// Robô do Meta: puxa os resultados de cada post do Instagram e do Facebook pelo link cadastrado na
// entrega (alcance, curtidas, comentários, salvamentos, compartilhamentos, visualizações) e grava
// em entrega.metricas, para o relatório sair sem digitar número.
// Roda no GitHub Actions uma vez por dia (ver .github/workflows/robo-meta.yml).
//
// Precisa de:
//   META_TOKEN   token de usuário do sistema (Business Manager) com instagram_basic,
//                instagram_manage_insights, pages_read_engagement, pages_show_list, read_insights.
//                Segredo do GitHub; só o dono cola lá.
//   Identidade do Google: a mesma do robô do Drive (sem chave), para gravar no Firestore.
//   META_PAGINA_ID (opcional) id da página do Facebook da revista. Sem ele o robô pega a primeira
//                página que o token enxerga que tenha Instagram ligado.

const { Firestore } = require("@google-cloud/firestore");

const TOKEN = process.env.META_TOKEN;
if (!TOKEN) { console.error("Falta o segredo META_TOKEN."); process.exit(1); }
const PROJETO = process.env.GOOGLE_CLOUD_PROJECT || "comercial-duas-rodas-lime";
const db = new Firestore({ projectId: PROJETO });
const G = "https://graph.facebook.com/v21.0";
const DIAS_REFRESCO = +process.env.DIAS_REFRESCO || 7; // post com menos de N dias é relido todo dia; depois, uma vez por semana

async function graph(caminho, params) {
  const u = new URL(G + caminho); Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v)); u.searchParams.set("access_token", TOKEN);
  const r = await fetch(u); const j = await r.json();
  if (j.error) throw new Error(j.error.message + " (" + caminho + ")");
  return j;
}
async function todasAsPaginas(caminho, params) {
  const out = []; let j = await graph(caminho, params);
  while (true) { out.push(...(j.data || [])); const prox = j.paging && j.paging.next; if (!prox) break; const r = await fetch(prox); j = await r.json(); if (j.error) throw new Error(j.error.message); }
  return out;
}

function codigoInstagram(url) { const m = /instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]+)/.exec(url || ""); return m ? m[1] : null; }
function ehFacebook(url) { return /facebook\.com|fb\.watch|fb\.com/.test(url || ""); }
function hojeISO() { return new Date().toISOString().slice(0, 10); }
function diasEntre(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

async function acharConta() {
  const paginas = await todasAsPaginas("/me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}", limit: 50 });
  let pagina = process.env.META_PAGINA_ID ? paginas.find(p => p.id === process.env.META_PAGINA_ID) : paginas.find(p => p.instagram_business_account);
  if (!pagina) throw new Error("Nenhuma página com Instagram ligado está acessível com esse token. Páginas vistas: " + paginas.map(p => p.name).join(", "));
  return pagina;
}

// Instagram: a API não busca por link, então lista as mídias da conta e casa pelo código do link
async function mapaInstagram(igId) {
  const midias = await todasAsPaginas(`/${igId}/media`, { fields: "id,shortcode,permalink,media_type,media_product_type,timestamp,like_count,comments_count", limit: 100 });
  const mapa = new Map(); midias.forEach(m => { if (m.shortcode) mapa.set(m.shortcode, m); const c = codigoInstagram(m.permalink); if (c) mapa.set(c, m); });
  return mapa;
}
async function insightsInstagram(m) {
  const reels = m.media_product_type === "REELS" || m.media_type === "VIDEO";
  const metricas = reels ? "reach,saved,shares,views,likes,comments" : (m.media_type === "CAROUSEL_ALBUM" ? "reach,saved,shares,views,likes,comments" : "reach,saved,shares,views,likes,comments");
  let ins = {};
  try { const j = await graph(`/${m.id}/insights`, { metric: metricas }); (j.data || []).forEach(d => { ins[d.name] = d.values && d.values[0] ? d.values[0].value : d.total_value && d.total_value.value; }); }
  catch (e) { // métrica que não existe para esse tipo: tenta o mínimo
    try { const j = await graph(`/${m.id}/insights`, { metric: "reach,saved" }); (j.data || []).forEach(d => { ins[d.name] = d.values && d.values[0] ? d.values[0].value : null; }); } catch (e2) { console.warn("sem insights para", m.id, e2.message); }
  }
  return { alcance: num(ins.reach), visualizacoes: num(ins.views), curtidas: num(ins.likes != null ? ins.likes : m.like_count), comentarios: num(ins.comments != null ? ins.comments : m.comments_count), salvamentos: num(ins.saved), compartilhamentos: num(ins.shares) };
}

