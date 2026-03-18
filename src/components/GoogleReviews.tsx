import { Star, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type GoogleReview = {
  id: string;
  author_name: string;
  author_photo_url: string | null;
  rating: number;
  comment: string | null;
  review_date: string | null;
  relative_time: string | null;
  avatar_color: string;
};

// Fallback reviews in case DB is empty
const FALLBACK_REVIEWS: Omit<GoogleReview, "id">[] = [
  {
    author_name: "Rossel Axele",
    author_photo_url: null,
    rating: 5,
    comment:
      "Excellente collaboration avec l'agence pour notre conférence avec une personnalité : Nelly est une vraie professionnelle, réactive et à l'écoute de nos besoins.",
    review_date: "17 Février 2026",
    relative_time: "il y a 2 semaines",
    avatar_color: "#EA4335",
  },
  {
    author_name: "Pascale L",
    author_photo_url: null,
    rating: 5,
    comment:
      "Nous avons fait appel à l'agence Les Conférenciers pour notre événement de fin d'année et nous en sommes pleinement satisfaits. Un accompagnement professionnel du début à la fin.",
    review_date: "14 Janvier 2026",
    relative_time: "il y a 2 mois",
    avatar_color: "#4285F4",
  },
  {
    author_name: "Anne-Laure Astier",
    author_photo_url: null,
    rating: 5,
    comment:
      "J'ai apprécié le professionnalisme et le suivi de Nelly tout au long de l'organisation de l'événement qui a été du reste un franc succès.",
    review_date: "19 Décembre 2025",
    relative_time: "il y a 3 mois",
    avatar_color: "#34A853",
  },
  {
    author_name: "SERVICE RH SEMARDEL",
    author_photo_url: null,
    rating: 5,
    comment:
      "Un accompagnement de qualité et réactif. Merci à toute l'équipe pour leur professionnalisme et leur disponibilité.",
    review_date: "2 Décembre 2025",
    relative_time: "il y a 3 mois",
    avatar_color: "#FBBC05",
  },
  {
    author_name: "Virginie Ber",
    author_photo_url: null,
    rating: 5,
    comment:
      "Nous avons été ravis par la prestation de l'Agence Les Conférenciers. Efficacité, réactivité et professionnalisme sont au rendez-vous.",
    review_date: "20 Novembre 2025",
    relative_time: "il y a 4 mois",
    avatar_color: "#FF6D01",
  },
  {
    author_name: "Elodie Hamel",
    author_photo_url: null,
    rating: 5,
    comment:
      "Je recommande pour une expérience parfaite ! Une grande qualité d'écoute et un suivi irréprochable de A à Z.",
    review_date: "21 Octobre 2025",
    relative_time: "il y a 5 mois",
    avatar_color: "#46BDC6",
  },
];

const GoogleReviews = () => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(63);
  const [averageRating, setAverageRating] = useState(5.0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Use type cast since google_reviews isn't in auto-generated types yet
        const { data, error } = await (supabase as any)
          .from("google_reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          setReviews(data as GoogleReview[]);
          const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
        } else {
          setReviews(FALLBACK_REVIEWS.map((r, i) => ({ ...r, id: `fallback-${i}` })));
        }
      } catch {
        setReviews(FALLBACK_REVIEWS.map((r, i) => ({ ...r, id: `fallback-${i}` })));
      }
    };

    fetchReviews();
  }, []);

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <section className="py-20 px-4 bg-secondary/20" id="avis">
      <div className="container mx-auto max-w-6xl">
        {/* Google Header Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-8">
            <svg viewBox="0 0 272 92" width="100" height="34" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
                fill="#EA4335"
              />
              <path
                d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
                fill="#FBBC05"
              />
              <path
                d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"
                fill="#4285F4"
              />
              <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853" />
              <path
                d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"
                fill="#EA4335"
              />
              <path
                d="M35.29 41.19V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49-.21z"
                fill="#4285F4"
              />
            </svg>
            <span className="text-muted-foreground font-medium text-lg">Excellent</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-foreground text-lg">{averageRating}</span>
            <span className="text-muted-foreground text-lg">|</span>
            <span className="text-muted-foreground text-lg">{totalReviews} avis</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-card border border-border/50 rounded-xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300 relative"
            >
              {/* Google icon */}
              <div className="absolute top-5 right-5">
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path
                    d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                    fill="#FFC107"
                  />
                  <path
                    d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                    fill="#FF3D00"
                  />
                  <path
                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                    fill="#4CAF50"
                  />
                  <path
                    d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                    fill="#1976D2"
                  />
                </svg>
              </div>

              {/* Author info */}
              <div className="flex items-center gap-3 mb-3">
                {review.author_photo_url ? (
                  <img
                    src={review.author_photo_url}
                    alt={review.author_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: review.avatar_color }}
                  >
                    {getInitial(review.author_name)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground text-sm leading-tight">{review.author_name}</p>
                  <p className="text-xs text-muted-foreground">{review.review_date || review.relative_time}</p>
                </div>
              </div>

              {/* Stars + verified */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">{review.comment}</p>
              )}

              {review.comment && review.comment.length > 150 && (
                <button className="text-xs text-primary mt-1 hover:underline">Lire la suite</button>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              window.open(
                "https://www.google.com/search?sca_esv=9a0f969563c68435&hl=fr&authuser=0&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOfMivPk97iOYuveCww4z1Y2jbPv0W2P7uA7h8i6ePtprg6jsbLcOMml4ixd5bS83Qu02WfiEaluEtuixqdnHP7zWiywt2Oq1tbtHqwCl78gkr6LdFQ%3D%3D&q=Agence+Les+Conf%C3%A9renciers+Avis&sa=X&ved=2ahUKEwiM3rPvkqqTAxVKSvEDHZ3EG-8Q0bkNegQIIhAF&biw=1635&bih=834&dpr=1.8",
                "_blank",
              )
            }
          >
            <ExternalLink className="h-4 w-4" />
            Voir tous les avis sur Google
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
