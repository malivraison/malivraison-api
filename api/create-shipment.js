export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { sender, recipient, parcel, carrier } = req.body;

    if (!process.env.BOXTAL_API_KEY) {
      return res.status(500).json({ error: "Clé API Boxtal non configurée sur le serveur" });
    }

    const response = await fetch("https://api.boxtal.com/v3/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.BOXTAL_API_KEY
      },
      body: JSON.stringify({ sender, recipient, parcel, carrier })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erreur Boxtal",
        details: data
      });
    }
