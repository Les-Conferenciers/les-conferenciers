import { Users, Award, Search, Handshake } from "lucide-react";

const REASONS = [
  {
    icon: Users,
    title: "300+ conférenciers",
    description: "Tous les profils, toutes les thématiques, tous les budgets. En France et à l'international.",
    stat: "300+",
    statLabel: "intervenants",
  },
  {
    icon: Award,
    title: "Des talents d'exception",
    description: "Chaque conférencier est sélectionné pour son expertise unique et son talent d'orateur éprouvé.",
    stat: "100%",
    statLabel: "vérifiés",
  },
  {
    icon: Search,
    title: "Un matching sur-mesure",
    description: "Nous analysons votre projet en détail pour vous proposer l'intervenant qui répondra précisément à vos objectifs.",
    stat: "24h",
    statLabel: "pour un devis",
  },
  {
    icon: Handshake,
    title: "Conseil & accompagnement",
    description: "Nous ne listons pas des profils : nous vous conseillons le bon intervenant, challengeons votre brief et nous engageons sur le résultat.",
    stat: "500+",
    statLabel: "événements",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase mb-4">
            Nos engagements
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Pourquoi nous choisir ?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REASONS.map((reason, idx) => (
            <div
              key={idx}
              className="group relative p-7 rounded-2xl bg-card border border-border/40 hover:border-accent/40 hover:shadow-xl transition-all duration-300 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <reason.icon className="h-7 w-7 text-accent" />
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">{reason.stat}</span>
                <span className="block text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{reason.statLabel}</span>
              </div>

              <h3 className="text-lg font-serif font-bold text-foreground mb-2">
                {reason.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
