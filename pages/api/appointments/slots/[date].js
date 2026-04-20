import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
    // 1. On récupère les créneaux déjà réservés dans la table 'rendez_vous'
    // Attention : Vérifie bien que c'est la table 'rendez_vous' que tu utilises
    const { data: bookedData, error } = await supabase
      .from("rendez_vous") 
      .select("time_slot")
      .eq("date", date);

    if (error) throw error;

    // On crée une liste simple des heures occupées : ["19:00", "14:30"]
    const bookedSlots = bookedData.map(item => item.time_slot);

    // 2. Déterminer si c'est le week-end
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); 
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // 3. Définir la liste totale des créneaux possibles
    let allSlots = [];
    if (isWeekend) {
      allSlots = [
       

        "09:00", "10:00", "11:00",  
        "12:00","13:00","14:00", 
        "15:00", "16:00", "17:00", "18:00"
      ];
    } else {
      allSlots = [

        "18:00", "19:00", "20:00"
      ];
    }

    // 4. LE FILTRE MAGIQUE : On ne garde que les créneaux qui ne sont PAS dans bookedSlots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    // On renvoie la liste filtrée. Si 19:00 est pris, il ne sera plus dans la liste.
    return res.status(200).json(availableSlots);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
