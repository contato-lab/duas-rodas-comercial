/* Comercial Duas Rodas
   Plataforma de controle das entregas comerciais da revista: marcas, autorizações (contratos),
   cotas por produto, fila de materiais, linha do tempo de brand, fila de edição, calendário e relatórios.
   Sem build: HTML + CSS + este arquivo. Dados no navegador (localStorage) até o Firebase entrar. */
(function () {
"use strict";
var VERSAO = "2026-10-16.1";

/* ============================================================ constantes */
var PRODUTOS = {
  brand:   { nome: "Brand (YouTube)",     curto: "Brand",   unidade: "vídeos",     plural: "vídeos de brand" },
  post:    { nome: "Posts publicidade",   curto: "Post",    unidade: "posts",      plural: "posts" },
  email:   { nome: "E-mail marketing",    curto: "E-mail",  unidade: "disparos",   plural: "disparos de e-mail" },
  banner:  { nome: "Banner no site",      curto: "Banner",  unidade: "impressões", plural: "impressões" },
  revista: { nome: "Páginas de revista",  curto: "Revista", unidade: "páginas",    plural: "páginas de revista" }
};
var ORDEM_PRODUTOS = ["post", "brand", "email", "revista", "banner"];
var ETAPAS_BRAND = [
  { id: "definir_tema",      nome: "Definir moto e produto",  quem: "Cliente e Marconi" },
  { id: "roteiro",           nome: "Roteiro ou sinopse",      quem: "Francis" },
  { id: "aprovacao_roteiro", nome: "Aprovação do roteiro",    quem: "Cliente" },
  { id: "agendar_gravacao",  nome: "Agendar gravação",        quem: "Produção" },
  { id: "gravado",           nome: "Gravado",                 quem: "Produção" },
  { id: "edicao",            nome: "Edição",                  quem: "New" },
  { id: "revisao_interna",   nome: "Revisão interna",         quem: "Leandro e Francis" },
  { id: "aprovacao_cliente", nome: "Aprovação do cliente",    quem: "Cliente" },
  { id: "data_veiculacao",   nome: "Definir data",            quem: "Igor e Isa" },
  { id: "veiculado",         nome: "Veiculado",               quem: "" }
];
var ETAPAS_COM_CLIENTE = { definir_tema: 1, aprovacao_roteiro: 1, aprovacao_cliente: 1 };
var LOGISTICA = {
  nao_precisa: "Não precisa de produto",
  definindo:   "Definindo com a marca",
  marca_envia: "Marca vai enviar",
  retirar:     "Vamos retirar (gera custo)",
  recebido:    "Produto em mãos",
  devolver:    "Devolver para a marca"
};
var STATUS_EDICAO = ["Fila", "Próximo", "Edição", "Revisão", "Aprovação", "Aprovado", "Publicado", "Standby"];
var URGENCIAS = { normal: "Normal", data_pedida: "Cliente pediu data", urgente: "Urgente" };
var REDES = { instagram: "Instagram", facebook: "Facebook", instagram_facebook: "Instagram e Facebook", youtube: "YouTube", site: "Site", email: "E-mail" };
var NAV = [
  { to: "/inicio",        label: "Visão geral",    curto: "Início",    icone: "layout-dashboard" },
  { to: "/marcas",        label: "Marcas",         curto: "Marcas",    icone: "building" },
  { to: "/autorizacoes",  label: "Autorizações",   curto: "Contratos", icone: "file-text" },
  { to: "/fila",          label: "Fila de materiais", curto: "Fila",   icone: "inbox" },
  { to: "/brand",         label: "Brand",          curto: "Brand",     icone: "clapperboard" },
  { to: "/edicao",        label: "Edição",         curto: "Edição",    icone: "scissors" },
  { to: "/calendario",    label: "Calendário",     curto: "Agenda",    icone: "calendar" },
  { to: "/relatorios",    label: "Relatórios",     curto: "Relatórios", icone: "chart" },
  { to: "/ajustes",       label: "Ajustes",        curto: "Ajustes",   icone: "settings", rodape: true }
];
var ICONES = {
  "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  clapperboard: '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9M12.4 3.4l3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  calendar: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  menu: '<path d="M4 12h16M4 6h16M4 18h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7M19 12H5"/>',
  "triangle-alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  "external-link": '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
  "file-up": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M12 12v6M9 15l3-3 3 3"/>',
  printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="8"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'
};
function icone(nome, cls) {
  return '<svg class="' + (cls || "ic") + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONES[nome] || "") + "</svg>";
}

/* ============================================================ utilidades */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function attr(s) { return esc(s); }
function uid(p) { return (p || "x") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function hojeISO() { var d = new Date(); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
function p2(n) { return (n < 10 ? "0" : "") + n; }
function fmtData(iso) { if (!iso) return ""; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? m[3] + "/" + m[2] + "/" + m[1] : iso; }
function fmtDataCurta(iso) { if (!iso) return ""; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? m[3] + "/" + m[2] : iso; }
var DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function fmtDataExtensa(iso) { var d = parseISO(iso); if (!d) return ""; return fmtData(iso) + " (" + DIAS_SEMANA[d.getDay()] + ")"; }
function parseISO(iso) { if (!iso) return null; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function diasEntre(a, b) { var da = parseISO(a), db = parseISO(b); if (!da || !db) return null; return Math.round((db - da) / 86400000); }
function fmtNum(n) { if (n == null || isNaN(n)) return "0"; return Number(n).toLocaleString("pt-BR"); }
function fmtMoeda(n) { if (n == null || isNaN(n)) return ""; return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function num(v) { if (v == null || v === "") return null; var n = Number(String(v).replace(/\./g, "").replace(",", ".")); return isNaN(n) ? null : n; }
function mesChave(iso) { return iso ? iso.slice(0, 7) : ""; }
function nomeMes(chave) { var m = /^(\d{4})-(\d{2})/.exec(chave || ""); if (!m) return chave || ""; return MESES[+m[2] - 1] + " de " + m[1]; }
function nomeMesCurto(chave) { var m = /^(\d{4})-(\d{2})/.exec(chave || ""); if (!m) return chave || ""; return MESES[+m[2] - 1].slice(0, 3) + "/" + m[1].slice(2); }
function porNome(a, b) { return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"); }
function byId(lista, id) { for (var i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i]; return null; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function toast(msg, erro) {
  var el = document.createElement("div"); el.className = "toast" + (erro ? " erro" : ""); el.textContent = msg;
  document.getElementById("toasts").appendChild(el); setTimeout(function () { el.remove(); }, erro ? 6000 : 3200);
}

/* ============================================================ armazenamento */
var COLECOES = ["marcas", "autorizacoes", "brands", "entregas", "fila", "edicao"];
function dadosVazios() { var d = {}; COLECOES.forEach(function (c) { d[c] = []; }); return d; }
function dadosIniciais() {
  var seed = window.DADOS_INICIAIS || {}; var d = dadosVazios();
  COLECOES.forEach(function (c) { d[c] = clone(seed[c] || []); });
  var hoje = hojeISO();
  d.brands.forEach(function (b) { if (!b.atualizadoEm) b.atualizadoEm = hoje; if (!b.historico) b.historico = []; if (!b.cobrancas) b.cobrancas = []; if (!b.links) b.links = {}; if (b.linkYoutube && !b.links.youtube) b.links.youtube = b.linkYoutube; if (!b.logistica) b.logistica = "nao_precisa"; });
  return d;
}
/* API local: tudo no localStorage deste navegador */
function criarApiLocal() {
  var CHAVE = "drc-dados";
  var dados = null;
  function ler() { try { var s = localStorage.getItem(CHAVE); if (s) return JSON.parse(s); } catch (e) {} return null; }
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { toast("Não consegui gravar no navegador (espaço cheio?).", true); } }
  return {
    tipo: "local",
    carregar: function () { dados = ler(); if (!dados) { dados = dadosIniciais(); gravar(); } COLECOES.forEach(function (c) { if (!dados[c]) dados[c] = []; }); return Promise.resolve(dados); },
    salvar: function (col, item) { var l = dados[col]; var i = l.findIndex(function (x) { return x.id === item.id; }); if (i >= 0) l[i] = item; else l.push(item); gravar(); return Promise.resolve(item); },
    apagar: function (col, id) { dados[col] = dados[col].filter(function (x) { return x.id !== id; }); gravar(); return Promise.resolve(); },
    substituirTudo: function (novo) { dados = novo; COLECOES.forEach(function (c) { if (!dados[c]) dados[c] = []; }); gravar(); return Promise.resolve(dados); },
    exportar: function () { return clone(dados); }
  };
}
/* API Firebase: Firestore, uma coleção por tipo, entrada anônima. Liga quando firebase-config.js tiver o projeto. */
function criarApiFirebase(cfg) {
  var base = "https://www.gstatic.com/firebasejs/10.14.1/";
  var app, db, fs, dados = dadosVazios(), aoMudar = null;
  return {
    tipo: "firebase",
    carregar: function () {
      return Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-auth.js")]).then(function (m) {
        app = m[0].initializeApp(cfg); fs = m[1]; db = fs.getFirestore(app);
        var auth = m[2].getAuth(app);
        return m[2].signInAnonymously(auth).then(function () {
          return Promise.all(COLECOES.map(function (c) {
            return new Promise(function (ok) {
              var primeira = true;
              fs.onSnapshot(fs.collection(db, c), function (snap) {
                dados[c] = snap.docs.map(function (d) { return d.data(); });
                if (primeira) { primeira = false; ok(); } else if (aoMudar) aoMudar(c);
              }, function (err) { toast("Firebase: " + err.message, true); if (primeira) { primeira = false; ok(); } });
            });
          }));
        }).then(function () { return dados; });
      });
    },
    salvar: function (col, item) { var l = dados[col]; var i = l.findIndex(function (x) { return x.id === item.id; }); if (i >= 0) l[i] = item; else l.push(item); return fs.setDoc(fs.doc(db, col, item.id), JSON.parse(JSON.stringify(item))).then(function () { return item; }); },
    apagar: function (col, id) { dados[col] = dados[col].filter(function (x) { return x.id !== id; }); return fs.deleteDoc(fs.doc(db, col, id)); },
    substituirTudo: function (novo) {
      var ps = [];
      COLECOES.forEach(function (c) { (novo[c] || []).forEach(function (it) { ps.push(fs.setDoc(fs.doc(db, c, it.id), JSON.parse(JSON.stringify(it)))); }); });
      return Promise.all(ps).then(function () { return dados; });
    },
    exportar: function () { return clone(dados); },
    onChange: function (cb) { aoMudar = cb; }
  };
}
var API = null;

/* ============================================================ estado */
var S = {
  d: dadosVazios(), pronto: false, erro: null,
  dialogo: null, gavetaAberta: false,
  busca: "", filtroMarcas: "ativas", filtroBrandMarca: "", filtroBrandAut: "", filtroEdicaoTipo: "", filtroEdicaoStatus: "", filtroFila: "aguardando",
  calMes: hojeISO().slice(0, 7), relMarca: "", relAut: "", relDe: "", relAte: "",
  fichaAba: "post", fichaAut: ""
};
function marca(id) { return byId(S.d.marcas, id); }
function nomeMarca(id) { var m = marca(id); return m ? m.nome : "(sem marca)"; }
function aut(id) { return byId(S.d.autorizacoes, id); }
function autsDaMarca(mid) { return S.d.autorizacoes.filter(function (a) { return a.marcaId === mid; }).sort(function (a, b) { return String(b.inicio || b.rotulo).localeCompare(String(a.inicio || a.rotulo)); }); }
function rotuloAut(a) { if (!a) return "(sem autorização)"; return a.rotulo || (a.inicio ? fmtData(a.inicio) + " a " + fmtData(a.fim) : "Autorização"); }
function autVigente(a, dia) { dia = dia || hojeISO(); if (!a.inicio || !a.fim) return null; return a.inicio <= dia && dia <= a.fim; }
function situacaoAut(a) {
  var hoje = hojeISO();
  if (a.encerrada) return { id: "encerrada", nome: "Encerrada", cls: "" };
  if (!a.inicio || !a.fim) return { id: "sem_vigencia", nome: "Sem vigência informada", cls: "alerta" };
  if (hoje < a.inicio) return { id: "futura", nome: "Começa em " + fmtData(a.inicio), cls: "info" };
  if (hoje > a.fim) return { id: "vencida", nome: "Vencida em " + fmtData(a.fim), cls: "erro" };
  var dias = diasEntre(hoje, a.fim);
  if (dias <= 45) return { id: "vencendo", nome: "Vence em " + dias + " dias", cls: "alerta" };
  return { id: "vigente", nome: "Vigente até " + fmtData(a.fim), cls: "ok" };
}
function temCotas(a) { var c = a.cotas || {}; return ORDEM_PRODUTOS.some(function (p) { return c[p] > 0; }); }

/* consumo de uma autorização por produto */
function consumo(a) {
  var cotas = a.cotas || {}; var r = {};
  var entregas = S.d.entregas.filter(function (e) { return e.autorizacaoId === a.id; });
  var brands = S.d.brands.filter(function (b) { return b.autorizacaoId === a.id; });
  ORDEM_PRODUTOS.forEach(function (p) {
    var contratado = +cotas[p] || 0, entregue = 0, programado = 0, andamento = 0;
    if (p === "brand") {
      brands.forEach(function (b) { if (b.etapa === "veiculado") entregue++; else if (!ehCredito(b)) andamento++; });
    } else {
      entregas.filter(function (e) { return e.produto === p; }).forEach(function (e) {
        var q = p === "banner" ? (+(e.metricas && e.metricas.impressoes) || 0) : (p === "revista" ? (+(e.quantidade) || 1) : 1);
        if (e.status === "agendado") programado += q; else entregue += q;
      });
    }
    var pct = contratado ? Math.min(100, Math.round(entregue / contratado * 100)) : 0;
    r[p] = { contratado: contratado, entregue: entregue, programado: programado, andamento: andamento, saldo: Math.max(0, contratado - entregue), pct: pct };
  });
  return r;
}
function tempoDecorrido(a) {
  if (!a.inicio || !a.fim) return null;
  var total = diasEntre(a.inicio, a.fim), passou = diasEntre(a.inicio, hojeISO());
  if (total == null || total <= 0) return null;
  return Math.max(0, Math.min(100, Math.round(passou / total * 100)));
}
/* alertas de uma autorização: produto atrasado em relação ao tempo, vencida com saldo */
function alertasAut(a) {
  var out = [], sit = situacaoAut(a), c = consumo(a), t = tempoDecorrido(a);
  if (!temCotas(a)) return out;
  var m = nomeMarca(a.marcaId);
  ORDEM_PRODUTOS.forEach(function (p) {
    var x = c[p]; if (!x.contratado || !x.saldo) return;
    if (sit.id === "vencida") out.push({ tipo: "erro", autId: a.id, marcaId: a.marcaId, produto: p, texto: m + ": autorização " + rotuloAut(a) + " venceu com " + fmtNum(x.saldo) + " " + PRODUTOS[p].unidade + " sem usar." });
    else if (sit.id === "vigente" || sit.id === "vencendo") {
      if (t != null && t - x.pct >= 25) out.push({ tipo: "alerta", autId: a.id, marcaId: a.marcaId, produto: p, texto: m + ": " + PRODUTOS[p].curto + " em " + x.pct + "% do pacote com " + t + "% do prazo passado (" + fmtNum(x.entregue) + " de " + fmtNum(x.contratado) + " " + PRODUTOS[p].unidade + ")." });
    }
  });
  return out;
}
function todosAlertas() {
  var out = [];
  S.d.autorizacoes.forEach(function (a) { if (!a.encerrada) out = out.concat(alertasAut(a)); });
  out.sort(function (a, b) { return (a.tipo === "erro" ? 0 : 1) - (b.tipo === "erro" ? 0 : 1); });
  return out;
}
function diasParado(b) { var d = diasEntre(b.atualizadoEm || hojeISO(), hojeISO()); return d == null ? 0 : d; }

/* ============================================================ rotas e render */
function rota() { var h = location.hash.replace(/^#/, "") || "/inicio"; var q = h.split("?"); var partes = q[0].split("/").filter(Boolean); return { caminho: "/" + (partes[0] || "inicio"), id: partes[1] || "", params: new URLSearchParams(q[1] || "") }; }
function irPara(h) { location.hash = h; }
function render() {
  var app = document.getElementById("app");
  var foco = document.activeElement && document.activeElement.id ? { id: document.activeElement.id, pos: document.activeElement.selectionStart } : null;
  if (!S.pronto) { app.innerHTML = '<div style="display:flex;min-height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:10px" class="muted">' + (S.erro ? '<div class="alerta-box erro">' + esc(S.erro) + "</div>" : "Carregando a plataforma...") + "</div>"; return; }
  var r = rota(); var conteudo = "", titulo = "", sub = "", acao = "";
  switch (r.caminho) {
    case "/inicio": titulo = "Visão geral"; sub = fmtDataExtensa(hojeISO()); conteudo = telaInicio(); acao = '<span class="acoes-rapidas">' + botao("Entrou material", "", 'data-acao="novo-fila"', "plus") + botao("Registrar entrega", "", 'data-acao="nova-entrega"', "plus") + botao("Novo brand", "", 'data-acao="novo-brand"', "plus") + "</span>"; break;
    case "/marcas":
      titulo = "Marcas"; sub = S.d.marcas.length + " marcas cadastradas · clique numa marca para abrir a ficha ao lado"; conteudo = telaMarcas(r.id && marca(r.id) ? r.id : ""); acao = botao("Nova marca", "prim", 'data-acao="nova-marca"', "plus");
      break;
    case "/autorizacoes": titulo = "Autorizações"; sub = S.d.autorizacoes.length + " contratos · " + S.d.autorizacoes.filter(temCotas).length + " com cotas · as quantidades são editáveis direto na tabela"; conteudo = telaAutorizacoes(); acao = botao("Nova autorização", "prim", 'data-acao="nova-aut"', "plus"); break;
    case "/fila": titulo = "Fila de materiais"; sub = "O que o atendimento recebeu e ainda não tem data"; conteudo = telaFila(); acao = botao("Entrou material", "prim", 'data-acao="novo-fila"', "plus"); break;
    case "/brand": titulo = "Brand"; sub = "Produção dos vídeos: quem está com a bola, há quanto tempo e o que fazer agora"; conteudo = telaBrand(); acao = botao("Novo brand", "prim", 'data-acao="novo-brand"', "plus"); break;
    case "/edicao": titulo = "Edição"; sub = "Fila de edição e YouTube (New)"; conteudo = telaEdicao(); acao = botao("Novo material", "prim", 'data-acao="novo-edicao"', "plus"); break;
    case "/calendario": titulo = "Calendário"; sub = "Tudo que vai sair, por dia"; conteudo = telaCalendario(); break;
    case "/relatorios": titulo = "Relatórios"; sub = "Relatório por cliente na identidade da revista"; conteudo = telaRelatorios(); break;
    case "/ajustes": titulo = "Ajustes"; sub = "Dados, tema e integrações"; conteudo = telaAjustes(); break;
    default: titulo = "Página não encontrada"; conteudo = '<div class="vazio">Essa tela não existe. <a href="#/inicio">Voltar ao início</a>.</div>';
  }
  app.innerHTML = casca(r, titulo, sub, acao, conteudo) + (S.dialogo ? dialogo() : "") + (S.gavetaAberta ? gaveta(r) : "");
  if (foco) { var el = document.getElementById(foco.id); if (el) { el.focus(); try { if (foco.pos != null && el.setSelectionRange) el.setSelectionRange(foco.pos, foco.pos); } catch (e) {} } }
}
function botao(texto, variante, attrs, ic) { return '<button type="button" class="btn ' + (variante || "") + '" ' + (attrs || "") + ">" + (ic ? icone(ic) : "") + esc(texto) + "</button>"; }
function temaAtual() { return document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro"; }
function casca(r, titulo, sub, acao, conteudo) {
  var alertas = todosAlertas().length;
  var filaN = S.d.fila.filter(function (f) { return f.status === "aguardando"; }).length;
  function item(n, cls) {
    var ativo = r.caminho === n.to;
    var num = n.to === "/inicio" && alertas ? alertas : (n.to === "/fila" && filaN ? filaN : 0);
    return '<a href="#' + n.to + '" class="' + cls + (ativo ? " ativo" : "") + '"' + (ativo ? ' aria-current="page"' : "") + ">" + icone(n.icone) + "<span>" + esc(cls === "item-baixo" ? n.curto : n.label) + "</span>" + (num && cls === "item-lado" ? '<span class="num">' + num + "</span>" : "") + "</a>";
  }
  var principais = NAV.filter(function (n) { return !n.rodape; });
  var lado = '<aside class="lado"><a href="#/inicio" class="logo"><img src="logo-branco.png?v=1" alt="Duas Rodas" class="logo-img"><span class="sub">Comercial</span></a>' +
    '<nav class="meio" aria-label="Navegação principal">' + principais.map(function (n) { return item(n, "item-lado"); }).join("") + "</nav>" +
    '<div class="pe">' + NAV.filter(function (n) { return n.rodape; }).map(function (n) { return item(n, "item-lado"); }).join("") +
    '<button type="button" class="item-lado" data-acao="tema">' + icone(temaAtual() === "escuro" ? "sun" : "moon") + "<span>Estilo " + (temaAtual() === "escuro" ? "claro" : "escuro") + "</span></button>" +
    '<div class="estado"><i class="' + (API && API.tipo === "firebase" ? "on" : "") + '"></i>' + (API && API.tipo === "firebase" ? "Dados compartilhados (Firebase)" : "Dados só neste navegador") + "</div></div></aside>";
  var baixo = '<nav class="nav-baixo" aria-label="Navegação principal">' + principais.slice(0, 4).map(function (n) { return item(n, "item-baixo"); }).join("") +
    '<button type="button" class="item-baixo" data-acao="gaveta">' + icone("menu") + "<span>Mais</span></button></nav>";
  return '<div class="casca">' + lado + '<div class="conteudo"><header class="topo"><div style="min-width:0;display:flex;align-items:center;gap:10px">' +
    '<button type="button" class="btn icone fantasma menu-cel" data-acao="gaveta" aria-label="Menu">' + icone("menu") + "</button>" +
    '<div style="min-width:0"><h1>' + esc(titulo) + "</h1>" + (sub ? '<div class="sub">' + esc(sub) + "</div>" : "") + "</div></div>" +
    '<div class="acoes"><button type="button" class="btn icone ajuda" data-acao="ajuda" aria-label="Ajuda e tutorial" title="Ajuda e tutorial">?</button>' + acao + "</div></header><main>" + conteudo + "</main></div>" + baixo + "</div>";
}
function gaveta(r) {
  return '<div class="gaveta" data-acao="fechar-gaveta"><div class="painel" onclick="event.stopPropagation()">' +
    '<a href="#/inicio" class="logo"><img src="logo-branco.png?v=1" alt="Duas Rodas" class="logo-img"><span class="sub">Comercial</span></a>' +
    NAV.map(function (n) { return '<a href="#' + n.to + '" class="item-lado' + (r.caminho === n.to ? " ativo" : "") + '">' + icone(n.icone) + "<span>" + esc(n.label) + "</span></a>"; }).join("") +
    '<button type="button" class="item-lado" data-acao="tema">' + icone(temaAtual() === "escuro" ? "sun" : "moon") + "<span>Estilo " + (temaAtual() === "escuro" ? "claro" : "escuro") + "</span></button>" +
    '<button type="button" class="item-lado" data-acao="ajuda">' + icone("info") + "<span>Ajuda e tutorial</span></button></div></div>";
}

/* ============================================================ peças */
function selo(texto, cls) { return '<span class="selo ' + (cls || "") + '">' + esc(texto) + "</span>"; }
function tagProduto(p) { return '<span class="tag-produto ' + p + '">' + esc(PRODUTOS[p] ? PRODUTOS[p].curto : p) + "</span>"; }
function barra(pct, cls, tempo) { return '<div class="barra"><i class="' + (cls || "") + '" style="width:' + Math.max(0, Math.min(100, pct || 0)) + '%"></i>' + (tempo != null ? '<span class="marca-tempo" style="left:' + tempo + '%" title="Tempo do contrato já passado: ' + tempo + '%"></span>' : "") + "</div>"; }
function classeCota(x, t) { if (!x.contratado) return ""; if (x.pct >= 100) return "ok"; if (t != null && t - x.pct >= 25) return "alerta"; return ""; }
function blocoCotas(a) {
  var c = consumo(a), t = tempoDecorrido(a);
  if (!temCotas(a)) return '<div class="vazio">Esta autorização ainda não tem cotas cadastradas. ' + botao("Cadastrar cotas", "p", 'data-acao="editar-aut" data-id="' + attr(a.id) + '"', "pencil") + "</div>";
  return ORDEM_PRODUTOS.filter(function (p) { return c[p].contratado; }).map(function (p) {
    var x = c[p];
    return '<div class="cota"><div class="cab"><span class="nome">' + tagProduto(p) + " " + esc(PRODUTOS[p].nome) + '</span><span class="num mono">' + fmtNum(x.entregue) + " <small>de " + fmtNum(x.contratado) + " " + esc(PRODUTOS[p].unidade) + "</small></span></div>" +
      barra(x.pct, classeCota(x, t), t) +
      '<div class="row between small muted"><span>' + (x.saldo ? "Faltam " + fmtNum(x.saldo) : "Pacote completo") + (x.programado ? " · " + fmtNum(x.programado) + " programado" : "") + (x.andamento ? " · " + x.andamento + " em produção" : "") + "</span><span>" + x.pct + "%" + (t != null ? " do pacote · " + t + "% do prazo" : "") + "</span></div></div>";
  }).join("");
}
function campo(label, inner, ajuda) { return '<div class="campo"><label>' + esc(label) + "</label>" + inner + (ajuda ? '<span class="ajuda">' + esc(ajuda) + "</span>" : "") + "</div>"; }
function input(name, valor, tipo, extra) { return '<input class="input" name="' + name + '" id="f-' + name + '" type="' + (tipo || "text") + '" value="' + attr(valor == null ? "" : valor) + '" ' + (extra || "") + ">"; }
function textarea(name, valor, extra) { return '<textarea class="textarea" name="' + name + '" id="f-' + name + '" ' + (extra || "") + ">" + esc(valor || "") + "</textarea>"; }
function select(name, opcoes, valor, extra) { return '<select class="select" name="' + name + '" id="f-' + name + '" ' + (extra || "") + ">" + opcoes.map(function (o) { return '<option value="' + attr(o[0]) + '"' + (String(o[0]) === String(valor == null ? "" : valor) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; }
function opcoesMarcas(comVazio) { var o = comVazio ? [["", comVazio]] : []; S.d.marcas.slice().sort(porNome).forEach(function (m) { o.push([m.id, m.nome]); }); return o; }
function opcoesAuts(mid, comVazio) { var o = comVazio ? [["", comVazio]] : []; (mid ? autsDaMarca(mid) : S.d.autorizacoes.slice()).forEach(function (a) { o.push([a.id, (mid ? "" : nomeMarca(a.marcaId) + " · ") + rotuloAut(a) + " (" + situacaoAut(a).nome + ")"]); }); return o; }
function linkExterno(url, texto) { if (!url) return '<span class="muted">—</span>'; return '<a href="' + attr(url) + '" target="_blank" rel="noopener" class="row" style="gap:4px;display:inline-flex">' + esc(texto || url.replace(/^https?:\/\//, "").slice(0, 40)) + icone("external-link", "") + "</a>"; }

/* ============================================================ tela: início */
/* situação de cada marca para o semáforo: vencida com saldo > atrasada > em dia > sem cotas */
function situacaoMarca(m) {
  var auts = S.d.autorizacoes.filter(function (a) { return a.marcaId === m.id && !a.encerrada; });
  var vig = auts.filter(function (a) { var s = situacaoAut(a).id; return s === "vigente" || s === "vencendo"; });
  var fut = auts.filter(function (a) { return situacaoAut(a).id === "futura"; });
  var recentes = auts.slice().sort(function (a, b) { return String(b.fim || "").localeCompare(String(a.fim || "")); });
  var alvo = vig.filter(temCotas)[0] || fut.filter(temCotas)[0] || recentes.filter(temCotas)[0] || vig[0] || fut[0] || recentes[0] || null;
  var alertas = []; auts.forEach(function (a) { alertas = alertas.concat(alertasAut(a)); });
  var producao = S.d.brands.filter(function (b) { return b.marcaId === m.id && b.etapa !== "veiculado" && !ehCredito(b); });
  var ultima = null; (m.cobrancas || []).forEach(function (c) { if (!ultima || c.data > ultima) ultima = c.data; }); S.d.brands.filter(function (b) { return b.marcaId === m.id; }).forEach(function (b) { (b.cobrancas || []).forEach(function (c) { if (!ultima || c.data > ultima) ultima = c.data; }); });
  var id = "ok", nome = "Em dia";
  if (alertas.some(function (a) { return a.tipo === "erro"; })) { id = "vencida"; nome = "Vencida com saldo"; }
  else if (alertas.length) { id = "atrasada"; nome = "Atrasada"; }
  else if (!alvo || !temCotas(alvo)) { id = "sem_cotas"; nome = alvo ? "Sem cotas cadastradas" : "Sem autorização"; }
  else if (!vig.length) { id = fut.length ? "futura" : "ok"; nome = fut.length ? "Começa em breve" : "Em dia"; }
  var mostrar = vig.length || fut.length || alertas.length || producao.length;
  return { marca: m, alvo: alvo, vigentes: vig, alertas: alertas, producao: producao, ultimaCobranca: ultima, id: id, nome: nome, mostrar: mostrar };
}
function inicioSemana(iso) { var d = parseISO(iso); var dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
function somaDias(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
function telaInicio() {
  var hoje = hojeISO();
  var sits = S.d.marcas.map(situacaoMarca).filter(function (x) { return x.mostrar; });
  var ordem = { vencida: 0, atrasada: 1, ok: 2, futura: 3, sem_cotas: 4 };
  sits.sort(function (a, b) { return (ordem[a.id] - ordem[b.id]) || porNome(a.marca, b.marca); });
  var n = function (id) { return sits.filter(function (x) { return x.id === id; }).length; };
  var vigentes = sits.filter(function (x) { return x.vigentes.length; }).length;
  function kpi(cls, valor, rot, filtro) { return '<button type="button" class="indicador clicavel ' + cls + '" data-acao="kpi" data-v="' + filtro + '"><span class="valor">' + valor + '</span><span class="rot">' + esc(rot) + '</span><span class="ver">Ver marcas ' + icone("chevron-right", "ic") + "</span></button>"; }
  var kpis = '<div class="grid g4">' + kpi("", vigentes, "Marcas com contrato vigente", "vigentes") + kpi("ok", n("ok"), "Em dia", "ok") + kpi("alerta", n("atrasada"), "Atrasadas no pacote", "atrasada") + kpi(n("vencida") ? "destaque" : "", n("vencida"), "Vencidas com saldo", "vencida") + "</div>";
  var semCotas = sits.filter(function (x) { return x.id === "sem_cotas"; });
  var semaforo = '<div class="semaforo">' + sits.filter(function (x) { return x.id !== "sem_cotas"; }).map(function (x) {
    var a = x.alvo, cotas = "";
    if (a && temCotas(a)) { var c = consumo(a), t = tempoDecorrido(a); cotas = '<div class="mini-cotas">' + ORDEM_PRODUTOS.filter(function (p) { return c[p].contratado; }).slice(0, 4).map(function (p) { var k = c[p]; return '<div class="mini-cota"><span>' + esc(PRODUTOS[p].curto) + "</span>" + barra(k.pct, classeCota(k, t), t) + '<span class="n">' + fmtNum(k.entregue) + "/" + fmtNum(k.contratado) + "</span></div>"; }).join("") + "</div>"; }
    else cotas = '<div class="small muted">' + (a ? "Autorização sem cotas. Suba o PDF ou cadastre as quantidades." : "Sem autorização cadastrada.") + "</div>";
    var pe = [];
    if (x.id === "vencida") pe.push("venceu " + fmtDataCurta((x.alertas[0] && aut(x.alertas[0].autId) || {}).fim));
    if (x.producao.length) pe.push(x.producao.length + " brand em produção");
    pe.push(x.ultimaCobranca ? "cobrada há " + diasEntre(x.ultimaCobranca, hoje) + " d" : "sem cobrança registrada");
    return '<a href="#/marcas/' + x.marca.id + '" class="peca ' + x.id + '"><div class="nm"><span>' + esc(x.marca.nome) + "</span>" + (a ? "<small>" + esc(rotuloAut(a)) + "</small>" : "") + "</div>" + cotas + '<div class="pe">' + esc(pe.join(" · ")) + "</div></a>";
  }).join("") + "</div>" +
    (semCotas.length ? '<div class="card"><div class="cab"><h2>Sem cotas cadastradas (' + semCotas.length + ')</h2><span class="small muted">Estas marcas têm contrato ou produção, mas a autorização veio da planilha sem as quantidades. Suba o PDF ou cadastre para entrarem no semáforo.</span></div><div class="corpo chips">' + semCotas.map(function (x) { return '<a href="#/marcas/' + x.marca.id + '" class="chip" style="text-decoration:none">' + esc(x.marca.nome) + (x.alvo ? ' <span class="muted">· ' + esc(rotuloAut(x.alvo)) + "</span>" : "") + (x.producao.length ? ' <span class="muted">· ' + x.producao.length + " brand</span>" : "") + "</a>"; }).join("") + "</div></div>" : "");
  // semana atual, de segunda a domingo, mais a coluna sem data
  var seg = inicioSemana(hoje); var ev = eventosCalendario(); var porDia = {}; ev.forEach(function (e) { (porDia[e.data] = porDia[e.data] || []).push(e); });
  var fila = S.d.fila.filter(function (f) { return f.status === "aguardando"; });
  var total = 0; var dias = "";
  for (var i = 0; i < 7; i++) {
    var iso = somaDias(seg, i); var d = parseISO(iso); var lista = porDia[iso] || []; total += lista.length;
    dias += '<div class="sdia' + (iso === hoje ? " hoje" : "") + '"><div class="d">' + ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i] + " " + d.getDate() + (iso === hoje ? " · hoje" : "") + "</div>" +
      lista.slice(0, 4).map(function (e) { return '<div class="evento ' + e.produto + (e.status === "gravacao" ? " gravacao" : "") + '" data-acao="abrir-evento" data-tipo="' + e.tipo + '" data-id="' + attr(e.id) + '" title="' + attr(e.marca + ": " + e.titulo) + '">' + esc(e.marca) + " · " + esc(e.titulo) + "</div>"; }).join("") + (lista.length > 4 ? '<div class="small muted">+' + (lista.length - 4) + "</div>" : "") + "</div>";
  }
  var peso = { urgente: 0, data_pedida: 1, normal: 2 }; fila.sort(function (a, b) { return (peso[a.urgencia] - peso[b.urgencia]) || String(a.criadoEm).localeCompare(String(b.criadoEm)); });
  dias += '<div class="sdia sem"><div class="d">Na fila, sem data</div>' + (fila.length ? fila.slice(0, 4).map(function (f) { var dd = diasEntre(f.criadoEm, hoje); return '<div class="evento fila" data-acao="alocar-fila" data-id="' + attr(f.id) + '" title="Dar data">' + esc(nomeMarca(f.marcaId)) + " · " + esc(f.descricao || PRODUTOS[f.produto].curto) + (dd >= 5 ? ' <b style="color:var(--erro)">' + dd + " d</b>" : "") + "</div>"; }).join("") + (fila.length > 4 ? '<a href="#/fila" class="small muted">+' + (fila.length - 4) + " na fila</a>" : "") : '<div class="small muted">Nada esperando data.</div>') + "</div>";
  var semana = '<div class="card"><div class="cab"><h2>Esta semana</h2><span class="row"><span class="small muted">' + total + " saída" + (total === 1 ? "" : "s") + " · " + fila.length + " sem data</span><a href=\"#/calendario\" class=\"btn p\">Calendário</a></span></div><div class=\"corpo\"><div class=\"semana\">" + dias + "</div></div></div>";
  // radar de renovação: vence em até 60 dias
  var radar = S.d.autorizacoes.filter(function (a) { if (a.encerrada || !a.fim) return false; var dd = diasEntre(hoje, a.fim); return dd != null && dd >= 0 && dd <= 60; }).sort(function (a, b) { return a.fim.localeCompare(b.fim); });
  var radarHtml = radar.length ? '<table class="tabela">' + radar.map(function (a) { var c = consumo(a); var saldo = ORDEM_PRODUTOS.filter(function (p) { return c[p].saldo; }).map(function (p) { return fmtNum(c[p].saldo) + " " + PRODUTOS[p].unidade; }); var dd = diasEntre(hoje, a.fim);
      return '<tr class="clicavel" data-acao="ir-marca" data-id="' + attr(a.marcaId) + '"><td><strong>' + esc(nomeMarca(a.marcaId)) + '</strong><div class="small muted">' + esc(rotuloAut(a)) + '</div></td><td class="nowrap">vence em ' + dd + " dias<div class=\"small muted\">" + fmtData(a.fim) + "</div></td><td>" + (saldo.length ? '<span class="small">saldo: ' + esc(saldo.join(", ")) + "</span>" : '<span class="small muted">' + (temCotas(a) ? "pacote completo" : "sem cotas cadastradas") + "</span>") + "</td><td>" + (saldo.length ? selo("Renovar sem carregar saldo", "alerta") : selo("Renovar", "ok")) + "</td></tr>"; }).join("") + "</table>" :
    '<div class="vazio" style="margin:16px">Nenhum contrato vence nos próximos 60 dias.</div>';
  var alertas = todosAlertas();
  var alertasHtml = alertas.length ? '<div class="lista-alertas">' + alertas.slice(0, 8).map(function (al) { return '<a href="#/marcas/' + al.marcaId + '" class="alerta-box ' + al.tipo + '" style="text-decoration:none">' + icone("triangle-alert") + '<span class="t">' + esc(al.texto) + "</span></a>"; }).join("") + (alertas.length > 8 ? '<div class="small muted center">e mais ' + (alertas.length - 8) + ". Veja marca por marca.</div>" : "") + "</div>" : '<div class="vazio">Nenhum pacote atrasado em relação ao prazo.</div>';
  var parados = S.d.brands.filter(function (b) { return b.etapa !== "veiculado" && !ehCredito(b) && ETAPAS_COM_CLIENTE[b.etapa] && diasParado(b) >= 14; }).sort(function (a, b) { return diasParado(b) - diasParado(a); }).slice(0, 6);
  var paradosHtml = parados.length ? '<table class="tabela">' + parados.map(function (b) { var e = byId(ETAPAS_BRAND, b.etapa); return '<tr class="clicavel" data-acao="abrir-brand" data-id="' + attr(b.id) + '"><td><strong>' + esc(nomeMarca(b.marcaId)) + '</strong><div class="small muted">' + esc(b.titulo) + "</div></td><td>" + esc(e ? e.nome : b.etapa) + '</td><td class="nowrap right">' + diasParado(b) + ' dias<div class="small muted">' + (b.cobrancas && b.cobrancas.length ? b.cobrancas.length + " cobrança" + (b.cobrancas.length > 1 ? "s" : "") : "sem cobrança") + "</div></td></tr>"; }).join("") + "</table>" : '<div class="vazio" style="margin:16px">Nenhum vídeo parado com o cliente há 14 dias ou mais.</div>';
  var avisoEx = temExemplos() ? '<div class="alerta-box info">' + icone("info") + '<span class="t">Dados de exemplo ativos: cotas, entregas e materiais fictícios para mostrar a plataforma cheia. Para tirar, vá em Ajustes e clique em Remover dados de exemplo.</span></div>' : "";
  return avisoEx + kpis + semaforo + semana +
    '<div class="grid g2"><div class="card"><div class="cab"><h2>Radar de renovação</h2>' + selo("vence em até 60 dias", radar.length ? "alerta" : "") + '</div><div class="corpo sem tabela-wrap">' + radarHtml + "</div></div>" +
    '<div class="card"><div class="cab"><h2>Brand parado com o cliente</h2><a href="#/brand" class="btn p">Ver brand</a></div><div class="corpo sem tabela-wrap">' + paradosHtml + "</div></div></div>" +
    '<div class="card"><div class="cab"><h2>Alertas em detalhe</h2>' + selo(alertas.length + " aviso" + (alertas.length === 1 ? "" : "s"), alertas.length ? "erro" : "ok") + '</div><div class="corpo">' + alertasHtml + "</div></div>";
}
function indicador(rot, valor, destaque) { return '<div class="indicador' + (destaque ? " destaque" : "") + '"><span class="valor">' + valor + '</span><span class="rot">' + esc(rot) + "</span></div>"; }

/* ============================================================ tela: marcas */
/* ---------- marcas: lista à esquerda, ficha à direita */
function cotaCritica(x) {
  // produto com maior distância entre o tempo passado e o entregue, para mostrar na lista
  var a = x.alvo; if (!a || !temCotas(a)) return null;
  var c = consumo(a), t = tempoDecorrido(a), pior = null;
  ORDEM_PRODUTOS.forEach(function (p) { var k = c[p]; if (!k.contratado) return; var gap = (t == null ? 0 : t) - k.pct; if (!pior || gap > pior.gap) pior = { p: p, k: k, gap: gap }; });
  return pior;
}
function telaMarcas(idSel) {
  var q = S.busca.toLowerCase();
  var sits = S.d.marcas.map(situacaoMarca).filter(function (x) { return !q || x.marca.nome.toLowerCase().indexOf(q) >= 0; });
  if (S.filtroMarcas === "ativas") sits = sits.filter(function (x) { return x.mostrar; });
  else if (S.filtroMarcas === "alertas") sits = sits.filter(function (x) { return x.id === "atrasada" || x.id === "vencida"; });
  else if (S.filtroMarcas === "sem") sits = sits.filter(function (x) { return x.id === "sem_cotas"; });
  var ordem = { vencida: 0, atrasada: 1, ok: 2, futura: 3, sem_cotas: 4 };
  sits.sort(function (a, b) { return (ordem[a.id] - ordem[b.id]) || porNome(a.marca, b.marca); });
  var m = idSel ? marca(idSel) : null;
  var lista = '<aside class="md-lista' + (m ? " com-ficha" : "") + '"><div class="md-topo"><div class="busca">' + icone("search") + '<input class="input p" id="busca-marcas" placeholder="Buscar marca" value="' + attr(S.busca) + '" data-filtro="busca"></div>' +
    '<div class="chips">' + [["ativas", "Ativas"], ["alertas", "Com alerta"], ["sem", "Sem cotas"], ["todas", "Todas"]].map(function (o) { return '<button type="button" class="chip' + (S.filtroMarcas === o[0] ? " ativo" : "") + '" data-acao="filtro-marcas" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>" +
    '<div class="md-itens">' + (sits.length ? sits.map(function (x) {
      var cc = cotaCritica(x); var sel = m && m.id === x.marca.id;
      return '<a href="#/marcas/' + x.marca.id + '" class="md-item' + (sel ? " sel" : "") + '"><i class="bola ' + x.id + '"></i><span class="nm">' + esc(x.marca.nome) + '</span><span class="n">' + (cc ? esc(PRODUTOS[cc.p].curto) + " " + fmtNum(cc.k.entregue) + "/" + fmtNum(cc.k.contratado) : (x.alvo ? "sem cotas" : "")) + "</span></a>";
    }).join("") : '<div class="vazio" style="margin:10px">Nenhuma marca nesse filtro.</div>') + "</div></aside>";
  var ficha = m ? fichaMarca(m) : '<div class="md-vazio"><div class="vazio">Escolha uma marca na lista para ver a ficha, ou ' + botao("cadastre uma nova", "p", 'data-acao="nova-marca"', "plus") + "</div></div>";
  return '<div class="md-grade' + (m ? " com-ficha" : "") + '">' + lista + '<section class="md-ficha">' + ficha + "</section></div>";
}
/* meses entre duas datas (ou o ano corrente), no formato AAAA-MM */
function mesesEntre(ini, fim) {
  var a = parseISO(ini) || new Date(new Date().getFullYear(), 0, 1), b = parseISO(fim) || new Date(new Date().getFullYear(), 11, 31);
  var out = []; var d = new Date(a.getFullYear(), a.getMonth(), 1);
  while (d <= b && out.length < 60) { out.push(d.getFullYear() + "-" + p2(d.getMonth() + 1)); d = new Date(d.getFullYear(), d.getMonth() + 1, 1); }
  return out;
}
function cobrancasDaMarca(m) {
  var lista = (m.cobrancas || []).map(function (c) { return { data: c.data, texto: c.texto, produto: c.produto || null, ref: "" }; });
  S.d.brands.filter(function (b) { return b.marcaId === m.id; }).forEach(function (b) { (b.cobrancas || []).forEach(function (c) { lista.push({ data: c.data, texto: c.texto, produto: "brand", ref: b.titulo, brandId: b.id }); }); });
  return lista.sort(function (x, y) { return String(y.data).localeCompare(String(x.data)); });
}
function resumoParaCliente(m, a) {
  var linhas = [m.nome + (a ? ", autorização " + rotuloAut(a) + (a.inicio ? " (" + fmtData(a.inicio) + " a " + fmtData(a.fim) + ")" : "") : "") + ":"];
  if (a && temCotas(a)) { var c = consumo(a); ORDEM_PRODUTOS.forEach(function (p) { var k = c[p]; if (!k.contratado) return; linhas.push("• " + PRODUTOS[p].nome + ": " + fmtNum(k.entregue) + " de " + fmtNum(k.contratado) + " " + PRODUTOS[p].unidade + (k.saldo ? ", faltam " + fmtNum(k.saldo) : ", completo") + (k.programado ? " (" + fmtNum(k.programado) + " programado)" : "") + (p === "brand" && k.andamento ? " (" + k.andamento + " em produção)" : "")); }); }
  else linhas.push("• Sem cotas cadastradas.");
  var cob = cobrancasDaMarca(m); if (cob.length) linhas.push("Última cobrança em " + fmtData(cob[0].data) + ": " + cob[0].texto);
  if (a && a.fim) { var dd = diasEntre(hojeISO(), a.fim); linhas.push(dd >= 0 ? "Vigência termina em " + fmtData(a.fim) + " (" + dd + " dias)." : "Vigência terminou em " + fmtData(a.fim) + "; o saldo não passa para o próximo contrato."); }
  return linhas.join("\n");
}
function fichaMarca(m) {
  var auts = autsDaMarca(m.id); var sit = situacaoMarca(m);
  if (!S.fichaAut || !byId(auts, S.fichaAut)) S.fichaAut = (sit.alvo || auts[0] || {}).id || "";
  var a = aut(S.fichaAut); var c = a ? consumo(a) : null; var t = a ? tempoDecorrido(a) : null;
  var abasExtra = { ano: "Linha do ano", cobrancas: "Cobranças", contrato: "Contrato" };
  if (!S.fichaAba || (!PRODUTOS[S.fichaAba] && !abasExtra[S.fichaAba])) S.fichaAba = "post";
  var cab = '<div class="ficha-topo"><div class="row" style="gap:10px"><a href="#/marcas" class="btn icone fantasma so-cel" aria-label="Voltar">' + icone("arrow-left") + '</a><h2 class="display" style="font-size:30px;line-height:1">' + esc(m.nome) + "</h2>" + selo(sit.nome, sit.id === "ok" ? "ok" : sit.id === "atrasada" ? "alerta" : sit.id === "vencida" ? "erro" : "") + (m.ativa === false ? selo("Inativa") : "") + "</div>" +
    '<div class="small muted">' + (m.contato ? "Contato: " + esc(m.contato) : "Sem contato cadastrado") + (m.obs ? " · " + esc(m.obs) : "") + "</div>" +
    '<div class="row" style="gap:6px;margin-top:4px">' + botao("Editar marca", "p", 'data-acao="editar-marca" data-id="' + attr(m.id) + '"', "pencil") + botao("Copiar resumo pro cliente", "p", 'data-acao="copiar-resumo" data-id="' + attr(m.id) + '"', "link") + botao("Nova entrega", "p", 'data-acao="nova-entrega" data-marca="' + attr(m.id) + '" data-aut="' + attr(a ? a.id : "") + '" data-produto="' + attr(PRODUTOS[S.fichaAba] ? S.fichaAba : "post") + '"', "plus") + botao("Relatório", "p preto", 'data-acao="ir-relatorio" data-marca="' + attr(m.id) + '"', "printer") + "</div>" +
    '<div class="row" style="gap:6px;margin-top:6px"><span class="small muted">Autorização:</span>' + auts.map(function (x) { var sx = situacaoAut(x); return '<button type="button" class="chip' + (a && a.id === x.id ? " ativo" : "") + '" data-acao="ficha-aut" data-id="' + attr(x.id) + '">' + esc(rotuloAut(x)) + ' <span class="muted">· ' + esc(sx.nome) + "</span></button>"; }).join("") + botao("Nova", "p fantasma", 'data-acao="nova-aut" data-marca="' + attr(m.id) + '"', "plus") + "</div></div>";
  // caixas por produto
  var caixas = '<div class="prod-caixas">' + ORDEM_PRODUTOS.map(function (p) {
    var k = c ? c[p] : null; var contratado = k && k.contratado; var linha, cls = "";
    if (!contratado) linha = '<span class="muted">não contratado</span>';
    else if (k.saldo === 0) { linha = "pacote completo"; cls = "ok"; }
    else { var atras = t != null && t - k.pct >= 25; linha = "faltam " + fmtNum(k.saldo) + (atras ? " · atrasado" : ""); cls = atras ? "alerta" : ""; if (p === "brand" && k.andamento) linha += " · " + k.andamento + " em produção"; if (k.programado) linha += " · " + fmtNum(k.programado) + " programado"; }
    return '<button type="button" class="prod-caixa ' + p + (S.fichaAba === p ? " ativa" : "") + '" data-acao="ficha-aba" data-v="' + p + '"><span class="rot">' + esc(PRODUTOS[p].curto) + '</span><span class="num">' + (contratado ? fmtNum(k.entregue) + "<small>/" + fmtNum(k.contratado) + "</small>" : (k && k.entregue ? fmtNum(k.entregue) : "—")) + '</span><span class="lin ' + cls + '">' + linha + "</span></button>";
  }).join("") + "</div>";
  var abas = '<div class="abas ficha-abas">' + Object.keys(abasExtra).map(function (k) { return '<button type="button" class="aba' + (S.fichaAba === k ? " ativa" : "") + '" data-acao="ficha-aba" data-v="' + k + '">' + abasExtra[k] + (k === "cobrancas" ? " (" + cobrancasDaMarca(m).length + ")" : "") + "</button>"; }).join("") + "</div>";
  var painel;
  if (PRODUTOS[S.fichaAba]) painel = painelProduto(m, a, S.fichaAba);
  else if (S.fichaAba === "ano") painel = painelLinhaDoAno(m, a);
  else if (S.fichaAba === "cobrancas") painel = painelCobrancas(m);
  else painel = painelContrato(m, a);
  return cab + caixas + abas + '<div class="card painel"><div class="corpo">' + painel + "</div></div>";
}
function painelProduto(m, a, p) {
  var hoje = hojeISO(); var k = a ? consumo(a)[p] : null; var t = a ? tempoDecorrido(a) : null;
  var cab = '<div class="row between"><h3>' + esc(PRODUTOS[p].nome) + (k && k.contratado ? ' <span class="muted" style="font-weight:400">· ' + fmtNum(k.entregue) + " de " + fmtNum(k.contratado) + " " + esc(PRODUTOS[p].unidade) + "</span>" : "") + '</h3><span class="row">' + botao("Registrar cobrança", "p", 'data-acao="nova-cobranca-marca" data-id="' + attr(m.id) + '" data-produto="' + p + '"', "bell") + (p === "brand" ? botao("Novo brand", "p prim", 'data-acao="novo-brand" data-marca="' + attr(m.id) + '"', "plus") : botao("Registrar " + PRODUTOS[p].curto.toLowerCase(), "p prim", 'data-acao="nova-entrega" data-marca="' + attr(m.id) + '" data-aut="' + attr(a ? a.id : "") + '" data-produto="' + p + '"', "plus")) + "</span></div>";
  var ritmo = "";
  if (k && k.contratado) {
    var txt = [];
    if (t != null) txt.push(t + "% do prazo passou");
    if (k.saldo && a && a.fim && diasEntre(hoje, a.fim) > 0) { var sem = Math.max(1, Math.round(diasEntre(hoje, a.fim) / 7)); txt.push("ritmo necessário: " + fmtNum(k.saldo) + " " + PRODUTOS[p].unidade + " em " + sem + " semana" + (sem > 1 ? "s" : "") + (p !== "banner" ? " (" + (k.saldo / sem).toFixed(1).replace(".", ",") + " por semana)" : "")); }
    if (k.saldo && a && a.fim && diasEntre(hoje, a.fim) < 0) txt.push("contrato vencido com " + fmtNum(k.saldo) + " " + PRODUTOS[p].unidade + " sem usar");
    ritmo = barra(k.pct, classeCota(k, t), t) + '<div class="small muted mt1">' + esc(txt.join(" · ")) + "</div>";
  } else ritmo = '<div class="small muted">Este produto não está nas cotas da autorização selecionada' + (a ? "" : " (nenhuma autorização)") + ". As entregas abaixo não contam em pacote.</div>";
  var corpo;
  if (p === "brand") {
    var brands = S.d.brands.filter(function (b) { return b.marcaId === m.id && (!a || !b.autorizacaoId || b.autorizacaoId === a.id); }).sort(function (x, y) { return indiceEtapa(x.etapa) - indiceEtapa(y.etapa); });
    corpo = brands.length ? '<div class="tabela-wrap"><table class="tabela">' + brands.map(function (b) { var e = byId(ETAPAS_BRAND, b.etapa); var d = diasParado(b); return '<tr class="clicavel" data-acao="abrir-brand" data-id="' + attr(b.id) + '"><td><strong>' + esc(b.titulo) + "</strong>" + (b.apresentador ? '<div class="small muted">' + esc(b.apresentador) + "</div>" : "") + "</td><td>" + selo(e ? e.nome : b.etapa, b.etapa === "veiculado" ? "ok" : (ETAPAS_COM_CLIENTE[b.etapa] ? "alerta" : "")) + (b.etapa !== "veiculado" && d >= 14 ? ' <span class="small muted">' + d + " d</span>" : "") + '</td><td class="nowrap mono small">' + (b.dataVeiculacao ? fmtData(b.dataVeiculacao) : (b.dataGravacao ? "grav. " + fmtDataCurta(b.dataGravacao) : "")) + "</td><td>" + (b.links && b.links.youtube ? linkExterno(b.links.youtube, "YouTube") : "") + "</td></tr>"; }).join("") + "</table></div>" : '<div class="vazio">Nenhum vídeo de brand nesta autorização.</div>';
  } else {
    var ents = S.d.entregas.filter(function (e) { return e.marcaId === m.id && e.produto === p && (!a || e.autorizacaoId === a.id || !e.autorizacaoId); }).sort(function (x, y) { return String(y.data).localeCompare(String(x.data)); });
    var cols = p === "post" ? ["Rede", "Views", "Alcance", "Curtidas"] : p === "email" ? ["Base", "Aberturas", "Cliques"] : p === "banner" ? ["Mês", "Impressões"] : ["Edição", "Páginas", "Formato"];
    function cel(e) { var mm = e.metricas || {}; if (p === "post") return [REDES[e.rede] || e.rede || "", fmtNum(mm.visualizacoes), fmtNum(mm.alcance), fmtNum(mm.curtidas)]; if (p === "email") return [fmtNum(mm.base), fmtNum(mm.aberturas), fmtNum(mm.cliques)]; if (p === "banner") return [nomeMesCurto(e.mes || mesChave(e.data)), fmtNum(mm.impressoes)]; return [nomeMesCurto(e.mes || mesChave(e.data)), String(e.quantidade || 1), e.formato || ""]; }
    corpo = ents.length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Data</th><th>Título</th>' + cols.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "<th></th></tr></thead><tbody>" + ents.map(function (e) { return '<tr class="clicavel" data-acao="editar-entrega" data-id="' + attr(e.id) + '"><td class="nowrap mono">' + fmtData(e.data) + (e.status === "agendado" ? '<div class="small" style="color:var(--info)">programado</div>' : "") + "</td><td>" + esc(e.titulo || "") + (!e.autorizacaoId ? ' <span class="small muted">(fora da cota)</span>' : "") + "</td>" + cel(e).map(function (v) { return '<td class="small">' + esc(v === "0" ? "" : v) + "</td>"; }).join("") + "<td>" + linkExterno(e.link, "abrir") + "</td></tr>"; }).join("") + "</tbody></table></div>" : '<div class="vazio">Nenhuma entrega de ' + esc(PRODUTOS[p].nome.toLowerCase()) + " registrada nesta autorização.</div>";
  }
  return cab + '<div class="mt3 mb3">' + ritmo + "</div>" + corpo;
}
function painelLinhaDoAno(m, a) {
  var hojeM = hojeISO().slice(0, 7); var meses = mesesEntre(a && a.inicio, a && a.fim);
  var c = a ? consumo(a) : null; var produtos = c ? ORDEM_PRODUTOS.filter(function (p) { return c[p].contratado; }) : ORDEM_PRODUTOS;
  var ents = S.d.entregas.filter(function (e) { return e.marcaId === m.id && (!a || e.autorizacaoId === a.id); });
  var brands = S.d.brands.filter(function (b) { return b.marcaId === m.id && (!a || !b.autorizacaoId || b.autorizacaoId === a.id); });
  var cob = cobrancasDaMarca(m);
  function celula(p, mes) {
    var futuro = mes > hojeM; var pub = 0, prog = 0, prod = 0;
    if (p === "brand") { brands.forEach(function (b) { if (b.etapa === "veiculado" && mesChave(b.dataVeiculacao) === mes) pub++; else if (b.etapa !== "veiculado" && mes === hojeM) prod++; }); }
    else ents.forEach(function (e) { if (e.produto !== p) return; var k = (p === "banner" || p === "revista") ? (e.mes || mesChave(e.data)) : mesChave(e.data); if (k !== mes) return; var q = p === "banner" ? (+(e.metricas && e.metricas.impressoes) || 0) : (p === "revista" ? (+e.quantidade || 1) : 1); if (e.status === "agendado") prog += q; else pub += q; });
    var cls = "ano-cel " + (pub ? "cheia " + p : (futuro ? "futura" : "vazia")); var txt = pub ? (p === "banner" ? fmtNum(pub) : String(pub)) : "";
    if (prog) txt += (txt ? " " : "") + '<span class="prog">+' + (p === "banner" ? fmtNum(prog) : prog) + "</span>";
    if (prod) txt += (txt ? " " : "") + '<span class="prog">' + prod + " em prod.</span>";
    return '<div class="' + cls + '" title="' + attr(PRODUTOS[p].curto + " · " + nomeMes(mes)) + '">' + txt + "</div>";
  }
  var grade = '<div class="ano-grade" style="grid-template-columns:76px repeat(' + meses.length + ',minmax(0,1fr)) 56px">' +
    '<span></span>' + meses.map(function (mes) { return '<span class="ano-cab' + (mes === hojeM ? " hoje" : "") + '">' + esc(nomeMesCurto(mes)) + "</span>"; }).join("") + '<span class="ano-cab right">total</span>' +
    produtos.map(function (p) { var k = c ? c[p] : null; return '<span class="ano-rot ' + p + '">' + esc(PRODUTOS[p].curto) + "</span>" + meses.map(function (mes) { return celula(p, mes); }).join("") + '<span class="ano-tot ' + (k && k.contratado ? (k.saldo ? classeCota(k, tempoDecorrido(a)) || "" : "ok") : "") + '">' + (k && k.contratado ? fmtNum(k.entregue) + "/" + fmtNum(k.contratado) : "") + "</span>"; }).join("") +
    '<span class="ano-rot muted">Cobranças</span>' + meses.map(function (mes) { var n = cob.filter(function (x) { return mesChave(x.data) === mes; }).length; return '<div class="ano-cel cob">' + (n ? icone("bell", "ic") + n : "") + "</div>"; }).join("") + '<span class="ano-tot">' + (cob.length || "") + "</span>" + "</div>";
  return '<div class="row between"><h3>Linha do ano' + (a ? ' <span class="muted" style="font-weight:400">· ' + esc(rotuloAut(a)) + (a.inicio ? " · " + fmtData(a.inicio) + " a " + fmtData(a.fim) : "") + "</span>" : "") + "</h3>" + botao("Copiar resumo pro cliente", "p", 'data-acao="copiar-resumo" data-id="' + attr(m.id) + '"', "link") + "</div>" +
    '<div class="mt3">' + grade + '</div><div class="small muted mt2">Cinza: mês sem entrega. Tracejado: meses que ainda vêm. Azul "+N": programado. Sino: cobrança registrada naquele mês.</div>';
}
function painelCobrancas(m) {
  var cob = cobrancasDaMarca(m);
  return '<div class="row between"><h3>Cobranças ao cliente <span class="muted" style="font-weight:400">· ' + cob.length + "</span></h3>" + botao("Registrar cobrança", "p prim", 'data-acao="nova-cobranca-marca" data-id="' + attr(m.id) + '"', "bell") + "</div>" +
    '<div class="small muted mt1 mb3">Cada registro guarda a data. É a prova de que a revista cobrou o material e estava com o pé na entrega.</div>' +
    (cob.length ? '<div class="tabela-wrap"><table class="tabela">' + cob.map(function (x) { return "<tr" + (x.brandId ? ' class="clicavel" data-acao="abrir-brand" data-id="' + attr(x.brandId) + '"' : "") + '><td class="nowrap mono">' + fmtData(x.data) + "</td><td>" + (x.produto ? tagProduto(x.produto) : "") + "</td><td>" + esc(x.texto) + (x.ref ? '<div class="small muted">' + esc(x.ref) + "</div>" : "") + "</td></tr>"; }).join("") + "</table></div>" : '<div class="vazio">Nenhuma cobrança registrada para esta marca.</div>');
}
function painelContrato(m, a) {
  if (!a) return '<div class="vazio">Esta marca não tem autorização cadastrada. ' + botao("Cadastrar autorização", "p", 'data-acao="nova-aut" data-marca="' + attr(m.id) + '"', "plus") + "</div>";
  var cotas = a.cotas || {};
  return '<div class="row between"><h3>' + esc(rotuloAut(a)) + " " + selo(situacaoAut(a).nome, situacaoAut(a).cls) + '</h3><span class="row">' + botao("Editar", "p", 'data-acao="editar-aut" data-id="' + attr(a.id) + '"', "pencil") + (a.encerrada ? botao("Reabrir", "p", 'data-acao="encerrar-aut" data-id="' + attr(a.id) + '" data-v="0"') : botao("Encerrar", "p", 'data-acao="encerrar-aut" data-id="' + attr(a.id) + '" data-v="1"')) + "</span></div>" +
    '<dl class="kv mt3">' + (a.gecom ? "<dt>Gecom</dt><dd>" + esc(a.gecom) + "</dd>" : "") + "<dt>Vigência</dt><dd>" + (a.inicio ? fmtData(a.inicio) + " a " + fmtData(a.fim) : '<span class="muted">não informada</span>') + "</dd><dt>Cotas</dt><dd>" + (temCotas(a) ? ORDEM_PRODUTOS.filter(function (p) { return cotas[p]; }).map(function (p) { return fmtNum(cotas[p]) + " " + PRODUTOS[p].unidade + " (" + PRODUTOS[p].curto + ")"; }).join(" · ") : '<span class="muted">sem cotas cadastradas</span>') + "</dd>" + (a.valor ? "<dt>Valor</dt><dd>" + fmtMoeda(a.valor) + (a.pagamento ? ' <span class="small muted">' + esc(a.pagamento) + "</span>" : "") + "</dd>" : "") + (a.contato ? "<dt>Contato</dt><dd>" + esc(a.contato) + "</dd>" : "") + (a.pdfNome ? "<dt>PDF</dt><dd>" + esc(a.pdfNome) + "</dd>" : "") + (a.obs ? "<dt>Obs.</dt><dd>" + esc(a.obs) + "</dd>" : "") + "<dt>Origem</dt><dd>" + esc(a.origem || "cadastro manual") + "</dd></dl>";
}
function indiceEtapa(id) { for (var i = 0; i < ETAPAS_BRAND.length; i++) if (ETAPAS_BRAND[i].id === id) return i; return 0; }
function resumoMetricas(e) {
  var m = e.metricas || {}; var partes = [];
  if (e.produto === "banner") partes.push(fmtNum(m.impressoes) + " impressões");
  if (e.produto === "revista") partes.push((e.quantidade || 1) + " pág. " + (e.formato || ""));
  if (e.produto === "post" || e.produto === "brand") { if (m.visualizacoes) partes.push(fmtNum(m.visualizacoes) + " views"); if (m.alcance) partes.push(fmtNum(m.alcance) + " alcance"); if (m.curtidas) partes.push(fmtNum(m.curtidas) + " curtidas"); }
  if (e.produto === "email") { if (m.base) partes.push("base " + fmtNum(m.base)); if (m.aberturas) partes.push(fmtNum(m.aberturas) + " aberturas"); if (m.cliques) partes.push(fmtNum(m.cliques) + " cliques"); }
  return partes.length ? '<span class="small">' + esc(partes.join(" · ")) + "</span>" : '<span class="small muted">sem métricas</span>';
}

/* ============================================================ tela: autorizações */
var ORDEM_SIT = ["vencendo", "vigente", "futura", "sem_vigencia", "vencida", "encerrada"];
var TITULO_SIT = { vencendo: "Vencendo em até 45 dias", vigente: "Vigentes", futura: "Começam depois", sem_vigencia: "Sem vigência informada (conferir com a autorização)", vencida: "Vencidas", encerrada: "Encerradas" };
function autsSemCotas() { var ordem = { vencendo: 0, vigente: 1, futura: 2, sem_vigencia: 3, vencida: 4, encerrada: 5 }; return S.d.autorizacoes.filter(function (a) { return !a.encerrada && !temCotas(a); }).sort(function (a, b) { return (ordem[situacaoAut(a).id] - ordem[situacaoAut(b).id]) || porNome({ nome: nomeMarca(a.marcaId) }, { nome: nomeMarca(b.marcaId) }) || String(b.inicio || b.rotulo).localeCompare(String(a.inicio || a.rotulo)); }); }
function brandsNaPlanilha(a) { return S.d.brands.filter(function (b) { return b.autorizacaoId === a.id; }).length; }
function telaAutorizacoes() {
  var q = S.busca.toLowerCase();
  var lista = S.d.autorizacoes.filter(function (a) { return !q || nomeMarca(a.marcaId).toLowerCase().indexOf(q) >= 0 || String(a.rotulo || "").toLowerCase().indexOf(q) >= 0 || String(a.gecom || "").toLowerCase().indexOf(q) >= 0; });
  var f = S.filtroAut || "ativas";
  lista = lista.filter(function (a) { var sid = situacaoAut(a).id; if (f === "ativas") return sid !== "encerrada" && sid !== "vencida"; if (f === "vencidas") return sid === "vencida" && alertasAut(a).length; if (f === "sem") return sid !== "encerrada" && !temCotas(a); if (f === "encerradas") return sid === "encerrada"; return true; });
  var semCotas = autsSemCotas().length;
  var topo = '<div class="filtros"><div class="busca">' + icone("search") + '<input class="input" id="busca-aut" placeholder="Buscar marca, contrato ou Gecom" value="' + attr(S.busca) + '" data-filtro="busca"></div>' +
    '<div class="chips">' + [["ativas", "Ativas"], ["vencidas", "Vencidas com saldo"], ["sem", "Sem cotas (" + semCotas + ")"], ["encerradas", "Encerradas"], ["todas", "Todas"]].map(function (o) { return '<button type="button" class="chip' + (f === o[0] ? " ativo" : "") + '" data-acao="filtro-aut" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
    '<div class="chips" style="margin-left:auto"><button type="button" class="chip' + (S.visaoAut !== "tempo" ? " ativo" : "") + '" data-acao="visao-aut" data-v="tabela">Tabela</button><button type="button" class="chip' + (S.visaoAut === "tempo" ? " ativo" : "") + '" data-acao="visao-aut" data-v="tempo">Linha do tempo</button></div>' +
    (semCotas ? botao("Cadastrar em sequência (" + semCotas + ")", "p preto", 'data-acao="seq-iniciar"', "arrow-right") : "") + "</div>";
  return topo + (S.visaoAut === "tempo" ? autLinhaDoTempo(lista) : autTabela(lista));
}
function cotaInline(a, p, c) {
  var k = c[p]; var v = (a.cotas || {})[p];
  return '<td class="cota-cel"><span class="ent mono">' + (k.entregue ? fmtNum(k.entregue) : "0") + '</span><span class="muted">/</span><input class="cota-inline" type="number" min="0" step="1" value="' + (v || "") + '" placeholder="—" data-cota-aut="' + attr(a.id) + '" data-cota-produto="' + p + '" aria-label="' + attr(PRODUTOS[p].nome) + '">' + (k.contratado ? barra(k.pct, classeCota(k, tempoDecorrido(a)), tempoDecorrido(a)) : "") + "</td>";
}
function autTabela(lista) {
  var grupos = {}; lista.forEach(function (a) { var sid = situacaoAut(a).id; (grupos[sid] = grupos[sid] || []).push(a); });
  var html = ORDEM_SIT.filter(function (sid) { return grupos[sid]; }).map(function (sid) {
    var itens = grupos[sid].sort(function (a, b) { return (sid === "vencendo" || sid === "vencida" ? String(a.fim || "").localeCompare(String(b.fim || "")) : 0) || porNome({ nome: nomeMarca(a.marcaId) }, { nome: nomeMarca(b.marcaId) }); });
    var cls = sid === "vencendo" ? "alerta" : sid === "vencida" ? "erro" : sid === "sem_vigencia" ? "info" : "";
    return '<div class="card aut-grupo"><div class="aut-grupo-cab ' + cls + '">' + esc(TITULO_SIT[sid]) + ' <span class="muted">· ' + itens.length + '</span></div><div class="tabela-wrap"><table class="tabela aut-tabela"><thead><tr><th>Marca · contrato</th><th>Vigência</th><th>Posts</th><th>Brand</th><th>E-mail</th><th>Revista</th><th>Banner</th><th>Saldo</th><th></th></tr></thead><tbody>' +
      itens.map(function (a) {
        var c = consumo(a); var st = situacaoAut(a); var hoje = hojeISO();
        var saldo = temCotas(a) ? ORDEM_PRODUTOS.filter(function (p) { return c[p].saldo; }).map(function (p) { return fmtNum(c[p].saldo) + " " + (p === "banner" ? "impr." : PRODUTOS[p].curto.toLowerCase() + (c[p].saldo > 1 && p !== "email" ? "s" : "")); }).join(", ") || '<span class="selo ok">completo</span>' : '<span class="muted small">cadastre as cotas ao lado</span>';
        var dias = a.fim ? diasEntre(hoje, a.fim) : null;
        var vig = a.inicio ? fmtData(a.inicio).slice(0, 5) + "/" + a.inicio.slice(2, 4) + " a " + fmtData(a.fim).slice(0, 5) + "/" + a.fim.slice(2, 4) : '<button type="button" class="chip" data-acao="editar-aut" data-id="' + attr(a.id) + '">informar datas</button>';
        var vigSub = dias == null ? "" : dias < 0 ? '<div class="small" style="color:var(--erro)">venceu há ' + (-dias) + " dias</div>" : dias <= 60 ? '<div class="small" style="color:var(--alerta)">vence em ' + dias + " dias</div>" : "";
        var pod = (sid === "vencendo" || sid === "vigente" || sid === "vencida") && !S.d.autorizacoes.some(function (x) { return x.renovaDe === a.id; });
        return '<tr><td><strong>' + esc(nomeMarca(a.marcaId)) + '</strong><div class="small muted">' + esc(rotuloAut(a)) + (a.gecom ? " · Gecom " + esc(a.gecom) : "") + (brandsNaPlanilha(a) && !(a.cotas || {}).brand ? ' · <span style="color:var(--info)">' + brandsNaPlanilha(a) + " brand na planilha</span>" : "") + '</div></td><td class="nowrap small">' + vig + vigSub + "</td>" + ORDEM_PRODUTOS.map(function (p) { return cotaInline(a, p, c); }).join("") + '<td class="small">' + saldo + '</td><td class="nowrap"><span class="row" style="gap:4px;flex-wrap:nowrap">' + (pod ? botao("Renovar", "p", 'data-acao="renovar-aut" data-id="' + attr(a.id) + '"', "arrow-right") : "") + botao("", "p icone", 'data-acao="editar-aut" data-id="' + attr(a.id) + '" aria-label="Editar"', "pencil") + "</span></td></tr>";
      }).join("") + "</tbody></table></div></div>";
  }).join("");
  return html || '<div class="vazio">Nenhuma autorização nesse filtro.</div>';
}
function autLinhaDoTempo(lista) {
  var hoje = hojeISO(); var comData = lista.filter(function (a) { return a.inicio && a.fim; }); var semData = lista.filter(function (a) { return !a.inicio || !a.fim; });
  var ini = somaDias(hoje, -600), fim = somaDias(hoje, 420);
  comData.forEach(function (a) { if (a.inicio < ini) ini = a.inicio; if (a.fim > fim) fim = a.fim; });
  if (diasEntre(ini, fim) > 1500) ini = somaDias(hoje, -720);
  var total = diasEntre(ini, fim); var pct = function (iso) { return Math.max(0, Math.min(100, diasEntre(ini, iso) / total * 100)); };
  var todosMeses = mesesEntre(ini, fim); var passo = Math.max(1, Math.ceil(todosMeses.length / 9)); var meses = todosMeses.filter(function (m, i) { return i % passo === 0; });
  var porMarca = {}; comData.forEach(function (a) { (porMarca[a.marcaId] = porMarca[a.marcaId] || []).push(a); });
  var ids = Object.keys(porMarca).sort(function (a, b) { return porNome({ nome: nomeMarca(a) }, { nome: nomeMarca(b) }); });
  var linhas = ids.map(function (mid) {
    var auts = porMarca[mid].sort(function (a, b) { return a.inicio.localeCompare(b.inicio); });
    return '<div class="tl-rot"><a href="#/marcas/' + mid + '">' + esc(nomeMarca(mid)) + '</a></div><div class="tl-trilho">' + auts.map(function (a) {
      var st = situacaoAut(a); var c = consumo(a); var cls = st.id === "vencida" && alertasAut(a).length ? "vencida" : (st.id === "vencida" || st.id === "encerrada") ? "passada" : !temCotas(a) ? "sem" : alertasAut(a).length ? "atrasada" : "ok";
      var cc = ORDEM_PRODUTOS.filter(function (p) { return c[p].contratado; }).map(function (p) { return PRODUTOS[p].curto + " " + fmtNum(c[p].entregue) + "/" + fmtNum(c[p].contratado); }).slice(0, 2).join(" · ");
      var left = pct(a.inicio), w = Math.max(1.5, pct(a.fim) - left);
      return '<button type="button" class="tl-barra ' + cls + '" style="left:' + left + "%;width:" + w + '%" data-acao="editar-aut" data-id="' + attr(a.id) + '" title="' + attr(rotuloAut(a) + " · " + fmtData(a.inicio) + " a " + fmtData(a.fim) + (cc ? " · " + cc : "")) + '">' + esc(rotuloAut(a)) + (cc ? ' <span class="cc">· ' + esc(cc) + "</span>" : (temCotas(a) ? "" : ' <span class="cc">· sem cotas</span>')) + "</button>";
    }).join("") + "</div>";
  }).join("");
  return '<div class="card"><div class="corpo"><div class="tl-cab" style="grid-template-columns:130px 1fr"><span></span><div class="tl-meses">' + meses.map(function (m) { return '<span style="left:' + pct(m + "-01") + '%" class="' + (m === hoje.slice(0, 7) ? "hoje" : "") + '">' + esc(nomeMesCurto(m)) + "</span>"; }).join("") + "</div></div>" +
    '<div class="tl-grade" style="grid-template-columns:130px 1fr"><div class="tl-hoje" style="left:calc(130px + (100% - 130px) * ' + (pct(hoje) / 100).toFixed(4) + ')"></div>' + (linhas || '<div class="vazio" style="grid-column:1/-1">Nenhuma autorização com datas nesse filtro.</div>') + "</div>" +
    '<div class="legenda mt3"><span><i style="background:var(--ok-bg);border:1px solid var(--ok)"></i>em dia</span><span><i style="background:var(--alerta-bg);border:1px solid var(--alerta)"></i>atrasada ou vencendo</span><span><i style="background:var(--erro-bg);border:1px solid var(--erro)"></i>vencida com saldo</span><span><i style="background:var(--muted-bg)"></i>passada</span><span><i style="border:1px dashed var(--borda-forte)"></i>sem cotas</span></div>' +
    (semData.length ? '<div class="small muted mt3">Sem datas (não aparecem na linha): ' + semData.map(function (a) { return '<button type="button" class="chip" data-acao="editar-aut" data-id="' + attr(a.id) + '">' + esc(nomeMarca(a.marcaId)) + " · " + esc(rotuloAut(a)) + "</button>"; }).join(" ") + "</div>" : "") + "</div></div>";
}
/* renovar: cria a autorização seguinte copiando as cotas, com a vigência avançada em um ano */
function renovarAut(a) {
  var ini = a.fim ? somaDias(a.fim, 1) : null; var fimN = ini ? somaDias(ini, 364) : null;
  var ano = fimN ? fimN.slice(0, 4) : String(new Date().getFullYear() + 1);
  var novo = { marcaId: a.marcaId, rotulo: ano, gecom: "", inicio: ini, fim: fimN, valor: a.valor || null, pagamento: a.pagamento || "", contato: a.contato || "", cotas: clone(a.cotas || {}), obs: "Renovação de " + rotuloAut(a) + ". O saldo do contrato anterior não passa para este.", renovaDe: a.id, origem: "renovação" };
  S.dialogo = { tipo: "aut", item: novo, novoDeRenovacao: true }; render();
}
/* cadastrar em sequência: percorre as autorizações sem cotas */
function iniciarSequencia() {
  var ids = autsSemCotas().map(function (a) { return a.id; }); if (!ids.length) return toast("Todas as autorizações já têm cotas.");
  abrirSequencia(ids, 0);
}
function abrirSequencia(ids, i) {
  while (i < ids.length && !aut(ids[i])) i++;
  if (i >= ids.length) { S.dialogo = null; toast("Fim da sequência."); return render(); }
  S.dialogo = { tipo: "aut", item: clone(aut(ids[i])), sequencia: { ids: ids, i: i } }; render();
}

/* ============================================================ tela: fila de materiais */
function telaFila() {
  var lista = S.d.fila.slice();
  if (S.filtroFila === "aguardando") lista = lista.filter(function (f) { return f.status === "aguardando"; });
  else if (S.filtroFila === "alocado") lista = lista.filter(function (f) { return f.status === "alocado"; });
  var peso = { urgente: 0, data_pedida: 1, normal: 2 };
  lista.sort(function (a, b) { return (peso[a.urgencia] - peso[b.urgencia]) || String(a.dataPedida || "9").localeCompare(String(b.dataPedida || "9")) || String(a.criadoEm).localeCompare(String(b.criadoEm)); });
  return '<div class="alerta-box info">' + icone("info") + '<span class="t">O atendimento registra aqui tudo que a marca mandou (arquivo no Drive, link parametrizado, texto). Igor e Isa escolhem a data e o item vira uma entrega programada no calendário. A ordem é por urgência e data pedida, não por chegada.</span></div>' +
    '<div class="chips">' + [["aguardando", "Aguardando data"], ["alocado", "Com data"], ["todos", "Todos"]].map(function (o) { return '<button type="button" class="chip' + (S.filtroFila === o[0] ? " ativo" : "") + '" data-acao="filtro-fila" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
    '<div class="card"><div class="corpo sem">' + (lista.length ? lista.map(function (f, i) {
      return '<div class="fila-item"><span class="pos">' + (i + 1) + '</span><div><div class="row"><span class="t">' + esc(nomeMarca(f.marcaId)) + "</span>" + tagProduto(f.produto) + (f.urgencia !== "normal" ? selo(URGENCIAS[f.urgencia], f.urgencia === "urgente" ? "erro" : "alerta") : "") + (f.status === "alocado" ? selo("Programado para " + fmtData(f.dataAlocada), "info") : "") + (f.status === "publicado" ? selo("Publicado", "ok") : "") + "</div>" +
        '<div class="d">' + esc(f.descricao || "") + (f.dataPedida ? " · cliente pediu " + fmtData(f.dataPedida) : "") + " · entrou " + fmtData(f.criadoEm) + (f.por ? " por " + esc(f.por) : "") + "</div>" +
        '<div class="row small mt1">' + (f.linkMaterial ? linkExterno(f.linkMaterial, "Material") : "") + (f.linkDestino ? linkExterno(f.linkDestino, "Link parametrizado") : "") + "</div></div>" +
        '<div class="row">' + (f.status === "aguardando" ? botao("Dar data", "p prim", 'data-acao="alocar-fila" data-id="' + attr(f.id) + '"', "calendar") : "") + botao("", "p icone", 'data-acao="editar-fila" data-id="' + attr(f.id) + '" aria-label="Editar"', "pencil") + "</div></div>";
    }).join("") : '<div class="vazio" style="margin:16px">Nada na fila. ' + botao("Entrou material", "p", 'data-acao="novo-fila"', "plus") + "</div>") + "</div></div>";
}

/* ============================================================ tela: brand (kanban) */
/* crédito: vídeo contratado que ainda não tem tema (veio da planilha como "A definir") */
function ehCredito(b) { return b.etapa === "definir_tema" && /^(a definir|aguardando cliente|aguardando|definir|-|)$/i.test(String(b.titulo || "").trim()) && !(b.historico || []).some(function (h) { return h.texto && !/^Criado|^Exemplo/.test(h.texto); }); }
var FASES_BRAND = [
  { id: "cliente", nome: "Com o cliente", etapas: ["definir_tema", "aprovacao_roteiro", "aprovacao_cliente"], cls: "alerta" },
  { id: "roteiro", nome: "Roteiro", etapas: ["roteiro"], cls: "" },
  { id: "gravacao", nome: "Gravação", etapas: ["agendar_gravacao", "gravado"], cls: "" },
  { id: "edicao", nome: "Edição e revisão", etapas: ["edicao", "revisao_interna"], cls: "info" },
  { id: "prontos", nome: "Prontos, dar data", etapas: ["data_veiculacao"], cls: "ok" }
];
function faseDe(etapa) { for (var i = 0; i < FASES_BRAND.length; i++) if (FASES_BRAND[i].etapas.indexOf(etapa) >= 0) return FASES_BRAND[i]; return null; }
function quemEsta(b) { var e = byId(ETAPAS_BRAND, b.etapa); return e ? e.quem : ""; }
/* ação rápida certa para a etapa atual */
function acaoRapida(b) {
  switch (b.etapa) {
    case "definir_tema": case "aprovacao_roteiro": case "aprovacao_cliente": return { acao: "brand-cobrar-rapido", rotulo: "Cobrar", icone: "bell" };
    case "roteiro": return { acao: "brand-avancar-rapido", rotulo: "Roteiro pronto", icone: "arrow-right" };
    case "agendar_gravacao": return b.dataGravacao ? { acao: "brand-avancar-rapido", rotulo: "Gravado", icone: "check" } : { acao: "abrir-brand", rotulo: "Marcar", icone: "calendar" };
    case "gravado": return { acao: "brand-avancar-rapido", rotulo: "Em edição", icone: "arrow-right" };
    case "edicao": return { acao: "brand-avancar-rapido", rotulo: "Para revisão", icone: "arrow-right" };
    case "revisao_interna": return { acao: "brand-avancar-rapido", rotulo: "Enviar ao cliente", icone: "arrow-right" };
    case "data_veiculacao": return { acao: "brand-avancar-rapido", rotulo: "Veiculou", icone: "check" };
  }
  return null;
}
function avancarBrandRapido(id) {
  var b = clone(byId(S.d.brands, id)); if (!b) return; var i = indiceEtapa(b.etapa); var prox = ETAPAS_BRAND[i + 1]; if (!prox) return;
  b.etapa = prox.id; b.historico = b.historico || []; b.historico.push({ data: hojeISO(), etapa: prox.id, texto: "Avançou para " + prox.nome }); b.atualizadoEm = hojeISO();
  if (prox.id === "veiculado" && !b.dataVeiculacao) b.dataVeiculacao = hojeISO();
  return API.salvar("brands", b).then(function () { toast(nomeMarca(b.marcaId) + " · " + b.titulo + ": " + prox.nome + "."); render(); });
}
function proximaDataBrand(b) {
  if (b.etapa === "veiculado") return b.dataVeiculacao ? { t: "saiu " + fmtDataCurta(b.dataVeiculacao), cls: "muted" } : null;
  if (b.dataVeiculacao) return { t: "sai " + fmtDataExtensa(b.dataVeiculacao).replace(/\/\d{4}/, ""), cls: "info" };
  if (b.dataGravacao && indiceEtapa(b.etapa) <= indiceEtapa("agendar_gravacao")) return { t: "grava " + fmtDataExtensa(b.dataGravacao).replace(/\/\d{4}/, ""), cls: "info" };
  return null;
}
function linhaBrand(b, mostrarMarca) {
  var e = byId(ETAPAS_BRAND, b.etapa) || {}; var d = diasParado(b); var cliente = !!ETAPAS_COM_CLIENTE[b.etapa]; var ar = acaoRapida(b); var pd = proximaDataBrand(b);
  var trava = b.logistica && b.logistica !== "nao_precisa" && b.logistica !== "recebido" && indiceEtapa(b.etapa) <= indiceEtapa("agendar_gravacao") ? LOGISTICA[b.logistica] : "";
  return '<div class="brand-linha" data-acao="abrir-brand" data-id="' + attr(b.id) + '"><div class="t">' + (mostrarMarca ? '<span class="marca-mini">' + esc(nomeMarca(b.marcaId)) + "</span> " : "") + esc(b.titulo) + (b.apresentador ? ' <span class="muted">· ' + esc(b.apresentador) + "</span>" : "") + (trava ? ' <span class="small" style="color:var(--alerta)">· ' + esc(trava.toLowerCase()) + "</span>" : "") + (b.refacoes >= 2 ? ' <span class="small" style="color:var(--erro)">· ' + b.refacoes + " refações</span>" : "") + "</div>" +
    '<div class="row brand-dir">' + (pd ? '<span class="small" style="color:var(--' + (pd.cls === "info" ? "info" : "muted") + ')">' + esc(pd.t) + "</span>" : "") + '<span class="small ' + (cliente ? "" : "muted") + '" style="' + (cliente ? "color:var(--alerta)" : "") + '">' + esc(quemEsta(b)) + (b.etapa !== "veiculado" && d >= 7 ? " · " + d + " d" : "") + "</span>" + selo(b.etapa === "veiculado" ? (b.dataVeiculacao ? fmtDataCurta(b.dataVeiculacao) : "Veiculado") : (e.nome || b.etapa), b.etapa === "veiculado" ? "ok" : cliente ? (d >= 30 ? "erro" : "alerta") : "") +
    (ar && b.etapa !== "veiculado" ? '<button type="button" class="btn p' + (ar.acao === "brand-cobrar-rapido" && d >= 14 ? " prim" : "") + '" data-acao="' + ar.acao + '" data-id="' + attr(b.id) + '" onclick="event.stopPropagation()">' + icone(ar.icone) + esc(ar.rotulo) + "</button>" : "") + "</div></div>";
}
function telaBrand() {
  var todos = S.d.brands.filter(function (b) { return (!S.filtroBrandMarca || b.marcaId === S.filtroBrandMarca) && (!S.filtroBrandAut || b.autorizacaoId === S.filtroBrandAut); });
  var q = S.busca.toLowerCase(); if (q) todos = todos.filter(function (b) { return (nomeMarca(b.marcaId) + " " + b.titulo + " " + (b.apresentador || "")).toLowerCase().indexOf(q) >= 0; });
  var creditos = todos.filter(ehCredito); var reais = todos.filter(function (b) { return !ehCredito(b); });
  var producao = reais.filter(function (b) { return b.etapa !== "veiculado"; }); var veiculados = reais.filter(function (b) { return b.etapa === "veiculado"; });
  var contFase = {}; FASES_BRAND.forEach(function (f) { contFase[f.id] = producao.filter(function (b) { return f.etapas.indexOf(b.etapa) >= 0; }).length; });
  var bola = S.filtroBrandBola || "todos";
  var filtrados = producao.filter(function (b) { var f = faseDe(b.etapa); if (bola === "todos") return true; if (bola === "cliente") return !!ETAPAS_COM_CLIENTE[b.etapa]; if (bola === "nossa") return !ETAPAS_COM_CLIENTE[b.etapa] && b.etapa !== "data_veiculacao"; if (bola === "prontos") return b.etapa === "data_veiculacao"; return f && f.id === bola; });
  var totalProd = producao.length || 1;
  var funil = '<div class="funil">' + FASES_BRAND.map(function (f) { var n = contFase[f.id]; return '<button type="button" class="funil-seg ' + f.cls + (bola === f.id ? " ativo" : "") + '" style="flex:' + Math.max(n, 2) + '" data-acao="filtro-brand-bola" data-v="' + f.id + '" title="' + attr(f.nome) + '"><span class="n">' + n + '</span><span class="r">' + esc(f.nome) + "</span></button>"; }).join("") + "</div>";
  var cab = '<div class="filtros"><div class="busca">' + icone("search") + '<input class="input" id="busca-brand" placeholder="Buscar marca, moto ou apresentador" value="' + attr(S.busca) + '" data-filtro="busca"></div>' +
    select("filtroBrandMarca", opcoesMarcas("Todas as marcas"), S.filtroBrandMarca, 'data-filtro="brandMarca"') +
    '<div class="chips">' + [["todos", "Todos (" + producao.length + ")"], ["cliente", "Com o cliente (" + producao.filter(function (b) { return ETAPAS_COM_CLIENTE[b.etapa]; }).length + ")"], ["nossa", "Na nossa mão (" + producao.filter(function (b) { return !ETAPAS_COM_CLIENTE[b.etapa] && b.etapa !== "data_veiculacao"; }).length + ")"], ["prontos", "Prontos (" + contFase.prontos + ")"]].map(function (o) { return '<button type="button" class="chip' + (bola === o[0] ? " ativo" : "") + '" data-acao="filtro-brand-bola" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
    '<div class="chips" style="margin-left:auto"><button type="button" class="chip' + (S.visaoBrand !== "lista" ? " ativo" : "") + '" data-acao="visao-brand" data-v="marca">Por marca</button><button type="button" class="chip' + (S.visaoBrand === "lista" ? " ativo" : "") + '" data-acao="visao-brand" data-v="lista">Lista</button></div></div>' +
    '<div class="small muted">' + producao.length + " em produção · " + creditos.length + " crédito" + (creditos.length === 1 ? "" : "s") + " sem tema · " + veiculados.length + " veiculado" + (veiculados.length === 1 ? "" : "s") + "</div>";
  return cab + funil + (S.visaoBrand === "lista" ? brandLista(filtrados, creditos) : brandPorMarca(filtrados, creditos, veiculados, bola));
}
function brandPorMarca(filtrados, creditos, veiculados, bola) {
  var porMarca = {}; filtrados.forEach(function (b) { (porMarca[b.marcaId] = porMarca[b.marcaId] || { prod: [], cred: [], veic: [] }).prod.push(b); });
  creditos.forEach(function (b) { if (bola !== "todos" && !porMarca[b.marcaId]) return; (porMarca[b.marcaId] = porMarca[b.marcaId] || { prod: [], cred: [], veic: [] }).cred.push(b); });
  veiculados.forEach(function (b) { if (porMarca[b.marcaId]) porMarca[b.marcaId].veic.push(b); else if (bola === "todos") porMarca[b.marcaId] = { prod: [], cred: [], veic: [b] }; });
  var ids = Object.keys(porMarca).sort(function (a, b) { var pa = porMarca[a].prod.some(function (x) { return ETAPAS_COM_CLIENTE[x.etapa] && diasParado(x) >= 14; }), pb = porMarca[b].prod.some(function (x) { return ETAPAS_COM_CLIENTE[x.etapa] && diasParado(x) >= 14; }); return (pb - pa) || (porMarca[b].prod.length - porMarca[a].prod.length) || porNome({ nome: nomeMarca(a) }, { nome: nomeMarca(b) }); });
  if (!ids.length) return '<div class="vazio">Nenhum brand nesse filtro. ' + botao("Novo brand", "p", 'data-acao="novo-brand"', "plus") + "</div>";
  var hoje = hojeISO();
  return '<div class="lista-marcas brand-marcas">' + ids.map(function (mid) {
    var g = porMarca[mid]; var sit = situacaoMarca(marca(mid)); var a = sit.alvo; var cota = "";
    var auts = autsDaMarca(mid).filter(function (x) { return (x.cotas || {}).brand; }); var ab = auts.filter(function (x) { return autVigente(x); })[0] || auts[0] || null;
    if (ab) { var c = consumo(ab).brand; var t = tempoDecorrido(ab); cota = '<div class="mini-cota" style="grid-template-columns:auto 1fr auto"><span class="small muted">' + esc(rotuloAut(ab)) + "</span>" + barra(c.pct, classeCota(c, t), t) + '<span class="n">' + c.entregue + "/" + c.contratado + " vídeos</span></div>"; }
    var comCliente = g.prod.filter(function (b) { return ETAPAS_COM_CLIENTE[b.etapa]; }); var maisParado = comCliente.reduce(function (m, b) { return Math.max(m, diasParado(b)); }, 0);
    var aberto = S.brandVeicAberto && S.brandVeicAberto[mid];
    var cred = g.cred.length ? '<div class="credito-linha' + (sit.id === "vencida" ? " erro" : "") + '"><span>' + g.cred.length + " crédito" + (g.cred.length > 1 ? "s" : "") + " sem tema definido" + (sit.id === "vencida" ? " · contrato vencido" : "") + (sit.ultimaCobranca ? " · cobrado há " + diasEntre(sit.ultimaCobranca, hoje) + " d" : "") + '</span><span class="row">' + botao("Cobrar tema", "p", 'data-acao="nova-cobranca-marca" data-id="' + attr(mid) + '" data-produto="brand"', "bell") + botao("Iniciar um", "p", 'data-acao="abrir-brand" data-id="' + attr(g.cred[0].id) + '"', "arrow-right") + "</span></div>" : "";
    g.prod.sort(function (a, b) { return (ETAPAS_COM_CLIENTE[b.etapa] ? 1 : 0) - (ETAPAS_COM_CLIENTE[a.etapa] ? 1 : 0) || diasParado(b) - diasParado(a) || indiceEtapa(b.etapa) - indiceEtapa(a.etapa); });
    return '<div class="card marca-card brand-card" style="cursor:default;transform:none"><div class="row between"><a href="#/marcas/' + mid + '" class="nome" style="text-decoration:none">' + esc(nomeMarca(mid)) + "</a>" + (comCliente.length ? selo(comCliente.length + " com o cliente" + (maisParado >= 14 ? " · " + maisParado + " d" : ""), maisParado >= 30 ? "erro" : "alerta") : (g.prod.length ? selo(g.prod.length + " em produção", "info") : (g.cred.length ? selo("só créditos") : selo("Tudo veiculado", "ok")))) + "</div>" + cota +
      (g.prod.length ? '<div class="brand-lista">' + g.prod.map(function (b) { return linhaBrand(b, false); }).join("") + "</div>" : "") + cred +
      '<div class="row between" style="margin-top:auto">' + (g.veic.length ? '<button type="button" class="btn p fantasma" data-acao="brand-veic" data-id="' + attr(mid) + '">' + icone(aberto ? "chevron-left" : "chevron-right") + (aberto ? "Esconder veiculados" : g.veic.length + " veiculado" + (g.veic.length > 1 ? "s" : "")) + "</button>" : "<span></span>") + botao("Novo brand", "p", 'data-acao="novo-brand" data-marca="' + attr(mid) + '"', "plus") + "</div>" +
      (aberto ? '<div class="brand-lista">' + g.veic.sort(function (a, b) { return String(b.dataVeiculacao || "").localeCompare(String(a.dataVeiculacao || "")); }).map(function (b) { return linhaBrand(b, false); }).join("") + "</div>" : "") + "</div>";
  }).join("") + "</div>";
}
function brandLista(filtrados, creditos) {
  var lista = filtrados.slice().sort(function (a, b) { return (ETAPAS_COM_CLIENTE[b.etapa] ? 1 : 0) - (ETAPAS_COM_CLIENTE[a.etapa] ? 1 : 0) || diasParado(b) - diasParado(a); });
  var porMarcaCred = {}; creditos.forEach(function (b) { porMarcaCred[b.marcaId] = (porMarcaCred[b.marcaId] || 0) + 1; });
  return '<div class="card"><div class="corpo sem">' + (lista.length ? '<div class="brand-lista sem-borda">' + lista.map(function (b) { return linhaBrand(b, true); }).join("") + "</div>" : '<div class="vazio" style="margin:16px">Nenhum vídeo nesse filtro.</div>') + "</div></div>" +
    (Object.keys(porMarcaCred).length ? '<div class="card"><div class="cab"><h2>Créditos a iniciar</h2><span class="small muted">vídeos contratados que ainda não têm tema; não contam como produção</span></div><div class="corpo chips">' + Object.keys(porMarcaCred).sort(function (a, b) { return porNome({ nome: nomeMarca(a) }, { nome: nomeMarca(b) }); }).map(function (mid) { var primeiro = creditos.filter(function (b) { return b.marcaId === mid; })[0]; return '<button type="button" class="chip" data-acao="abrir-brand" data-id="' + attr(primeiro.id) + '">' + esc(nomeMarca(mid)) + ' <span class="muted">· ' + porMarcaCred[mid] + "</span></button>"; }).join("") + "</div></div>" : "");
}
/* ============================================================ tela: edição (New) */
function telaEdicao() {
  var lista = S.d.edicao.slice();
  if (S.filtroEdicaoTipo) lista = lista.filter(function (e) { return (e.tipo || "") === S.filtroEdicaoTipo; });
  if (S.filtroEdicaoStatus) lista = lista.filter(function (e) { return (e.status || "") === S.filtroEdicaoStatus; });
  var q = S.busca.toLowerCase(); if (q) lista = lista.filter(function (e) { return ((e.marcaId ? nomeMarca(e.marcaId) : "") + " " + e.material).toLowerCase().indexOf(q) >= 0; });
  var ordem = {}; STATUS_EDICAO.forEach(function (s, i) { ordem[s] = i; });
  lista.sort(function (a, b) { return ((ordem[a.status] == null ? 9 : ordem[a.status]) - (ordem[b.status] == null ? 9 : ordem[b.status])) || String(b.inicio || "").localeCompare(String(a.inicio || "")); });
  var contagem = {}; S.d.edicao.forEach(function (e) { contagem[e.status] = (contagem[e.status] || 0) + 1; });
  return '<div class="filtros"><div class="busca">' + icone("search") + '<input class="input" id="busca-ed" placeholder="Buscar material" value="' + attr(S.busca) + '" data-filtro="busca"></div>' +
    select("filtroEdicaoTipo", [["", "Branded e editorial"], ["Branded", "Só branded"], ["Editorial", "Só editorial"]], S.filtroEdicaoTipo, 'data-filtro="edTipo"') + "</div>" +
    '<div class="chips"><button type="button" class="chip' + (!S.filtroEdicaoStatus ? " ativo" : "") + '" data-acao="filtro-ed-status" data-v="">Todos</button>' + STATUS_EDICAO.map(function (s) { return '<button type="button" class="chip' + (S.filtroEdicaoStatus === s ? " ativo" : "") + '" data-acao="filtro-ed-status" data-v="' + s + '">' + s + (contagem[s] ? " (" + contagem[s] + ")" : "") + "</button>"; }).join("") + "</div>" +
    '<div class="card"><div class="corpo sem tabela-wrap"><table class="tabela"><thead><tr><th>Marca</th><th>Material</th><th>Status</th><th>Tipo</th><th>Início</th><th>Finalizado</th><th>Revisões</th><th>Ajustes</th><th>Reels</th><th>Links</th></tr></thead><tbody>' +
    (lista.length ? lista.slice(0, 200).map(function (e) {
      var rev = (e.revisoes || []).length, aj = (e.ajustes || []).length;
      return '<tr class="clicavel" data-acao="editar-edicao" data-id="' + attr(e.id) + '"><td><strong>' + esc(e.marcaId ? nomeMarca(e.marcaId) : "") + "</strong></td><td>" + esc(e.material) + "</td><td>" + selo(e.status || "", e.status === "Publicado" || e.status === "Aprovado" ? "ok" : (e.status === "Aprovação" || e.status === "Revisão" ? "alerta" : (e.status === "Standby" ? "" : "info"))) + "</td><td class=\"small\">" + esc(e.tipo || "") + '</td><td class="nowrap mono small">' + fmtDataCurta(e.inicio) + '</td><td class="nowrap mono small">' + fmtDataCurta(e.finalizado) + '</td><td class="small">' + (rev ? rev + "× <span class=\"muted\">" + esc((e.revisoes || []).map(fmtDataCurta).join(", ")) + "</span>" : "") + '</td><td class="small">' + (aj ? aj + "× <span class=\"muted\">" + esc((e.ajustes || []).map(fmtDataCurta).join(", ")) + "</span>" : "") + '</td><td class="nowrap mono small">' + fmtDataCurta(e.reels) + '</td><td class="small nowrap">' + (e.linkExibicao ? linkExterno(e.linkExibicao, "vídeo") : "") + " " + (e.linkMaterial ? linkExterno(e.linkMaterial, "material") : "") + "</td></tr>";
    }).join("") : '<tr><td colspan="10"><div class="vazio" style="margin:16px">Nada nesse filtro.</div></td></tr>') + "</tbody></table></div></div>";
}

/* ============================================================ tela: calendário */
function eventosCalendario() {
  var ev = [];
  S.d.entregas.forEach(function (e) { if (e.data) ev.push({ tipo: "entrega", id: e.id, data: e.data, produto: e.produto, marca: nomeMarca(e.marcaId), titulo: (e.status === "agendado" ? "(programado) " : "") + (e.titulo || PRODUTOS[e.produto].nome), status: e.status }); });
  S.d.brands.forEach(function (b) { if (b.dataVeiculacao && b.etapa !== "veiculado") ev.push({ tipo: "brand", id: b.id, data: b.dataVeiculacao, produto: "brand", marca: nomeMarca(b.marcaId), titulo: b.titulo, status: "agendado" }); if (b.dataGravacao && b.etapa !== "veiculado" && indiceEtapa(b.etapa) <= indiceEtapa("agendar_gravacao")) ev.push({ tipo: "brand", id: b.id, data: b.dataGravacao, produto: "brand", marca: nomeMarca(b.marcaId), titulo: "Gravação: " + b.titulo, status: "gravacao" }); });
  S.d.fila.forEach(function (f) { if (f.status === "alocado" && f.dataAlocada && !f.entregaId) ev.push({ tipo: "fila", id: f.id, data: f.dataAlocada, produto: f.produto, marca: nomeMarca(f.marcaId), titulo: f.descricao || "", status: "agendado" }); });
  return ev;
}
function telaCalendario() {
  var m = /^(\d{4})-(\d{2})$/.exec(S.calMes); var ano = +m[1], mes = +m[2] - 1;
  var primeiro = new Date(ano, mes, 1), ini = new Date(ano, mes, 1 - primeiro.getDay());
  var ev = eventosCalendario(); var porDia = {}; ev.forEach(function (e) { (porDia[e.data] = porDia[e.data] || []).push(e); });
  var hoje = hojeISO(); var dias = "";
  for (var i = 0; i < 42; i++) {
    var d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i); var iso = d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
    var fora = d.getMonth() !== mes; var lista = porDia[iso] || [];
    dias += '<div class="dia' + (fora ? " fora" : "") + (iso === hoje ? " hoje" : "") + '"><span class="n">' + d.getDate() + "</span>" + lista.slice(0, 4).map(function (e) { return '<div class="evento ' + e.produto + (e.tipo === "fila" ? " fila" : "") + '" data-acao="abrir-evento" data-tipo="' + e.tipo + '" data-id="' + attr(e.id) + '" title="' + attr(e.marca + ": " + e.titulo) + '">' + esc(e.marca) + " · " + esc(e.titulo) + "</div>"; }).join("") + (lista.length > 4 ? '<div class="small muted">+' + (lista.length - 4) + "</div>" : "") + "</div>";
    if (i >= 34 && new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i + 1).getMonth() !== mes && i % 7 === 6) break;
  }
  var ant = new Date(ano, mes - 1, 1), prox = new Date(ano, mes + 1, 1);
  return '<div class="row between"><div class="row">' + botao("", "icone", 'data-acao="cal-mes" data-v="' + ant.getFullYear() + "-" + p2(ant.getMonth() + 1) + '" aria-label="Mês anterior"', "chevron-left") + '<h2 class="display" style="font-size:28px;min-width:220px;text-align:center">' + esc(MESES[mes]) + " " + ano + "</h2>" + botao("", "icone", 'data-acao="cal-mes" data-v="' + prox.getFullYear() + "-" + p2(prox.getMonth() + 1) + '" aria-label="Próximo mês"', "chevron-right") + botao("Hoje", "p", 'data-acao="cal-mes" data-v="' + hoje.slice(0, 7) + '"') + "</div>" +
    '<div class="legenda">' + ORDEM_PRODUTOS.map(function (p) { return '<span><i class="evento ' + p + '" style="padding:0;border-left-width:10px"></i>' + esc(PRODUTOS[p].curto) + "</span>"; }).join("") + "<span><i style=\"border:1px dashed var(--muted)\"></i>Fila com data</span></div></div>" +
    '<div class="cal-cab">' + ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(function (d) { return "<span>" + d + "</span>"; }).join("") + '</div><div class="cal">' + dias + "</div>";
}

/* ============================================================ tela: relatórios */
function contagemRelatorio(m, a, de, ate) {
  var ents = S.d.entregas.filter(function (e) { return e.marcaId === m.id && (a === "todas" || e.autorizacaoId === a.id) && e.status !== "agendado" && e.data >= de && e.data <= ate; });
  var brands = S.d.brands.filter(function (b) { return b.marcaId === m.id && (a === "todas" || b.autorizacaoId === a.id) && b.etapa === "veiculado" && (!b.dataVeiculacao || (b.dataVeiculacao >= de && b.dataVeiculacao <= ate)); });
  return { entregas: ents, brands: brands };
}
function periodoRelatorio(a) { return { de: S.relDe ? S.relDe + "-01" : "0000-00-00", ate: S.relAte ? S.relAte + "-31" : "9999-99-99" }; }
function telaRelatorios() {
  var m = S.relMarca ? marca(S.relMarca) : null; var auts = m ? autsDaMarca(m.id) : [];
  if (m && S.relAut !== "todas" && (!S.relAut || !byId(auts, S.relAut))) { var sit = situacaoMarca(m); S.relAut = (sit.alvo || auts[0] || {}).id || "todas"; }
  var a = S.relAut === "todas" ? "todas" : aut(S.relAut);
  var previa = "";
  if (m && a) {
    var per = periodoRelatorio(a); var cont = contagemRelatorio(m, a, per.de, per.ate);
    var dados = window.Relatorio ? window.Relatorio.montarDados(coletorRelatorio(m, a)) : { slides: [] };
    var aviso = "";
    if (!cont.entregas.length && !cont.brands.length) {
      var outras = auts.filter(function (x) { return a === "todas" || x.id !== a.id; }).map(function (x) { var c2 = contagemRelatorio(m, x, "0000-00-00", "9999-99-99"); return { a: x, n: c2.entregas.length + c2.brands.length }; }).filter(function (x) { return x.n; });
      aviso = '<div class="alerta-box">' + icone("triangle-alert") + '<span class="t">Nenhuma entrega publicada nem vídeo veiculado ' + (a === "todas" ? "nesta marca" : "nesta autorização") + (S.relDe || S.relAte ? " dentro do período escolhido" : "") + ". O relatório sairia só com capa e agradecimento." + (outras.length ? " As entregas da " + esc(m.nome) + " estão em: " + outras.map(function (x) { return '<button type="button" class="chip" data-acao="rel-aut" data-id="' + attr(x.a.id) + '">' + esc(rotuloAut(x.a)) + " · " + x.n + " item" + (x.n > 1 ? "s" : "") + "</button>"; }).join(" ") : " Registre as entregas na ficha da marca (caixa do produto, botão Registrar) e os vídeos em Brand.") + "</span></div>";
    }
    var semCotas = a !== "todas" && !temCotas(a) ? '<div class="alerta-box info">' + icone("info") + '<span class="t">Esta autorização não tem cotas cadastradas, então a tela "Materiais acordados" não entra. Cadastre as cotas em Autorizações para o relatório mostrar contratado e entregue lado a lado.</span></div>' : "";
    previa = aviso + semCotas + '<div class="card"><div class="cab"><h2>O que vai no relatório</h2><span class="row">' + selo(cont.entregas.length + " entrega" + (cont.entregas.length === 1 ? "" : "s")) + selo(cont.brands.length + " brand") + selo(dados.slides.length + " telas") + '</span></div><div class="corpo"><ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.9">' + dados.slides.map(function (sl) { return "<li>" + esc(sl.descricao) + "</li>"; }).join("") + "</ol>" +
      '<div class="alerta-box info mt3">' + icone("info") + '<span class="t">O relatório abre em uma aba nova, em formato 16:9 igual ao do Canva. Para salvar em PDF: Arquivo, Imprimir, destino "Salvar como PDF", papel paisagem, sem margens. Prints de post entram pelo campo de imagem de cada entrega; vídeos de brand usam a thumb do YouTube.</span></div></div></div>';
  }
  var opcAut = m ? opcoesAuts(m.id).concat([["todas", "Toda a marca (todas as autorizações)"]]) : [];
  return '<div class="card"><div class="corpo"><div class="grid g3">' +
    campo("Marca", select("relMarca", opcoesMarcas("Escolha a marca"), S.relMarca, 'data-filtro="relMarca"')) +
    campo("Autorização", m ? select("relAut", opcAut, S.relAut, 'data-filtro="relAut"') : '<input class="input" disabled placeholder="Escolha a marca primeiro">', m && a && a !== "todas" ? "Sugerida: a que tem cotas e entregas" : "") +
    campo("Período (opcional)", '<div class="row" style="flex-wrap:nowrap">' + input("relDe", S.relDe, "month", 'data-filtro="relDe"') + '<span class="muted">a</span>' + input("relAte", S.relAte, "month", 'data-filtro="relAte"') + "</div>", "Em branco = tudo que está lançado na autorização") +
    '</div><div class="row mt4">' + botao("Gerar relatório", "prim", 'data-acao="gerar-relatorio"' + (m && a ? "" : " disabled"), "printer") + (S.relDe || S.relAte ? botao("Limpar período", "fantasma", 'data-acao="rel-limpar-periodo"') : "") + "</div></div></div>" + previa;
}
function coletorRelatorio(m, a) {
  var per = periodoRelatorio(a); var cont = contagemRelatorio(m, a, per.de, per.ate);
  cont.entregas.sort(function (x, y) { return x.data.localeCompare(y.data); });
  var autRef = a === "todas" ? (situacaoMarca(m).alvo || { id: "todas", rotulo: "Todas as autorizações", cotas: {} }) : a;
  var cons = a === "todas" ? consumoMarca(m) : consumo(a);
  return { marca: m, autorizacao: a === "todas" ? { id: "todas", rotulo: "Todas as autorizações", cotas: autRef.cotas || {}, inicio: null, fim: null } : a, consumo: cons, entregas: cont.entregas, brands: cont.brands, periodo: per, dataEmissao: hojeISO() };
}
/* soma das cotas e do consumo de todas as autorizações da marca (para o relatório "toda a marca") */
function consumoMarca(m) {
  var total = {}; ORDEM_PRODUTOS.forEach(function (p) { total[p] = { contratado: 0, entregue: 0, programado: 0, andamento: 0, saldo: 0, pct: 0 }; });
  autsDaMarca(m.id).forEach(function (a) { var c = consumo(a); ORDEM_PRODUTOS.forEach(function (p) { ["contratado", "entregue", "programado", "andamento"].forEach(function (k) { total[p][k] += c[p][k]; }); }); });
  ORDEM_PRODUTOS.forEach(function (p) { var x = total[p]; x.saldo = Math.max(0, x.contratado - x.entregue); x.pct = x.contratado ? Math.min(100, Math.round(x.entregue / x.contratado * 100)) : 0; });
  return total;
}

/* ============================================================ tela: ajustes */
function telaAjustes() {
  var fb = API && API.tipo === "firebase";
  return '<div class="grid g2">' +
    '<div class="card"><div class="cab"><h2>Onde os dados ficam</h2>' + selo(fb ? "Firebase ligado" : "Só neste navegador", fb ? "ok" : "alerta") + '</div><div class="corpo col">' +
      (fb ? "<p>Os dados são compartilhados pelo Firestore. Todo mundo que abrir a plataforma vê a mesma coisa.</p>" : '<p>Enquanto o projeto Firebase não existe, cada pessoa tem a própria cópia dos dados no navegador. Para passar os dados de um computador para outro, exporte aqui e importe no outro.</p><p class="small muted">Para ligar o Firebase: criar o projeto no console, ativar Firestore e a entrada anônima, colar a configuração em <code>firebase-config.js</code> e publicar. Os dados deste navegador podem ser enviados pelo botão de importar depois.</p>') +
      '<div class="row">' + botao("Exportar dados (JSON)", "", 'data-acao="exportar"', "download") + '<label class="btn">' + icone("upload") + 'Importar dados<input type="file" accept="application/json" class="sr-only" data-acao-arquivo="importar"></label>' + "</div>" +
      '<div class="row">' + (temExemplos() ? botao("Remover dados de exemplo", "", 'data-acao="exemplos-remover"', "trash") : botao("Carregar dados de exemplo", "", 'data-acao="exemplos-carregar"', "plus")) + '<span class="small muted">Cotas, entregas, fila e cobranças fictícias, marcadas como exemplo, para ver a plataforma cheia. Saem com um clique.</span></div>' +
      '<div class="row">' + botao("Recarregar dados das planilhas", "perigo", 'data-acao="recarregar-seed"', "database") + '<span class="small muted">Apaga o que foi editado e volta aos dados importados das planilhas em ' + esc((window.DADOS_INICIAIS || {}).geradoEm || "") + ".</span></div>" +
    "</div></div>" +
    '<div class="card"><div class="cab"><h2>Integrações</h2></div><div class="corpo col">' +
      '<div class="row between"><span class="row">' + icone("folder") + "<strong>Google Drive</strong></span>" + selo("Próxima etapa") + '</div><p class="small muted" style="margin:0">Pasta Duas Rodas / Comercial, uma por marca e mês. Um robô vai varrer de hora em hora e lançar os arquivos novos na fila de materiais. Precisa que a pasta exista e seja compartilhada com a conta de serviço.</p>' +
      '<div class="row between"><span class="row">' + icone("chart") + "<strong>Instagram e YouTube</strong></span>" + selo("Próxima etapa") + '</div><p class="small muted" style="margin:0">Puxar visualizações e interações pelo link do post ou vídeo, para o relatório sair sem digitar número.</p>' +
      '<div class="row between"><span class="row">' + icone("file-up") + "<strong>Leitura de PDF da autorização</strong></span>" + selo("Funciona para PDF com texto", "ok") + '</div><p class="small muted" style="margin:0">Ao subir o PDF na autorização, a plataforma tenta ler Gecom, vigência, valor e cotas. PDF escaneado (imagem) não tem texto para ler; nesse caso os campos ficam para preencher à mão.</p>' +
    "</div></div>" +
    '<div class="card"><div class="cab"><h2>Aparência</h2></div><div class="corpo row">' + botao("Estilo " + (temaAtual() === "escuro" ? "claro" : "escuro"), "", 'data-acao="tema"', temaAtual() === "escuro" ? "sun" : "moon") + "</div></div>" +
    '<div class="card"><div class="cab"><h2>Sobre</h2></div><div class="corpo small muted">Comercial Duas Rodas, versão ' + VERSAO + ". Dados nas planilhas de origem: Branded (Fê) e Status de edições (New), importadas em " + esc((window.DADOS_INICIAIS || {}).geradoEm || "") + ". Marcas: " + S.d.marcas.length + " · autorizações: " + S.d.autorizacoes.length + " · brands: " + S.d.brands.length + " · entregas: " + S.d.entregas.length + " · edição: " + S.d.edicao.length + ".</div></div>" +
    "</div>";
}

/* ============================================================ diálogos */
function dialogo() {
  var d = S.dialogo; var html = "";
  switch (d.tipo) {
    case "marca": html = formMarca(d); break;
    case "aut": html = formAut(d); break;
    case "brand": html = fichaBrand(d); break;
    case "entrega": html = formEntrega(d); break;
    case "fila": html = formFila(d); break;
    case "alocar": html = formAlocar(d); break;
    case "edicao": html = formEdicao(d); break;
    case "ajuda": html = window.Tutorial ? window.Tutorial.htmlAjuda(d.secao) : ""; break;
    case "kpi": html = dialogoKpi(d.filtro); break;
    case "texto": html = '<div class="dialogo">' + cabDialogo(d.titulo) + '<div class="corpo"><textarea class="textarea" style="min-height:200px" readonly>' + esc(d.texto) + '</textarea><div class="small muted">Selecione o texto e copie.</div></div><div class="pe">' + botao("Fechar", "", 'data-acao="fechar"') + "</div></div>"; break;
    case "cobranca-brand": { var bb = byId(S.d.brands, d.brandId) || {}; html = '<form class="dialogo" data-form="cobranca-brand">' + cabDialogo("Cobrar o cliente: " + nomeMarca(bb.marcaId), bb.titulo + " · " + ((byId(ETAPAS_BRAND, bb.etapa) || {}).nome || "") + ". Fica gravado na ficha do vídeo com a data de hoje.") + '<div class="corpo">' + campo("O que foi cobrado", textarea("texto", "", 'required autofocus placeholder="Ex.: e-mail para a Érica pedindo o tema do vídeo"')) + campo("Data", input("data", hojeISO(), "date", "required")) + "</div>" + peForm("Registrar cobrança") + "</form>"; break; }
    case "cobranca-marca": html = '<form class="dialogo" data-form="cobranca-marca">' + cabDialogo("Registrar cobrança: " + nomeMarca(d.marcaId), "Fica gravado com a data de hoje. Diga para quem, por qual canal e o que foi pedido.") + '<div class="corpo">' + campo("Produto", select("produto", [["", "Geral"]].concat(ORDEM_PRODUTOS.map(function (p) { return [p, PRODUTOS[p].nome]; })), d.produto)) + campo("O que foi cobrado", textarea("texto", "", 'required autofocus placeholder="Ex.: e-mail para o Marcos pedindo as artes dos 9 posts que faltam"')) + campo("Data", input("data", hojeISO(), "date", "required")) + "</div>" + peForm("Registrar") + "</form>"; break;
    case "confirmar": html = '<div class="dialogo"><div class="cab"><h2>' + esc(d.titulo) + '</h2></div><div class="corpo"><p style="margin:0">' + esc(d.texto) + '</p></div><div class="pe">' + botao("Cancelar", "", 'data-acao="fechar"') + botao(d.botao || "Confirmar", "perigo", 'data-acao="confirmar-ok"') + "</div></div>"; break;
  }
  return '<div class="fundo" data-acao="fechar-fundo">' + html + "</div>";
}
function cabDialogo(titulo, sub) { return '<div class="cab"><div><h2>' + esc(titulo) + "</h2>" + (sub ? '<div class="sub">' + esc(sub) + "</div>" : "") + "</div>" + botao("", "icone fantasma", 'data-acao="fechar" aria-label="Fechar"', "x") + "</div>"; }
function peForm(salvar, apagarAttr) { return '<div class="pe">' + (apagarAttr ? botao("Excluir", "fantasma perigo esq", apagarAttr, "trash") : "") + botao("Cancelar", "", 'data-acao="fechar"') + '<button type="submit" class="btn prim">' + esc(salvar || "Salvar") + "</button></div>"; }

var KPI_TITULOS = { vigentes: ["Marcas com contrato vigente", "Têm pelo menos uma autorização dentro da vigência hoje."], ok: ["Marcas em dia", "Entregas acompanhando o tempo do contrato, sem produto atrasado."], atrasada: ["Marcas atrasadas no pacote", "Algum produto está 25 pontos ou mais abaixo do tempo já passado do contrato. Hora de cobrar material."], vencida: ["Marcas vencidas com saldo", "A autorização passou do fim e ainda tem produto sem usar. Caso de renovar, não de carregar saldo."] };
function dialogoKpi(filtro) {
  var hoje = hojeISO(); var t = KPI_TITULOS[filtro] || ["Marcas", ""];
  var sits = S.d.marcas.map(situacaoMarca).filter(function (x) { return filtro === "vigentes" ? x.vigentes.length : x.id === filtro; }).sort(function (a, b) { return porNome(a.marca, b.marca); });
  var linhas = sits.map(function (x) {
    var a = x.alvo; var resumo = "";
    if (a && temCotas(a)) { var c = consumo(a); resumo = ORDEM_PRODUTOS.filter(function (p) { return c[p].contratado; }).map(function (p) { return PRODUTOS[p].curto + " " + fmtNum(c[p].entregue) + "/" + fmtNum(c[p].contratado) + (c[p].saldo ? "" : " ✓"); }).join(" · "); }
    else resumo = a ? "Sem cotas cadastradas" : "Sem autorização";
    var extra = []; if (x.producao.length) extra.push(x.producao.length + " brand em produção"); extra.push(x.ultimaCobranca ? "cobrada há " + diasEntre(x.ultimaCobranca, hoje) + " dias" : "sem cobrança registrada");
    return '<tr><td><strong>' + esc(x.marca.nome) + '</strong><div class="small muted">' + (a ? esc(rotuloAut(a)) + " · " + esc(situacaoAut(a).nome) : "") + "</div></td><td><div class=\"small\">" + esc(resumo) + '</div><div class="small muted">' + esc(extra.join(" · ")) + "</div></td><td class=\"right\">" + botao("Abrir marca", "p", 'data-acao="ir-marca" data-id="' + attr(x.marca.id) + '"', "arrow-right") + "</td></tr>";
  }).join("");
  return '<div class="dialogo largo">' + cabDialogo(t[0] + " (" + sits.length + ")", t[1]) + '<div class="corpo sem tabela-wrap" style="padding:0">' + (sits.length ? '<table class="tabela">' + linhas + "</table>" : '<div class="vazio" style="margin:16px">Nenhuma marca neste grupo.</div>') + '</div><div class="pe">' + botao("Fechar", "", 'data-acao="fechar"') + "</div></div>";
}
function formMarca(d) {
  var m = d.item || { nome: "", contato: "", obs: "", ativa: true };
  return '<form class="dialogo" data-form="marca">' + cabDialogo(m.id ? "Editar marca" : "Nova marca") + '<div class="corpo">' +
    campo("Nome", input("nome", m.nome, "text", "required autofocus")) + campo("Contato na marca", input("contato", m.contato), "Nome, e-mail ou telefone de quem aprova") +
    campo("Observações", textarea("obs", m.obs)) +
    '<label class="row"><input type="checkbox" name="ativa"' + (m.ativa !== false ? " checked" : "") + "> Marca ativa</label></div>" + peForm("Salvar", m.id ? 'data-acao="apagar-marca" data-id="' + attr(m.id) + '"' : "") + "</form>";
}
function formAut(d) {
  var a = d.item || { marcaId: d.marcaId || "", rotulo: "", gecom: "", inicio: "", fim: "", valor: "", pagamento: "", contato: "", cotas: {}, obs: "" };
  var c = a.cotas || {}; var seq = d.sequencia; var sugBrand = a.id && !c.brand ? brandsNaPlanilha(a) : 0;
  var titulo = seq ? "Cadastrar cotas · " + (seq.i + 1) + " de " + seq.ids.length : d.novoDeRenovacao ? "Renovar autorização" : a.id ? "Editar autorização" : "Nova autorização";
  var sub = seq ? nomeMarca(a.marcaId) + " · " + rotuloAut(a) + ". Preencha as cotas e as datas e clique em Salvar e próxima." : d.novoDeRenovacao ? "Cotas copiadas do contrato anterior e vigência avançada em um ano. Confira e ajuste." : "O que o comercial fechou com a marca e o que a revista deve entregar";
  return '<form class="dialogo" data-form="aut">' + cabDialogo(titulo, sub) + '<div class="corpo">' +
    (seq ? '<div class="barra"><i class="ok" style="width:' + Math.round(seq.i / seq.ids.length * 100) + '%"></i></div>' : "") +
    (sugBrand ? '<div class="alerta-box info">' + icone("info") + '<span class="t">A planilha tem ' + sugBrand + " vídeo" + (sugBrand > 1 ? "s" : "") + " de brand ligado" + (sugBrand > 1 ? "s" : "") + " a esta autorização. Deixei esse número sugerido na cota de Brand; confira com o contrato.</span></div>" : "") +
    (a.id ? "" : '<div class="drop" data-acao="escolher-pdf">' + icone("file-up", "") + " Subir o PDF da autorização para preencher sozinho (Gecom, vigência, valor e cotas). Depois é só conferir.<input type=\"file\" accept=\"application/pdf\" class=\"sr-only\" id=\"pdf-aut\" data-acao-arquivo=\"ler-pdf\"></div>" + (d.lendo ? '<div class="small muted">Lendo o PDF...</div>' : "") + (d.avisoPdf ? '<div class="alerta-box ' + (d.avisoPdfTipo || "alerta") + '">' + icone("info") + '<span class="t">' + esc(d.avisoPdf) + "</span></div>" : "")) +
    '<div class="grid g2">' + campo("Marca", select("marcaId", opcoesMarcas("Escolha"), a.marcaId, "required")) + campo("Nome da autorização", input("rotulo", a.rotulo, "text", 'placeholder="Ex.: Gecom 104-25 (2025/2026)"'), "Como vocês chamam esse contrato") + "</div>" +
    '<div class="grid g3">' + campo("Gecom", input("gecom", a.gecom)) + campo("Início da vigência", input("inicio", a.inicio, "date")) + campo("Fim da vigência", input("fim", a.fim, "date")) + "</div>" +
    '<div class="grid g2">' + campo("Valor total líquido (R$)", input("valor", a.valor, "number", 'step="0.01" min="0"')) + campo("Forma de pagamento", input("pagamento", a.pagamento, "text", 'placeholder="12 x R$ 5.000,00"')) + "</div>" +
    campo("Contato na marca", input("contato", a.contato)) +
    '<h3 style="font-size:13px">Cotas contratadas</h3><div class="grid g5">' + ORDEM_PRODUTOS.map(function (p) { return campo(PRODUTOS[p].curto, input("cota_" + p, c[p] || (p === "brand" && sugBrand ? sugBrand : ""), "number", 'min="0" step="1"'), PRODUTOS[p].unidade); }).join("") + "</div>" +
    campo("Observações", textarea("obs", a.obs), "Ex.: posts são 12 em cada rede; banner de 540 mil pageviews") +
    (a.pdfNome ? '<div class="small muted">PDF: ' + esc(a.pdfNome) + "</div>" : "") + '<input type="hidden" name="pdfNome" value="' + attr(a.pdfNome || "") + '">' +
    '<input type="hidden" name="renovaDe" value="' + attr(a.renovaDe || "") + '">' +
    "</div>" + (seq ? '<div class="pe">' + botao("Sair da sequência", "fantasma esq", 'data-acao="fechar"') + botao("Pular", "", 'data-acao="seq-pular"') + '<button type="submit" class="btn prim">Salvar e próxima</button></div>' : peForm(d.novoDeRenovacao ? "Criar renovação" : "Salvar autorização", a.id && !seq ? 'data-acao="apagar-aut" data-id="' + attr(a.id) + '"' : "")) + "</form>";
}
function fichaBrand(d) {
  var b = d.item;
  var novo = !b.id;
  var etapaAtual = indiceEtapa(b.etapa);
  var passos = ETAPAS_BRAND.map(function (e, i) {
    var feito = i < etapaAtual, atual = i === etapaAtual; var datas = (b.historico || []).filter(function (h) { return h.etapa === e.id; }).map(function (h) { return fmtDataCurta(h.data); });
    return '<div class="passo' + (feito || b.etapa === "veiculado" && i === etapaAtual ? " feito" : "") + (atual && b.etapa !== "veiculado" ? " atual" : "") + '"><div class="n">' + esc(e.nome) + '</div><div class="d">' + (e.quem ? esc(e.quem) : "") + (datas.length ? (e.quem ? " · " : "") + datas.join(", ") : "") + "</div></div>";
  }).join("");
  var hist = (b.historico || []).slice().concat((b.cobrancas || []).map(function (c) { return { data: c.data, texto: "Cobrança ao cliente: " + c.texto, cobranca: true }; })).sort(function (x, y) { return String(y.data).localeCompare(String(x.data)); });
  var links = b.links || {};
  var proxima = ETAPAS_BRAND[etapaAtual + 1];
  return '<form class="dialogo largo" data-form="brand">' + cabDialogo(novo ? "Novo brand" : nomeMarca(b.marcaId) + " · " + b.titulo, novo ? "Um vídeo de brand contratado. A linha do tempo registra cada etapa com data." : (byId(ETAPAS_BRAND, b.etapa) || {}).nome + (diasParado(b) ? " · parado há " + diasParado(b) + " dias" : "")) +
    '<div class="corpo"><div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px"><div class="col" style="gap:12px">' +
      '<div class="grid g2">' + campo("Marca", select("marcaId", opcoesMarcas("Escolha"), b.marcaId, 'required data-filtro="brandFormMarca"')) + campo("Autorização", select("autorizacaoId", opcoesAuts(b.marcaId, "Sem autorização"), b.autorizacaoId)) + "</div>" +
      campo("Moto ou produto (tema do vídeo)", input("titulo", b.titulo, "text", "required")) +
      '<div class="grid g2">' + campo("Apresentador", input("apresentador", b.apresentador, "text", 'placeholder="Francis (padrão)"')) + campo("Local da gravação", input("local", b.local)) + "</div>" +
      '<div class="grid g2">' + campo("Etapa atual", select("etapa", ETAPAS_BRAND.map(function (e) { return [e.id, e.nome]; }), b.etapa || "definir_tema")) + campo("Logística do produto", select("logistica", Object.keys(LOGISTICA).map(function (k) { return [k, LOGISTICA[k]]; }), b.logistica || "nao_precisa")) + "</div>" +
      '<div class="grid g2">' + campo("Data da gravação", input("dataGravacao", b.dataGravacao, "date")) + campo("Data de veiculação", input("dataVeiculacao", b.dataVeiculacao, "date")) + "</div>" +
      '<div class="grid g2">' + campo("Refações (idas e vindas)", '<div class="contador"><button type="button" data-acao="ref-menos">−</button><span id="ref-n">' + (b.refacoes || 0) + '</span><button type="button" data-acao="ref-mais">+</button></div><input type="hidden" name="refacoes" id="f-refacoes" value="' + (b.refacoes || 0) + '">') + campo("Custo extra (R$)", input("custo", b.custo, "number", 'step="0.01" min="0"'), "Retirada, locação, convidado") + "</div>" +
      '<h3 style="font-size:13px">Links</h3><div class="grid g2">' + campo("Drive (material bruto)", input("link_drive", links.drive, "url")) + campo("YouTube não listado (aprovação)", input("link_naoListado", links.naoListado, "url")) + campo("Vídeo final (YouTube)", input("link_youtube", links.youtube, "url")) + campo("Reels", input("link_reels", links.reels, "url")) + campo("Vídeo em alta (Drive)", input("link_final", links.final, "url")) + campo("Thumb", input("link_thumb", links.thumb, "url")) + "</div>" +
      campo("Observações", textarea("obs", b.obs), "Motivos de remarcação, o que foi o ajuste, quem está com a bola") +
    "</div><div class=\"col\" style=\"gap:14px\">" +
      '<div><h3 style="font-size:13px" class="mb2">Linha do tempo</h3><div class="linha-tempo">' + passos + "</div></div>" +
      (novo ? "" : '<div class="card"><div class="corpo col">' +
        '<div class="row">' + (proxima && b.etapa !== "veiculado" ? botao("Avançar para: " + proxima.nome, "p prim", 'data-acao="brand-avancar"', "arrow-right") : "") + "</div>" +
        '<div class="row"><input class="input p" id="nota-texto" placeholder="Anotar algo nesta etapa (ex.: cliente pediu trocar a moto)" style="flex:1;min-width:160px">' + botao("Anotar", "p", 'data-acao="brand-anotar"') + "</div>" +
        '<div class="row"><input class="input p" id="cobranca-texto" placeholder="Cobrança feita ao cliente (ex.: e-mail para a Érica pedindo o tema)" style="flex:1;min-width:160px">' + botao("Registrar cobrança", "p", 'data-acao="brand-cobrar"', "bell") + "</div>" +
        '<span class="small muted">Cada registro grava a data de hoje. Isso é a prova de que a revista cobrou e estava com o pé na entrega.</span></div></div>' +
        '<div><h3 style="font-size:13px" class="mb2">Histórico (' + hist.length + ')</h3>' + (hist.length ? '<div class="historico">' + hist.map(function (h) { return '<div class="hist-item' + (h.cobranca ? " cobranca" : "") + '"><span class="d">' + fmtData(h.data) + "</span><span>" + esc(h.texto) + "</span></div>"; }).join("") + "</div>" : '<div class="small muted">Nenhum registro ainda.</div>') + "</div>" +
        (b.origem ? '<div class="small muted">Importado de: ' + esc(b.origem) + (b.roteiro || b.gravacao || b.edicao ? ". Texto da planilha: " + esc([b.roteiro && "roteiro: " + b.roteiro, b.gravacao && "gravação: " + b.gravacao, b.edicao && "edição: " + b.edicao, b.veiculado && "veiculado: " + b.veiculado].filter(Boolean).join(" · ")) : "") + "</div>" : "")) +
    "</div></div></div>" + peForm("Salvar", novo ? "" : 'data-acao="apagar-brand" data-id="' + attr(b.id) + '"') + "</form>";
}
function formEntrega(d) {
  var e = d.item || { marcaId: d.marcaId || "", autorizacaoId: d.autId || "", produto: d.produto || "post", data: hojeISO(), titulo: "", link: "", rede: "instagram_facebook", status: "publicado", metricas: {}, imagem: "" };
  var m = e.metricas || {};
  var auts = opcoesAuts(e.marcaId, "Sem autorização (não conta na cota)");
  var metricas = "";
  if (e.produto === "post") metricas = '<div class="grid g3">' + campo("Visualizações", input("m_visualizacoes", m.visualizacoes, "number")) + campo("Alcance (contas)", input("m_alcance", m.alcance, "number")) + campo("Curtidas", input("m_curtidas", m.curtidas, "number")) + campo("Comentários", input("m_comentarios", m.comentarios, "number")) + campo("Compartilhamentos", input("m_compartilhamentos", m.compartilhamentos, "number")) + campo("Salvamentos", input("m_salvamentos", m.salvamentos, "number")) + "</div>";
  else if (e.produto === "email") metricas = '<div class="grid g3">' + campo("Base disparada", input("m_base", m.base, "number")) + campo("Aberturas", input("m_aberturas", m.aberturas, "number")) + campo("Cliques", input("m_cliques", m.cliques, "number")) + "</div>";
  else if (e.produto === "banner") metricas = '<div class="grid g2">' + campo("Impressões no mês", input("m_impressoes", m.impressoes, "number", "required"), "Soma na cota de impressões") + campo("Mês de referência", input("mes", e.mes || mesChave(e.data), "month")) + "</div>";
  else if (e.produto === "revista") metricas = '<div class="grid g3">' + campo("Edição / mês", input("mes", e.mes || mesChave(e.data), "month")) + campo("Quantidade de páginas", input("quantidade", e.quantidade || 1, "number", 'min="1"'), "Soma na cota") + campo("Formato", select("formato", [["simples", "Simples"], ["dupla", "Dupla"], ["capa", "Capa / contracapa"]], e.formato || "simples")) + "</div>";
  else if (e.produto === "brand") metricas = '<div class="alerta-box info">' + icone("info") + '<span class="t">Vídeos de brand contam pela linha do tempo (etapa Veiculado), não por aqui. Use esta entrega só para registrar o resultado do vídeo no relatório.</span></div><div class="grid g2">' + campo("Visualizações", input("m_visualizacoes", m.visualizacoes, "number")) + campo("Curtidas", input("m_curtidas", m.curtidas, "number")) + "</div>";
  return '<form class="dialogo" data-form="entrega">' + cabDialogo(e.id ? "Editar entrega" : "Registrar entrega", "O que saiu (ou vai sair) para a marca. Publicado conta na cota; programado aparece no calendário.") + '<div class="corpo">' +
    '<div class="grid g2">' + campo("Marca", select("marcaId", opcoesMarcas("Escolha"), e.marcaId, 'required data-filtro="entregaFormMarca"')) + campo("Autorização", select("autorizacaoId", auts, e.autorizacaoId)) + "</div>" +
    '<div class="grid g3">' + campo("Produto", select("produto", ORDEM_PRODUTOS.map(function (p) { return [p, PRODUTOS[p].nome]; }), e.produto, 'data-filtro="entregaFormProduto"')) + campo("Data", input("data", e.data, "date", "required")) + campo("Situação", select("status", [["publicado", "Publicado"], ["agendado", "Programado"]], e.status)) + "</div>" +
    campo("Título ou descrição", input("titulo", e.titulo, "text", 'placeholder="Ex.: AGV e Dainese com nova distribuição no Brasil"')) +
    (e.produto === "post" ? campo("Rede", select("rede", Object.keys(REDES).map(function (k) { return [k, REDES[k]]; }), e.rede)) : "") +
    campo("Link", input("link", e.link, "url")) + metricas +
    campo("Print para o relatório", '<div class="colar-print' + (e.imagem ? " com-imagem" : "") + '">' + (e.imagem ? '<img src="' + attr(e.imagem) + '" alt="">' : '<span class="muted">' + icone("upload", "ic") + ' Tire o print e cole aqui com <b>Cmd + V</b> (ou arraste a imagem)</span>') + '<div class="row"><label class="btn p">' + icone("upload") + (e.imagem ? "Trocar" : "Escolher arquivo") + '<input type="file" accept="image/*" class="sr-only" data-acao-arquivo="imagem-entrega"></label>' + (e.imagem ? botao("Tirar", "p fantasma", 'data-acao="tirar-imagem"') : "") + '</div></div><input type="hidden" name="imagem" value="' + attr(e.imagem || "") + '">', "Print do post, dos Insights ou da página. Fica guardado com a entrega e entra na tela do relatório.") +
    campo("Observações", textarea("obs", e.obs)) +
    "</div>" + peForm("Salvar entrega", e.id ? 'data-acao="apagar-entrega" data-id="' + attr(e.id) + '"' : "") + "</form>";
}
function formFila(d) {
  var f = d.item || { marcaId: "", produto: "post", descricao: "", linkMaterial: "", linkDestino: "", dataPedida: "", urgencia: "normal", por: "", obs: "", status: "aguardando" };
  return '<form class="dialogo" data-form="fila">' + cabDialogo(f.id ? "Editar item da fila" : "Entrou material", "O atendimento registra o que a marca mandou. Conteúdo dá a data depois.") + '<div class="corpo">' +
    '<div class="grid g2">' + campo("Marca", select("marcaId", opcoesMarcas("Escolha"), f.marcaId, "required")) + campo("Produto", select("produto", ORDEM_PRODUTOS.map(function (p) { return [p, PRODUTOS[p].nome]; }), f.produto)) + "</div>" +
    campo("O que é", input("descricao", f.descricao, "text", 'required placeholder="Ex.: carrossel capacete AGV, 5 cards + legenda"')) +
    '<div class="grid g2">' + campo("Link do material (Drive, WeTransfer)", input("linkMaterial", f.linkMaterial, "url")) + campo("Link parametrizado (destino)", input("linkDestino", f.linkDestino, "url")) + "</div>" +
    '<div class="grid g3">' + campo("Cliente pediu data?", input("dataPedida", f.dataPedida, "date")) + campo("Urgência", select("urgencia", Object.keys(URGENCIAS).map(function (k) { return [k, URGENCIAS[k]]; }), f.urgencia)) + campo("Quem registrou", input("por", f.por, "text", 'placeholder="Mariana"')) + "</div>" +
    campo("Observações", textarea("obs", f.obs)) + "</div>" + peForm(f.id ? "Salvar" : "Colocar na fila", f.id ? 'data-acao="apagar-fila" data-id="' + attr(f.id) + '"' : "") + "</form>";
}
function formAlocar(d) {
  var f = d.item;
  return '<form class="dialogo" data-form="alocar">' + cabDialogo("Dar data: " + nomeMarca(f.marcaId), f.descricao) + '<div class="corpo">' +
    '<div class="grid g2">' + campo("Data de publicação", input("data", f.dataPedida || "", "date", "required")) + campo("Autorização (para contar na cota)", select("autorizacaoId", opcoesAuts(f.marcaId, "Sem autorização"), (autsDaMarca(f.marcaId).filter(function (a) { return autVigente(a); })[0] || {}).id || "")) + "</div>" +
    (f.produto === "post" ? campo("Rede", select("rede", Object.keys(REDES).map(function (k) { return [k, REDES[k]]; }), "instagram_facebook")) : "") +
    '<div class="small muted">Cria uma entrega programada no calendário. Quando sair, abra a entrega e marque como publicada, com o link e os números.</div></div>' + peForm("Programar") + "</form>";
}
function formEdicao(d) {
  var e = d.item || { marcaId: "", material: "", status: "Fila", tipo: "Branded", inicio: "", finalizado: "", revisoes: [], ajustes: [], reels: "", linkExibicao: "", linkMaterial: "", obs: "" };
  return '<form class="dialogo" data-form="edicao">' + cabDialogo(e.id ? "Editar material" : "Novo material na edição", "Fila de edição e YouTube. Cada revisão e ajuste é uma data; quantas datas, quantas idas e vindas.") + '<div class="corpo">' +
    '<div class="grid g2">' + campo("Marca", select("marcaId", opcoesMarcas("Editorial / sem marca"), e.marcaId)) + campo("Material", input("material", e.material, "text", "required")) + "</div>" +
    '<div class="grid g2">' + campo("Status", select("status", STATUS_EDICAO.map(function (s) { return [s, s]; }), e.status)) + campo("Tipo", select("tipo", [["Branded", "Branded"], ["Editorial", "Editorial"]], e.tipo)) + "</div>" +
    '<div class="grid g3">' + campo("Início", input("inicio", e.inicio, "date")) + campo("Finalizado", input("finalizado", e.finalizado, "date")) + campo("Reels", input("reels", e.reels, "date")) + "</div>" +
    '<div class="grid g2">' + campo("Revisões (datas)", input("revisoes", (e.revisoes || []).join(", ")), "Separe por vírgula. Ex.: 2026-09-24, 2026-10-01") + campo("Ajustes (datas)", input("ajustes", (e.ajustes || []).join(", ")), "Cada data é uma rodada de ajuste") + "</div>" +
    '<div class="grid g2">' + campo("Link de exibição (não listado)", input("linkExibicao", e.linkExibicao, "url")) + campo("Link do material (Drive)", input("linkMaterial", e.linkMaterial, "url")) + "</div>" +
    campo("Observações", textarea("obs", e.obs)) + "</div>" + peForm("Salvar", e.id ? 'data-acao="apagar-edicao" data-id="' + attr(e.id) + '"' : "") + "</form>";
}

/* ============================================================ leitura de PDF */
function lerPdfAutorizacao(arquivo) {
  function carregarPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function (ok, erro) {
      var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; ok(window.pdfjsLib); };
      s.onerror = function () { erro(new Error("Não consegui carregar o leitor de PDF.")); }; document.head.appendChild(s);
    });
  }
  return carregarPdfJs().then(function (pdfjs) { return arquivo.arrayBuffer(); }).then(function (buf) { return window.pdfjsLib.getDocument({ data: buf }).promise; }).then(function (pdf) {
    var ps = []; for (var i = 1; i <= Math.min(pdf.numPages, 4); i++) ps.push(pdf.getPage(i).then(function (p) { return p.getTextContent(); }).then(function (tc) { return tc.items.map(function (it) { return it.str; }).join(" "); }));
    return Promise.all(ps);
  }).then(function (paginas) { return interpretarAutorizacao(paginas.join("\n")); });
}
var MESES_ABREV = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
function interpretarAutorizacao(texto) {
  var t = texto.replace(/\s+/g, " "); var r = { cotas: {}, textoLido: t.length };
  if (t.replace(/\s/g, "").length < 40) return r;
  var m;
  if ((m = /Gecom\s*([\d]+[-\/]\d+)/i.exec(t))) r.gecom = m[1];
  if ((m = /\b(\d{1,2})\s+Produ[cç][õo]es?\s+de\s+v[ií]deo/i.exec(t))) r.cotas.brand = +m[1];
  if ((m = /(\d{1,3}(?:\.\d{3})+|\d{4,})\s*Impress[õo]es/i.exec(t))) r.cotas.banner = +m[1].replace(/\./g, "");
  if ((m = /\b(\d{1,3})\s+Posts?\b/i.exec(t))) r.cotas.post = +m[1];
  if ((m = /\b(\d{1,3})\s+Disparos?/i.exec(t))) r.cotas.email = +m[1];
  if ((m = /\b(\d{1,3})\s+P[áa]ginas?\s+de\s+Publicidade/i.exec(t))) r.cotas.revista = +m[1];
  if ((m = /VALOR TOTAL[^R]*R\$\s*([\d.]+,\d{2})/i.exec(t))) r.valor = num(m[1]);
  if ((m = /PAGAMENTO\s+(.{10,120}?)(?:Atenciosamente|Raz[ãa]o Social|$)/i.exec(t))) r.pagamento = m[1].trim();
  if ((m = /per[ií]odo entre\s+([a-zç]+)\s*\/?\s*(\d{2,4})\s+e\s+([a-zç]+)\s*\/?\s*(\d{2,4})/i.exec(t))) {
    var m1 = MESES_ABREV[m[1].slice(0, 3).toLowerCase()], m2 = MESES_ABREV[m[3].slice(0, 3).toLowerCase()];
    var a1 = +m[2] < 100 ? 2000 + +m[2] : +m[2], a2 = +m[4] < 100 ? 2000 + +m[4] : +m[4];
    if (m1 != null && m2 != null) { r.inicio = a1 + "-" + p2(m1 + 1) + "-01"; var ult = new Date(a2, m2 + 1, 0).getDate(); r.fim = a2 + "-" + p2(m2 + 1) + "-" + p2(ult); }
  }
  if ((m = /\bÀ\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\/&.-]{2,40}?)\s+At\.?/i.exec(t))) r.marcaNome = m[1].trim();
  if ((m = /At\.?\s*(?:Sr[a]?\.?|Srta\.?)?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wáéíóúâêôãõç]+){0,3})/.exec(t))) r.contato = m[1].trim();
  if ((m = /Rio de Janeiro,\s*(\d{1,2}) de ([a-zç]+) de (\d{4})/i.exec(t))) { var mm = MESES_ABREV[m[2].slice(0, 3).toLowerCase()]; if (mm != null) r.dataEmissao = m[3] + "-" + p2(mm + 1) + "-" + p2(+m[1]); }
  return r;
}


/* ============================================================ dados de exemplo (removíveis) */
function temExemplos() { return COLECOES.some(function (c) { return S.d[c].some(function (x) { return x.exemplo || x.exemploCotas; }); }); }
function gerarExemplos() {
  var hoje = hojeISO(); var d = function (n) { return somaDias(hoje, n); }; var seg = inicioSemana(hoje); var ds = function (n) { return somaDias(seg, n); };
  var ops = []; // {col, item}
  function autDe(marcaId, pref) { var l = autsDaMarca(marcaId); return l.filter(function (a) { return a.id === pref; })[0] || l.filter(function (a) { return autVigente(a); })[0] || l[0]; }
  function cotas(marcaId, pref, c, extra) { var a = autDe(marcaId, pref); if (!a) return null; a = clone(a); if (!a.exemploCotas) { a.cotasAntes = a.cotas || {}; a.exemploCotas = true; } a.cotas = c; if (extra) Object.keys(extra).forEach(function (k) { if (a[k + "Antes"] === undefined) a[k + "Antes"] = a[k] === undefined ? null : a[k]; a[k] = extra[k]; }); ops.push({ col: "autorizacoes", item: a }); return a; }
  function ent(n, marcaId, a, produto, data, titulo, mais) { var e = { id: "ex-ent-" + n, exemplo: true, marcaId: marcaId, autorizacaoId: a ? a.id : null, produto: produto, data: data, status: "publicado", titulo: titulo, link: "", rede: produto === "post" ? "instagram_facebook" : null, mes: mesChave(data), quantidade: produto === "revista" ? 1 : null, metricas: {}, obs: "Exemplo" }; if (mais) Object.keys(mais).forEach(function (k) { e[k] = mais[k]; }); ops.push({ col: "entregas", item: e }); return e; }
  function brand(n, marcaId, a, titulo, etapa, mais) { var b = { id: "ex-brand-" + n, exemplo: true, marcaId: marcaId, autorizacaoId: a ? a.id : null, produto: "brand", titulo: titulo, apresentador: "Francis", etapa: etapa, logistica: "nao_precisa", links: {}, historico: [{ data: hoje, etapa: etapa, texto: "Exemplo" }], cobrancas: [], refacoes: 0, atualizadoEm: hoje, obs: "Exemplo" }; if (mais) Object.keys(mais).forEach(function (k) { b[k] = mais[k]; }); ops.push({ col: "brands", item: b }); return b; }
  function fila(n, marcaId, produto, desc, criado, mais) { var f = { id: "ex-fila-" + n, exemplo: true, marcaId: marcaId, produto: produto, descricao: desc, linkMaterial: "https://drive.google.com/", linkDestino: "", dataPedida: null, urgencia: "normal", por: "Mariana", obs: "Exemplo", status: "aguardando", criadoEm: criado }; if (mais) Object.keys(mais).forEach(function (k) { f[k] = mais[k]; }); ops.push({ col: "fila", item: f }); }
  var n = 0, i;
  // Honda: atrasada em posts, em dia na revista, cobrada há 41 dias
  var honda = cotas("honda", "honda-2026", { post: 12, brand: 3, revista: 12, email: 6 });
  if (honda) { for (i = 0; i < 3; i++) ent(++n, "honda", honda, "post", d(-200 + i * 45), ["Hornet 750 chega às lojas", "CB 300F Twister", "Elite 125 novo visual"][i], { metricas: { visualizacoes: 8200 + i * 900, alcance: 6100 + i * 500, curtidas: 150 + i * 20 } });
    for (i = 0; i < 10; i++) ent(++n, "honda", honda, "revista", d(-280 + i * 30), "Honda", { formato: i % 2 ? "dupla" : "simples" });
    for (i = 0; i < 2; i++) ent(++n, "honda", honda, "email", d(-150 + i * 60), "Lançamento Hornet 750", { metricas: { base: 48000, aberturas: 9800, cliques: 760 } });
    ent(++n, "honda", honda, "email", ds(1), "Hornet 750: condições de outubro", { status: "agendado", metricas: { base: 48000 } });
    brand(++n, "honda", honda, "Hornet 750 em teste", "aprovacao_cliente", { atualizadoEm: d(-41), cobrancas: [{ data: d(-41), texto: "E-mail para a Honda pedindo aprovação do vídeo" }], historico: [{ data: d(-60), etapa: "edicao", texto: "Edição concluída" }, { data: d(-41), etapa: "aprovacao_cliente", texto: "Avançou para Aprovação do cliente" }] }); }
  // Yamaha: em dia
  var yam = cotas("yamaha", "yamaha-2026", { post: 12, brand: 4, email: 6 });
  if (yam) { for (i = 0; i < 10; i++) ent(++n, "yamaha", yam, "post", d(-270 + i * 27), ["MT-07", "NMAX", "Aerox", "Lander", "Fluo", "R3", "Crosser", "Fazer 250", "XTZ 150", "Tenere 700"][i], { metricas: { visualizacoes: 9000 + i * 300, alcance: 7000 + i * 200, curtidas: 180 + i * 10 } });
    for (i = 0; i < 5; i++) ent(++n, "yamaha", yam, "email", d(-240 + i * 50), "Yamaha novidades", { metricas: { base: 48000, aberturas: 10200, cliques: 810 } });
    ent(++n, "yamaha", yam, "post", ds(0), "R7 2027: primeiras imagens", { status: "agendado" });
    brand(++n, "yamaha", yam, "Tracer 07", "agendar_gravacao", { dataGravacao: ds(3), logistica: "marca_envia" });
    for (i = 0; i < 3; i++) brand(++n, "yamaha", yam, ["MT-07", "NMAX", "Aerox"][i], "veiculado", { dataVeiculacao: d(-240 + i * 70), links: { youtube: "https://youtu.be/" } }); }
  // Kawasaki: 2 de 27 posts, sem cobrança, vence em 50 dias
  var kaw = cotas("kawasaki", "kawasaki-ate-maio-2026", { post: 27, brand: 3 }, { inicio: d(-315), fim: d(50) });
  if (kaw) { ent(++n, "kawasaki", kaw, "post", d(-120), "Z900RS 2026", { metricas: { visualizacoes: 7700, alcance: 5900, curtidas: 160 } }); ent(++n, "kawasaki", kaw, "post", d(-60), "KLX 230", { metricas: { visualizacoes: 6100, alcance: 4800, curtidas: 120 } });
    brand(++n, "kawasaki", kaw, "Z900RS 2026", "aprovacao_cliente", { atualizadoEm: d(-18), historico: [{ data: d(-18), etapa: "aprovacao_cliente", texto: "Vídeo não listado enviado para a Kawasaki" }] }); }
  // Castrol: em dia, muitos vídeos
  var cas = cotas("castrol", "castrol-2025-2026", { brand: 15, revista: 12 });
  if (cas) { for (i = 0; i < 9; i++) ent(++n, "castrol", cas, "revista", d(-270 + i * 30), "Castrol", { formato: "simples" });
    brand(++n, "castrol", cas, "Educação Castrol EP 15", "data_veiculacao", { dataVeiculacao: ds(2), links: { naoListado: "https://youtu.be/" } });
    for (i = 0; i < 9; i++) brand(++n, "castrol", cas, "Educação Castrol EP " + (i + 1), "veiculado", { dataVeiculacao: d(-300 + i * 30), links: { youtube: "https://youtu.be/" } }); }
  // Pirelli: vencida com saldo, 3 cobranças, 61 dias parada
  var pir = cotas("pirelli", "pirelli-2024", { brand: 5 }, { inicio: d(-420), fim: d(-55) });
  if (pir) { brand(++n, "pirelli", pir, "Linha Scorpion", "veiculado", { dataVeiculacao: d(-200), links: { youtube: "https://youtu.be/" } });
    brand(++n, "pirelli", pir, "Tema a definir (4 vídeos)", "definir_tema", { apresentador: "Durval", atualizadoEm: d(-61), cobrancas: [{ data: d(-61), texto: "E-mail pedindo os temas dos 4 vídeos" }, { data: d(-45), texto: "Segunda cobrança por e-mail e WhatsApp" }, { data: d(-30), texto: "Marconi cobrou na reunião" }] }); }
  // Michelin: aguardando pneus
  var mic = cotas("michelin-e-levorin", "michelin-e-levorin-2025", { brand: 5 }, { inicio: d(-180), fim: d(185) });
  if (mic) { brand(++n, "michelin-e-levorin", mic, "Power 2CT", "veiculado", { dataVeiculacao: d(-90), links: { youtube: "https://youtu.be/" } }); brand(++n, "michelin-e-levorin", mic, "Street Radial", "veiculado", { dataVeiculacao: d(-40), links: { youtube: "https://youtu.be/" } });
    brand(++n, "michelin-e-levorin", mic, "Sirac x Duna II x Dual Sport", "agendar_gravacao", { apresentador: "Leandro Mello", logistica: "marca_envia", atualizadoEm: d(-23), obs: "Aguardando a Michelin enviar os pneus" });
    ent(++n, "michelin-e-levorin", mic, "post", ds(2), "Anakee Adventure II", { status: "agendado" }); }
  // Láquila: um post nesta semana e a cobrança
  var laq = autDe("laquila-texx", "laquila-texx-gecom-104-25");
  if (laq) { ent(++n, "laquila-texx", laq, "post", ds(4), "AGV Pista GP RR", { status: "agendado" }); for (i = 0; i < 4; i++) ent(++n, "laquila-texx", laq, "post", d(-190 + i * 45), ["Texx Falcon V2", "Overland by Texx", "Conjunto Armor 2", "AGV e Dainese no Brasil"][i], { metricas: { visualizacoes: [5512, 12195, 9758, 9758][i], alcance: [4173, 5615, 7106, 7106][i], curtidas: [56, 108, 174, 174][i] } }); for (i = 0; i < 19; i++) ent(++n, "laquila-texx", laq, "revista", d(-220 + i * 11), "Láquila", { formato: i % 3 ? "simples" : "dupla" });
    brand(++n, "laquila-texx", laq, "Texx Lavagem de equipamentos", "veiculado", { dataVeiculacao: d(-185), links: { youtube: "https://youtu.be/h5dDTB2xaX0" } }); }
  // Suzuki e Harley: saídas e gravação na semana
  var suz = autDe("suzuki"); if (suz) brand(++n, "suzuki", suz, "GSX 8S 2026", "data_veiculacao", { dataVeiculacao: ds(6) });
  var har = autDe("harley-davidson"); if (har) brand(++n, "harley-davidson", har, "Road Glide", "agendar_gravacao", { dataGravacao: ds(0), apresentador: "Leandro Mello", local: "Serra da Cantareira" });
  // Haojue: contrato vencendo em 40 dias com saldo (radar)
  var hao = cotas("haojue", null, { post: 6, brand: 1 }, { inicio: d(-325), fim: d(40) });
  if (hao) { ent(++n, "haojue", hao, "post", d(-200), "Burgman 125", {}); ent(++n, "haojue", hao, "post", d(-100), "NK 160", {}); }
  // fila
  fila(++n, "honda", "post", "Carrossel PCX 160, 5 cards + legenda", d(-6), { dataPedida: ds(4), urgencia: "data_pedida" });
  fila(++n, "bmw", "email", "E-mail C400 X promoção de outubro", d(-2));
  fila(++n, "riffel", "post", "Post relação Carbon, arte pronta", hoje, { por: "Maíra" });
  return ops;
}
function carregarExemplos() {
  var ops = gerarExemplos(); var ps = ops.map(function (o) { return API.salvar(o.col, o.item); });
  return Promise.all(ps).then(function () { S.d = API.exportar(); toast(ops.length + " registros de exemplo carregados."); S.dialogo = null; render(); });
}
function removerExemplos() {
  var ps = [];
  COLECOES.forEach(function (c) { S.d[c].forEach(function (x) {
    if (x.exemplo) ps.push(API.apagar(c, x.id));
    else if (x.exemploCotas) { var a = clone(x); a.cotas = a.cotasAntes || {}; delete a.cotasAntes; delete a.exemploCotas; ["inicio", "fim"].forEach(function (k) { if (a[k + "Antes"] !== undefined) { a[k] = a[k + "Antes"]; delete a[k + "Antes"]; } }); ps.push(API.salvar(c, a)); }
  }); });
  return Promise.all(ps).then(function () { S.d = API.exportar(); toast("Exemplos removidos."); S.dialogo = null; render(); });
}

/* ============================================================ ações */
function fechar() { S.dialogo = null; render(); }
function abrirMarcaForm(m) { S.dialogo = { tipo: "marca", item: m ? clone(m) : null }; render(); }
function abrirAutForm(a, marcaId) { S.dialogo = { tipo: "aut", item: a ? clone(a) : null, marcaId: marcaId || "" }; render(); }
function abrirBrand(b, marcaId) { S.dialogo = { tipo: "brand", item: b ? clone(b) : { marcaId: marcaId || "", autorizacaoId: "", titulo: "", apresentador: "", local: "", etapa: "definir_tema", logistica: "nao_precisa", links: {}, historico: [], cobrancas: [], refacoes: 0, obs: "" } }; render(); }
function abrirEntrega(e, marcaId, produto, autId) { S.dialogo = { tipo: "entrega", item: e ? clone(e) : null, marcaId: marcaId || "", produto: produto || "post", autId: autId || "" }; render(); }
function confirmar(titulo, texto, botao, fn) { S.dialogo = { tipo: "confirmar", titulo: titulo, texto: texto, botao: botao, fn: fn }; render(); }
function ler(form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = typeof v === "string" ? v.trim() : v; }); return o; }
function salvar(col, item, msg) { return API.salvar(col, item).then(function () { if (msg) toast(msg); S.dialogo = null; render(); }).catch(function (e) { toast("Não salvou: " + e.message, true); }); }
function apagar(col, id, msg) { return API.apagar(col, id).then(function () { toast(msg || "Excluído."); S.dialogo = null; render(); }); }

function aoSubmeter(ev) {
  var form = ev.target.closest("form[data-form]"); if (!form) return; ev.preventDefault();
  var tipo = form.getAttribute("data-form"); var f = ler(form); var d = S.dialogo; var item = d && d.item ? clone(d.item) : {};
  if (tipo === "marca") {
    item.id = item.id || uid("marca"); item.nome = f.nome; item.contato = f.contato; item.obs = f.obs; item.ativa = !!form.ativa.checked;
    return salvar("marcas", item, "Marca salva.").then(function () { if (!d.item) irPara("#/marcas/" + item.id); });
  }
  if (tipo === "aut") {
    item.id = item.id || uid("aut"); item.marcaId = f.marcaId; item.rotulo = f.rotulo || ((f.inicio ? fmtData(f.inicio).slice(3) : "") + (f.fim ? " a " + fmtData(f.fim).slice(3) : "")) || "Autorização"; item.gecom = f.gecom; item.inicio = f.inicio || null; item.fim = f.fim || null; item.valor = num(f.valor); item.pagamento = f.pagamento; item.contato = f.contato; item.obs = f.obs; item.pdfNome = f.pdfNome || item.pdfNome || null;
    item.cotas = {}; ORDEM_PRODUTOS.forEach(function (p) { var v = num(f["cota_" + p]); if (v) item.cotas[p] = v; });
    if (f.renovaDe) item.renovaDe = f.renovaDe; if (!item.origem) item.origem = d.novoDeRenovacao ? "renovação" : "cadastro manual";
    if (!item.marcaId) return toast("Escolha a marca.", true);
    var seqAut = d.sequencia;
    return API.salvar("autorizacoes", item).then(function () { S.fichaAut = item.id; if (seqAut) { toast("Salvo. Próxima."); abrirSequencia(seqAut.ids, seqAut.i + 1); } else { toast("Autorização salva."); S.dialogo = null; render(); } }).catch(function (e) { toast("Não salvou: " + e.message, true); });
  }
  if (tipo === "brand") {
    var novo = !item.id; item.id = item.id || uid("brand");
    var etapaAntes = item.etapa;
    item.marcaId = f.marcaId; item.autorizacaoId = f.autorizacaoId || null; item.titulo = f.titulo; item.apresentador = f.apresentador; item.local = f.local; item.etapa = f.etapa; item.logistica = f.logistica; item.dataGravacao = f.dataGravacao || null; item.dataVeiculacao = f.dataVeiculacao || null; item.refacoes = +f.refacoes || 0; item.custo = num(f.custo); item.obs = f.obs;
    item.links = { drive: f.link_drive, naoListado: f.link_naoListado, youtube: f.link_youtube, reels: f.link_reels, final: f.link_final, thumb: f.link_thumb };
    if (novo) item.historico = [{ data: hojeISO(), etapa: item.etapa, texto: "Criado na etapa " + (byId(ETAPAS_BRAND, item.etapa) || {}).nome }];
    if (!novo && etapaAntes !== item.etapa) { item.historico.push({ data: hojeISO(), etapa: item.etapa, texto: "Etapa mudou de " + (byId(ETAPAS_BRAND, etapaAntes) || {}).nome + " para " + (byId(ETAPAS_BRAND, item.etapa) || {}).nome }); item.atualizadoEm = hojeISO(); }
    if (novo) item.atualizadoEm = hojeISO();
    if (!item.marcaId || !item.titulo) return toast("Marca e tema são obrigatórios.", true);
    return salvar("brands", item, "Brand salvo.");
  }
  if (tipo === "entrega") {
    item.id = item.id || uid("ent"); item.marcaId = f.marcaId; item.autorizacaoId = f.autorizacaoId || null; item.produto = f.produto; item.data = f.data; item.status = f.status; item.titulo = f.titulo; item.link = f.link; item.rede = f.rede || null; item.obs = f.obs; item.mes = f.mes || mesChave(f.data); item.quantidade = f.quantidade ? +f.quantidade : (item.produto === "revista" ? 1 : null); item.formato = f.formato || null; item.imagem = f.imagem || null;
    item.metricas = {}; Object.keys(f).forEach(function (k) { if (k.indexOf("m_") === 0 && f[k] !== "") item.metricas[k.slice(2)] = num(f[k]); });
    if (!item.marcaId) return toast("Escolha a marca.", true);
    return salvar("entregas", item, item.status === "agendado" ? "Entrega programada para " + fmtDataExtensa(item.data) + "." : "Entrega registrada.").then(function () {
      var fila = S.d.fila.filter(function (x) { return x.entregaId === item.id; })[0];
      if (fila && item.status !== "agendado" && fila.status !== "publicado") { fila.status = "publicado"; API.salvar("fila", fila).then(render); }
    });
  }
  if (tipo === "cobranca-brand") {
    var bq = clone(byId(S.d.brands, d.brandId)); bq.cobrancas = bq.cobrancas || []; bq.cobrancas.push({ data: f.data || hojeISO(), texto: f.texto });
    return salvar("brands", bq, "Cobrança registrada em " + fmtData(f.data || hojeISO()) + ".");
  }
  if (tipo === "cobranca-marca") {
    var mk = clone(marca(d.marcaId)); mk.cobrancas = mk.cobrancas || []; mk.cobrancas.push({ data: f.data || hojeISO(), texto: f.texto, produto: f.produto || null });
    return salvar("marcas", mk, "Cobrança registrada em " + fmtData(f.data || hojeISO()) + ".");
  }
  if (tipo === "fila") {
    item.id = item.id || uid("fila"); item.marcaId = f.marcaId; item.produto = f.produto; item.descricao = f.descricao; item.linkMaterial = f.linkMaterial; item.linkDestino = f.linkDestino; item.dataPedida = f.dataPedida || null; item.urgencia = f.urgencia; item.por = f.por; item.obs = f.obs; item.status = item.status || "aguardando"; item.criadoEm = item.criadoEm || hojeISO();
    return salvar("fila", item, item.status === "aguardando" ? "Material na fila." : "Salvo.");
  }
  if (tipo === "alocar") {
    var fi = clone(d.item); var ent = { id: uid("ent"), marcaId: fi.marcaId, autorizacaoId: f.autorizacaoId || null, produto: fi.produto, data: f.data, status: "agendado", titulo: fi.descricao, link: fi.linkDestino || "", rede: f.rede || null, obs: fi.obs || "", mes: mesChave(f.data), quantidade: fi.produto === "revista" ? 1 : null, metricas: {}, filaId: fi.id };
    fi.status = "alocado"; fi.dataAlocada = f.data; fi.entregaId = ent.id;
    return API.salvar("entregas", ent).then(function () { return API.salvar("fila", fi); }).then(function () { toast("Programado para " + fmtDataExtensa(f.data) + "."); S.dialogo = null; render(); });
  }
  if (tipo === "edicao") {
    function listaDatas(s) { return String(s || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
    item.id = item.id || uid("ed"); item.marcaId = f.marcaId || null; item.material = f.material; item.status = f.status; item.tipo = f.tipo; item.inicio = f.inicio || null; item.finalizado = f.finalizado || null; item.reels = f.reels || null; item.revisoes = listaDatas(f.revisoes); item.ajustes = listaDatas(f.ajustes); item.linkExibicao = f.linkExibicao; item.linkMaterial = f.linkMaterial; item.obs = f.obs;
    return salvar("edicao", item, "Material salvo.");
  }
}

function aoClicar(ev) {
  var el = ev.target.closest("[data-acao]"); if (!el) return;
  var acao = el.getAttribute("data-acao"), id = el.getAttribute("data-id"), v = el.getAttribute("data-v");
  if (acao === "fechar-fundo") { if (ev.target !== el) return; return fechar(); }
  if (el.tagName === "LABEL") return;
  switch (acao) {
    case "fechar": return fechar();
    case "ajuda": S.gavetaAberta = false; S.dialogo = { tipo: "ajuda", secao: -1 }; return render();
    case "tutorial-passeio": S.dialogo = null; render(); return window.Tutorial && window.Tutorial.iniciar();
    case "tutorial-secao": S.dialogo.secao = S.dialogo.secao === +v ? -1 : +v; return render();
    case "gaveta": S.gavetaAberta = true; return render();
    case "fechar-gaveta": if (ev.target === el) { S.gavetaAberta = false; render(); } return;
    case "tema": var novo = temaAtual() === "escuro" ? "claro" : "escuro"; document.documentElement.setAttribute("data-tema", novo); try { localStorage.setItem("drc-tema", novo); } catch (e) {} S.gavetaAberta = false; return render();
    case "filtro-marcas": S.filtroMarcas = v; return render();
    case "filtro-aut": S.filtroAut = v; return render();
    case "visao-aut": S.visaoAut = v; return render();
    case "renovar-aut": return renovarAut(aut(id));
    case "seq-iniciar": return iniciarSequencia();
    case "seq-pular": { var sq = S.dialogo && S.dialogo.sequencia; if (sq) abrirSequencia(sq.ids, sq.i + 1); return; }
    case "filtro-fila": S.filtroFila = v; return render();
    case "filtro-ed-status": S.filtroEdicaoStatus = v; return render();
    case "ficha-aut": S.fichaAut = id; return render();
    case "ficha-aba": S.fichaAba = v; return render();
    case "cal-mes": S.calMes = v; return render();
    case "toggle-veiculados": S.mostrarVeiculados = !S.mostrarVeiculados; return render();
    case "visao-brand": S.visaoBrand = v; return render();
    case "filtro-brand-bola": S.filtroBrandBola = S.filtroBrandBola === v && FASES_BRAND.some(function (f) { return f.id === v; }) ? "todos" : v; return render();
    case "brand-avancar-rapido": return avancarBrandRapido(id);
    case "brand-cobrar-rapido": { var bc = byId(S.d.brands, id); S.dialogo = { tipo: "cobranca-brand", brandId: id }; return render(); }
    case "brand-veic": S.brandVeicAberto = S.brandVeicAberto || {}; S.brandVeicAberto[id] = !S.brandVeicAberto[id]; return render();
    case "nova-marca": return abrirMarcaForm(null);
    case "editar-marca": return abrirMarcaForm(marca(id));
    case "apagar-marca": return confirmar("Excluir marca", "Excluir " + nomeMarca(id) + "? As autorizações, brands e entregas dela continuam gravados, mas sem marca.", "Excluir", function () { apagar("marcas", id, "Marca excluída."); irPara("#/marcas"); });
    case "nova-aut": return abrirAutForm(null, el.getAttribute("data-marca") || (rota().caminho === "/marcas" ? rota().id : ""));
    case "editar-aut": return abrirAutForm(aut(id));
    case "apagar-aut": return confirmar("Excluir autorização", "Excluir esta autorização? As entregas ligadas a ela deixam de contar em cota.", "Excluir", function () { apagar("autorizacoes", id, "Autorização excluída."); });
    case "encerrar-aut": var a = clone(aut(id)); a.encerrada = v === "1"; return API.salvar("autorizacoes", a).then(function () { toast(a.encerrada ? "Autorização encerrada." : "Autorização reaberta."); render(); });
    case "escolher-pdf": return document.getElementById("pdf-aut").click();
    case "novo-brand": return abrirBrand(null, el.getAttribute("data-marca") || S.filtroBrandMarca || "");
    case "abrir-brand": return abrirBrand(byId(S.d.brands, id));
    case "apagar-brand": return confirmar("Excluir brand", "Excluir este vídeo da linha do tempo? O histórico e as cobranças somem junto.", "Excluir", function () { apagar("brands", id, "Brand excluído."); });
    case "brand-avancar": { var b = S.dialogo.item; var i = indiceEtapa(b.etapa); var prox = ETAPAS_BRAND[i + 1]; if (!prox) return; var formEl = el.closest("form"); var f = ler(formEl); b.etapa = prox.id; formEl.etapa.value = prox.id; b.historico = b.historico || []; b.historico.push({ data: hojeISO(), etapa: prox.id, texto: "Avançou para " + prox.nome }); b.atualizadoEm = hojeISO(); if (prox.id === "veiculado" && !b.dataVeiculacao) { b.dataVeiculacao = hojeISO(); } return guardarBrandDoForm(formEl, b, "Etapa: " + prox.nome + "."); }
    case "brand-anotar": { var tx = document.getElementById("nota-texto").value.trim(); if (!tx) return toast("Escreva a anotação.", true); var b2 = S.dialogo.item; b2.historico = b2.historico || []; b2.historico.push({ data: hojeISO(), etapa: b2.etapa, texto: tx }); b2.atualizadoEm = hojeISO(); return guardarBrandDoForm(el.closest("form"), b2, "Anotado."); }
    case "brand-cobrar": { var tc = document.getElementById("cobranca-texto").value.trim(); if (!tc) return toast("Descreva a cobrança (para quem, por qual canal).", true); var b3 = S.dialogo.item; b3.cobrancas = b3.cobrancas || []; b3.cobrancas.push({ data: hojeISO(), texto: tc }); return guardarBrandDoForm(el.closest("form"), b3, "Cobrança registrada em " + fmtData(hojeISO()) + "."); }
    case "ref-mais": case "ref-menos": { var inp = document.getElementById("f-refacoes"); var n = Math.max(0, (+inp.value || 0) + (acao === "ref-mais" ? 1 : -1)); inp.value = n; document.getElementById("ref-n").textContent = n; return; }
    case "nova-entrega": return abrirEntrega(null, el.getAttribute("data-marca") || "", el.getAttribute("data-produto") || "post", el.getAttribute("data-aut") || "");
    case "copiar-resumo": { var mc = marca(id); var txt = resumoParaCliente(mc, aut(S.fichaAut)); var ok = function () { toast("Resumo copiado. Cole no e-mail ou no WhatsApp."); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { S.dialogo = { tipo: "texto", titulo: "Resumo para o cliente", texto: txt }; render(); }); else { S.dialogo = { tipo: "texto", titulo: "Resumo para o cliente", texto: txt }; render(); } return; }
    case "nova-cobranca-marca": S.dialogo = { tipo: "cobranca-marca", marcaId: id, produto: el.getAttribute("data-produto") || "" }; return render();
    case "editar-entrega": return abrirEntrega(byId(S.d.entregas, id));
    case "apagar-entrega": return confirmar("Excluir entrega", "Excluir esta entrega? Ela deixa de contar na cota.", "Excluir", function () { apagar("entregas", id, "Entrega excluída."); });
    case "tirar-imagem": S.dialogo.item = S.dialogo.item || {}; S.dialogo.item = Object.assign(lerFormParaItem(el.closest("form")), { imagem: "" }); return render();
    case "novo-fila": S.dialogo = { tipo: "fila", item: null }; return render();
    case "editar-fila": S.dialogo = { tipo: "fila", item: clone(byId(S.d.fila, id)) }; return render();
    case "apagar-fila": return confirmar("Excluir da fila", "Tirar este material da fila?", "Excluir", function () { apagar("fila", id, "Removido da fila."); });
    case "alocar-fila": S.dialogo = { tipo: "alocar", item: clone(byId(S.d.fila, id)) }; return render();
    case "novo-edicao": S.dialogo = { tipo: "edicao", item: null }; return render();
    case "editar-edicao": S.dialogo = { tipo: "edicao", item: clone(byId(S.d.edicao, id)) }; return render();
    case "apagar-edicao": return confirmar("Excluir material", "Excluir este material da fila de edição?", "Excluir", function () { apagar("edicao", id, "Excluído."); });
    case "abrir-evento": { var tipo = el.getAttribute("data-tipo"); if (tipo === "brand") return abrirBrand(byId(S.d.brands, id)); if (tipo === "fila") { S.dialogo = { tipo: "fila", item: clone(byId(S.d.fila, id)) }; return render(); } return abrirEntrega(byId(S.d.entregas, id)); }
    case "ir-marca": S.dialogo = null; return irPara("#/marcas/" + id);
    case "kpi": S.dialogo = { tipo: "kpi", filtro: v }; return render();
    case "ir-relatorio": S.relMarca = el.getAttribute("data-marca"); S.relAut = S.fichaAut && aut(S.fichaAut) && aut(S.fichaAut).marcaId === S.relMarca ? S.fichaAut : ""; S.relDe = ""; S.relAte = ""; return irPara("#/relatorios");
    case "rel-aut": S.relAut = id; return render();
    case "rel-limpar-periodo": S.relDe = ""; S.relAte = ""; return render();
    case "gerar-relatorio": { var mm = marca(S.relMarca), aa = S.relAut === "todas" ? "todas" : aut(S.relAut); if (!mm || !aa) return; return window.Relatorio.abrir(coletorRelatorio(mm, aa)); }
    case "exportar": { var blob = new Blob([JSON.stringify(API.exportar(), null, 1)], { type: "application/json" }); var u = URL.createObjectURL(blob); var at = document.createElement("a"); at.href = u; at.download = "comercial-duas-rodas-" + hojeISO() + ".json"; at.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); return toast("Arquivo exportado."); }
    case "recarregar-seed": return confirmar("Recarregar dados das planilhas", "Isso apaga tudo que foi editado nesta plataforma e volta aos dados importados das planilhas. Exporte antes se quiser guardar.", "Recarregar", function () { API.substituirTudo(dadosIniciais()).then(function (d) { S.d = d; toast("Dados das planilhas recarregados."); S.dialogo = null; render(); }); });
    case "exemplos-carregar": return carregarExemplos();
    case "exemplos-remover": return confirmar("Remover dados de exemplo", "Apaga as entregas, brands e materiais marcados como exemplo e devolve as cotas originais das autorizações.", "Remover", removerExemplos);
    case "confirmar-ok": { var fn = S.dialogo.fn; S.dialogo = null; return fn && fn(); }
  }
}
function lerFormParaItem(form) { var f = ler(form); var it = clone(S.dialogo.item || {}); Object.keys(f).forEach(function (k) { if (k.indexOf("m_") === 0) { it.metricas = it.metricas || {}; it.metricas[k.slice(2)] = f[k]; } else it[k] = f[k]; }); return it; }
function guardarBrandDoForm(formEl, b, msg) {
  var f = ler(formEl);
  b.marcaId = f.marcaId; b.autorizacaoId = f.autorizacaoId || null; b.titulo = f.titulo; b.apresentador = f.apresentador; b.local = f.local; b.logistica = f.logistica; b.dataGravacao = f.dataGravacao || b.dataGravacao || null; b.dataVeiculacao = f.dataVeiculacao || b.dataVeiculacao || null; b.refacoes = +f.refacoes || 0; b.custo = num(f.custo); b.obs = f.obs;
  b.links = { drive: f.link_drive, naoListado: f.link_naoListado, youtube: f.link_youtube, reels: f.link_reels, final: f.link_final, thumb: f.link_thumb };
  if (!b.id) b.id = uid("brand");
  return API.salvar("brands", b).then(function () { toast(msg); S.dialogo.item = clone(b); render(); });
}
function aoMudar(ev) {
  var el = ev.target; var filtro = el.getAttribute("data-filtro"); var arq = el.getAttribute("data-acao-arquivo");
  if (arq === "importar") {
    var file = el.files[0]; if (!file) return;
    return file.text().then(function (txt) { var novo = JSON.parse(txt); if (!novo.marcas) throw new Error("arquivo sem marcas"); return API.substituirTudo(novo); }).then(function (d) { S.d = d; toast("Dados importados."); render(); }).catch(function (e) { toast("Não consegui importar: " + e.message, true); });
  }
  if (arq === "ler-pdf") {
    var pdf = el.files[0]; if (!pdf) return; S.dialogo.lendo = true; S.dialogo.avisoPdf = ""; render();
    return lerPdfAutorizacao(pdf).then(function (r) {
      var it = S.dialogo.item || { cotas: {} }; it.cotas = it.cotas || {};
      var achou = Object.keys(r.cotas).length || r.gecom || r.inicio || r.valor;
      if (r.gecom) { it.gecom = r.gecom; it.rotulo = it.rotulo || "Gecom " + r.gecom; } if (r.inicio) { it.inicio = r.inicio; it.fim = r.fim; } if (r.valor) it.valor = r.valor; if (r.pagamento) it.pagamento = r.pagamento; if (r.contato) it.contato = r.contato;
      ORDEM_PRODUTOS.forEach(function (p) { if (r.cotas[p]) it.cotas[p] = r.cotas[p]; });
      if (r.marcaNome && !it.marcaId) { var alvo = S.d.marcas.filter(function (m) { return m.nome.toLowerCase().indexOf(r.marcaNome.toLowerCase().split(" ")[0]) >= 0; })[0]; if (alvo) it.marcaId = alvo.id; }
      it.pdfNome = pdf.name; S.dialogo.item = it; S.dialogo.lendo = false; S.dialogo.marcaId = it.marcaId || S.dialogo.marcaId;
      S.dialogo.avisoPdf = achou ? "Li o PDF e preenchi o que encontrei. Confira cada campo antes de salvar." : (r.textoLido < 40 ? "Esse PDF é uma imagem escaneada, sem texto para ler. Preencha os campos à mão olhando o documento." : "Não reconheci o formato deste PDF. Preencha à mão.");
      S.dialogo.avisoPdfTipo = achou ? "ok" : "alerta"; render();
    }).catch(function (e) { S.dialogo.lendo = false; S.dialogo.avisoPdf = "Não consegui ler o PDF: " + e.message; S.dialogo.avisoPdfTipo = "erro"; render(); });
  }
  if (arq === "imagem-entrega") {
    var img = el.files[0]; if (!img) return;
    return reduzirImagem(img, 1200).then(function (dataUrl) { var it = lerFormParaItem(el.closest("form")); it.imagem = dataUrl; S.dialogo.item = it; render(); }).catch(function () { toast("Não consegui ler a imagem.", true); });
  }
  var cotaAut = el.getAttribute && el.getAttribute("data-cota-aut");
  if (cotaAut) {
    var ca = clone(aut(cotaAut)); if (!ca) return; ca.cotas = ca.cotas || {}; var pv = num(el.value); var pr = el.getAttribute("data-cota-produto");
    if (pv) ca.cotas[pr] = pv; else delete ca.cotas[pr];
    return API.salvar("autorizacoes", ca).then(function () { toast(nomeMarca(ca.marcaId) + ": cota de " + PRODUTOS[pr].curto.toLowerCase() + (pv ? " = " + fmtNum(pv) : " removida") + "."); render(); });
  }
  if (!filtro) return;
  var val = el.value;
  switch (filtro) {
    case "busca": S.busca = val; break;
    case "brandMarca": S.filtroBrandMarca = val; S.filtroBrandAut = ""; break;
    case "brandAut": S.filtroBrandAut = val; break;
    case "edTipo": S.filtroEdicaoTipo = val; break;
    case "relMarca": S.relMarca = val; S.relAut = ""; break;
    case "relAut": S.relAut = val; break;
    case "relDe": S.relDe = val; break;
    case "relAte": S.relAte = val; break;
    case "brandFormMarca": case "entregaFormMarca": { var it2 = lerFormParaItem(el.closest("form")); it2.autorizacaoId = ""; S.dialogo.item = it2; break; }
    case "entregaFormProduto": { var it3 = lerFormParaItem(el.closest("form")); S.dialogo.item = it3; break; }
  }
  render();
}
function reduzirImagem(file, max) {
  return new Promise(function (ok, erro) {
    var img = new Image(); var u = URL.createObjectURL(file);
    img.onload = function () { var esc2 = Math.min(1, max / Math.max(img.width, img.height)); var c = document.createElement("canvas"); c.width = Math.round(img.width * esc2); c.height = Math.round(img.height * esc2); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.82)); };
    img.onerror = function () { URL.revokeObjectURL(u); erro(new Error("imagem inválida")); }; img.src = u;
  });
}

/* ============================================================ início */
document.addEventListener("click", aoClicar);
document.addEventListener("submit", aoSubmeter);
document.addEventListener("input", function (ev) { var f = ev.target.getAttribute && ev.target.getAttribute("data-filtro"); if (f === "busca") aoMudar(ev); });
document.addEventListener("change", function (ev) { var f = ev.target.getAttribute && (ev.target.getAttribute("data-filtro") || ev.target.getAttribute("data-acao-arquivo") || ev.target.getAttribute("data-cota-aut")); if (f && f !== "busca") aoMudar(ev); });
var rotaAnterior = rota().caminho;
window.addEventListener("hashchange", function () { var agora = rota().caminho; if (agora !== rotaAnterior) S.busca = ""; rotaAnterior = agora; S.gavetaAberta = false; render(); });
document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && S.dialogo) fechar(); });
function imagemParaEntrega(file) {
  var form = document.querySelector('form[data-form="entrega"]'); if (!form || !file || !/^image\//.test(file.type)) return false;
  reduzirImagem(file, 1200).then(function (dataUrl) { var it = lerFormParaItem(form); it.imagem = dataUrl; S.dialogo.item = it; render(); toast("Print colado na entrega."); }).catch(function () { toast("Não consegui ler a imagem.", true); });
  return true;
}
document.addEventListener("paste", function (ev) {
  if (!S.dialogo || S.dialogo.tipo !== "entrega") return;
  var itens = (ev.clipboardData && ev.clipboardData.items) || []; for (var i = 0; i < itens.length; i++) { if (itens[i].kind === "file" && /^image\//.test(itens[i].type)) { if (imagemParaEntrega(itens[i].getAsFile())) { ev.preventDefault(); return; } } }
});
document.addEventListener("dragover", function (ev) { if (S.dialogo && S.dialogo.tipo === "entrega") { ev.preventDefault(); var z = document.querySelector(".colar-print"); if (z) z.classList.add("arrastando"); } });
document.addEventListener("dragleave", function () { var z = document.querySelector(".colar-print"); if (z) z.classList.remove("arrastando"); });
document.addEventListener("drop", function (ev) { if (!S.dialogo || S.dialogo.tipo !== "entrega") return; ev.preventDefault(); var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]; imagemParaEntrega(f); });
render();
API = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId ? criarApiFirebase(window.FIREBASE_CONFIG) : criarApiLocal();
API.carregar().then(function (d) {
  // Firestore recém-criado: carrega os dados das planilhas uma vez
  if (API.tipo === "firebase" && COLECOES.every(function (c) { return !d[c] || !d[c].length; })) { S.erro = null; toast("Primeira abertura: carregando os dados das planilhas no Firebase..."); return API.substituirTudo(dadosIniciais()).then(function () { return API.exportar(); }); }
  return d;
}).then(function (d) {
  S.d = d; S.pronto = true;
  if (API.onChange) API.onChange(function () { S.d = API.exportar(); render(); });
  render();
  if (window.Tutorial && !window.Tutorial.jaViu()) setTimeout(window.Tutorial.iniciar, 600);
}).catch(function (e) { S.erro = "Não consegui carregar os dados: " + e.message; render(); });
window.DRC = { S: S, get API() { return API; }, consumo: consumo, render: render };
})();
