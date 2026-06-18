import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields) => {
      if (err) reject(err);
      else resolve(fields);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const fields = await parseForm(req);

    const apiKey = process.env.API_KEY_BOXTAL;

    const payload = {
      shipper: {
        street: fields.shipper_street,
        zipCode: fields.shipper_zip,
        city: fields.shipper_city,
        country: "FR",
      },
      recipient: {
        street: fields.recipient_street,
        zipCode: fields.recipient_zip,
        city: fields.recipient_city,
        country: "FR",
      },
      parcel: {
        weight: Number(fields.weight),
      },
      service: fields.service,
    };

    const response = await fetch(
      "https://api-sandbox.boxtal.com/v3.1/shipping-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Erreur Boxtal",
        details: data,
      });
    }

    return res.status(200).json({
      payment_url: data.payment_url,
      order_id: data.id,
    });
  } catch (err) {
    console.error("Erreur create-shipment :", err);
    return res.status(500).json({ error: "Erreur interne" });
  }
}
