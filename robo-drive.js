// Robô do Google Drive: varre a pasta Comercial (uma subpasta por marca, dentro dela por mês ou
// por material) e lança na fila de materiais todo arquivo novo ou alterado, com link, marca e tipo.
// Roda no GitHub Actions (ver .github/workflows/robo-drive.yml), de hora em hora.
//
// Precisa de:
//   Identidade: o workflow se autentica no Google sem chave (Workload Identity Federation) como a conta
//                           firebase-adminsdk-fbsvc@comercial-duas-rodas.iam.gserviceaccount.com.
//                           A pasta Comercial tem que estar compartilhada com esse e-mail (leitor).
//   DRIVE_PASTA_ID          (opcional) id da pasta Comercial. Sem ele, o robô procura uma pasta chamada
//                           "Comercial" entre as compartilhadas com a conta.
//   DIAS_INICIAIS           (opcional) na primeira rodada, só olha arquivos alterados nos últimos N dias (padrão 30).

const { google } = require("googleapis");
const admin = require("firebase-admin");

// Dois jeitos de se identificar: (a) sem chave, pelo GitHub (Workload Identity Federation, configurado em
// .github/workflows/robo-drive.yml, que deixa as credenciais em GOOGLE_APPLICATION_CREDENTIALS); (b) com o JSON
// de uma conta de serviço no segredo GOOGLE_SERVICE_ACCOUNT, se um dia a organização liberar chaves.
const PROJETO = process.env.GOOGLE_CLOUD_PROJECT || "comercial-duas-rodas";
const credenciais = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "null");
const ESCOPOS = ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/datastore", "https://www.googleapis.com/auth/cloud-platform"];
let auth;
if (credenciais) {
  admin.initializeApp({ credential: admin.credential.cert(credenciais), projectId: credenciais.project_id });
  auth = new google.auth.GoogleAuth({ credentials: credenciais, scopes: ESCOPOS });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJETO });
  auth = new google.auth.GoogleAuth({ scopes: ESCOPOS });
} else { console.error("Sem credencial: configure a identidade do GitHub (workflow) ou o segredo GOOGLE_SERVICE_ACCOUNT."); process.exit(1); }
const db = admin.firestore();
const drive = google.drive({ version: "v3", auth });

const PASTA = "application/vnd.google-apps.folder";
const CAMPOS = "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, size, parents)";

function hojeISO() { return new Date().toISOString().slice(0, 10); }
function normalizar(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }

async function listar(q) {
  const out = []; let pageToken;
  do {
    const r = await drive.files.list({ q, fields: CAMPOS, pageSize: 1000, pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true });
    out.push(...(r.data.files || [])); pageToken = r.data.nextPageToken;
  } while (pageToken);
  return out;
}

async function acharPastaRaiz() {
  if (process.env.DRIVE_PASTA_ID) return { id: process.env.DRIVE_PASTA_ID, name: "Comercial" };
  const pastas = await listar(`mimeType = '${PASTA}' and name = 'Comercial' and trashed = false`);
  if (!pastas.length) throw new Error("Não achei nenhuma pasta chamada Comercial compartilhada com a conta de serviço. Compartilhe a pasta ou informe DRIVE_PASTA_ID.");
  return pastas[0];
}

// percorre a árvore inteira guardando o caminho de cada arquivo
async function varrer(raiz) {
  const arquivos = []; const fila = [{ pasta: raiz, caminho: [] }];
  while (fila.length) {
    const { pasta, caminho } = fila.shift();
    const itens = await listar(`'${pasta.id}' in parents and trashed = false`);
    for (const it of itens) {
      if (it.mimeType === PASTA) fila.push({ pasta: it, caminho: caminho.concat(it.name) });
      else arquivos.push({ ...it, caminho });
    }
  }
  return arquivos;
}

function adivinharProduto(nome, mime) {
  const n = normalizar(nome);
  if (/\b(e ?mail|newsletter|mailing|disparo)\b/.test(n)) return "email";
  if (/\bbanner|\d{3,4}x\d{2,4}\b/.test(n)) return "banner";
  if (/\brevista|anuncio|pagina|pag\b|impresso\b/.test(n)) return "revista";
  if (/\bbrand|video|branded|youtube\b/.test(n)) return "brand";
  if (/\bpost|carrossel|reels|stories|feed|legenda\b/.test(n)) return "post";
  if (mime.startsWith("video/")) return "brand";
  if (mime === "text/html") return "email";
  if (mime === "application/pdf") return "revista";
  if (mime.startsWith("image/")) return "post";
  if (mime === "application/zip" || mime === "image/gif") return "banner";
  return "post";
}

