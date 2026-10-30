// Robô do Meta: puxa os resultados de cada post do Instagram e do Facebook pelo link cadastrado na
// entrega (alcance, curtidas, comentários, salvamentos, compartilhamentos, visualizações) e grava
// em entrega.metricas, para o relatório sair sem digitar número. Se a entrega ainda não tem print,
// grava a imagem do post (reduzida) em entrega.imagem, e guarda a 1ª linha da legenda em
// entrega.legendaPost, que é o título que aparece na tela do relatório.
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
const Jimp = require("jimp");

const TOKEN = process.env.META_TOKEN;
if (!TOKEN) { console.error("Falta o segredo META_TOKEN."); process.exit(1); }
const PROJETO = process.env.GOOGLE_CLOUD_PROJECT || "comercial-duas-rodas-lime";
const db = new Firestore({ projectId: PROJETO });
const G = "https://graph.facebook.com/v21.0";
const DIAS_REFRESCO = +process.env.DIAS_REFRESCO || 7; // post com menos de N dias é relido todo dia; depois, uma vez por semana

async function graph(caminho, params) {
  const u = new URL(G + caminho); Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v)); if (!u.searchParams.has("access_token")) u.searchParams.set("access_token", TOKEN); // posts da página usam o token da própria página
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
  const midias = await todasAsPaginas(`/${igId}/media`, { fields: "id,shortcode,permalink,media_type,media_product_type,timestamp,like_count,comments_count,caption,media_url,thumbnail_url", limit: 100 });
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
  const posts = await todasAsPaginas(`/${pagina.id}/posts`, { fields: "id,permalink_url,created_time,message,full_picture", limit: 100, access_token: pagina.access_token });
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

