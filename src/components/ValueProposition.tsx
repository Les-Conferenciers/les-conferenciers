import stepEcoute from "@/assets/step-ecoute.jpg";
import stepDevis from "@/assets/step-devis.jpg";
import stepSelection from "@/assets/step-selection.jpg";
import stepValidation from "@/assets/step-validation.jpg";
import stepCoordination from "@/assets/step-coordination.jpg";
import stepEvenement from "@/assets/step-evenement.jpg";

const STEPS = [
  {
    image: stepEcoute,
    title: "Écoute & brief",
    description: "Nous prenons le temps de comprendre votre identité, vos objectifs, votre audience et votre budget.",
  },
  {
    image: stepDevis,
    title: "Devis sous 24h",
    description: "Vous recevez un devis détaillé et transparent avec plusieurs propositions de conférenciers adaptés.",
  },
  {
    image: stepSelection,
    title: "Sélection sur-mesure",
    description: "Nous vous présentons des profils triés sur le volet, en lien direct avec les conférenciers.",
  },
  {
    image: stepValidation,
    title: "Validation & contrat",
    description: "Une fois le profil choisi, nous gérons la contractualisation et les aspects administratifs.",
  },
  {
    image: stepCoordination,
    title: "Coordination logistique",
    description: "Nous organisons les déplacements, le briefing et la préparation technique de l'intervention.",
  },
  {
    image: stepEvenement,
    title: "Jour J & suivi",
    description: "Le jour de l'événement, tout est en place. Nous assurons le suivi post-conférence.",
  },
];

const ValueProposition = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase mb-4">
            Notre méthode
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Un processus simple et éprouvé en 6 étapes pour trouver le conférencier 
            parfait et garantir le succès de votre événement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="group text-center rounded-2xl bg-card border border-border/40 hover:border-accent/40 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="h-[160px] overflow-hidden">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold text-sm mb-3">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
