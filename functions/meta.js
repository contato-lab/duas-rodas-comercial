// Leitura de um post do Instagram ou do Facebook pelo link, na hora em que a entrega é salva.
// Usado pela função metaPost (Firebase, chamada pelo site). O robô diário (robo-meta.js) continua
// relendo os números depois; aqui é só para a entrega já nascer com números, print e título.
const Jimp = require("jimp");

const G = "https://graph.facebook.com/v21.0";
const PAGINA_ID = "253904534671383"; // página Duas Rodas, ligada ao @duasrodasbr
const FOLGA_DIAS = 10; // procura o post até 10 dias antes e depois da data da entrega

function codigoInstagram(url) { const m = /instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]+)/.exec(url || ""); return m ? m[1] : null; }
function ehFacebook(url) { return /facebook\.com|fb\.watch|fb\.com/.test(url || ""); }
function normalizarUrl(u) { try { const x = new URL(u); return (x.hostname.replace(/^(www|m|web)\./, "") + x.pathname).replace(/\/$/, "").toLowerCase(); } catch (e) { return String(u || "").toLowerCase(); } }
function num(v) { return v == null || isNaN(+v) ? null : +v; }
function hojeISO() { return new Date().toISOString().slice(0, 10); }

function criarGraph(token) {
  async function graph(caminho, params) {
    const u = new URL(caminho.startsWith("http") ? caminho : G + caminho);
    Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v));
    if (!u.searchParams.has("access_token")) u.searchParams.set("access_token", token);
    const r = await fetch(u); const j = await r.json();
    if (j.error) throw new Error(j.error.message + " (" + u.pathname + ")");
    return j;
  }
  return graph;
}

