import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProposalData = {
  id: string;
  client_name: string;
  message: string | null;
  expires_at: string;
  created_at: string;
  proposal_speakers: {
    total_price: number | null;
    display_order: number;
    speakers: {
      name: string;
      role: string | null;
      image_url: string | null;
      themes: string[] | null;
      biography: string | null;
      slug: string;
    };
  }[];
};

const ProposalView = () => {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("proposals")
        .select("id, client_name, message, expires_at, created_at, proposal_speakers(total_price, display_order, speakers(name, role, image_url, themes, biography, slug))")
        .eq("token", token)
        .single();

      if (error || !data) {
        // Could be expired (RLS blocks it) or truly not found
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setExpired(true);
        setLoading(false);
        return;
      }

      // Sort speakers by display_order
      (data as any).proposal_speakers?.sort((a: any, b: any) => a.display_order - b.display_order);
      setProposal(data as any);
      setLoading(false);
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (notFound || expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {expired ? "Proposition expirée" : "Proposition introuvable"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {expired
              ? "Cette proposition a dépassé sa durée de validité. Veuillez nous contacter pour en recevoir une nouvelle."
              : "Le lien que vous avez utilisé n'est pas valide."}
          </p>
          <Button asChild variant="outline">
            <a href="mailto:contact@lesconferenciers.com">
              <Mail className="h-4 w-4 mr-2" /> Nous contacter
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="text-sm uppercase tracking-widest opacity-70">Les Conférenciers</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Votre sélection personnalisée</h1>
          {proposal.message && (
            <p className="text-sm opacity-80 max-w-xl mx-auto mt-4">{proposal.message}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs opacity-60">
            <Clock className="h-3 w-3" />
            <span>Valide encore {daysLeft} jour{daysLeft !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </header>

      {/* Speakers */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {proposal.proposal_speakers.map((ps, i) => {
          const speaker = ps.speakers as any;
          if (!speaker) return null;

          return (
            <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card">
              <div className="md:flex">
                {/* Photo */}
                <div className="md:w-1/3 bg-muted">
                  {speaker.image_url ? (
                    <img
                      src={speaker.image_url}
                      alt={speaker.name}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="md:w-2/3 p-6 md:p-8 space-y-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">{speaker.name}</h2>
                    {speaker.role && <p className="text-sm text-muted-foreground mt-1">{speaker.role}</p>}
                  </div>

                  {speaker.themes && speaker.themes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {speaker.themes.slice(0, 5).map((t: string) => (
                        <span key={t} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">{t}</span>
                      ))}
                    </div>
                  )}

                  {speaker.biography && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{speaker.biography}</p>
                  )}

                  {ps.total_price && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{ps.total_price.toLocaleString("fr-FR")} €</span>
                        <span className="text-xs text-muted-foreground">TTC</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* CTA */}
        <div className="text-center pt-8 space-y-4">
          <p className="text-muted-foreground text-sm">Un profil vous intéresse ? Contactez-nous pour concrétiser votre événement.</p>
          <Button asChild size="lg">
            <a href="mailto:contact@lesconferenciers.com?subject=Suite à votre proposition">
              <Mail className="h-4 w-4 mr-2" /> Répondre à cette proposition
            </a>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Les Conférenciers — Proposition confidentielle
      </footer>
    </div>
  );
};

export default ProposalView;
