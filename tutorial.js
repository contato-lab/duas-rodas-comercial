/* Tutorial: passeio guiado (abre sozinho na primeira vez) e guia passo a passo em texto (botão ? no topo).
   Depende de window.DRC (estado e render do app). */
(function () {
"use strict";
var CHAVE = "drc-tutorial-visto";
var VERSAO_TUTORIAL = 2;

/* ============================================================ passos do passeio
   rota: para onde ir antes de mostrar o passo. alvo: lista de seletores; usa o primeiro que existir e estiver visível.
   Sem alvo = cartão centralizado. */
var PASSOS = [
  { rota: "#/inicio", alvo: null, titulo: "Bem-vindo à plataforma Comercial Duas Rodas",
    texto: "Aqui fica tudo que a revista vendeu e tudo que entregou para cada marca: posts, e-mails, páginas de revista, banner e vídeos de brand. Este passeio leva uns 3 minutos e mostra onde fica cada coisa. Você pode sair quando quiser e voltar pelo botão ? no topo." },
  { rota: "#/inicio", alvo: [".lado .meio", ".nav-baixo"], titulo: "O menu",
    texto: "Cada item do menu é uma parte do trabalho. Marcas e Autorizações guardam o que foi contratado. Fila, Brand e Edição acompanham a produção. Calendário e Relatórios mostram o resultado. O número vermelho avisa quantos alertas ou materiais estão esperando." },
  { rota: "#/inicio", alvo: [".grid.g4"], titulo: "Visão geral: os números do dia",
    texto: "Quantas marcas têm contrato vigente, quantas estão em dia, quantas estão atrasadas no pacote e quantas venceram com saldo sem usar. Os botões no topo são atalhos: Entrou material, Registrar entrega e Novo brand, sem precisar trocar de tela." },
  { rota: "#/inicio", alvo: [".semaforo"], titulo: "Semáforo de marcas",
    texto: "Uma peça por marca. A cor da borda de cima diz a situação: verde em dia, laranja atrasada, vermelha vencida com saldo, tracejada sem cotas cadastradas. Dentro, a barrinha de cada produto e, embaixo, há quanto tempo o cliente foi cobrado. Clique na peça para abrir a ficha." },
  { rota: "#/inicio", alvo: [".semana"], titulo: "Esta semana",
    texto: "De segunda a domingo, tudo que sai em cada dia, de todas as marcas. A última coluna é o que está na fila sem data: clique no item para dar a data na hora. Vermelho ao lado do item é material parado há 5 dias ou mais." },
  { rota: "#/inicio", alvo: [".grid.g2 .card"], titulo: "Radar de renovação",
    texto: "Contratos que vencem nos próximos 60 dias e o saldo que ainda têm. É o aviso para o Marconi começar a renovar sem deixar o cliente carregar saldo vencido. Ao lado, os vídeos de brand parados com o cliente há 14 dias ou mais." },
  { rota: "#/marcas", alvo: [".chips"], titulo: "Marcas: filtros",
    texto: "Por padrão aparecem só as marcas com contrato vigente ou vídeo em produção. Os outros filtros mostram todas, só as com alerta, ou as que ainda estão sem cotas cadastradas." },
  { rota: "#/marcas", alvo: [".lista-marcas .marca-card"], titulo: "O card de cada marca",
    texto: "A barrinha de cada produto mostra quanto já foi entregue do que foi contratado. O risquinho preto é o tempo do contrato que já passou. Barrinha laranja é produto atrasado. Clique no card para abrir a ficha completa." },
  { rota: "#/marcas/__MARCA__", alvo: [".ficha-cab + .row", ".card .row.mt4"], titulo: "Ficha da marca: as autorizações",
    texto: "Cada chip é uma autorização (contrato) da marca, com a situação: vigente, vencendo, vencida. Uma marca pode ter várias ao mesmo tempo, por exemplo o contrato de 2025 com saldo e o de 2026 já renovado. Clique no chip para ver só aquela autorização." },
  { rota: "#/marcas/__MARCA__", alvo: [".cota", ".ficha-grade .card"], titulo: "Consumo do pacote",
    texto: "Aqui estão as cotas daquela autorização: contratado, entregue, programado e o que falta. Ao lado ficam as abas de Entregas, Brand e Cobranças. O botão Nova entrega registra um post, e-mail, página ou banner que saiu." },
  { rota: "#/autorizacoes", alvo: ['[data-acao="nova-aut"]'], titulo: "Cadastrar uma autorização",
    texto: "Quando o Marconi fechar um contrato novo, clique aqui. Dá para subir o PDF da autorização: se o PDF tiver texto, a plataforma lê Gecom, vigência, valor e cotas sozinha. Se for escaneado, preencha à mão olhando o documento. Sem as cotas, a barrinha da marca não funciona." },
  { rota: "#/fila", alvo: ['[data-acao="novo-fila"]'], titulo: "Fila de materiais",
    texto: "O atendimento registra aqui tudo que a marca mandou: o que é, o link do arquivo no Drive e o link parametrizado. Nada mais se perde no WhatsApp. Igor e Isa clicam em Dar data, e o material vira uma entrega programada no calendário. Quando sair, basta marcar como publicado." },
  { rota: "#/brand", alvo: [".brand-card"], titulo: "Brand: um card por marca",
    texto: "Dentro do card estão os vídeos da marca e a etapa em que cada um está. Laranja é etapa que depende do cliente. Clique no vídeo para abrir a ficha: lá tem a linha do tempo, o botão de avançar etapa, o registro de cobrança ao cliente e o contador de refações. Cada registro grava a data, e isso é a prova de que a revista cobrou." },
  { rota: "#/edicao", alvo: ["main .card"], titulo: "Edição",
    texto: "A fila de edição e YouTube do New: status, datas de início, finalização, revisões e ajustes. Cada data em Revisões ou Ajustes é uma ida e volta. Branded e editorial ficam juntos, com filtro." },
  { rota: "#/calendario", alvo: [".cal"], titulo: "Calendário",
    texto: "Tudo que vai sair, por dia, de todas as marcas: post, e-mail, brand, revista, banner. Serve para responder o cliente que pergunta quando o material dele sai, sem precisar perguntar para ninguém. Clique no item para abrir." },
  { rota: "#/relatorios", alvo: ["main .card"], titulo: "Relatório por cliente",
    texto: "Escolha a marca, a autorização e, se quiser, o período. O relatório abre em uma aba nova, no padrão visual da revista, com o que foi acordado, o que foi entregue e cada post com os números. Para salvar em PDF, use Imprimir e escolha Salvar como PDF." },
  { rota: "#/ajustes", alvo: ["main .card"], titulo: "Ajustes",
    texto: "Exportar e importar dados, trocar o estilo claro ou escuro e ver o estado das integrações. Enquanto o Firebase não estiver ligado, os dados ficam só neste navegador: exporte antes de trocar de computador." },
  { rota: "#/inicio", alvo: ['[data-acao="ajuda"]'], titulo: "Pronto. Dúvida? Clique no ?",
    texto: "O botão ? no topo reabre este passeio e tem o guia completo em texto, com o passo a passo de cada tarefa: cadastrar marca, registrar entrega, dar data na fila, acompanhar um brand, gerar relatório." }
];

/* ============================================================ guia em texto */
var GUIA = [
  { titulo: "Cadastrar uma marca nova", passos: [
    "Vá em Marcas e clique em Nova marca, no canto superior direito.",
    "Preencha o nome e, se tiver, o contato na marca (quem aprova os materiais).",
    "Salve. A plataforma abre a ficha da marca já pronta para receber a autorização." ] },
  { titulo: "Cadastrar uma autorização (contrato)", passos: [
    "Na ficha da marca, clique em Nova autorização. Ou vá em Autorizações e clique em Nova autorização.",
    "Se tiver o PDF da autorização, clique na área cinza e escolha o arquivo. Se o PDF tiver texto, os campos são preenchidos sozinhos. Confira cada um.",
    "Se o PDF for escaneado (foto), preencha à mão: nome da autorização (ex.: Gecom 104-25), início e fim da vigência, valor e as cotas de cada produto.",
    "As cotas são o coração da plataforma: posts, brands, disparos de e-mail, páginas de revista e impressões de banner. Sem elas a barrinha não funciona.",
    "Salve. A autorização aparece como chip na ficha da marca." ] },
  { titulo: "Registrar uma entrega (post, e-mail, página, banner)", passos: [
    "Abra a ficha da marca e escolha o chip da autorização certa.",
    "Clique em Nova entrega.",
    "Escolha o produto, a data e escreva o título. Cole o link do post e, se já tiver, os números (visualizações, alcance, curtidas).",
    "Se quiser que o print apareça no relatório, suba a imagem em Print para o relatório.",
    "Situação Publicado conta na cota. Situação Programado só aparece no calendário, sem contar.",
    "Salve. A barrinha da marca atualiza na hora." ] },
  { titulo: "Material que a marca mandou (fila)", passos: [
    "Atendimento: vá em Fila de materiais e clique em Entrou material.",
    "Escolha a marca e o produto, descreva o material, cole o link do arquivo (Drive) e o link parametrizado. Se o cliente pediu uma data, informe. Marque a urgência.",
    "Conteúdo (Igor e Isa): abra a fila, clique em Dar data no item, escolha a data de publicação e a autorização. Vira uma entrega programada no calendário.",
    "Quando o material sair, abra a entrega (pelo calendário ou pela ficha da marca), mude para Publicado e cole o link e os números." ] },
  { titulo: "Acompanhar um vídeo de brand", passos: [
    "Vá em Brand. Cada card é uma marca; dentro estão os vídeos e a etapa de cada um.",
    "Para começar um vídeo novo, clique em Novo brand no card da marca. Informe o tema (moto ou produto), o apresentador e a autorização.",
    "Clique no vídeo para abrir a ficha. Use Avançar para passar de etapa: a data fica gravada na linha do tempo.",
    "Se o cliente está demorando, escreva a cobrança no campo e clique em Registrar cobrança. Fica gravado com a data: é a prova de que a revista cobrou.",
    "Use o contador de Refações a cada ida e volta de edição. Anote o motivo em Observações.",
    "Logística do produto registra se a marca manda a moto, se vamos retirar ou se o produto já está em mãos.",
    "Quando o vídeo for ao ar, cole o link do YouTube e avance para Veiculado. Ele passa a contar na cota de brand da autorização." ] },
  { titulo: "Fila de edição (New)", passos: [
    "Vá em Edição. Clique em Novo material para incluir um vídeo na fila.",
    "Atualize o Status conforme avança: Fila, Próximo, Edição, Revisão, Aprovação, Aprovado, Publicado.",
    "Em Revisões e Ajustes, coloque uma data para cada rodada, separadas por vírgula. Quantas datas, quantas idas e vindas.",
    "Cole o link de exibição (YouTube não listado) para o cliente aprovar e o link do material no Drive." ] },
  { titulo: "Gerar o relatório de um cliente", passos: [
    "Vá em Relatórios. Escolha a marca e a autorização. Se quiser só um mês, preencha o período.",
    "Confira a lista do que vai entrar e clique em Gerar relatório. Ele abre em uma aba nova.",
    "Para salvar em PDF: Imprimir, destino Salvar como PDF, papel paisagem, sem margens.",
    "Os prints dos posts vêm das entregas. Sem print, a tela mostra o espaço reservado." ] },
  { titulo: "Entender os alertas", passos: [
    "Pacote atrasado: o produto está 25 pontos ou mais abaixo do tempo do contrato já passado. Exemplo: 60% do prazo passou e só 20% dos posts saíram.",
    "Vencida com saldo: a autorização passou do fim e ainda tem produto sem usar. É o caso de cobrar renovação, não de carregar o saldo para o ano seguinte.",
    "Brand parado com o cliente: o vídeo está em etapa que depende da marca (definir tema, aprovar roteiro, aprovar vídeo) há 14 dias ou mais." ] },
  { titulo: "Dados e cópia de segurança", passos: [
    "Enquanto o Firebase não estiver ligado, os dados ficam só no navegador de quem usa.",
    "Em Ajustes, Exportar dados baixa um arquivo com tudo. Importar dados carrega esse arquivo em outro computador.",
    "Recarregar dados das planilhas apaga tudo que foi editado e volta ao início. Use com cuidado." ] }
];

/* ============================================================ passeio */
var T = { ativo: false, i: 0, el: null, marcaDemo: "" };
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function visivel(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }
function acharAlvo(sels) { if (!sels) return null; for (var i = 0; i < sels.length; i++) { var el = document.querySelector(sels[i]); if (visivel(el)) return el; } return null; }
function marcaDemo() {
  var d = window.DRC && window.DRC.S.d; if (!d) return "";
  var pref = d.marcas.filter(function (m) { return m.id === "laquila-texx"; })[0];
  if (pref) return pref.id;
  var comAut = d.autorizacoes.filter(function (a) { var c = a.cotas || {}; return Object.keys(c).some(function (k) { return c[k] > 0; }); })[0];
  return comAut ? comAut.marcaId : (d.marcas[0] || {}).id || "";
}
function montar() {
  if (T.el) return;
  var el = document.createElement("div"); el.className = "tour"; el.innerHTML = '<div class="tour-foco"></div><div class="tour-cartao" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(el); T.el = el;
  el.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-tour]"); if (!b) return;
    var a = b.getAttribute("data-tour");
    if (a === "prox") ir(T.i + 1); else if (a === "ant") ir(T.i - 1); else if (a === "sair") encerrar(true); else if (a === "fim") encerrar(true);
  });
  window.addEventListener("resize", posicionar);
  document.addEventListener("keydown", teclas);
}
function teclas(ev) { if (!T.ativo) return; if (ev.key === "Escape") encerrar(true); if (ev.key === "ArrowRight") ir(T.i + 1); if (ev.key === "ArrowLeft") ir(T.i - 1); }
function iniciar() {
  if (!window.DRC || !window.DRC.S.pronto) return;
  if (window.DRC.S.dialogo) { window.DRC.S.dialogo = null; window.DRC.render(); }
  T.marcaDemo = marcaDemo(); montar(); T.ativo = true; T.el.classList.add("on"); document.body.classList.add("tour-ativo"); ir(0);
}
function encerrar(marcar) {
  T.ativo = false; if (T.el) T.el.classList.remove("on"); document.body.classList.remove("tour-ativo");
  if (marcar) { try { localStorage.setItem(CHAVE, String(VERSAO_TUTORIAL)); } catch (e) {} }
}
function ir(i) {
  if (i < 0) i = 0; if (i >= PASSOS.length) return encerrar(true);
  T.i = i; var p = PASSOS[i];
  var rota = p.rota.replace("__MARCA__", T.marcaDemo);
  if (location.hash !== rota) { location.hash = rota; }
  // o app redesenha no hashchange; espera um instante antes de procurar o alvo
  setTimeout(function () { if (!T.ativo || T.i !== i) return; mostrar(p); }, 80);
}
function mostrar(p) {
  var alvo = acharAlvo(p.alvo);
  if (alvo) { alvo.scrollIntoView({ block: "center", behavior: "instant" in document.documentElement.style ? "instant" : "auto" }); }
  T.alvo = alvo;
  var cartao = T.el.querySelector(".tour-cartao");
  cartao.innerHTML = '<div class="tour-passo">' + (T.i + 1) + " de " + PASSOS.length + '</div><h3>' + esc(p.titulo) + "</h3><p>" + esc(p.texto) + "</p>" +
    '<div class="tour-botoes">' + (T.i > 0 ? '<button type="button" class="btn p" data-tour="ant">Anterior</button>' : '<button type="button" class="btn p fantasma" data-tour="sair">Pular o passeio</button>') +
    '<span style="flex:1"></span>' + (T.i < PASSOS.length - 1 ? '<button type="button" class="btn p fantasma" data-tour="sair">Sair</button><button type="button" class="btn p prim" data-tour="prox">Próximo</button>' : '<button type="button" class="btn p prim" data-tour="fim">Concluir</button>') + "</div>";
  setTimeout(posicionar, 30);
}
function posicionar() {
  if (!T.ativo || !T.el) return;
  var foco = T.el.querySelector(".tour-foco"), cartao = T.el.querySelector(".tour-cartao");
  var vw = window.innerWidth, vh = window.innerHeight, pad = 8;
  var alvo = T.alvo && document.body.contains(T.alvo) ? T.alvo : acharAlvo(PASSOS[T.i].alvo);
  if (!alvo) {
    // sem alvo: escurece a tela inteira e centraliza o cartão
    foco.style.display = "block"; foco.style.left = (vw / 2) + "px"; foco.style.top = (vh / 2) + "px"; foco.style.width = "0px"; foco.style.height = "0px";
    cartao.style.left = Math.max(12, (vw - cartao.offsetWidth) / 2) + "px"; cartao.style.top = Math.max(12, (vh - cartao.offsetHeight) / 2) + "px"; cartao.style.bottom = "auto";
    return;
  }
  var r = alvo.getBoundingClientRect();
  foco.style.display = "block"; foco.style.left = (r.left - pad) + "px"; foco.style.top = (r.top - pad) + "px"; foco.style.width = (r.width + pad * 2) + "px"; foco.style.height = (r.height + pad * 2) + "px";
  if (vw < 700) { cartao.style.left = "12px"; cartao.style.top = "auto"; cartao.style.bottom = "12px"; return; }
  var cw = cartao.offsetWidth, ch = cartao.offsetHeight, left, top;
  var espacoDir = vw - r.right, espacoBaixo = vh - r.bottom;
  if (espacoDir >= cw + 24) { left = r.right + 16; top = r.top; }
  else if (espacoBaixo >= ch + 24) { left = r.left; top = r.bottom + 16; }
  else if (r.left >= cw + 24) { left = r.left - cw - 16; top = r.top; }
  else { left = r.left; top = r.top - ch - 16; }
  left = Math.max(12, Math.min(left, vw - cw - 12)); top = Math.max(12, Math.min(top, vh - ch - 12));
  cartao.style.left = left + "px"; cartao.style.top = top + "px"; cartao.style.bottom = "auto";
}

