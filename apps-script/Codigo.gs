/**
 * Ponte entre a plataforma Comercial Duas Rodas e o Drive da Lime.
 * Roda como performance@limeag.com (dona da pasta MATERIAIS), publicado como app da web.
 * - pastas:  garante uma subpasta por marca dentro de MATERIAIS
 * - sessao:  abre um envio retomável no Drive e devolve o endereço para o navegador mandar o arquivo direto
 * - lixeira: manda para a lixeira um arquivo que foi tirado do item da fila
 * O robô do Drive (GitHub) lê a mesma pasta.
 * Quem chama precisa mandar o token de login do Firebase do projeto comercial-duas-rodas-lime.
 */
var RAIZ = '1MjcOLiyJ_z5sZ8MK63YjOhwK_jGB9tLa'; // DUAS RODAS / MATERIAIS
// Marcas cadastradas na plataforma em 28/10/2026. Marca nova ganha pasta sozinha no primeiro arquivo.
var MARCAS = ["Auper", "Bajaj", "Bateria Route", "BMW", "BR Motorsport (Norisk/LS2)", "Can-Am", "Castrol", "CFMOTO", "Dafra", "Duas Rodas (editorial)", "Ducati", "Haojue", "Harley-Davidson", "Honda", "Ipiranga", "Kawasaki", "KF Baterias", "Kymco", "Láquila/Texx", "Lubrax", "Magnet", "Michelin e Levorin", "Mobil", "Moto Morini", "Motul", "Nacar", "Petronas", "Philips", "Piaggio", "Pinaccle", "Pirelli", "Pro Honda", "Riffel", "Rinaldi", "Royal Enfield", "Shell", "Starplast (Bieffe/Peels)", "Suhai", "Suzuki", "Taiga Motors", "Technic", "Total/Elf", "Triumph", "Vibra", "Voge", "Yamaha", "YPF", "Zontes"];

function pastaDaMarca_(nome) {
  nome = String(nome || 'Sem marca').trim();
  var raiz = DriveApp.getFolderById(RAIZ);
  var it = raiz.getFoldersByName(nome);
  return it.hasNext() ? it.next() : raiz.createFolder(nome);
}
// Só aceita quem chega com o login (anônimo) do Firebase da plataforma. Confere o token no próprio Firebase
// e guarda o resultado por 10 minutos. A chave abaixo é a chave web pública do projeto (a mesma do site).
var FIREBASE_WEB_KEY = 'AIzaSyA9Frfju6O3BKt8q3i3FZ31IwKPK4BYns4';
function loginValido_(token) {
  if (!token) return false;
  var cache = CacheService.getScriptCache(); var k = 'tk' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token)).slice(0, 40);
  if (cache.get(k)) return true;
  var r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_WEB_KEY, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: token }), headers: { Referer: 'https://contato-lab.github.io/duas-rodas-comercial/' }, muteHttpExceptions: true });
  var ok = r.getResponseCode() === 200 && (JSON.parse(r.getContentText()).users || []).length > 0;
  if (ok) cache.put(k, '1', 600);
  return ok;
}
var PRODUTOS_PASTA = { post: 'Posts', email: 'E-mail marketing', banner: 'Banner', revista: 'Revista', brand: 'Brand (vídeo)' };
function subpasta_(pai, nome) { var it = pai.getFoldersByName(nome); return it.hasNext() ? it.next() : pai.createFolder(nome); }
function pastaDestino_(marca, produto) { var m = pastaDaMarca_(marca); return PRODUTOS_PASTA[produto] ? subpasta_(m, PRODUTOS_PASTA[produto]) : m; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    if (!loginValido_(p.token)) return json_({ erro: 'sem permissão: abra pela plataforma' });
    if (p.acao === 'pastas') {
      var r = {};
      (p.marcas || []).forEach(function (n) { r[n] = pastaDaMarca_(n).getId(); });
      return json_({ ok: true, pastas: r });
    }
    if (p.acao === 'sessao') {
      var pasta = pastaDestino_(p.marca, p.produto);
      var tipo = p.tipo || 'application/octet-stream';
      var res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink,size', {
        method: 'post', contentType: 'application/json; charset=UTF-8', muteHttpExceptions: true,
        payload: JSON.stringify({ name: p.nome, parents: [pasta.getId()], mimeType: tipo }),
        headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': tipo, 'X-Upload-Content-Length': String(p.tamanho), Origin: p.origem || 'https://contato-lab.github.io' }
      });
      var h = res.getAllHeaders(); var loc = h.Location || h.location;
      if (!loc) return json_({ erro: 'Drive recusou: ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 300) });
      return json_({ ok: true, url: loc, pastaId: pasta.getId(), pastaUrl: pasta.getUrl() });
    }
    if (p.acao === 'lixeira') {
      var f = DriveApp.getFileById(p.id);
      var pais = f.getParents(); var dentro = false;
      while (pais.hasNext()) { var pai = pais.next(); var avos = pai.getParents(); if (pai.getId() === RAIZ || (avos.hasNext() && avos.next().getId() === RAIZ)) dentro = true; }
      if (!dentro) return json_({ erro: 'arquivo fora da pasta MATERIAIS' });
      f.setTrashed(true);
      return json_({ ok: true });
    }
    return json_({ erro: 'ação desconhecida' });
  } catch (err) { return json_({ erro: String(err && err.message || err) }); }
}

