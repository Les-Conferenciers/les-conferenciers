import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Mail, User, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import nugget from "@/assets/nugget.png";

type SpeakerConference = {
  title: string;
  description: string | null;
};

type ProposalData = {
  id: string;
  client_name: string;
  message: string | null;
  expires_at: string;
  created_at: string;
  proposal_speakers: {
    total_price: number | null;
    travel_costs: number | null;
    display_order: number;
    speakers: {
      name: string;
      role: string | null;
      image_url: string | null;
      themes: string[] | null;
      biography: string | null;
      key_points: string[] | null;
      slug: string;
      city: string | null;
      speaker_conferences: SpeakerConference[];
    };
  }[];
};

const ProposalView = () => {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check if admin is logged in
      const { data: { session } } = await supabase.auth.getSession();
      const admin = !!session;
      setIsAdmin(admin);

      if (!token) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("proposals")
        .select("id, client_name, message, expires_at, created_at, proposal_speakers(total_price, travel_costs, display_order, speakers(name, role, image_url, themes, biography, key_points, slug, city, speaker_conferences(title, description)))")
        .eq("token", token)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Only block non-admin users when expired
      if (!admin && new Date(data.expires_at) < new Date()) {
        setExpired(true);
        setLoading(false);
        return;
      }

      (data as any).proposal_speakers?.sort((a: any, b: any) => a.display_order - b.display_order);
      setProposal(data as any);
      setLoading(false);
    };
    init();
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
            <a href="mailto:nellysabde@lesconferenciers.com">
              <Mail className="h-4 w-4 mr-2" /> Nous contacter
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const isProposalExpired = new Date(proposal.expires_at) < new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-background">
      {/* Admin banner */}
      {isAdmin && isProposalExpired && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-center py-2 text-xs text-amber-700 font-medium">
          ⚠️ Cette proposition est expirée pour le client — visible uniquement en mode admin
        </div>
      )}

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={nugget} alt="" className="h-6 w-6" />
            <p className="text-sm uppercase tracking-widest opacity-70">Les Conférenciers</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Votre sélection personnalisée</h1>
          {proposal.client_name && (
            <p className="text-sm opacity-80">Pour {proposal.client_name}</p>
          )}
          {proposal.message && (
            <p className="text-sm opacity-80 max-w-xl mx-auto mt-4">{proposal.message}</p>
          )}
          {!isProposalExpired && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs opacity-60">
              <Clock className="h-3 w-3" />
              <span>Valide encore {daysLeft} jour{daysLeft !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </header>

      {/* Speaker Cards */}
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
                <div className="md:w-2/3 p-6 md:p-8 space-y-5">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">Qui est {speaker.name}</h2>
                    {speaker.role && <p className="text-sm text-muted-foreground mt-1">{speaker.role}</p>}
                  </div>

                  {/* Key Points */}
                  {speaker.key_points && speaker.key_points.length > 0 && (
                    <ul className="space-y-1.5">
                      {speaker.key_points.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-accent mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Profile Link */}
                  <a
                    href={`https://www.lesconferenciers.com/conferencier/${speaker.slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Voir son profil complet
                  </a>

                  {/* Conference Summary */}
                  {speaker.speaker_conferences && speaker.speaker_conferences.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-4">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Conférence</h3>
                      {speaker.speaker_conferences.slice(0, 1).map((conf: SpeakerConference, idx: number) => (
                        <div key={idx}>
                          {conf.title && <p className="text-sm font-semibold text-foreground">{conf.title}</p>}
                          {conf.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed mt-1 whitespace-pre-line">{conf.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Tariffs Section */}
        <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">Tarifs proposés</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Conférencier</th>
                  <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Localisation</th>
                  <th className="text-right py-3 pr-4 font-medium text-muted-foreground">Frais de déplacement</th>
                  <th className="text-right py-3 font-medium text-muted-foreground">Prix total TTC</th>
                </tr>
              </thead>
              <tbody>
                {proposal.proposal_speakers.map((ps, i) => {
                  const speaker = ps.speakers as any;
                  if (!speaker) return null;
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-4 pr-4">
                        <span className="font-medium text-foreground">{speaker.name}</span>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">
                        {speaker.city || "—"}
                      </td>
                      <td className="py-4 pr-4 text-right text-muted-foreground">
                        {ps.travel_costs ? `${ps.travel_costs.toLocaleString("fr-FR")} €` : "Inclus"}
                      </td>
                      <td className="py-4 text-right">
                        {ps.total_price ? (
                          <span className="font-bold text-foreground text-lg">{ps.total_price.toLocaleString("fr-FR")} €</span>
                        ) : "Sur devis"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Les tarifs incluent la prestation du conférencier et la commission d'agence. Les frais de déplacement sont indiqués séparément le cas échéant.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 space-y-4">
          <p className="text-muted-foreground text-sm">Un profil vous intéresse ? Contactez-nous pour concrétiser votre événement.</p>
          <Button asChild size="lg">
            <a href="mailto:nellysabde@lesconferenciers.com?subject=Suite à votre proposition">
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