// Título do post: 1ª linha da legenda, sem hashtags e menções soltas no fim
function tituloDaLegenda(txt) {
  const linha = String(txt || "").split(/\n/).map(l => l.trim()).find(l => l.replace(/[#@][\w.]+/g, "").trim().length > 3);
  if (!linha) return null;
  let t = linha.replace(/(\s*[#@][\w.]+)+\s*$/, "").trim();
  if (t.length > 90) t = t.slice(0, 87).replace(/\s+\S*$/, "") + "...";
  return t;
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

async function acharPagina(graph) {
  const j = await graph("/me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}", limit: 50 });
  const pagina = (j.data || []).find(p => p.id === PAGINA_ID) || (j.data || []).find(p => p.instagram_business_account);
  if (!pagina) throw new Error("O token do Meta não enxerga a página da revista.");
  return pagina;
}

// Instagram: a API não busca por link; percorre as mídias da mais nova para a mais antiga
// e para quando acha o código do link ou quando passa da data da entrega
async function acharNoInstagram(graph, igId, codigo, dataEntrega) {
  const limite = dataEntrega ? new Date(new Date(dataEntrega).getTime() - FOLGA_DIAS * 86400000) : null;
  let j = await graph(`/${igId}/media`, { fields: "id,shortcode,permalink,media_type,media_product_type,timestamp,like_count,comments_count,caption,media_url,thumbnail_url", limit: 100 });
  for (let paginas = 0; paginas < 40; paginas++) {
    for (const m of j.data || []) {
      if (m.shortcode === codigo || codigoInstagram(m.permalink) === codigo) return m;
    }
    const ultimo = (j.data || [])[(j.data || []).length - 1];
    if (limite && ultimo && new Date(ultimo.timestamp) < limite) return null;
    if (!j.paging || !j.paging.next) return null;
    j = await graph(j.paging.next);
  }
  return null;
}
async function insightsInstagram(graph, m) {
  let ins = {};
  try { const j = await graph(`/${m.id}/insights`, { metric: "reach,saved,shares,views,likes,comments" }); (j.data || []).forEach(d => { ins[d.name] = d.values && d.values[0] ? d.values[0].value : d.total_value && d.total_value.value; }); }
  catch (e) { try { const j = await graph(`/${m.id}/insights`, { metric: "reach,saved" }); (j.data || []).forEach(d => { ins[d.name] = d.values && d.values[0] ? d.values[0].value : null; }); } catch (e2) { console.warn("sem insights para", m.id, e2.message); } }
  return { alcance: num(ins.reach), visualizacoes: num(ins.views), curtidas: num(ins.likes != null ? ins.likes : m.like_count), comentarios: num(ins.comments != null ? ins.comments : m.comments_count), salvamentos: num(ins.saved), compartilhamentos: num(ins.shares) };
}
async function imagemDoInstagram(graph, m) {
  if (m.media_type === "VIDEO") return m.thumbnail_url || null;
  if (m.media_url && m.media_type !== "CAROUSEL_ALBUM") return m.media_url;
  try { const j = await graph(`/${m.id}/children`, { fields: "media_type,media_url,thumbnail_url" }); const c = (j.data || [])[0]; if (c) return c.media_type === "VIDEO" ? c.thumbnail_url : c.media_url; } catch (e) { console.warn("sem filhos do carrossel", m.id, e.message); }
  return m.media_url || m.thumbnail_url || null;
}

// Facebook: lista só os posts da página perto da data da entrega e casa pelo link
async function acharNoFacebook(graph, pagina, link, dataEntrega) {
  const params = { fields: "id,permalink_url,created_time,message,full_picture", limit: 100, access_token: pagina.access_token };
  if (dataEntrega) {
    const d = new Date(dataEntrega).getTime();
    params.since = Math.floor((d - FOLGA_DIAS * 86400000) / 1000);
    params.until = Math.floor((d + FOLGA_DIAS * 86400000) / 1000);
  }
  const alvo = normalizarUrl(link); const idNoLink = (/\/(\d{10,})/.exec(link) || [])[1] || (/(?:story_fbid|fbid)=(\d+)/.exec(link) || [])[1];
  let j = await graph(`/${pagina.id}/posts`, params);
  for (let paginas = 0; paginas < 20; paginas++) {
    for (const p of j.data || []) {
      if (p.permalink_url && normalizarUrl(p.permalink_url) === alvo) return p;
      if (idNoLink && (p.id === idNoLink || p.id.split("_")[1] === idNoLink)) return p;
    }
    if (!j.paging || !j.paging.next) return null;
    j = await graph(j.paging.next);
  }
  return null;
}
async function insightsFacebook(graph, post, pagina) {
  const ins = {};
  try { const j = await graph(`/${post.id}/insights`, { metric: "post_impressions_unique,post_reactions_like_total,post_clicks", access_token: pagina.access_token }); (j.data || []).forEach(d => { ins[d.name] = d.values && d.values[0] ? d.values[0].value : null; }); } catch (e) { console.warn("sem insights para", post.id, e.message); }
  const det = await graph(`/${post.id}`, { fields: "shares,comments.summary(true).limit(0),reactions.summary(true).limit(0)", access_token: pagina.access_token });
  return { alcance: num(ins.post_impressions_unique), curtidas: num(det.reactions && det.reactions.summary && det.reactions.summary.total_count), comentarios: num(det.comments && det.comments.summary && det.comments.summary.total_count), compartilhamentos: num(det.shares && det.shares.count) };
}

// Lê o post da entrega e devolve o que mudar nela: { metricas, imagem?, legendaPost? } ou { aviso }
async function lerPost(token, entrega) {
  const graph = criarGraph(token);
  const link = entrega.link || ""; const cod = codigoInstagram(link);
  if (!cod && !ehFacebook(link)) return { aviso: "O link não é de um post do Instagram nem do Facebook." };
  const pagina = await acharPagina(graph);
  let novo = null, legenda = null, urlImg = null, fonte = null;
  if (cod) {
    const ig = pagina.instagram_business_account; if (!ig) throw new Error("A página da revista está sem Instagram ligado.");
    const m = await acharNoInstagram(graph, ig.id, cod, entrega.data);
    if (m) { novo = await insightsInstagram(graph, m); legenda = m.caption; urlImg = await imagemDoInstagram(graph, m); fonte = "instagram"; }
  } else {
    const p = await acharNoFacebook(graph, pagina, link, entrega.data);
    if (p) { novo = await insightsFacebook(graph, p, pagina); legenda = p.message; urlImg = p.full_picture; fonte = "facebook"; }
  }
  if (!novo) return { aviso: "Post não encontrado na conta da revista. Confira o link e a data da entrega." };
  const metricas = Object.assign({}, entrega.metricas || {});
  Object.entries(novo).forEach(([k, v]) => { if (v != null) metricas[k] = v; });
  metricas.metaEm = hojeISO(); metricas.fonte = fonte; delete metricas.metaAviso;
  const mudar = { metricas };
  const titulo = tituloDaLegenda(legenda); if (titulo) mudar.legendaPost = titulo;
  if (!entrega.imagem && urlImg) { try { mudar.imagem = await imagemReduzida(urlImg); } catch (e) { console.warn("sem print", link, e.message); } }
  return mudar;
}

module.exports = { lerPost };
