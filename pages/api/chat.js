const WHATSAPP = "07 43 56 51 89";

// ─────────────────────────────────────────────────────────────
// NORMALISATION INTELLIGENTE
// ─────────────────────────────────────────────────────────────
function norm(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    // corrections fréquentes utilisateurs
    .replace(/\b(sa|ca)\b/g, "ca")
    .replace(/\b(fais|fait|faire)\b/g, "faire")
    .replace(/\b(bienfais|bienfait|bienfaits)\b/g, "bienfaits")
    .replace(/\b(seance|seances)\b/g, "seance")
    .replace(/\b(dur|duree|temps)\b/g, "duree")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────
// SCORE MATCH (clé de l’intelligence)
// ─────────────────────────────────────────────────────────────
function scoreMatch(normMsg, tags) {
  let score = 0;

  for (const tag of tags) {
    const t = norm(tag);

    if (normMsg.includes(t)) {
      score += t.length; // plus le mot est long, plus il pèse
    }
  }

  return score;
}

// ─────────────────────────────────────────────────────────────
// FAQ AMÉLIORÉE
// ─────────────────────────────────────────────────────────────
const FAQ = [

  // SALUTATION (faible priorité)
  {
    tags: ["bonjour", "salam", "salut", "hello"],
    rep: "Bonjour ! Je suis l'assistante de Fatiha 😊 Comment puis-je vous aider ?",
  },

  // BIENFAITS
  {
    tags: [
      "bienfaits", "bienfait", "a quoi sert", "utilite",
      "pourquoi faire", "effets", "avantages hijama"
    ],
    rep: "La hijama permet de détoxifier le corps, améliorer la circulation sanguine, réduire le stress, soulager les douleurs (dos, migraines, règles) et renforcer le système immunitaire.",
  },

  // ADAPTATION / MALADIES
  {
    tags: [
      "adapte", "mon cas", "ma situation", "efficace",
      "soulage", "soigne", "probleme"
    ],
    rep: "La hijama peut soulager fatigue, stress, douleurs, migraines, troubles hormonaux et circulatoires. Un avis personnalisé est recommandé selon votre situation.",
  },

  // CONTRE-INDICATIONS
  {
    tags: [
      "danger", "contre indication", "enceinte",
      "grossesse", "anticoagulant", "chimio"
    ],
    rep: "Les contre-indications principales : anticoagulants, début de grossesse, infections en cours ou traitements lourds (chimiothérapie...).",
  },

  // DOULEUR
  {
    tags: ["mal", "douleur", "douloureux", "ca fait mal"],
    rep: "Pas du tout ! Les incisions sont très superficielles. Vous pouvez ressentir de légers picotements seulement.",
  },

  // DURÉE
  {
    tags: ["duree", "combien de temps", "temps seance"],
    rep: "La séance dure environ 30 à 45 minutes.",
  },

  // APRÈS SÉANCE
  {
    tags: [
      "apres seance", "apres hijama", "que faire apres",
      "conseil apres", "recommandation apres"
    ],
    rep: "Après la séance : reposez-vous, buvez beaucoup d'eau, évitez le sport pendant 24 à 48h et privilégiez une alimentation légère.",
  },

  // ALIMENTATION
  {
    tags: ["manger", "alimentation", "quoi manger", "eviter"],
    rep: "Évitez le gras après la séance. Privilégiez une alimentation légère et buvez beaucoup d'eau.",
  },

  // DÉROULEMENT
  {
    tags: [
      "deroulement", "comment ca se passe",
      "etapes", "procedure"
    ],
    rep: "La séance se déroule ainsi : ventouses pour stimuler la circulation, micro-incisions superficielles, puis extraction des toxines. Durée : 30 à 45 min.",
  },

  // TYPES
  {
    tags: [
      "type hijama", "combien de types",
      "hijama seche", "hijama humide", "difference"
    ],
    rep: "Il existe 2 types : hijama sèche (sans saignée) et hijama humide (avec micro-incisions). Fatiha utilise les deux.",
  },

  // PRIX
  {
    tags: ["prix", "tarif", "combien euro"],
    rep: "Le prix de la séance est de 45€.",
  },

  // LIEU
  {
    tags: ["adresse", "lieu", "domicile", "ou se trouve"],
    rep: "Les séances se font au domicile de Fatiha. Contactez-la sur WhatsApp pour l'adresse.",
  },
];

// ─────────────────────────────────────────────────────────────
// LOGIQUE INTELLIGENTE
// ─────────────────────────────────────────────────────────────
function getBotResponse(message) {
  const normMsg = norm(message);

  if (normMsg.length < 3) {
    return "Peux-tu préciser ta question ? 😊";
  }

  let bestScore = 0;
  let bestResponse = null;

  for (const entry of FAQ) {
    const score = scoreMatch(normMsg, entry.tags);

    if (score > bestScore) {
      bestScore = score;
      bestResponse = entry.rep;
    }
  }

  if (bestScore > 3) return bestResponse;

  return "Je n'ai pas bien compris 😊 Tu peux préciser ta question (douleur, prix, déroulement...) ou contacter Fatiha au " + WHATSAPP;
}

// ─────────────────────────────────────────────────────────────
// API HANDLER
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message requis" });
  }

  const response = getBotResponse(message.slice(0, 500));

  return res.status(200).json({ response });
}
