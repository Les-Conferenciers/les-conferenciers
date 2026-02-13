import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const reviewSchema = z.object({
  author_name: z.string().trim().min(2, "Nom trop court").max(80),
  rating: z.number().min(1).max(5),
  comment: z.string().trim().min(10, "Votre avis doit contenir au moins 10 caractères").max(1000),
});

interface SpeakerReviewsProps {
  speakerId: string;
  speakerName: string;
}

const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const SpeakerReviews = ({ speakerId, speakerName }: SpeakerReviewsProps) => {
  const queryClient = useQueryClient();
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

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

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = reviewSchema.parse({ author_name: authorName, rating, comment });
      const { error } = await supabase.from("reviews").insert({
        speaker_id: speakerId,
        author_name: parsed.author_name,
        rating: parsed.rating,
        comment: parsed.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", speakerId] });
      setAuthorName("");
      setRating(0);
      setComment("");
      setShowForm(false);
      toast.success("Merci pour votre avis !");
    },
    onError: (err: any) => {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Erreur lors de l'envoi de votre avis");
      }
    },
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
        <span className="w-1 h-7 bg-accent rounded-full block"></span>
        Avis
        {reviews.length > 0 && (
          <span className="text-base font-normal text-muted-foreground ml-1">
            ({reviews.length})
          </span>
        )}
      </h2>

      {/* Summary */}
      {avgRating && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-border/40">
          <div className="text-3xl font-bold text-foreground">{avgRating}</div>
          <div>
            <StarRating value={Math.round(Number(avgRating))} readonly />
            <p className="text-sm text-muted-foreground mt-0.5">
              {reviews.length} avis
            </p>
          </div>
        </div>
      )}

      {/* CTA to write */}
      {!showForm && (
        <Button
          variant="outline"
          className="mb-6 rounded-xl gap-2"
          onClick={() => setShowForm(true)}
        >
          <Star className="h-4 w-4" />
          Donner votre avis sur {speakerName}
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-card border border-border/40 space-y-4">
          <h3 className="font-semibold text-foreground">Votre avis</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Note</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Votre nom</label>
            <Input
              placeholder="Jean Dupont"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Votre commentaire</label>
            <Textarea
              placeholder="Partagez votre expérience avec ce conférencier..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              className="rounded-xl min-h-[100px]"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || rating === 0}
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl gap-2"
            >
              <Send className="h-4 w-4" />
              {mutation.isPending ? "Envoi..." : "Publier"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Chargement des avis...</p>
      ) : reviews.length === 0 && !showForm ? (
        <p className="text-muted-foreground text-sm">Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-5 rounded-xl bg-card border border-border/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-accent/10 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">{review.author_name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
              </div>
              <StarRating value={review.rating} readonly />
              {review.comment && (
                <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SpeakerReviews;
