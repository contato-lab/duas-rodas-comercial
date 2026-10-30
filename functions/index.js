// Função chamada pelo site (Firebase callable): guarda a chave do Claude no Secret Manager,
// nunca no navegador. Só atende quem entrou na plataforma (login anônimo do Firebase).
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const ia = require("./ia");
const meta = require("./meta");

const CHAVE = defineSecret("ANTHROPIC_API_KEY");
const META_TOKEN = defineSecret("META_TOKEN");

exports.ia = onCall(
  { region: "southamerica-east1", secrets: [CHAVE], timeoutSeconds: 300, memory: "512MiB", maxInstances: 5, cors: true },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Entre na plataforma para usar a leitura com IA.");
    const d = req.data || {};
    const client = ia.cliente(CHAVE.value());
    try {
      if (d.tipo === "contrato") return await ia.lerContrato(client, d);
      if (d.tipo === "print") return await ia.lerPrint(client, d);
      if (d.tipo === "destaques") return await ia.escreverDestaques(client, d);
      if (d.tipo === "material") return await ia.classificarMaterial(client, d);
      throw new HttpsError("invalid-argument", "Tipo de leitura desconhecido.");
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      console.error(d.tipo, e);
      throw new HttpsError("internal", e && e.message ? e.message : "Falha na leitura com IA.");
    }
  }
);

// Lê na hora o post do Instagram/Facebook de uma entrega (chamada pelo site ao salvar com link)
// e devolve números, print e título; quem grava na entrega é o próprio site.
exports.metaPost = onCall(
  { region: "southamerica-east1", secrets: [META_TOKEN], timeoutSeconds: 120, memory: "512MiB", maxInstances: 5, cors: true },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Entre na plataforma para ler o post.");
    const d = req.data || {};
    if (!d.link || typeof d.link !== "string") throw new HttpsError("invalid-argument", "Falta o link do post.");
    try {
      return await meta.lerPost(META_TOKEN.value(), { link: d.link, data: d.data || null, imagem: d.temImagem ? "sim" : null, metricas: d.metricas || {} });
    } catch (err) {
      console.error("metaPost", d.link, err);
      throw new HttpsError("internal", err && err.message ? err.message : "Falha ao ler o post.");
    }
  }
);
