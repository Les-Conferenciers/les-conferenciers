import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const REVIEWS = [
  {
    name: "Sophie Martin",
    company: "Directrice RH, Groupama",
    rating: 5,
    text: "Une agence exceptionnelle ! Le conférencier proposé a parfaitement su captiver notre audience de 300 collaborateurs. Un vrai moment fort pour notre séminaire annuel.",
    date: "Il y a 2 semaines",
  },
  {
    name: "Thomas Durand",
    company: "CEO, Tech Solutions",
    rating: 5,
    text: "Réactivité impressionnante, devis en 24h et un accompagnement sur-mesure. Le speaker a dépassé toutes nos attentes. Je recommande vivement !",
    date: "Il y a 1 mois",
  },
  {
    name: "Marie-Claire Dubois",
    company: "Events Manager, SNCF",
    rating: 5,
    text: "Troisième collaboration avec l'agence et toujours aussi satisfaite. Ils comprennent nos besoins et trouvent toujours l'intervenant idéal.",
    date: "Il y a 1 mois",
  },
  {
    name: "Pierre Lefèvre",
    company: "DG, Réseau Entreprendre",
    rating: 5,
    text: "Un service premium avec une touche humaine. L'équipe est passionnée et cela se ressent dans la qualité des conférenciers proposés.",
    date: "Il y a 2 mois",
  },
  {
    name: "Claire Fontaine",
    company: "Responsable Formation, Thales",
    rating: 5,
    text: "Organisation impeccable du début à la fin. Le conférencier a su adapter son intervention à notre contexte industriel. Bravo !",
    date: "Il y a 3 mois",
  },
  {
    name: "Jean-Baptiste Morel",
    company: "Directeur Commercial, BNP",
    rating: 4,
    text: "Excellent choix de conférencier pour notre convention commerciale. Impact immédiat sur la motivation des équipes. Merci !",
    date: "Il y a 3 mois",
  },
];

const GoogleReviews = () => {
  const avgRating = (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section className="py-20 px-4 bg-secondary/20" id="avis">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-card border border-border/60 rounded-full px-5 py-2.5 shadow-sm mb-6">
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="font-semibold text-foreground">Avis Google</span>
            <div className="flex gap-0.5 ml-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-foreground">{avgRating}/5</span>
            <span className="text-muted-foreground text-sm">({REVIEWS.length} avis)</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Ce que disent nos clients
          </h2>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <Card
              key={review.name}
              className="border-border/40 hover:shadow-lg transition-shadow duration-300 bg-card"
            >
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-accent/30 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-4 text-sm">
                  "{review.text}"
                </p>
                <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{review.name}</p>
                    <p className="text-muted-foreground text-xs">{review.company}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
