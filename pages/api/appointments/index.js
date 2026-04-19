import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendConfirmationEmail(data) {
  if (!process.env.GMAIL_APP_PASSWORD) return;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: data.email,
      subject: "Confirmation de RDV - Hijama Sunnah",
      text: `Bonjour ${data.first_name},
Votre rendez-vous est confirmé pour le ${data.date} à ${data.time_slot}.
Prestation : ${data.service_type}

À bientôt !
Hijama Sunnah`,
    });
  } catch (err) {
    console.error("Email error:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { first_name, last_name, phone, email, service_type, date, time_slot, comment } = req.body;

  if (!first_name || !last_name || !phone || !email || !date || !time_slot) {
    return res.status(400).json({ detail: "Champs obligatoires manquants" });
  }

  try {
    // 🔍 1. Vérification dans la table "rendez_vous"
    const { data: existing, error: checkError } = await supabase
      .from("rendez_vous")
      .select("id")
      .eq("date", date)
      .eq("time_slot", time_slot);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(400).json({ detail: "Ce créneau est déjà réservé" });
    }

    // 💾 2. Insertion dans "rendez_vous"
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

    // 📧 3. Email
    sendConfirmationEmail({ first_name, email, date, time_slot, service_type });

    return res.status(200).json({ status: "success", data });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ detail: err.message || "Erreur serveur" });
  }
}