/* Tutorial: passeio guiado (abre sozinho na primeira vez) e guia passo a passo em texto (botão ? no topo).
   Depende de window.DRC (estado e render do app). */
(function () {
"use strict";
var CHAVE = "drc-tutorial-visto";
var VERSAO_TUTORIAL = 12;

/* ============================================================ passos do passeio
   rota: para onde ir antes de mostrar o passo. alvo: lista de seletores; usa o primeiro que existir e estiver visível.
   Sem alvo = cartão centralizado. */
var PASSOS = [
  { rota: "#/inicio", alvo: null, titulo: "Bem-vindo à plataforma Comercial Duas Rodas",
    texto: "Aqui fica tudo que a revista vendeu e tudo que entregou para cada marca: posts, e-mails, páginas de revista, banner e vídeos de brand. Este passeio leva uns 4 minutos e mostra onde fica cada coisa. Pode sair quando quiser e voltar pelo botão ? no topo." },
  { rota: "#/inicio", alvo: [".lado .meio", ".nav-baixo"], titulo: "O menu",
    texto: "Marcas e Autorizações guardam o que foi contratado. Fila, Brand e Edição acompanham a produção. Calendário e Relatórios mostram o resultado. O número vermelho ao lado de um item avisa quantos alertas ou materiais estão esperando." },
  { rota: "#/inicio", alvo: [".grid.g4"], titulo: "Visão geral: os números do dia",
    texto: "Quantas marcas têm contrato vigente, quantas estão em dia, quantas estão atrasadas no pacote e quantas venceram com saldo sem usar. Clique num número para ver a lista. Os botões no topo são atalhos: Entrou material, Registrar entrega e Novo brand, sem trocar de tela." },
  { rota: "#/inicio", alvo: [".semaforo"], titulo: "Semáforo de marcas",
    texto: "Uma peça por marca com cotas cadastradas. A cor da borda de cima diz a situação: verde em dia, laranja atrasada no pacote, vermelha vencida com saldo. Dentro, a barrinha de cada produto e, embaixo, há quanto tempo o cliente foi cobrado. Clique na peça para abrir a ficha. As marcas sem cotas ficam na faixa de chips logo abaixo." },
  { rota: "#/inicio", alvo: [".semana"], titulo: "Esta semana",
    texto: "De segunda a domingo, tudo que sai em cada dia, de todas as marcas. A última coluna é o que está na fila sem data: clique no item para dar a data na hora. Vermelho ao lado do item é material parado há 5 dias ou mais." },
  { rota: "#/inicio", alvo: [".card.radar", ".grid.g2 .card"], titulo: "Radar de renovação e brand parado",
    texto: "À esquerda, os contratos que vencem nos próximos 60 dias e o saldo que ainda têm: é o aviso para começar a renovar sem deixar o cliente carregar saldo vencido. À direita, os vídeos de brand parados com o cliente há 14 dias ou mais." },
  { rota: "#/marcas", alvo: [".md-lista"], titulo: "Marcas: a lista",
    texto: "Todas as marcas numa coluna, com a bolinha de situação e o produto mais crítico. Busca e filtros em cima. Clique numa marca e a ficha abre ao lado, sem trocar de tela." },
  { rota: "#/marcas/__MARCA__", alvo: [".ficha-topo"], titulo: "Ficha da marca",
    texto: "Nome, situação, contato e os botões: Editar, Copiar resumo pro cliente (texto pronto com contratado, entregue e saldo), Nova entrega e Relatório. Embaixo, os chips são as autorizações: uma marca pode ter o contrato de 2025 com saldo e o de 2026 renovado ao mesmo tempo." },
  { rota: "#/marcas/__MARCA__", alvo: [".prod-caixas"], titulo: "Uma caixa por produto",
    texto: "Posts, Brand, E-mail, Revista e Banner, cada um com entregue de contratado e o que falta. Clique na caixa para ver só aquele produto: a barrinha, o ritmo necessário para fechar no prazo e a lista de entregas com os números." },
  { rota: "#/marcas/__MARCA__", alvo: [".ficha-abas"], titulo: "Linha do ano, Cobranças e Contrato",
    texto: "Linha do ano mostra mês a mês o que saiu de cada produto e os meses vazios, que é a visão de defesa. Cobranças guarda cada vez que a revista cobrou a marca, com data. Contrato traz os dados da autorização." },
  { rota: "#/autorizacoes", alvo: [".aut-tabela"], titulo: "Autorizações: a tabela",
    texto: "Os contratos agrupados por situação: vencendo primeiro, depois vigentes, depois vencidas. Cada linha mostra entregue e contratado por produto. Os números tracejados são as cotas, editáveis na própria linha: clicou, digitou, saiu do campo, salvou. Renovar cria o contrato do ano seguinte com as mesmas cotas, sem carregar saldo." },
  { rota: "#/autorizacoes", alvo: ['[data-acao="seq-iniciar"]', '[data-acao="visao-aut"][data-v="tempo"]'], titulo: "Cadastrar em sequência e linha do tempo",
    texto: "Cadastrar em sequência percorre uma a uma as autorizações que vieram da planilha sem quantidades, sugerindo a cota de brand pelo que a planilha mostra. Linha do tempo troca a tabela por barras no calendário. Nova autorização aceita o PDF e lê Gecom, vigência e cotas quando o PDF tem texto." },
  { rota: "#/fila", alvo: [".fila-grade"], titulo: "Fila de materiais",
    texto: "Esquerda: o que chegou da marca e ainda não tem data, com o checklist do que veio e do que falta (arte, legenda, link). Direita: a semana programada. Arraste o material para um dia ou clique em Dar data. Pedir o que falta copia o texto pronto para mandar à marca. Arquivo colocado na pasta MATERIAIS do Drive entra aqui sozinho, de hora em hora, marcado como lançado pelo robô." },
  { rota: "#/brand", alvo: [".funil"], titulo: "Brand: o funil",
    texto: "Quantos vídeos estão em cada fase: com o cliente, roteiro, gravação, edição e revisão, prontos para dar data. Clique numa fase para filtrar. Os créditos contratados que ainda não têm tema ficam fora do funil, agrupados em cada marca." },
  { rota: "#/brand", alvo: [".brand-card", ".brand-lista", "main .card"], titulo: "Brand: um card por marca",
    texto: "Dentro do card, cada vídeo em produção com a etapa, quem está com a bola, há quantos dias e o botão da ação daquele momento: Cobrar, Roteiro pronto, Gravado, Para revisão, Enviar ao cliente, Veiculou. Clique no vídeo para abrir a ficha completa. Com o link do YouTube na ficha, as visualizações, curtidas e comentários entram sozinhos e atualizam todo dia." },
  { rota: "#/edicao", alvo: [".ed-fila"], titulo: "Edição: o quadro do New",
    texto: "Quatro colunas: Na fila do New (já na ordem certa), Editando, Esperando resposta e Prontos para publicar. Arraste o cartão para a coluna seguinte ou use o botão do cartão: Começar, Finalizado, Ok ao cliente, Aprovou, Publicado. A setinha para trás é Pediu ajuste, que devolve para a edição e conta mais uma rodada. Cartão ligado a um vídeo do menu Brand faz as duas telas andarem juntas. A visão Tabela é a planilha completa, editável na linha." },
  { rota: "#/calendario", alvo: [".cal"], titulo: "Calendário",
    texto: "Tudo que vai sair, por dia, de todas as marcas: post, e-mail, brand, revista, banner. Serve para responder o cliente que pergunta quando o material dele sai. Clique no item para abrir." },
  { rota: "#/relatorios", alvo: ["main .card"], titulo: "Relatório por cliente",
    texto: "Escolha a marca, a autorização e, se quiser, o período. O relatório abre em uma aba nova, no padrão visual da revista, com o que foi acordado, o que foi entregue e cada post com os números. Números do YouTube, do Instagram e do Facebook entram sozinhos quando a entrega tem o link. Para salvar em PDF, use Imprimir e escolha Salvar como PDF." },
  { rota: "#/ajustes", alvo: ["main .card"], titulo: "Ajustes e integrações",
    texto: "Os dados ficam no Firebase, compartilhados por todo mundo que abre a plataforma. Aqui dá para exportar uma cópia, trocar o estilo claro ou escuro e ver se os robôs estão rodando: YouTube, Drive e Instagram/Facebook." },
  { rota: "#/inicio", alvo: ['[data-acao="ajuda"]'], titulo: "Pronto. Dúvida? Clique no ?",
    texto: "O botão ? no topo reabre este passeio e tem o guia completo em texto, com o passo a passo de cada tarefa: cadastrar marca, registrar entrega, dar data na fila, acompanhar um brand, gerar relatório, ligar os robôs." }
];

/* ============================================================ guia em texto */
var GUIA = [
  { titulo: "Cadastrar uma marca nova", passos: [
    "Vá em Marcas e clique em Nova marca, no canto superior direito.",
    "Preencha o nome e, se tiver, o contato na marca (quem aprova os materiais).",
    "Se a pasta dessa marca no Drive tiver um nome diferente do nome aqui, preencha Pasta no Drive, para o robô reconhecer os arquivos.",
    "Salve. A plataforma abre a ficha da marca já pronta para receber a autorização." ] },
  { titulo: "Cadastrar uma autorização (contrato)", passos: [
    "Na ficha da marca, clique em Nova autorização. Ou vá em Autorizações e clique em Nova autorização.",
    "Se tiver o PDF da autorização, clique na área cinza e escolha o arquivo. Se o PDF tiver texto, os campos são preenchidos sozinhos. Confira cada um.",
    "Se o PDF for escaneado (foto), preencha à mão: nome da autorização (ex.: Gecom 104-25), início e fim da vigência e as cotas de cada produto.",
    "As cotas são o coração da plataforma: posts, brands, disparos de e-mail, páginas de revista e impressões de banner. Sem elas a barrinha não funciona.",
    "Salve. A autorização aparece como chip na ficha da marca.",
    "Para corrigir só as quantidades, não precisa abrir o formulário: em Autorizações, digite direto nos números tracejados da tabela.",
    "Para renovar um contrato, clique em Renovar na linha dele: a plataforma cria o do ano seguinte com as mesmas cotas e a vigência avançada. O saldo antigo não passa." ] },
  { titulo: "Registrar uma entrega (post, e-mail, página, banner)", passos: [
    "Abra a ficha da marca (Marcas, clique no nome) e escolha o chip da autorização certa.",
    "Clique na caixa do produto (Posts, E-mail, Revista ou Banner) e depois em Registrar.",
    "Escolha o produto, a data e escreva o título. Cole o link do post.",
    "Post com link do Instagram ou do Facebook da revista recebe os números sozinho (alcance, curtidas, comentários, salvamentos, compartilhamentos), lidos todo dia de manhã pelo robô. Não precisa digitar.",
    "Para o print aparecer no relatório: tire o print do post, abra a entrega e cole com Cmd + V (ou arraste a imagem, ou escolha o arquivo).",
    "Situação Publicado conta na cota. Situação Programado só aparece no calendário, sem contar.",
    "Salve. A barrinha da marca atualiza na hora." ] },
  { titulo: "Material que a marca mandou (fila)", passos: [
    "Pelo Drive: coloque o arquivo na pasta MATERIAIS, dentro da subpasta da marca. Em até uma hora ele aparece na fila, com link, marca e tipo, marcado como lançado pelo robô.",
    "Pela mão: vá em Fila de materiais e clique em Entrou material. Descreva o material com o nome da marca no texto (a marca é reconhecida sozinha), escolha o produto, cole os links e marque no checklist o que já veio.",
    "Se faltar algo, o item mostra o que falta e o botão Pedir o que falta copia a mensagem pronta para mandar à marca.",
    "Conteúdo: arraste o material para um dia da semana à direita, ou clique em Dar data. Vira uma entrega programada no calendário.",
    "Quando o material sair, abra a entrega (pelo calendário ou pela ficha da marca), mude para Publicado e cole o link do post." ] },
  { titulo: "Acompanhar um vídeo de brand", passos: [
    "Vá em Brand. Cada card é uma marca; dentro estão os vídeos e a etapa de cada um.",
    "Para começar um vídeo novo, clique em Novo brand. Informe o tema (moto ou produto), o apresentador e a autorização.",
    "Cada vídeo tem um botão com a ação daquela etapa (Roteiro pronto, Gravado, Para revisão, Veiculou): um clique avança e grava a data. Para o resto, clique no vídeo e abra a ficha.",
    "Se o cliente está demorando, escreva a cobrança no campo e clique em Registrar cobrança. Fica gravado com a data: é a prova de que a revista cobrou.",
    "Use o contador de Refações a cada ida e volta de edição. Anote o motivo em Observações.",
    "Quando o vídeo for ao ar, cole o link do YouTube no campo Vídeo final e avance para Veiculado. Ele passa a contar na cota de brand da autorização." ] },
  { titulo: "Fila de edição (New)", passos: [
    "Vá em Edição. A coluna Na fila do New já está na ordem certa: clique em Começar quando pegar o vídeo (ou arraste o cartão para Editando) e em Finalizado quando mandar para revisão.",
    "Na coluna Esperando resposta, o botão diz o que aconteceu: Ok, ao cliente (passou na revisão interna), Aprovou (cliente aprovou) ou a setinha para trás, Pediu ajuste, que devolve para Editando e conta mais uma rodada. Cada clique grava a data.",
    "Para incluir um vídeo novo, clique em Novo material e, se for branded, escolha o vídeo de brand correspondente: assim as duas telas andam juntas.",
    "Na visão Tabela dá para corrigir status e datas direto na linha e registrar rodadas antigas com o botão +.",
    "Cole o link de exibição (YouTube não listado) para o cliente aprovar e o link do material no Drive." ] },
  { titulo: "Números do YouTube sem digitar", passos: [
    "Na ficha do vídeo de brand, cole o link público ou não listado no campo Vídeo final (YouTube). Em um segundo aparecem visualizações, curtidas e comentários logo abaixo; ao salvar, ficam gravados.",
    "Todo dia, quem abrir a plataforma primeiro atualiza sozinho todos os vídeos com link. No menu Brand aparece quantos já foram lidos hoje, e o botão Atualizar agora força de novo.",
    "No relatório, a tela de cada branded já sai com esses números." ] },
  { titulo: "Números do Instagram e do Facebook sem digitar", passos: [
    "Cadastre a entrega do post com o link do Instagram (instagram.com/p/... ou /reel/...) ou do Facebook da revista.",
    "Todo dia às 6h30 o robô lê alcance, curtidas, comentários, salvamentos, compartilhamentos e visualizações de cada post e grava na entrega. Post dos últimos 7 dias é relido todo dia; depois, uma vez por semana.",
    "Na entrega aparece de onde vieram os números e quando. Se o post não for da conta da revista, aparece um aviso para conferir o link.",
    "Em Ajustes dá para ver quantos posts já foram lidos e quando foi a última rodada." ] },
  { titulo: "Robô do Drive", passos: [
    "A pasta é MATERIAIS, dentro de DUAS RODAS, no Drive da Lime. Dentro dela, uma subpasta por marca com o mesmo nome da marca na plataforma.",
    "Todo arquivo novo na subpasta entra na fila na hora cheia seguinte, com link, marca e tipo (post, e-mail, banner, revista ou brand, adivinhado pelo nome e pelo formato).",
    "O robô só lê: não apaga, não move e não renomeia nada no Drive. Arquivo trocado depois de lançado ganha uma observação na fila.",
    "Arquivo em subpasta que a plataforma não reconhece entra sem marca, com aviso para escolher na ficha." ] },
  { titulo: "Usar a leitura com IA (Claude)", passos: [
    "Contratos: em Autorizações, clique em Ler contratos com IA e escolha os PDFs ou fotos das autorizações, vários de uma vez. O Claude lê cada um, mesmo escaneado, e monta uma tabela com marca, Gecom, vigência e cotas. Confira, ajuste o que precisar e clique em Salvar.",
    "Para cada contrato a tabela já diz se vai atualizar um contrato que existe ou criar um novo. Dá para trocar na própria linha.",
    "Print dos Insights: na entrega do post, cole o print da tela de estatísticas e clique em Ler números do print. Os campos de alcance, curtidas e o resto são preenchidos. Confira e salve.",
    "Relatório: em Relatórios, depois de escolher a marca, clique em Escrever com IA no quadro de destaques. O Claude escreve de 3 a 5 frases só com os números lançados. Edite à vontade; se o quadro tiver texto, o relatório ganha uma tela de destaques.",
    "Drive: o robô que lê a pasta MATERIAIS agora abre cada arquivo novo e diz o tipo do material, uma descrição e o que a marca ainda precisa mandar. Isso aparece no checklist e na observação do item da fila.",
    "Tudo isso usa o crédito mensal de API da UnderClick. Ler um contrato ou um print custa centavos." ] },
  { titulo: "Gerar o relatório de um cliente", passos: [
    "Vá em Relatórios. Escolha a marca e a autorização. Se quiser só um mês, preencha o período.",
    "Confira a lista do que vai entrar e clique em Gerar relatório. Ele abre em uma aba nova.",
    "Para salvar em PDF: Imprimir, destino Salvar como PDF, papel paisagem, sem margens.",
    "Os prints dos posts vêm das entregas; a thumb dos vídeos vem do link do YouTube. Sem print, a tela mostra o espaço reservado." ] },
  { titulo: "Cobrar o cliente e ter a prova", passos: [
    "Na ficha da marca, clique na caixa do produto e depois em Registrar cobrança. Ou use a aba Cobranças.",
    "Escreva para quem, por qual canal e o que foi pedido. A data fica gravada.",
    "Para vídeos de brand, a cobrança fica na ficha do vídeo (menu Brand) e aparece também na aba Cobranças da marca.",
    "Na hora de responder o cliente, use Copiar resumo pro cliente no topo da ficha: sai um texto com contratado, entregue, saldo e a última cobrança, pronto para colar no e-mail ou no WhatsApp." ] },
  { titulo: "Entender os alertas", passos: [
    "Pacote atrasado: o produto está 25 pontos ou mais abaixo do tempo do contrato já passado. Exemplo: 60% do prazo passou e só 20% dos posts saíram.",
    "Vencida com saldo: a autorização passou do fim e ainda tem produto sem usar. É o caso de cobrar renovação, não de carregar o saldo para o ano seguinte.",
    "Brand parado com o cliente: o vídeo está em etapa que depende da marca (definir tema, aprovar roteiro, aprovar vídeo) há 14 dias ou mais.",
    "Sem cotas cadastradas: a marca tem contrato ou produção, mas a autorização está sem quantidades. Entra na faixa de chips da Visão geral até alguém cadastrar." ] },
  { titulo: "Dados e cópia de segurança", passos: [
    "Os dados ficam no Firebase e são os mesmos para todo mundo que abre a plataforma. Não precisa salvar nada.",
    "Em Ajustes, Exportar dados baixa um arquivo com tudo, como cópia de segurança.",
    "Recarregar dados das planilhas apaga tudo que foi editado e volta ao início. Use só se for preciso." ] }
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
    '<div class="corpo"><div class="alerta-box info" style="align-items:center"><span class="t" style="flex:1">O passeio guiado leva uns 4 minutos e mostra cada tela com a explicação no lugar.</span><button type="button" class="btn p prim" data-acao="tutorial-passeio">Começar o passeio</button></div>' +
    '<div class="guia">' + GUIA.map(function (g, i) {
      var aberta = secaoAberta === i;
      return '<div class="guia-secao' + (aberta ? " aberta" : "") + '"><button type="button" class="guia-titulo" data-acao="tutorial-secao" data-v="' + i + '"><span>' + esc(g.titulo) + '</span><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
        (aberta ? '<ol class="guia-passos">' + g.passos.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ol>" : "") + "</div>";
    }).join("") + "</div></div></div>";
}
function jaViu() { try { return localStorage.getItem(CHAVE) === String(VERSAO_TUTORIAL); } catch (e) { return true; } }

window.Tutorial = { iniciar: iniciar, encerrar: encerrar, htmlAjuda: htmlAjuda, jaViu: jaViu, PASSOS: PASSOS, GUIA: GUIA };
})();
