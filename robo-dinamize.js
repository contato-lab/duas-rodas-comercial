// Robô da Dinamize: lê os envios de e-mail marketing da conta da revista e o resumo de cada um
// (enviados, entregues, aberturas, cliques) pela API oficial (https://panel.dinamize.com/apidoc/).
// Guarda a lista em robo/dinamize no Firestore, com a marca que parece ser a dona de cada envio,
// e atualiza os números das entregas de e-mail que já estão ligadas a um envio (entrega.dinamizeCode).
// Não cria entrega sozinho: quem confirma que o disparo é de uma marca é a pessoa, na plataforma,
// para newsletter editorial não contar na cota de ninguém.
// Roda no GitHub Actions uma vez por dia (ver .github/workflows/robo-dinamize.yml).
//
// Precisa de três segredos do GitHub, que só o dono cola lá:
//   DINAMIZE_USER         e-mail do usuário da Dinamize (de preferência um usuário só do robô)
//   DINAMIZE_PASSWORD     senha desse usuário
//   DINAMIZE_CLIENT_CODE  código do cliente (número da conta)
//   Identidade do Google: a mesma dos outros robôs (sem chave), para gravar no Firestore.
// Nos registros do GitHub (que são públicos) só saem contagens, nunca título, assunto ou base.

const { Firestore } = require("@google-cloud/firestore");

const USER = process.env.DINAMIZE_USER, PASS = process.env.DINAMIZE_PASSWORD, CLIENTE = process.env.DINAMIZE_CLIENT_CODE;
const PROJETO = process.env.GOOGLE_CLOUD_PROJECT || "comercial-duas-rodas-lime";
const db = new Firestore({ projectId: PROJETO });
const API = "https://api.dinamize.com";
const DIAS = +process.env.DINAMIZE_DIAS || 120;      // janela de envios guardados
const DIAS_RELEITURA = 30;                            // envio mais novo que isso tem o resumo relido todo dia
const PAUSA_MS = 1100;                                // a API aceita 60 chamadas por minuto

const espera = ms => new Promise(r => setTimeout(r, ms));
function hojeISO() { return new Date().toISOString().slice(0, 10); }
function diasEntre(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function textoSimples(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
function num(v) { return v == null || isNaN(+v) ? null : +v; }

// A API responde sempre HTTP 200; o que diz se deu certo é o campo "code" (480001 = sucesso)
async function chamar(caminho, corpo, token) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const cab = { "Content-Type": "application/json; charset=utf-8" }; if (token) cab["auth-token"] = token;
    const r = await fetch(API + caminho, { method: "POST", headers: cab, body: JSON.stringify(corpo || {}) });
    const j = await r.json().catch(() => ({ code: "http-" + r.status, code_detail: "resposta sem JSON" }));
    if (j.code === "240024") { await espera((+(j.body && j.body["retry-after"]) || 20) * 1000 + 500); continue; } // limite por minuto
    if (j.code !== "480001") throw new Error(j.code + " " + (j.code_detail || ""));
    return j.body || {};
  }
  throw new Error("limite de chamadas da Dinamize não liberou");
}

async function listarEnvios(token, desde) {
  const todos = [];
  // tenta do mais novo para o mais antigo, para parar cedo; se a API não aceitar a ordenação, lê tudo
  let ordenado = true;
  for (let pagina = 1; pagina <= 40; pagina++) {
    let corpo = { page_number: String(pagina), page_size: "200" }; if (ordenado) corpo.order = [{ field: "date_start", type: "DESC" }];
    let b;
    try { b = await chamar("/emkt/action/search", corpo, token); }
    catch (e) { if (ordenado && pagina === 1) { ordenado = false; console.warn("lista sem ordenação:", e.message.slice(0, 60)); pagina = 0; continue; } throw e; }
    const itens = b.items || []; todos.push(...itens);
    const maisVelho = itens.map(i => (i.date_start || i.date_create || "").slice(0, 10)).filter(Boolean).sort()[0];
    if (!b.next || !itens.length || (ordenado && maisVelho && maisVelho < desde)) break;
    await espera(PAUSA_MS);
  }
  return todos;
}

