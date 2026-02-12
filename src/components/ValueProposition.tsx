import { Clock, HeartHandshake, ShieldCheck, Headphones } from "lucide-react";

const STEPS = [
  {
    icon: Headphones,
    title: "Écoute attentive",
    description: "Nous prenons le temps de comprendre votre identité, vos objectifs et votre audience.",
  },
  {
    icon: Clock,
    title: "Réactivité 24h",
    description: "Devis sous 24 heures conforme à votre budget, avec des propositions adaptées.",
  },
  {
    icon: ShieldCheck,
    title: "Experts vérifiés",
    description: "Nous collaborons avec des conférenciers professionnels qui ont fait leurs preuves.",
  },
  {
    icon: HeartHandshake,
    title: "Accompagnement total",
    description: "De la sélection à l'événement, nous vous accompagnons à chaque étape.",
  },
];

const ValueProposition = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Trouver l'orateur idéal n'est pas chose aisée
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            S'informer, comparer, gérer la logistique… Tout ceci est chronophage. 
            Notre agence vous conseille dans cette étape cruciale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, idx) => (
            <div
              key={step.title}
              className="group text-center p-8 rounded-2xl bg-card border border-border/40 hover:border-accent/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <step.icon className="h-8 w-8 text-accent" />
              </div>
              <div className="text-sm font-bold text-accent mb-2 tracking-wider uppercase">
                Étape {idx + 1}
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