function checklistInicial(produto, mime, nome) {
  const c = {};
  if (produto === "post") { c.arte = mime.startsWith("image/") || mime.startsWith("video/"); c.legenda = /legenda|copy|texto/.test(normalizar(nome)) || mime.includes("document"); c.link = false; }
  if (produto === "email") { c.html = mime === "text/html" || /\.html?$/i.test(nome); c.assunto = false; c.link = false; c.base = false; }
  if (produto === "banner") { c.pecas = true; c.link = false; }
  if (produto === "revista") { c.pdf = mime === "application/pdf"; }
  if (produto === "brand") { c.material = true; c.tema = false; }
  return c;
}

function acharMarca(marcas, nomePasta) {
  const alvo = normalizar(nomePasta); if (!alvo) return null;
  // 1. alias cadastrado na marca (campo pastaDrive), 2. nome igual, 3. primeira palavra em comum
  let m = marcas.find(x => normalizar(x.pastaDrive) === alvo); if (m) return m;
  m = marcas.find(x => normalizar(x.nome) === alvo || normalizar(x.id) === alvo); if (m) return m;
  const palavra = alvo.split(" ")[0];
  const cands = marcas.filter(x => { const n = normalizar(x.nome); return n.split(/[ /]/).includes(palavra) || n.includes(alvo) || alvo.includes(n); });
  return cands.length === 1 ? cands[0] : (cands.find(x => normalizar(x.nome).startsWith(alvo)) || null);
}

async function main() {
  const inicio = new Date();
  const estadoRef = db.collection("robo").doc("drive");
  const estado = (await estadoRef.get()).data() || {};
  const desde = estado.ultimaVarredura ? new Date(estado.ultimaVarredura) : new Date(Date.now() - (+process.env.DIAS_INICIAIS || 30) * 86400000);

  const raiz = await acharPastaRaiz();
  const [marcasSnap, filaSnap] = await Promise.all([db.collection("marcas").get(), db.collection("fila").get()]);
  const marcas = marcasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const jaNaFila = new Map(); filaSnap.docs.forEach(d => { const f = d.data(); if (f.driveId) jaNaFila.set(f.driveId, { id: d.id, ...f }); });

  const arquivos = await varrer(raiz);
  console.log(`Pasta ${raiz.name}: ${arquivos.length} arquivos, ${marcas.length} marcas, ${jaNaFila.size} já lançados.`);

  let novos = 0, atualizados = 0, semMarca = 0;
  for (const a of arquivos) {
    const modificado = new Date(a.modifiedTime);
    const existente = jaNaFila.get(a.id);
    if (existente) {
      // arquivo trocado depois de lançado: anota, sem mexer no que o time já editou
      if (existente.driveModificadoEm && modificado > new Date(existente.driveModificadoEm) && existente.status === "aguardando") {
        await db.collection("fila").doc(existente.id).update({ driveModificadoEm: a.modifiedTime, driveNome: a.name, obs: ((existente.obs || "") + `\nArquivo atualizado no Drive em ${hojeISO()}.`).trim(), roboEm: inicio.toISOString() });
        atualizados++;
      }
      continue;
    }
    if (modificado < desde) continue;
    const nomeMarca = a.caminho[0] || ""; const marca = acharMarca(marcas, nomeMarca);
    const produto = adivinharProduto(a.name, a.mimeType || "");
    const id = "fila-drive-" + a.id.slice(0, 12);
    const item = {
      id, marcaId: marca ? marca.id : "", produto, descricao: a.name.replace(/\.[a-z0-9]{2,5}$/i, ""),
      linkMaterial: a.webViewLink || "", linkDestino: "", dataPedida: null, urgencia: "normal", por: "Robô do Drive",
      obs: "Pasta: " + [raiz.name].concat(a.caminho).join(" / ") + (marca ? "" : " (marca não reconhecida, escolha na ficha)"),
      status: "aguardando", origem: "drive", checklist: checklistInicial(produto, a.mimeType || "", a.name), criadoEm: hojeISO(),
      driveId: a.id, driveNome: a.name, driveMime: a.mimeType || "", driveModificadoEm: a.modifiedTime, drivePasta: a.caminho.join(" / "), roboEm: inicio.toISOString()
    };
    await db.collection("fila").doc(id).set(item); novos++; if (!marca) semMarca++;
    console.log(`+ ${item.descricao} (${produto}) → ${marca ? marca.nome : "sem marca"} [${a.caminho.join(" / ")}]`);
  }
  await estadoRef.set({ ultimaVarredura: inicio.toISOString(), pasta: raiz.name, pastaId: raiz.id, arquivos: arquivos.length, novos, atualizados, semMarca, erro: null }, { merge: true });
  console.log(`Pronto: ${novos} novos, ${atualizados} atualizados, ${semMarca} sem marca.`);
}

main().catch(async e => {
  console.error(e);
  try { await db.collection("robo").doc("drive").set({ erro: String(e.message || e), erroEm: new Date().toISOString() }, { merge: true }); } catch (_) {}
  process.exit(1);
});
