
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      sender,
      recipient,
      parcel,
      carrier,
      apiKey
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "Clé API Boxtal manquante" });
    }

    // Appel API Boxtal
    const response = await fetch("https://api.boxtal.com/v2/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
      body: JSON.stringify({
        sender,
        recipient,
        parcel,
        carrier
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: "Erreur Boxtal",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      payment_url: data?.payment?.url || null,
      boxtal_response: data
    });

  } catch (error) {
    console.error("Erreur serveur :", error);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: error.message
    });
  }
}