/** Rode uma vez pelo editor para criar as pastas de todas as marcas. */
function criarPastas() {
  MARCAS.forEach(function (n) { pastaDaMarca_(n); });
  Logger.log(MARCAS.length + ' pastas conferidas em MATERIAIS.');
}

/* ============ organizador com IA ============
 * Arquivo solto direto em MATERIAIS (sem pasta) é lido pelo Claude, pela função "ia" da plataforma,
 * e vai para MATERIAIS / <marca> / <produto>. Sem marca reconhecida, vai para "_Conferir (sem marca)".
 * Roda sozinho a cada 15 minutos depois de rodar ligarOrganizador() uma vez.
 */
var FUNCAO_IA = 'https://southamerica-east1-comercial-duas-rodas-lime.cloudfunctions.net/ia';
var SITE = 'https://contato-lab.github.io/duas-rodas-comercial/';
var POR_RODADA = 10;

function tokenDoRobo_() {
  var props = PropertiesService.getScriptProperties(); var cache = CacheService.getScriptCache();
  var t = cache.get('tokenRobo'); if (t) return t;
  var refresh = props.getProperty('refreshRobo'); var r, j;
  if (refresh) {
    r = UrlFetchApp.fetch('https://securetoken.googleapis.com/v1/token?key=' + FIREBASE_WEB_KEY, { method: 'post', payload: { grant_type: 'refresh_token', refresh_token: refresh }, headers: { Referer: SITE }, muteHttpExceptions: true });
    if (r.getResponseCode() === 200) { j = JSON.parse(r.getContentText()); t = j.id_token; props.setProperty('refreshRobo', j.refresh_token); }
  }
  if (!t) {
    r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_WEB_KEY, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ returnSecureToken: true }), headers: { Referer: SITE }, muteHttpExceptions: true });
    j = JSON.parse(r.getContentText()); if (!j.idToken) throw new Error('não consegui entrar no Firebase: ' + r.getContentText().slice(0, 200));
    t = j.idToken; props.setProperty('refreshRobo', j.refreshToken);
  }
  cache.put('tokenRobo', t, 3000);
  return t;
}

function classificar_(arquivo) {
  var mime = arquivo.getMimeType(); var tam = arquivo.getSize(); var dados = { tipo: 'material', nome: arquivo.getName(), pasta: 'MATERIAIS (arquivo solto)', marcas: MARCAS };
  try {
    if (mime === 'application/vnd.google-apps.document') { dados.arquivo = Utilities.base64Encode(arquivo.getAs('text/plain').getBytes()); dados.mime = 'text/plain'; }
    else if ((mime === 'application/pdf' && tam <= 20e6) || (/^image\/(jpeg|png|gif|webp)$/.test(mime) && tam <= 4.5e6) || (/^text\//.test(mime) && tam <= 2e6)) { dados.arquivo = Utilities.base64Encode(arquivo.getBlob().getBytes()); dados.mime = mime; }
  } catch (e) { /* sem conteúdo: decide pelo nome */ }
  var r = UrlFetchApp.fetch(FUNCAO_IA, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ data: dados }), headers: { Authorization: 'Bearer ' + tokenDoRobo_() }, muteHttpExceptions: true });
  var j = JSON.parse(r.getContentText());
  if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
  return (j.result && j.result.dados) || {};
}

function organizar() {
  var raiz = DriveApp.getFolderById(RAIZ); var arquivos = raiz.getFiles(); var n = 0;
  while (arquivos.hasNext() && n < POR_RODADA) {
    var a = arquivos.next(); n++;
    try {
      var d = classificar_(a);
      var destino = d.marca && MARCAS.indexOf(d.marca) >= 0 ? pastaDestino_(d.marca, d.produto) : subpasta_(raiz, '_Conferir (sem marca)');
      var nota = 'Organizado pela IA em ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + ': ' + (d.descricao || '') + (d.falta && d.falta.length ? '. Falta: ' + d.falta.join('; ') : '') + '.';
      try { a.setDescription(nota); } catch (e) {}
      a.moveTo(destino);
      Logger.log(a.getName() + ' -> ' + (d.marca || 'sem marca') + ' / ' + (d.produto || ''));
    } catch (e) { Logger.log('Não organizei ' + a.getName() + ': ' + e.message); }
  }
  if (!n) Logger.log('Nenhum arquivo solto em MATERIAIS.');
}

/** Rode uma vez pelo editor: liga o organizador a cada 15 minutos. */
function ligarOrganizador() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'organizar') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('organizar').timeBased().everyMinutes(15).create();
  Logger.log('Organizador ligado: roda a cada 15 minutos.');
}
