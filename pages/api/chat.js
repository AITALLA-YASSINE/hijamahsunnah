// Chatbot simple basé sur des règles - pas de dépendance externe
const WHATSAPP_NUMBER = "33743565189";

const faqResponses = {
  prix: "Les tarifs sont : Hijama sèche/humide/sportive/bien-être : 45€ | Hijama visage : 35€ | Corps entier : 70€. Les ventouses sont fournies avec chaque prestation.",
  tarif: "Les tarifs sont : Hijama sèche/humide/sportive/bien-être : 45€ | Hijama visage : 35€ | Corps entier : 70€. Les ventouses sont fournies avec chaque prestation.",
  horaire: "Disponibilités : Samedi & Dimanche de 9h à 18h | Lundi au Vendredi de 18h à 20h.",
  heure: "Disponibilités : Samedi & Dimanche de 9h à 18h | Lundi au Vendredi de 18h à 20h.",
  reservation: "Pour réserver, utilisez le formulaire en ligne sur cette page (section Réservation) ou contactez Fatiha sur WhatsApp au 07 43 56 51 89.",
  rdv: "Pour prendre rendez-vous, utilisez le formulaire de réservation sur cette page ou écrivez sur WhatsApp au 07 43 56 51 89.",
  douleur: "La hijama peut aider pour les douleurs musculaires (dos, nuque, épaules), les contractures et tensions. C'est une thérapie naturelle très efficace.",
  bienfait: "La hijama aide pour : douleurs musculaires, détoxification, bien-être général, fatigue, stress, circulation sanguine, récupération sportive, et hijama visage pour l'anti-âge.",
  contraindication: "La hijama est déconseillée en cas de grossesse, traitement anticoagulant, ou maladies cutanées actives. En cas de doute, consultez votre médecin avant la séance.",
  apres: "Après la séance : reposez-vous 24h, évitez les efforts, pas de douche chaude immédiatement, hydratez-vous bien, alimentation légère. Les marques disparaissent en quelques jours.",
  avant: "Avant la séance : soyez à jeun 2 à 3h avant (eau autorisée), prévoyez des vêtements confortables.",
  femme: "Oui, les soins sont exclusivement réservés aux femmes.",
  homme: "Je suis désolée, les soins sont exclusivement réservés aux femmes.",
  lieu: "Les séances se déroulent dans un cadre professionnel et bienveillant. Pour l'adresse exacte, contactez Fatiha sur WhatsApp au 07 43 56 51 89.",
  adresse: "Pour l'adresse exacte, contactez Fatiha directement sur WhatsApp au 07 43 56 51 89.",
  diplome: "Fatiha est infirmière diplômée d'état et praticienne certifiée en hijama. Matériel stérile et usage unique garanti.",
  sterile: "Oui, tout le matériel est stérile et à usage unique. La sécurité et l'hygiène sont des priorités absolues.",
  sport: "La hijama sportive est idéale pour la récupération musculaire, la réduction des courbatures et l'amélioration des performances. Prix : 45€.",
  visage: "La hijama visage est bénéfique pour l'anti-âge, l'acné, les rides et le drainage lymphatique. Elle donne un teint lumineux. Prix : 35€.",
  salam: "Wa alaykum salam ! Je suis l'assistante de Fatiha. Comment puis-je vous aider aujourd'hui ?",
  bonjour: "Bonjour ! Je suis l'assistante de Fatiha. Comment puis-je vous aider ?",
};

function getBotResponse(message) {
  const lower = message.toLowerCase();

  for (const [keyword, response] of Object.entries(faqResponses)) {
    if (lower.includes(keyword)) {
      return response;
    }
  }

  // Réponse par défaut
  return `Je n'ai pas bien compris votre question. Pour toute information, vous pouvez :\n• Consulter les sections de cette page\n• Contacter Fatiha directement sur WhatsApp au 07 43 56 51 89\n• Utiliser le formulaire de réservation en ligne`;
}

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
