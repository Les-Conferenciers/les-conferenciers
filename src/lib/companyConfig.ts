export const COMPANY = {
  name: "EVE",
  tradeName: "LES CONFERENCIERS - LES CONFERENCIERS.COM",
  legalForm: "SAS",
  address: "4 B Villa de la Gare",
  zipCode: "92140",
  city: "Clamart",
  fullAddress: "4 B Villa de la Gare, 92140 Clamart",
  siret: "848 829 743 00014",
  siren: "848 829 743",
  tvaIntra: "FR39 848 829 743",
  naf: "82.30Z",
  iban: "FR76 XXXX XXXX XXXX XXXX XXXX XXX",
  bic: "XXXXXXXX",
  email: "contact@lesconferenciers.com",
  website: "www.lesconferenciers.com",
  phone: "",
  paymentTerms: {
    deposit: 50, // 50% acompte
    balanceDaysBefore: 30, // solde 30 jours avant événement
  },
  cgv: [
    "Acompte de 50% à la signature du contrat.",
    "Solde de 50% exigible 30 jours avant la date de l'événement.",
    "En cas d'annulation par le client moins de 30 jours avant l'événement, l'intégralité du montant reste due.",
    "En cas d'annulation par le client entre 30 et 60 jours avant l'événement, l'acompte versé reste acquis.",
    "En cas d'annulation par le client plus de 60 jours avant l'événement, l'acompte est remboursé sous déduction de 10% de frais de dossier.",
    "Les frais de déplacement, hébergement et restauration du conférencier sont à la charge du client sauf accord contraire.",
    "Le client s'engage à fournir les conditions techniques nécessaires au bon déroulement de la conférence (sonorisation, vidéoprojection, etc.).",
    "Toute reproduction, diffusion ou enregistrement de la conférence est soumis à l'accord préalable écrit du conférencier.",
  ],
} as const;
