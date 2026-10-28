/* Relatório por cliente: telas 16:9 no padrão visual dos relatórios da Duas Rodas
   (preto, vermelho #EB2126, branco, Bebas Neue nos títulos, Poppins no texto).
   Abre numa aba nova; salvar em PDF pelo Imprimir do navegador. */
(function () {
"use strict";
var VERMELHO = "#EB2126";
var LOGO = new URL("logo-branco.png", location.href).href;
var PRODUTOS = { brand: "Branded", post: "Posts publicidade", email: "E-mail marketing", banner: "Impressões (banner)", revista: "Páginas de revista" };
var UNIDADE = { brand: "", post: "", email: "", banner: "", revista: "" };
var MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fmtData(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || ""); }
function fmtNum(n) { return n == null || isNaN(n) ? "" : Number(n).toLocaleString("pt-BR"); }
function p02(n) { return n < 10 ? "0" + n : String(n); }
function mesDe(iso) { var m = /^(\d{4})-(\d{2})/.exec(iso || ""); return m ? MESES[+m[2] - 1] : ""; }
function youtubeId(url) { var m = /(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/.exec(url || ""); return m ? m[1] : null; }

/* peças visuais */
function faixaTitulo(marca, tituloBranco, tituloVermelho, data) {
  return '<div class="faixa"><span class="riscos"></span><span class="rel">RELATÓRIO <b>' + esc(marca) + "</b></span></div>" +
    '<h1 class="tit">' + esc(tituloBranco) + (tituloVermelho ? ' <b>' + esc(tituloVermelho) + "</b>" : "") + "</h1>" +
    (data ? '<div class="data">' + esc(fmtData(data)) + "</div>" : "");
}
function fundoLetras() { return '<div class="letras" aria-hidden="true"><span class="l1">DUAS</span><span class="l2">RODAS</span></div>'; }
function slideCapa(d) {
  return { descricao: "Capa: Relatório " + d.marca.nome, html: '<section class="slide capa">' + fundoLetras() +
    '<div class="caixa"><span class="tres"></span><h1>RELATÓRIO</h1><h2>' + esc(d.marca.nome.toUpperCase()) + '</h2><hr><img class="logo" src="' + LOGO + '" alt="Duas Rodas"></div></section>' };
}
function slideSecao(d, a, b) {
  return { descricao: "Abertura: " + a + (b ? " " + b : ""), html: '<section class="slide secao">' + fundoLetras() + '<div class="caixa-esq"><h1>' + esc(a) + (b ? '<br><b>' + esc(b) + "</b>" : "") + '</h1><div class="faixa baixo"><span class="riscos"></span><span class="rel">RELATÓRIO <b>' + esc(d.marca.nome) + "</b></span></div></div></section>" };
}
function slideLista(d, tituloA, tituloB, linhas) {
  return '<section class="slide lista"><div class="esq"><h1>' + esc(tituloA) + "<br><b>" + esc(tituloB) + '</b></h1><div class="faixa"><span class="riscos"></span><span class="rel">RELATÓRIO <b>' + esc(d.marca.nome) + '</b></span></div></div><div class="div"></div><ul>' +
    linhas.map(function (l) { return "<li><b>" + esc(l[0]) + "</b> " + esc(l[1]) + "</li>"; }).join("") + "</ul></section>";
}
function slideAcordados(d) {
  var c = d.consumo, linhas = [];
  ["post", "brand", "revista", "email", "banner"].forEach(function (p) { if (c[p] && c[p].contratado) linhas.push([p === "banner" ? fmtNum(c[p].contratado) : p02(c[p].contratado), PRODUTOS[p].toUpperCase()]); });
  if (!linhas.length) return null;
  return { descricao: "Materiais acordados (" + (d.autorizacao.id === "todas" ? "soma das cotas de todas as autorizações" : "cotas da autorização " + (d.autorizacao.rotulo || "")) + ")", html: slideLista(d, "MATERIAIS", "ACORDADOS", linhas) };
}
function slideEntregues(d) {
  var c = d.consumo, linhas = [];
  var porProduto = {}; d.entregas.forEach(function (e) { porProduto[e.produto] = (porProduto[e.produto] || 0) + (e.produto === "banner" ? (+(e.metricas && e.metricas.impressoes) || 0) : (e.produto === "revista" ? (+e.quantidade || 1) : 1)); });
  porProduto.brand = d.brands.length;
  ["post", "brand", "revista", "email", "banner"].forEach(function (p) { var n = porProduto[p] || 0; if (n || (c[p] && c[p].contratado)) linhas.push([p === "banner" ? fmtNum(n) : p02(n), PRODUTOS[p].toUpperCase()]); });
  if (!linhas.length) linhas.push(["", "NENHUM MATERIAL NO PERÍODO"]);
  return { descricao: "Materiais entregues no período" + (d.entregas.length || d.brands.length ? "" : " (nenhum)"), html: slideLista(d, "MATERIAIS", "ENTREGUES", linhas) };
}
function slideDestaques(d) {
  if (!d.destaques || !d.destaques.length) return null;
  return { descricao: "Destaques do período (" + d.destaques.length + ")", html: '<section class="slide lista destaques"><div class="esq"><h1>DESTAQUES<br><b>DO PERÍODO</b></h1><div class="faixa"><span class="riscos"></span><span class="rel">RELATÓRIO <b>' + esc(d.marca.nome) + '</b></span></div></div><div class="div"></div><ul>' +
    d.destaques.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></section>" };
}
function caixaMetrica(titulo, linhas) { return '<div class="metrica"><span class="rotulo">' + esc(titulo) + "</span><div>" + linhas.map(function (l) { return "<span>" + esc(l) + "</span>"; }).join("") + "</div></div>"; }
function slidePost(d, e) {
  var m = e.metricas || {}; var esq = [], dir = [];
  if (m.visualizacoes != null) esq.push(fmtNum(m.visualizacoes) + " VISUALIZAÇÕES"); if (m.alcance != null) esq.push(fmtNum(m.alcance) + " CONTAS ALCANÇADAS");
  if (m.curtidas != null) dir.push(fmtNum(m.curtidas) + " CURTIDAS"); if (m.comentarios != null) dir.push(fmtNum(m.comentarios) + " COMENTÁRIOS"); if (m.compartilhamentos != null) dir.push(fmtNum(m.compartilhamentos) + " COMPARTILHAMENTOS"); if (m.salvamentos != null) dir.push(fmtNum(m.salvamentos) + " SALVAMENTOS");
  var img = e.imagem ? '<div class="print"><img src="' + esc(e.imagem) + '" alt=""></div>' : '<div class="print vazio"><span>Print do post</span></div>';
  return { descricao: "Post " + fmtData(e.data) + ": " + (e.titulo || "sem título"), html: '<section class="slide item">' + faixaTitulo(d.marca.nome, "POSTS", "PUBLICIDADE", e.data) +
    '<div class="corpo">' + img + '<div class="metricas">' + (esq.length ? caixaMetrica("ALCANCE", esq) : "") + (dir.length ? caixaMetrica("INTERAÇÕES", dir) : "") + (!esq.length && !dir.length ? caixaMetrica("PUBLICADO", [fmtData(e.data), e.rede ? e.rede.replace("_", " e ").toUpperCase() : ""]) : "") + "</div></div>" +
    (e.titulo ? '<div class="legenda">' + esc(e.titulo.toUpperCase()) + "</div>" : "") + "</section>" };
}
function slideBrand(d, b) {
  var yt = youtubeId(b.links && b.links.youtube); var ent = d.entregas.filter(function (e) { return e.produto === "brand" && (e.link === (b.links || {}).youtube || e.titulo === b.titulo); })[0];
  var m = (ent && ent.metricas && ent.metricas.visualizacoes != null) ? ent.metricas : (b.youtube || (ent && ent.metricas) || {}); var linhas = [];
  if (m.visualizacoes != null) linhas.push(fmtNum(m.visualizacoes) + " VISUALIZAÇÕES"); if (m.curtidas != null) linhas.push(fmtNum(m.curtidas) + " CURTIDAS"); if (m.comentarios != null && m.comentarios > 0) linhas.push(fmtNum(m.comentarios) + " COMENTÁRIOS");
  var img = ent && ent.imagem ? '<div class="print"><img src="' + esc(ent.imagem) + '" alt=""></div>' : (yt ? '<div class="print"><img src="https://img.youtube.com/vi/' + yt + '/maxresdefault.jpg" onerror="this.src=\'https://img.youtube.com/vi/' + yt + '/hqdefault.jpg\'" alt=""></div>' : '<div class="print vazio"><span>Thumb do vídeo</span></div>');
  return { descricao: "Branded: " + b.titulo + (b.dataVeiculacao ? " (" + fmtData(b.dataVeiculacao) + ")" : ""), html: '<section class="slide item">' + faixaTitulo(d.marca.nome, "BRANDED", "", b.dataVeiculacao) +
    '<div class="corpo">' + img + '<div class="metricas">' + caixaMetrica("ALCANCE", linhas.length ? linhas : ["VEICULADO NO YOUTUBE", b.apresentador ? "COM " + b.apresentador.toUpperCase() : ""]) + "</div></div>" +
    '<div class="legenda">' + esc(((ent && ent.titulo) || b.titulo).toUpperCase()) + "</div></section>" };
}
function slideEmail(d, lista) {
  var linhas = lista.map(function (e) { var m = e.metricas || {}; return [fmtData(e.data), (e.titulo || "Disparo") + (m.base ? " · base " + fmtNum(m.base) : "") + (m.aberturas ? " · " + fmtNum(m.aberturas) + " aberturas" : "") + (m.cliques ? " · " + fmtNum(m.cliques) + " cliques" : "")]; });
  return { descricao: "E-mail marketing: " + lista.length + " disparo" + (lista.length > 1 ? "s" : ""), html: '<section class="slide item">' + faixaTitulo(d.marca.nome, "E-MAIL", "MARKETING") + '<div class="caixas">' + linhas.map(function (l) { return '<div class="cx"><span class="rot">' + esc(l[0]) + "</span><div>" + esc(l[1].toUpperCase()) + "</div></div>"; }).join("") + "</div></section>" };
}
function slideBanner(d, lista) {
  var porMes = {}; lista.forEach(function (e) { var k = e.mes || (e.data || "").slice(0, 7); porMes[k] = (porMes[k] || 0) + (+(e.metricas && e.metricas.impressoes) || 0); });
  var total = 0; Object.keys(porMes).forEach(function (k) { total += porMes[k]; });
  var cx = Object.keys(porMes).sort().map(function (k) { return '<div class="cx"><span class="rot">' + esc(mesDe(k + "-01")) + "</span><div>" + fmtNum(porMes[k]) + " IMPRESSÕES</div></div>"; });
  return { descricao: "Banner no site: " + fmtNum(total) + " impressões", html: '<section class="slide item">' + faixaTitulo(d.marca.nome, "BANNER", "NO SITE") + '<div class="caixas' + (cx.length > 6 ? " muitas" : (cx.length === 4 ? " quatro" : "")) + '">' + cx.join("") + '</div><div class="legenda">TOTAL: ' + fmtNum(total) + " IMPRESSÕES" + (d.consumo.banner && d.consumo.banner.contratado ? " DE " + fmtNum(d.consumo.banner.contratado) + " CONTRATADAS" : "") + "</div></section>" };
}
function slideRevista(d, lista) {
  var porMes = {}; lista.forEach(function (e) { var k = e.mes || (e.data || "").slice(0, 7); (porMes[k] = porMes[k] || []).push((e.titulo || d.marca.nome.split("/")[0]) + " - " + (e.formato || "simples").toUpperCase()); });
  var cx = Object.keys(porMes).sort().map(function (k) { return '<div class="cx"><span class="rot">' + esc(mesDe(k + "-01")) + "</span><div>" + porMes[k].map(function (t) { return esc(t.toUpperCase()); }).join("<br>") + "</div></div>"; });
  return { descricao: "Páginas de revista: " + lista.length + " lançamento" + (lista.length > 1 ? "s" : "") + " em " + Object.keys(porMes).length + " edições", html: '<section class="slide item"><div class="lateral"></div>' + faixaTitulo(d.marca.nome, "PÁGINAS DE", "REVISTA") + '<div class="caixas quatro">' + cx.join("") + "</div></section>" };
}
function slideObrigado() {
  return { descricao: "Obrigado e redes da Duas Rodas", html: '<section class="slide capa fim">' + fundoLetras() + '<div class="caixa"><h1>OBRIGADO!</h1><hr><div class="redes"><span><i class="ig"></i>@duasrodasbr</span><span><i class="yt"></i>@duasrodasbr</span><span><i class="fb"></i>@duasrodasbr</span><span><i class="tk"></i>@revistaduasrodas</span></div><hr><img class="logo" src="' + LOGO + '" alt="Duas Rodas"></div></section>' };
}

function montarDados(d) {
  var slides = [slideCapa(d)];
  var ac = slideAcordados(d); if (ac) slides.push(ac);
  slides.push(slideEntregues(d));
  var dq = slideDestaques(d); if (dq) slides.push(dq);
  var posts = d.entregas.filter(function (e) { return e.produto === "post"; });
  if (posts.length) { slides.push(slideSecao(d, "POSTS", "PUBLICIDADE")); posts.forEach(function (e) { slides.push(slidePost(d, e)); }); }
  if (d.brands.length) { slides.push(slideSecao(d, "BRANDED", "")); d.brands.forEach(function (b) { slides.push(slideBrand(d, b)); }); }
  var emails = d.entregas.filter(function (e) { return e.produto === "email"; }); if (emails.length) slides.push(slideEmail(d, emails));
  var banners = d.entregas.filter(function (e) { return e.produto === "banner"; }); if (banners.length) slides.push(slideBanner(d, banners));
  var revista = d.entregas.filter(function (e) { return e.produto === "revista"; }); if (revista.length) { slides.push(slideSecao(d, "PÁGINA", "DE REVISTA")); slides.push(slideRevista(d, revista)); }
  slides.push(slideObrigado());
  return { slides: slides };
}
var CSS = '@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:ital,wght@0,400;0,600;0,800;1,800&display=swap");' +
  "*{box-sizing:border-box}html,body{margin:0;background:#2a2a2a;font-family:Poppins,Arial,sans-serif}" +
  ".slide{position:relative;width:1920px;height:1080px;overflow:hidden;background:#0A0A0A;color:#fff;margin:0 auto 24px;page-break-after:always;break-after:page}" +
  ".bebas{font-family:'Bebas Neue',Impact,sans-serif}" +
  ".faixa{position:absolute;left:186px;top:88px;display:flex;align-items:center;gap:22px}.faixa.baixo{position:static;margin-top:40px}" +
  ".riscos{width:290px;height:40px;background:repeating-linear-gradient(115deg," + VERMELHO + " 0 26px,transparent 26px 44px)}" +
  ".rel{font-family:'Bebas Neue',Impact,sans-serif;font-size:40px;letter-spacing:.01em;color:#fff}.rel b{color:" + VERMELHO + ";font-weight:400}" +
  ".tit{position:absolute;left:186px;top:150px;margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:150px;line-height:1;color:#fff}.tit b{color:" + VERMELHO + ";font-weight:400}" +
  ".data{position:absolute;right:196px;top:0;width:198px;height:146px;background:" + VERMELHO + ";display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',Impact,sans-serif;font-size:40px}" +
  ".item .corpo{position:absolute;left:70px;right:80px;top:340px;bottom:190px;display:flex;gap:60px;align-items:flex-start}" +
  ".print{position:relative;flex:none;width:760px;max-height:520px;background:#111;box-shadow:-18px -18px 0 " + VERMELHO + "}.print img{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;background:#111}" +
  ".print.vazio{height:450px;display:flex;align-items:center;justify-content:center;color:#666;font-family:'Bebas Neue',Impact,sans-serif;font-size:40px;border:2px dashed #333}" +
  ".metricas{display:flex;flex-direction:row;flex-wrap:wrap;gap:40px 36px;padding-top:70px;align-items:flex-start}" +
  ".metrica{border:3px solid #fff;padding:34px 28px 22px;min-width:360px;position:relative;margin-top:20px}.metrica .rotulo{position:absolute;left:-3px;top:-34px;background:" + VERMELHO + ";padding:6px 30px 6px 14px;font-weight:800;font-size:28px;text-transform:uppercase}.metrica div{display:flex;flex-direction:column;gap:4px;font-family:'Bebas Neue',Impact,sans-serif;font-size:36px;line-height:1.15}" +
  ".legenda{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-family:'Bebas Neue',Impact,sans-serif;font-size:36px;text-decoration:underline;text-underline-offset:6px;padding:0 200px}" +
  ".caixas{position:absolute;left:220px;right:150px;top:400px;display:grid;grid-template-columns:repeat(3,1fr);gap:70px 60px;align-content:start}.caixas.quatro{grid-template-columns:repeat(4,1fr);gap:70px 60px}.caixas.muitas{grid-template-columns:repeat(4,1fr);gap:54px 40px;top:380px}.caixas.muitas .cx{min-height:96px;padding:34px 22px 16px}.caixas.muitas .cx div{font-size:30px}.caixas.muitas .cx .rot{font-size:24px;top:-28px}" +
  ".cx{border:3px solid #fff;padding:40px 28px 26px;position:relative;min-height:150px}.cx .rot{position:absolute;left:-3px;top:-32px;background:" + VERMELHO + ";padding:6px 30px 6px 14px;font-weight:800;font-size:28px}.cx div{font-family:'Bebas Neue',Impact,sans-serif;font-size:36px;line-height:1.15}" +
  ".lateral{position:absolute;left:0;top:0;bottom:0;width:120px;background:repeating-linear-gradient(135deg,#fff 0 30px,#000 30px 70px)}.lateral~.faixa{left:230px}.lateral~.tit{left:230px}" +
  ".lista{background:#0d0d0d radial-gradient(ellipse at 30% 50%,#1d1d1d,transparent 60%)}.lista:after{content:'';position:absolute;right:0;top:0;bottom:0;width:110px;background:repeating-linear-gradient(135deg," + VERMELHO + " 0 30px,transparent 30px 68px)}" +
  ".lista .esq{position:absolute;left:230px;top:380px;width:620px}.lista .esq .faixa{position:static;margin-top:36px}.lista .esq .riscos{width:220px;height:30px}.lista .esq .rel{font-size:32px}.lista .esq h1{margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:120px;line-height:.95;color:#fff}.lista .esq h1 b{color:" + VERMELHO + ";font-weight:400}.lista .div{position:absolute;left:890px;top:270px;width:3px;height:620px;background:#fff}" +
  ".lista ul{position:absolute;left:920px;top:380px;margin:0;padding:0;list-style:none;font-family:'Bebas Neue',Impact,sans-serif;font-size:66px;line-height:1.3;color:#fff}.lista li b{color:" + VERMELHO + ";font-weight:400;margin-right:16px}.lista.destaques ul{right:170px;top:300px;font-family:Poppins,Arial,sans-serif;font-size:34px;line-height:1.35;font-weight:600}.lista.destaques li{margin-bottom:34px;padding-left:34px;position:relative}.lista.destaques li:before{content:'';position:absolute;left:0;top:14px;width:16px;height:16px;background:" + VERMELHO + "}" +
  ".capa,.secao{background:#fff}.letras{position:absolute;inset:-200px;overflow:hidden;background:linear-gradient(160deg," + VERMELHO + " 0 46%,#fff 46%)}.letras span{position:absolute;font-family:Poppins,sans-serif;font-weight:800;font-style:italic;font-size:900px;line-height:.8;color:#0A0A0A;letter-spacing:-.06em;transform:rotate(-9deg)}.letras .l1{left:-120px;top:-260px}.letras .l2{left:420px;top:560px}" +
  ".capa .caixa{position:absolute;left:560px;top:180px;width:800px;height:720px;background:#0A0A0A;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:60px;box-shadow:0 40px 80px rgba(0,0,0,.35)}.capa .tres{width:220px;height:60px;background:repeating-linear-gradient(115deg,#fff 0 30px,transparent 30px 70px);position:absolute;top:-10px;left:50%;transform:translateX(-50%)}" +
  ".capa h1{margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:150px;line-height:1;color:#fff}.capa h2{margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:100px;line-height:1;color:" + VERMELHO + ";text-align:center}.capa hr{width:100%;border:0;border-top:3px solid #fff;margin:24px 0}.logo{display:block;width:420px;height:auto}" +
  ".fim .caixa{left:340px;width:1240px;top:230px;height:620px}.redes{display:flex;gap:60px;font-size:28px;color:#fff;font-weight:400}.redes i{display:inline-block;width:40px;height:40px;border-radius:9px;background:" + VERMELHO + ";vertical-align:middle;margin-right:14px}" +
  ".secao .letras{background:linear-gradient(160deg,#fff 0 100%)}.secao .letras span{color:#0A0A0A}.secao:before{content:'';position:absolute;left:0;top:0;bottom:0;width:110px;background:repeating-linear-gradient(135deg,#0A0A0A 0 30px,#fff 30px 70px)}" +
  ".secao .caixa-esq{position:absolute;left:110px;top:120px;width:940px;height:840px;background:#0A0A0A;padding:200px 100px 0;box-shadow:60px 0 120px rgba(0,0,0,.35)}.secao h1{margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:160px;line-height:.95;color:#fff}.secao h1 b{color:" + VERMELHO + ";font-weight:400}" +
  ".barra-topo{position:sticky;top:0;z-index:9;background:#111;color:#fff;padding:10px 16px;display:flex;gap:12px;align-items:center;font-size:14px}.barra-topo button{background:" + VERMELHO + ";color:#fff;border:0;border-radius:8px;padding:8px 14px;font:inherit;font-weight:600;cursor:pointer}" +
  "@media print{html,body{background:#fff}.barra-topo{display:none}.slide{margin:0;box-shadow:none}@page{size:1920px 1080px;margin:0}}";
function abrir(d) {
  var dados = montarDados(d);
  var w = window.open("", "_blank"); if (!w) { alert("O navegador bloqueou a aba nova. Libere pop-ups para este site."); return; }
  var html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ' + esc(d.marca.nome) + " · " + esc(fmtData(d.dataEmissao)) + '</title><style>' + CSS + "</style></head><body>" +
    '<div class="barra-topo"><strong>Relatório ' + esc(d.marca.nome) + "</strong><span>" + dados.slides.length + ' telas · para salvar em PDF use Imprimir, destino "Salvar como PDF", sem margens</span><button onclick="window.print()">Imprimir / salvar PDF</button></div>' +
    '<div id="telas">' + dados.slides.map(function (s) { return s.html; }).join("") + "</div>" +
    "<script>function ajustar(){var z=Math.min(1,(window.innerWidth-40)/1920);document.getElementById('telas').style.zoom=z}ajustar();window.addEventListener('resize',ajustar);window.addEventListener('beforeprint',function(){document.getElementById('telas').style.zoom=1});window.addEventListener('afterprint',ajustar);<\/script></body></html>";
  w.document.open(); w.document.write(html); w.document.close();
}
window.Relatorio = { montarDados: montarDados, abrir: abrir };
})();