// Marca sugerida: o nome da marca (ou um dos nomes separados por "/") aparece no título ou no assunto do envio
function sugerirMarca(marcas, envio) {
  const txt = " " + textoSimples((envio.title || "") + " " + (envio.subject || "")) + " ";
  let melhor = null;
  marcas.forEach(m => String(m.nome || "").split(/[\/(]/).map(textoSimples).filter(n => n.length >= 3).forEach(n => { if (txt.indexOf(" " + n + " ") >= 0 && (!melhor || n.length > melhor.n.length)) melhor = { id: m.id, n }; }));
  return melhor ? melhor.id : null;
}

async function main() {
  const estadoRef = db.collection("robo").doc("dinamize"); const hoje = hojeISO();
  if (!USER || !PASS || !CLIENTE) {
    const falta = "Faltam os segredos DINAMIZE_USER, DINAMIZE_PASSWORD e DINAMIZE_CLIENT_CODE no GitHub.";
    console.log(falta); await estadoRef.set({ erro: falta, erroEm: new Date().toISOString() }, { merge: true }); return;
  }
  const auth = await chamar("/auth", { user: USER, password: PASS, client_code: CLIENTE });
  const token = auth["auth-token"]; if (!token) throw new Error("a Dinamize não devolveu o token de acesso");
  console.log("Entrou na Dinamize.");

  const desde = new Date(Date.now() - DIAS * 86400000).toISOString().slice(0, 10);
  const bruto = await listarEnvios(token, desde);
  const naJanela = bruto.filter(e => { const d = (e.date_start || e.date_create || "").slice(0, 10); return d && d >= desde && ["FN", "EP", "EN"].indexOf(e.status) >= 0; });
  console.log(`${bruto.length} envios lidos da conta, ${naJanela.length} enviados nos últimos ${DIAS} dias.`);

  const anterior = (await estadoRef.get()).data() || {}; const guardados = {}; (anterior.envios || []).forEach(e => { guardados[e.code] = e; });
  const marcas = (await db.collection("marcas").get()).docs.map(d => d.data());
  const envios = []; let lidos = 0, falhas = 0;
  for (const e of naJanela) {
    const data = (e.date_start || e.date_create || "").slice(0, 10); const velho = guardados[e.code];
    const item = { code: String(e.code), titulo: e.title || "", assunto: e.subject || "", data, hora: (e.date_start || "").slice(11, 16), status: e.status, lista: e["contact-list_title"] || "", marcaSugerida: sugerirMarca(marcas, e) };
    const precisaLer = !velho || velho.base == null || diasEntre(data, hoje) <= DIAS_RELEITURA;
    if (precisaLer) {
      try {
        const r = await chamar("/emkt/action/report", { action_code: String(e.code), type: "summary" }, token);
        Object.assign(item, { base: num(r.sent), contatos: num(r.contacts), entregues: num(r.delivered), aberturas: num(r.view), cliques: num(r.click), descadastros: num(r.optout), erros: num(r.error), lidoEm: hoje }); lidos++;
      } catch (err) { falhas++; if (velho) ["base", "contatos", "entregues", "aberturas", "cliques", "descadastros", "erros", "lidoEm"].forEach(k => { if (velho[k] != null) item[k] = velho[k]; }); console.warn("resumo não lido de um envio:", err.message.slice(0, 60)); }
      await espera(PAUSA_MS);
    } else ["base", "contatos", "entregues", "aberturas", "cliques", "descadastros", "erros", "lidoEm"].forEach(k => { if (velho[k] != null) item[k] = velho[k]; });
    envios.push(item);
  }
  envios.sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));

  // entregas de e-mail já ligadas a um envio recebem os números novos
  const porCode = {}; envios.forEach(e => { porCode[e.code] = e; });
  const ligadas = (await db.collection("entregas").where("produto", "==", "email").get()).docs.filter(d => d.data().dinamizeCode && porCode[String(d.data().dinamizeCode)]);
  let atualizadas = 0;
  for (const d of ligadas) {
    const e = porCode[String(d.data().dinamizeCode)]; if (e.base == null) continue;
    const metricas = Object.assign({}, d.data().metricas || {}, { base: e.base, aberturas: e.aberturas, cliques: e.cliques, dinamizeEm: hoje });
    if (e.entregues != null) metricas.entregues = e.entregues;
    await d.ref.update({ metricas }); atualizadas++;
  }

  await estadoRef.set({ ultimaRodada: new Date().toISOString(), dias: DIAS, total: envios.length, comMarca: envios.filter(e => e.marcaSugerida).length, envios, erro: null });
  console.log(`Pronto: ${envios.length} envios guardados, ${lidos} resumos lidos, ${falhas} falhas, ${envios.filter(e => e.marcaSugerida).length} com marca sugerida, ${atualizadas} entregas atualizadas.`);
}

main().catch(async e => {
  console.error("Erro:", e.message);
  try { await db.collection("robo").doc("dinamize").set({ erro: String(e.message || e), erroEm: new Date().toISOString() }, { merge: true }); } catch (_) {}
  process.exit(1);
});
