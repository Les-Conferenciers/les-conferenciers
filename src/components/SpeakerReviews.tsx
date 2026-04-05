import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, User, Quote } from "lucide-react";

interface SpeakerReviewsProps {
  speakerId: string;
  speakerName: string;
}

const StarRating = ({ value }: { value: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);

const SpeakerReviews = ({ speakerId, speakerName }: SpeakerReviewsProps) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", speakerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("speaker_id", speakerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || reviews.length === 0) return null;

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
        <span className="w-1 h-7 bg-accent rounded-full block"></span>
        Ce qu'en pensent nos clients
      </h2>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-border/40">
        <div className="text-3xl font-bold text-foreground">{avgRating}</div>
        <div>
          <StarRating value={Math.round(Number(avgRating))} />
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-5 rounded-xl bg-card border border-border/40 space-y-3"
          >
            <Quote className="h-5 w-5 text-accent/40" />
            {review.comment && (
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                « {review.comment} »
              </p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="bg-accent/10 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-sm">{review.author_name}</span>
                  {(review as any).author_title && (
                    <p className="text-xs text-muted-foreground">{(review as any).author_title}</p>
                  )}
                </div>
              </div>
              <StarRating value={review.rating} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpeakerReviews;
