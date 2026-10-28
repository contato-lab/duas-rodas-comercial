// Leituras com o Claude usadas pela plataforma Comercial Duas Rodas.
// Usado pela função ia (Firebase, chamada pelo site) e pelo robô do Drive (GitHub Actions).
// Todas as respostas vêm em JSON validado por schema (structured outputs).
const Anthropic = require("@anthropic-ai/sdk");

const MODELO = "claude-opus-5-5";

function cliente(chave) { return new Anthropic({ apiKey: chave }); }

const N = { type: ["integer", "null"] };
const S = { type: ["string", "null"] };
const B = { type: ["boolean", "null"] };

async function pedir(client, { conteudo, sistema, schema, maxTokens = 4000, effort = "medium" }) {
  const r = await client.beta.messages.create({
    model: MODELO,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: sistema,
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: conteudo }],
  });
  if (r.stop_reason === "refusal") throw new Error("O Claude recusou a leitura deste arquivo.");
  if (r.stop_reason === "max_tokens") throw new Error("A resposta ficou longa demais e foi cortada.");
  const texto = r.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { dados: JSON.parse(texto), uso: { entrada: r.usage.input_tokens, saida: r.usage.output_tokens } };
}

// arquivo em base64 vira o bloco certo para o Claude
function blocoArquivo(base64, mime, nome) {
  if (mime === "application/pdf") return { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
  if (/^image\/(jpeg|png|gif|webp)$/.test(mime)) return { type: "image", source: { type: "base64", media_type: mime, data: base64 } };
  if (/^text\/|html|json|xml/.test(mime)) return { type: "text", text: "Conteúdo do arquivo " + (nome || "") + ":\n\n" + Buffer.from(base64, "base64").toString("utf8") };
  return null;
}

const REGRAS_TEXTO = "Escreva em português do Brasil, frases curtas e diretas. Nunca use travessão. Não use ponto de exclamação. Não invente nada que não esteja no material.";

// 1. contrato (autorização) em PDF ou foto -> Gecom, vigência e cotas
async function lerContrato(client, { arquivo, mime, nome, marcas }) {
  const bloco = blocoArquivo(arquivo, mime, nome);
  if (!bloco || bloco.type === "text") throw new Error("Mande o contrato em PDF ou imagem.");
  const schema = {
    type: "object", additionalProperties: false,
    required: ["legivel", "marca", "marcaNoDocumento", "gecom", "inicio", "fim", "contato", "cotas", "observacoes"],
    properties: {
      legivel: { type: "boolean" },
      marca: S, marcaNoDocumento: S, gecom: S, inicio: S, fim: S, contato: S, observacoes: S,
      cotas: { type: "object", additionalProperties: false, required: ["post", "brand", "email", "revista", "banner"], properties: { post: N, brand: N, email: N, revista: N, banner: N } },
    },
  };
  const sistema = "Você lê autorizações comerciais (contratos de mídia) da Revista Duas Rodas, de motociclismo. " +
    "Extraia só o que está escrito no documento. Campo que não aparece fica null, nunca chute. " +
    "Cotas são as quantidades contratadas no período inteiro: post = posts nas redes sociais (se o mesmo post sai no Instagram e no Facebook, conte uma vez); " +
    "brand = vídeos de branded content ou produções de vídeo; email = disparos de e-mail marketing; revista = páginas de publicidade na revista impressa; " +
    "banner = total de impressões de banner no site no período (some os meses se vier por mês). " +
    "Datas no formato AAAA-MM-DD. Se o documento só disser o mês, use o primeiro dia do mês de início e o último dia do mês de fim. " +
    "gecom é o número da autorização (ex.: 104-25). " +
    "Em marca, devolva exatamente um nome da lista de marcas cadastradas, ou null se nenhuma bater; em marcaNoDocumento, o nome como está escrito no documento. " +
    "Em observacoes, uma frase com o que for importante e não couber nos campos (ex.: reprogramação permitida, cotas por rede). " + REGRAS_TEXTO;
  const texto = "Marcas cadastradas na plataforma: " + (marcas || []).join("; ") + ".\n\nLeia esta autorização e preencha os campos.";
  return pedir(client, { conteudo: [bloco, { type: "text", text: texto }], sistema, schema, effort: "high" });
}

// 2. print da tela de Insights -> números do post
async function lerPrint(client, { imagem, mime, rede }) {
  const bloco = blocoArquivo(imagem, mime || "image/jpeg");
  if (!bloco || bloco.type !== "image") throw new Error("Mande o print como imagem.");
  const schema = {
    type: "object", additionalProperties: false,
    required: ["eInsights", "rede", "visualizacoes", "alcance", "curtidas", "comentarios", "compartilhamentos", "salvamentos", "impressoes"],
    properties: { eInsights: { type: "boolean" }, rede: S, visualizacoes: N, alcance: N, curtidas: N, comentarios: N, compartilhamentos: N, salvamentos: N, impressoes: N },
  };
  const sistema = "Você lê prints das telas de estatísticas (Insights) de posts do Instagram e do Facebook. " +
    "Devolva os números exatamente como aparecem, convertidos para inteiro (1,2 mil = 1200; 3.456 = 3456). " +
    "visualizacoes = visualizações ou reproduções; alcance = contas alcançadas ou pessoas alcançadas; curtidas = curtidas ou reações. " +
    "Número que não aparece no print fica null. Se a imagem não for uma tela de estatísticas (por exemplo, a arte do post), eInsights = false e todos os números null.";
  return pedir(client, { conteudo: [bloco, { type: "text", text: "Rede informada na entrega: " + (rede || "não informada") + ". Leia os números deste print." }], sistema, schema });
}

// 3. destaques do relatório do cliente, só com o que os dados mostram
async function escreverDestaques(client, { dados }) {
  const schema = { type: "object", additionalProperties: false, required: ["destaques"], properties: { destaques: { type: "array", items: { type: "string" } } } };
  const sistema = "Você escreve a tela de destaques do relatório que a Revista Duas Rodas manda para a marca anunciante. " +
    "Use só os números e fatos do JSON recebido. Não compare com mercado, não faça promessa, não diga que algo foi um sucesso sem o número que mostra isso. " +
    "Escreva de 3 a 5 destaques, cada um com no máximo 22 palavras, cada um trazendo um número com a unidade (posts, visualizações, contas alcançadas, impressões, páginas). " +
    "Priorize: o que foi entregue contra o contratado, o conteúdo de maior alcance ou visualização, o total de alcance somado, vídeos de brand veiculados. " + REGRAS_TEXTO;
  return pedir(client, { conteudo: [{ type: "text", text: "Dados do período:\n" + JSON.stringify(dados) }], sistema, schema });
}

// 4. arquivo que chegou no Drive -> tipo de material, descrição e o que veio ou falta
async function classificarMaterial(client, { arquivo, mime, nome, pasta, marcas }) {
  const bloco = arquivo ? blocoArquivo(arquivo, mime, nome) : null;
  const schema = {
    type: "object", additionalProperties: false,
    required: ["produto", "marca", "descricao", "arte", "legenda", "link", "html", "assunto", "pdf", "falta"],
    properties: {
      produto: { type: "string", enum: ["post", "email", "banner", "revista", "brand"] },
      marca: S, descricao: { type: "string" },
      arte: B, legenda: B, link: B, html: B, assunto: B, pdf: B,
      falta: { type: "array", items: { type: "string" } },
    },
  };
  const sistema = "Você confere materiais que as marcas mandam para a Revista Duas Rodas publicar. " +
    "Produtos: post (arte para Instagram e Facebook, com ou sem legenda), email (e-mail marketing em HTML ou arte de e-mail), banner (peças de banner para o site, normalmente em várias medidas), " +
    "revista (página de anúncio para a revista impressa, normalmente PDF em alta), brand (vídeo bruto ou material para vídeo de branded content). " +
    "Diga o produto, uma descrição curta do material (até 12 palavras) e, para cada item, true se veio, false se não veio, null se não dá para saber: " +
    "arte (imagem ou vídeo final do post), legenda (texto da legenda, no arquivo ou na própria arte), link (link de destino ou link parametrizado), html (código do e-mail), assunto (assunto do e-mail), pdf (arquivo de página em PDF). " +
    "Em falta, liste em poucas palavras o que a marca ainda precisa mandar para o material ser publicado. " +
    "Em marca, devolva exatamente um nome da lista, ou null. " + REGRAS_TEXTO;
  const conteudo = [];
  if (bloco) conteudo.push(bloco);
  conteudo.push({ type: "text", text: "Nome do arquivo: " + nome + "\nPasta: " + (pasta || "") + "\nMarcas cadastradas: " + (marcas || []).join("; ") + (bloco ? "" : "\n(O conteúdo do arquivo não pôde ser aberto; decida pelo nome e pela pasta.)") });
  return pedir(client, { conteudo, sistema, schema });
}

module.exports = { MODELO, cliente, lerContrato, lerPrint, escreverDestaques, classificarMaterial };
