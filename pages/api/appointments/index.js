import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📧 Création transporteur (UNE SEULE FOIS)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 📧 Fonction envoi email
async function sendEmails(data) {
  try {
    await transporter.verify();
    console.log("✅ SMTP prêt");

    // 📧 EMAIL CLIENT
    await transporter.sendMail({
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

    console.log("📧 Email client envoyé");

    // 📧 EMAIL ADMIN (TOI)
    await transporter.sendMail({
      from: `"Hijama Sunnah" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "🆕 Nouveau rendez-vous",
      html: `
        <div style="font-family: Arial; max-width:500px;">
          <h2>🆕 Nouveau rendez-vous</h2>
          <ul>
            <li><b>Nom :</b> ${data.first_name} ${data.last_name}</li>
            <li><b>Email :</b> ${data.email}</li>
            <li><b>Téléphone :</b> ${data.phone}</li>
            <li><b>Date :</b> ${data.date}</li>
            <li><b>Heure :</b> ${data.time_slot}</li>
            <li><b>Prestation :</b> ${data.service_type || "Non précisée"}</li>
            <li><b>Commentaire :</b> ${data.comment || "Aucun"}</li>
          </ul>
        </div>
      `,
    });

    console.log("📧 Email admin envoyé");

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

    console.log("📨 Envoi des emails...");

    // 📧 Envoi des emails
    await sendEmails({
      first_name,
      last_name,
      phone,
      email,
      date,
      time_slot,
      service_type,
      comment
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
