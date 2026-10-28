// Função chamada pelo site (Firebase callable): guarda a chave do Claude no Secret Manager,
// nunca no navegador. Só atende quem entrou na plataforma (login anônimo do Firebase).
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const ia = require("./ia");

const CHAVE = defineSecret("ANTHROPIC_API_KEY");

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