// Facebook: lista os posts da página e casa pelo link
async function mapaFacebook(pagina) {
  const posts = await todasAsPaginas(`/${pagina.id}/posts`, { fields: "id,permalink_url,created_time", limit: 100, access_token: pagina.access_token });
  const mapa = new Map(); posts.forEach(p => { if (p.permalink_url) mapa.set(normalizarUrl(p.permalink_url), p); mapa.set(p.id, p); const idCurto = p.id.split("_")[1]; if (idCurto) mapa.set(idCurto, p); });
  return mapa;
}
function normalizarUrl(u) { try { const x = new URL(u); return (x.hostname.replace(/^(www|m|web)\./, "") + x.pathname).replace(/\/$/, "").toLowerCase(); } catch (e) { return String(u || "").toLowerCase(); } }
async function insightsFacebook(post, pagina) {
  const j = await graph(`/${post.id}/insights`, { metric: "post_impressions_unique,post_reactions_like_total,post_clicks", access_token: pagina.access_token });
  const ins = {}; (j.data || []).forEach(d => { ins[d.name] = d.values && d.values[0] ? d.values[0].value : null; });
  const det = await graph(`/${post.id}`, { fields: "shares,comments.summary(true).limit(0),reactions.summary(true).limit(0)", access_token: pagina.access_token });
  return { alcance: num(ins.post_impressions_unique), curtidas: num(det.reactions && det.reactions.summary && det.reactions.summary.total_count), comentarios: num(det.comments && det.comments.summary && det.comments.summary.total_count), compartilhamentos: num(det.shares && det.shares.count) };
}
function num(v) { return v == null || isNaN(+v) ? null : +v; }

async function main() {
  const inicio = new Date(); const hoje = hojeISO();
  const estadoRef = db.collection("robo").doc("meta");
  const pagina = await acharConta();
  const ig = pagina.instagram_business_account;
  console.log(`Página: ${pagina.name} (${pagina.id})` + (ig ? ` · Instagram: @${ig.username}` : " · sem Instagram ligado"));

  const snap = await db.collection("entregas").get();
  const alvo = snap.docs.map(d => ({ ref: d.ref, ...d.data() })).filter(e => e.produto === "post" && e.link && (codigoInstagram(e.link) || ehFacebook(e.link)));
  const pendentes = alvo.filter(e => { const m = e.metricas || {}; if (!m.metaEm) return true; const idade = e.data ? diasEntre(e.data, hoje) : 999; const desde = diasEntre(m.metaEm, hoje); return idade <= DIAS_REFRESCO ? desde >= 1 : desde >= 7; });
  console.log(`${alvo.length} posts com link do Instagram ou Facebook, ${pendentes.length} para atualizar.`);
  if (!pendentes.length) { await estadoRef.set({ ultimaRodada: inicio.toISOString(), pagina: pagina.name, instagram: ig ? ig.username : null, posts: alvo.length, atualizados: 0, naoAchados: 0, erro: null }, { merge: true }); return; }

  const precisaIg = pendentes.some(e => codigoInstagram(e.link)), precisaFb = pendentes.some(e => ehFacebook(e.link) && !codigoInstagram(e.link));
  const mIg = precisaIg && ig ? await mapaInstagram(ig.id) : new Map();
  const mFb = precisaFb ? await mapaFacebook(pagina) : new Map();

  let atualizados = 0, naoAchados = 0; const faltando = [];
  for (const e of pendentes) {
    try {
      let novo = null; const cod = codigoInstagram(e.link);
      if (cod) { const m = mIg.get(cod); if (m) novo = await insightsInstagram(m); }
      else { const p = mFb.get(normalizarUrl(e.link)) || mFb.get((/\/(\d{10,})/.exec(e.link) || [])[1]); if (p) novo = await insightsFacebook(p, pagina); }
      if (!novo) { naoAchados++; faltando.push(e.titulo || e.link); await e.ref.update({ "metricas.metaAviso": "Post não encontrado na conta da revista. Confira o link." }); continue; }
      const metricas = Object.assign({}, e.metricas || {}); Object.entries(novo).forEach(([k, v]) => { if (v != null) metricas[k] = v; });
      metricas.metaEm = hoje; metricas.fonte = cod ? "instagram" : "facebook"; delete metricas.metaAviso;
      await e.ref.update({ metricas }); atualizados++;
      console.log(`+ ${e.titulo || e.link}: ` + Object.entries(novo).filter(([k, v]) => v != null).map(([k, v]) => `${k} ${v}`).join(", "));
    } catch (err) { console.warn("falhou", e.titulo || e.link, err.message); }
  }
  await estadoRef.set({ ultimaRodada: inicio.toISOString(), pagina: pagina.name, instagram: ig ? ig.username : null, posts: alvo.length, atualizados, naoAchados, faltando: faltando.slice(0, 20), erro: null }, { merge: true });
  console.log(`Pronto: ${atualizados} atualizados, ${naoAchados} não encontrados.`);
}

main().catch(async e => {
  console.error(e);
  try { await db.collection("robo").doc("meta").set({ erro: String(e.message || e), erroEm: new Date().toISOString() }, { merge: true }); } catch (_) {}
  process.exit(1);
});
