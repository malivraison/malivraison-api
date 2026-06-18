import { parse } from "querystring";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const rawBody = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });

    const body = parse(rawBody);

    const apiKey = process.env.API_KEY_BOXTAL;
    if (!apiKey) {
      return res.status(500).json({ error: "Clé API Boxtal manquante côté serveur" });
    }

    const sender = {
      name: body["sender[name]"],
      company: body["sender[company]"] || "",
      street: body["sender[address]"],
      street2: body["sender[address2]"] || "",
      zipCode: body["sender[zip]"],
      city: body["sender[city]"],
      country: body["sender[country]"] || "FR",
      phone: body["sender[phone]"],
      email: body["sender[email]"],
    };

    const recipient = {
      name: body["recipient[name]"],
      company: body["recipient[company]"] || "",
      street: body["recipient[address]"],
      street2: body["recipient[address2]"] || "",
      zipCode: body["recipient[zip]"],
      city: body["recipient[city]"],
      country: body["recipient[country]"] || "FR",
      phone: body["recipient[phone]"],
      email: body["recipient[email]"],
    };

    const parcel = {
      weight: Number(body["parcel[weight]"] || 1),
      type: body["parcel[type]"] || "parcel",
    };

    const carrier = body["carrier"] || undefined;

    // 🔥 Appel API SANDBOX Boxtal
   const boxtalResponse = await fetch("https://api.boxtal.build/v3.1/shipping-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  },
  body: JSON.stringify({
    sender,
    recipient,
    parcel,
    shippingOfferCode: carrier, // obligatoire pour créer une commande
  }),
});
    
    const data = await boxtalResponse.json();

    if (!boxtalResponse.ok) {
      console.log("Boxtal ERROR:", data);
      return res.status(400).json({
        error: "Erreur Boxtal",
        details: data,
        sent_payload: { sender, recipient, parcel, carrier },
      });
    }

    return res.status(200).json({
      success: true,
      payment_url: data?.payment?.url || null,
      boxtal_response: data,
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: error.message,
    });
  }
}
