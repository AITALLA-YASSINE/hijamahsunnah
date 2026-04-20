import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📧 Fonction envoi email
async function sendConfirmationEmail(data) {
  if (!process.env.GMAIL_APP_PASSWORD || !process.env.GMAIL_USER) {
    console.log("❌ Email config manquante");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // IMPORTANT
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 🔍 Vérifie la connexion SMTP
    await transporter.verify();
    console.log("✅ SMTP prêt");

    const info = await transporter.sendMail({
      from: `"Hijama Sunnah" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: "Confirmation de RDV - Hijama Sunnah",
      text: `Bonjour ${data.first_name},

Votre rendez-vous est confirmé :

📅 Date : ${data.date}
🕐 Heure : ${data.time_slot}
💆 Prestation : ${data.service_type || "Non précisée"}

À bientôt !
Hijama Sunnah`,
      html: `
        <div style="font-family: Arial; max-width:500px;">
          <h2>Confirmation de rendez-vous</h2>
          <p>Bonjour <b>${data.first_name}</b>,</p>
          <p>Votre rendez-vous est confirmé :</p>
          <ul>
            <li><b>Date :</b> ${data.date}</li>
            <li><b>Heure :</b> ${data.time_slot}</li>
            <li><b>Prestation :</b> ${data.service_type || "Non précisée"}</li>
          </ul>
          <p>À bientôt !</p>
        </div>
      `,
    });

    console.log("📧 Email envoyé :", info.messageId);

  } catch (err) {
    console.error("❌ Email error:", err);
  }
}

// 🚀 API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    first_name,
    last_name,
    phone,
    email,
    service_type,
    date,
    time_slot,
    comment
  } = req.body;

  // ✅ Validation
  if (!first_name || !last_name || !phone || !email || !date || !time_slot) {
    return res.status(400).json({ detail: "Champs obligatoires manquants" });
  }

  try {
    // 🔍 Vérifier si le créneau est déjà pris
    const { data: existing, error: checkError } = await supabase
      .from("rendez_vous")
      .select("id")
      .eq("date", date)
      .eq("time_slot", time_slot);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(400).json({
        detail: "Ce créneau est déjà réservé"
      });
    }

    // 💾 Insertion
    const { data, error } = await supabase
      .from("rendez_vous")
      .insert([{
        nom: `${first_name} ${last_name}`,
        telephone: phone,
        email: email,
        date: date,
        time_slot: time_slot,
        prestation: service_type || null,
        commentaire: comment || null
      }])
      .select();

    if (error) throw error;

    // 📧 Envoi email (IMPORTANT: await)
    console.log("📨 Envoi email à :", email);

    await sendConfirmationEmail({
      first_name,
      email,
      date,
      time_slot,
      service_type
    });

    return res.status(200).json({
      status: "success",
      data
    });

  } catch (err) {
    console.error("❌ Server Error:", err);

    return res.status(500).json({
      detail: err.message || "Erreur serveur"
    });
  }
}