/* ============================================================ ajuda (botão ?) */
function htmlAjuda(secaoAberta) {
  return '<div class="dialogo largo"><div class="cab"><div><h2>Ajuda</h2><div class="sub">Passeio guiado pela plataforma ou passo a passo por tarefa</div></div><button type="button" class="btn icone fantasma" data-acao="fechar" aria-label="Fechar"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
    '<div class="corpo"><div class="alerta-box info" style="align-items:center"><span class="t" style="flex:1">O passeio guiado leva uns 3 minutos e mostra cada tela com a explicação no lugar.</span><button type="button" class="btn p prim" data-acao="tutorial-passeio">Começar o passeio</button></div>' +
    '<div class="guia">' + GUIA.map(function (g, i) {
      var aberta = secaoAberta === i;
      return '<div class="guia-secao' + (aberta ? " aberta" : "") + '"><button type="button" class="guia-titulo" data-acao="tutorial-secao" data-v="' + i + '"><span>' + esc(g.titulo) + '</span><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
        (aberta ? '<ol class="guia-passos">' + g.passos.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ol>" : "") + "</div>";
    }).join("") + "</div></div></div>";
}
function jaViu() { try { return localStorage.getItem(CHAVE) === String(VERSAO_TUTORIAL); } catch (e) { return true; } }

window.Tutorial = { iniciar: iniciar, encerrar: encerrar, htmlAjuda: htmlAjuda, jaViu: jaViu, PASSOS: PASSOS, GUIA: GUIA };
})();
