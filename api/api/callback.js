import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const secret = process.env.BOXTAL_WEBHOOK_SECRET;

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["x-bxt-signature"];

    if (!signature) {
      return res.status(401).json({ error: "Signature manquante" });
    }

    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (computed !== signature) {
      return res.status(401).json({ error: "Signature invalide" });
    }

    const payload = JSON.parse(rawBody);

    console.log("Webhook Boxtal reçu :", payload);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erreur webhook :", err);
    return res.status(500).json({ error: "Erreur interne" });
  }
}
