import { Users, Award, Search, Handshake } from "lucide-react";

const REASONS = [
  {
    icon: Users,
    title: "Un large choix",
    description:
      "Quel que soit la taille de votre évènement (comité restreint ou grand rassemblement), le lieu géographique souhaité (en France ou à l'international), les thématiques choisies (leadership, coopération, engagement…), le domaine d'expertise de prédilection (sport, art culinaire, économie, politique, philosophie…), et votre budget, nous vous proposons les meilleurs profils d'intervenants pour votre évènement.",
  },
  {
    icon: Award,
    title: "Des intervenants d'élite",
    description:
      "Notre agence regroupe une communauté des meilleurs conférenciers dont la légitimité repose sur un savoir-faire unique, une expérience pérenne dans leur domaine, et un vrai talent d'orateur.",
  },
  {
    icon: Search,
    title: "Plus qu'un simple catalogue de conférenciers",
    description:
      "Nous étudions de façon détaillée votre projet en amont, afin de vous mettre en relation avec le conférencier qui de par son expertise et son profil, répondra précisément à vos besoins.",
  },
  {
    icon: Handshake,
    title: "Une relation de confiance avec nos intervenants",
    description:
      "Choisir un conférencier peut s'avérer hasardeux, sans une connaissance aigüe du contenu des conférences. C'est pourquoi notre agence a assisté personnellement à l'ensemble des interventions qu'elle propose afin de toujours mieux vous conseiller.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase mb-4">
            Nos engagements
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Pourquoi nous choisir ?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Trouvez l'orateur idéal n'est pas chose aisée. C'est pourquoi nous mettons
            notre expertise et notre réseau à votre service pour garantir le succès de votre événement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {REASONS.map((reason, idx) => (
            <div
              key={idx}
              className="group p-8 rounded-2xl bg-card border border-border/40 hover:border-accent/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <reason.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                {reason.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
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