// Título do post: 1ª linha da legenda, sem hashtags e menções soltas no fim
function tituloDaLegenda(txt) {
  const linha = String(txt || "").split(/\n/).map(l => l.trim()).find(l => l.replace(/[#@][\w.]+/g, "").trim().length > 3);
  if (!linha) return null;
  let t = linha.replace(/(\s*[#@][\w.]+)+\s*$/, "").trim();
  if (t.length > 90) t = t.slice(0, 87).replace(/\s+\S*$/, "") + "...";
  return t;
}
// Imagem do post: Instagram usa a capa do vídeo ou a 1ª foto do carrossel; Facebook usa full_picture
async function urlDaImagemIg(m) {
  if (m.media_type === "VIDEO") return m.thumbnail_url || null;
  if (m.media_url && m.media_type !== "CAROUSEL_ALBUM") return m.media_url;
  try { const j = await graph(`/${m.id}/children`, { fields: "media_type,media_url,thumbnail_url" }); const c = (j.data || [])[0]; if (c) return c.media_type === "VIDEO" ? c.thumbnail_url : c.media_url; } catch (e) { console.warn("sem filhos do carrossel", m.id, e.message); }
  return m.media_url || m.thumbnail_url || null;
}
// Baixa e reduz para 720 px de largura (JPEG ~80 KB), no mesmo formato do print colado à mão
async function imagemReduzida(url) {
  if (!url) return null;
  const r = await fetch(url); if (!r.ok) throw new Error("imagem respondeu " + r.status);
  const img = await Jimp.read(Buffer.from(await r.arrayBuffer()));
  if (img.bitmap.width > 720) img.resize(720, Jimp.AUTO);
  const buf = await img.quality(72).getBufferAsync(Jimp.MIME_JPEG);
  return "data:image/jpeg;base64," + buf.toString("base64");
}

async function main() {
  const inicio = new Date(); const hoje = hojeISO();
  const estadoRef = db.collection("robo").doc("meta");
  const pagina = await acharConta();
  const ig = pagina.instagram_business_account;
  console.log(`Página: ${pagina.name} (${pagina.id})` + (ig ? ` · Instagram: @${ig.username}` : " · sem Instagram ligado"));

  const snap = await db.collection("entregas").get();
  const alvo = snap.docs.map(d => ({ ref: d.ref, ...d.data() })).filter(e => e.produto === "post" && e.link && (codigoInstagram(e.link) || ehFacebook(e.link)));
  const pendentes = alvo.filter(e => { const m = e.metricas || {}; if (!m.metaEm || !e.imagem || !e.legendaPost) return true; const idade = e.data ? diasEntre(e.data, hoje) : 999; const desde = diasEntre(m.metaEm, hoje); return idade <= DIAS_REFRESCO ? desde >= 1 : desde >= 7; });
  console.log(`${alvo.length} posts com link do Instagram ou Facebook, ${pendentes.length} para atualizar.`);
  if (!pendentes.length) { await estadoRef.set({ ultimaRodada: inicio.toISOString(), pagina: pagina.name, instagram: ig ? ig.username : null, posts: alvo.length, atualizados: 0, naoAchados: 0, erro: null }, { merge: true }); return; }

  const precisaIg = pendentes.some(e => codigoInstagram(e.link)), precisaFb = pendentes.some(e => ehFacebook(e.link) && !codigoInstagram(e.link));
  const mIg = precisaIg && ig ? await mapaInstagram(ig.id) : new Map();
  const mFb = precisaFb ? await mapaFacebook(pagina) : new Map();

  let atualizados = 0, naoAchados = 0, prints = 0; const faltando = [];
  for (const e of pendentes) {
    try {
      let novo = null, legenda = null, urlImg = null; const cod = codigoInstagram(e.link);
      if (cod) { const m = mIg.get(cod); if (m) { novo = await insightsInstagram(m); legenda = m.caption; if (!e.imagem) urlImg = await urlDaImagemIg(m); } }
      else { const p = mFb.get(normalizarUrl(e.link)) || mFb.get((/\/(\d{10,})/.exec(e.link) || [])[1]); if (p) { novo = await insightsFacebook(p, pagina); legenda = p.message; if (!e.imagem) urlImg = p.full_picture; } }
      if (!novo) { naoAchados++; faltando.push(e.titulo || e.link); await e.ref.update({ "metricas.metaAviso": "Post não encontrado na conta da revista. Confira o link." }); continue; }
      const metricas = Object.assign({}, e.metricas || {}); Object.entries(novo).forEach(([k, v]) => { if (v != null) metricas[k] = v; });
      metricas.metaEm = hoje; metricas.fonte = cod ? "instagram" : "facebook"; delete metricas.metaAviso;
      const mudar = { metricas };
      const titulo = tituloDaLegenda(legenda); if (titulo && titulo !== e.legendaPost) mudar.legendaPost = titulo;
      if (urlImg) { try { const im = await imagemReduzida(urlImg); if (im) { mudar.imagem = im; mudar.imagemAuto = true; prints++; } } catch (err) { console.warn("sem print para", e.titulo || e.link, err.message); } }
      await e.ref.update(mudar); atualizados++;
      console.log(`+ ${e.titulo || e.link}: ` + Object.entries(novo).filter(([k, v]) => v != null).map(([k, v]) => `${k} ${v}`).join(", "));
    } catch (err) { console.warn("falhou", e.titulo || e.link, err.message); }
  }
  await estadoRef.set({ ultimaRodada: inicio.toISOString(), pagina: pagina.name, instagram: ig ? ig.username : null, posts: alvo.length, atualizados, naoAchados, prints, faltando: faltando.slice(0, 20), erro: null }, { merge: true });
  console.log(`Pronto: ${atualizados} atualizados, ${prints} prints novos, ${naoAchados} não encontrados.`);
}

main().catch(async e => {
  console.error(e);
  try { await db.collection("robo").doc("meta").set({ erro: String(e.message || e), erroEm: new Date().toISOString() }, { merge: true }); } catch (_) {}
  process.exit(1);
});
