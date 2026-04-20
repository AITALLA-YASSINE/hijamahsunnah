const WHATSAPP = "07 43 56 51 89";

// ─────────────────────────────────────────
// NORMALISATION
// ─────────────────────────────────────────
function norm(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(sa|ca)\b/g, "ca")
    .replace(/\b(fais|fait|faire)\b/g, "faire")
    .replace(/\b(seance|seances)\b/g, "seance")
    .replace(/\b(dur|duree|temps)\b/g, "duree")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────
// SCORE MATCH
// ─────────────────────────────────────────
function scoreMatch(msg, tags) {
  let score = 0;

  for (const tag of tags) {
    const t = norm(tag);

    if (msg.includes(t)) {
      score += t.length;
    }
  }

  return score;
}

// ─────────────────────────────────────────
// FAQ INTELLIGENTE
// ─────────────────────────────────────────
const FAQ = [

  // SALUTATION
  {
    tags: ["bonjour", "salam", "salut", "hello"],
    rep: "Bonjour 😊 Je suis l'assistante de Fatiha. Comment puis-je vous aider ?",
  },

  // DÉFINITION HIJAMA
  {
    tags: [
      "c est quoi hijama", "hijama c est quoi",
      "definition hijama", "hijama cest quoi",
      "c quoi hijama", "expliquer hijama","c est quoi la hijama","cest quoi la hijama", "cest quoi une hijama","hijama"
    ],
    rep: "La hijama est une méthode naturelle qui consiste à utiliser des ventouses pour éliminer les toxines du corps et améliorer la circulation sanguine.",
  },

  // POUR QUI (JEUNES / ÂGE)
  {
    tags: [
      "pour qui", "pour les jeunes", "age",
      "a partir de quel age", "jeune",
      "adolescent", "enfant"
    ],
    rep: "Oui 😊 La hijama peut être faite pour les jeunes comme pour les adultes. Elle est simplement adaptée selon l’âge et la condition de la personne.",
  },

  // BIENFAITS
  {
    tags: [
      "bienfaits", "a quoi sert", "pourquoi",
      "effets", "avantages"
    ],
    rep: "La hijama aide à détoxifier le corps, améliorer la circulation, réduire le stress, soulager les douleurs (dos, migraines, règles) et renforcer l’immunité.",
  },

  // DOULEUR
  {
    tags: ["mal", "douleur", "ca fait mal", "douloureux"],
    rep: "Pas du tout 😊 Les incisions sont très superficielles. Vous pouvez ressentir de légers picotements seulement.",
  },

  // DÉROULEMENT
  {
    tags: [
      "deroulement", "comment ca se passe",
      "etapes", "procedure", "seance"
    ],
    rep: "La séance se déroule en 3 étapes : pose des ventouses, micro-incisions très légères, puis extraction des toxines. Cela dure environ 30 à 45 minutes.",
  },

  // DURÉE
  {
    tags: ["duree", "combien de temps","minutes", "minute" ,"heure"],
    rep: "La séance dure environ 30 à 45 minutes.",
  },

  // APRÈS
  {
    tags: ["apres", "que faire apres", "conseil apres"],
    rep: "Après la séance : reposez-vous, buvez beaucoup d’eau et évitez le sport pendant 24 à 48h.",
  },

  // ALIMENTATION
  {
    tags: ["manger", "alimentation"],
    rep: "Après la hijama, privilégiez une alimentation légère et évitez les aliments gras.",
  },

  // CONTRE-INDICATIONS
  {
    tags: ["danger", "risque", "contre indication"],
    rep: "Certaines situations nécessitent un avis : grossesse débutante, anticoagulants, maladies lourdes…",
  },

  // PRIX
  {
    tags: ["prix", "tarif", "combien"],
    rep: "Le tarif de la séance est de 45€.",
  },

  // LIEU
  {
    tags: ["adresse", "ou", "lieu"],
    rep: "Les séances se font au domicile de Fatiha. Contactez-la sur WhatsApp pour plus d’informations.",
  },
];

// ─────────────────────────────────────────
// FALLBACK INTELLIGENT
// ─────────────────────────────────────────
function fallback(msg) {
  if (msg.includes("hijama")) {
    return "Tu souhaites des infos sur la hijama 😊 (douleur, bienfaits, déroulement, prix...) ?";
  }

  if (msg.includes("mal") || msg.includes("douleur")) {
    return "La hijama est très peu douloureuse 😊 Tu veux que je t’explique comment ça se passe ?";
  }

  return "Je n’ai pas bien compris 😊 Tu peux préciser ta question (douleur, prix, déroulement...) ou contacter Fatiha au " + WHATSAPP;
}

// ─────────────────────────────────────────
// LOGIQUE PRINCIPALE
// ─────────────────────────────────────────
function getBotResponse(message) {
  const msg = norm(message);

  if (msg.length < 2) {
    return "Peux-tu préciser ta question ? 😊";
  }

  let bestScore = 0;
  let bestResponse = null;

  for (const entry of FAQ) {
    const score = scoreMatch(msg, entry.tags);

    if (score > bestScore) {
      bestScore = score;
      bestResponse = entry.rep;
    }
  }

  if (bestScore > 3) {
    return bestResponse;
  }

  return fallback(msg);
}

// ─────────────────────────────────────────
// API HANDLER
// ─────────────────────────────────────────
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message requis" });
  }

  const response = getBotResponse(message.slice(0, 500));

  return res.status(200).json({ response });
}
