import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ IMPORTANT
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date manquante" });
  }

  try {
    console.log("DATE REÇUE :", date);

    const { data, error } = await supabase
      .from("appointments")
      .select("time_slot")
      .eq("date", date);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    const allSlots = [
      "09:00", "10:00", "11:00",
      "14:00", "15:00", "16:00"
    ];

    const bookedSlots = data.map(item => item.time_slot);

    const availableSlots = allSlots.filter(
      slot => !bookedSlots.includes(slot)
    );

    return res.status(200).json(availableSlots);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}