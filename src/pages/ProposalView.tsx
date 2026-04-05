import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Mail, User, ExternalLink, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import nugget from "@/assets/nugget.png";

type SpeakerConference = {
  id: string;
  title: string;
  description: string | null;
};

const ConferenceAccordion = ({ conf }: { conf: SpeakerConference }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left"
      >
        <p className="text-sm font-semibold text-foreground">« {conf.title} »</p>
        <span className="text-xs text-accent ml-3 whitespace-nowrap">
          {open ? "Masquer ▲" : "Voir le détail ▼"}
        </span>
      </button>
      {open && conf.description && (
        <div className="px-3 pb-3 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30">
          <div dangerouslySetInnerHTML={{ __html: conf.description }} />
        </div>
      )}
    </div>
  );
};

type ProposalData = {
  id: string;
  client_name: string;
  client_email: string;
  recipient_name: string | null;
  message: string | null;
  expires_at: string;
  created_at: string;
  proposal_speakers: {
    total_price: number | null;
    travel_costs: number | null;
    display_order: number;
    selected_conference_ids: string[] | null;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [formCompany, setFormCompany] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const admin = !!session;
      setIsAdmin(admin);

      if (!token) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("proposals")
        .select("id, client_name, client_email, recipient_name, message, expires_at, created_at, proposal_speakers(total_price, travel_costs, display_order, selected_conference_ids, speakers(name, role, image_url, themes, biography, key_points, slug, city, speaker_conferences(id, title, description)))")
        .eq("token", token)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!admin && new Date(data.expires_at) < new Date()) {
        setExpired(true);
        setLoading(false);
        return;
      }

      (data as any).proposal_speakers?.sort((a: any, b: any) => a.display_order - b.display_order);
      setProposal(data as any);

      // Pre-fill form
      setFormCompany(data.client_name || "");
      setFormName((data as any).recipient_name || "");
      setFormEmail(data.client_email || "");
      setFormMessage("Bonjour, je suis intéressé par cette proposition, merci de me recontacter.");

      setLoading(false);
    };
    init();
  }, [token]);

  const handleSubmitResponse = async () => {
    if (!formCompany || !formName || !formEmail || !formMessage) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-proposal-response", {
        body: {
          company_name: formCompany,
          full_name: formName,
          email: formEmail,
          phone: formPhone,
          message: formMessage,
          proposal_id: proposal?.id,
        },
      });

      if (error) throw error;

      toast({ title: "Message envoyé !", description: "Nous vous recontacterons dans les plus brefs délais." });
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "Erreur", description: "Une erreur est survenue. Veuillez réessayer.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

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
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Votre proposition personnalisée</h1>
          {(proposal.recipient_name || proposal.client_name) && (
            <p className="text-lg md:text-xl opacity-90 font-medium">
              {proposal.recipient_name
                ? `${proposal.recipient_name} pour ${proposal.client_name}`
                : `Pour ${proposal.client_name}`}
            </p>
          )}
          {!isProposalExpired && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs opacity-60">
              <Clock className="h-3 w-3" />
              <span>Valide encore {daysLeft} jour{daysLeft !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </header>

      {/* Personalized message */}
      {proposal.message && (
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-line">
              {proposal.message}
            </p>
            
          </div>
        </div>
      )}

      {/* Speaker Cards */}
      <main className={`max-w-4xl mx-auto px-4 ${proposal.message ? 'pt-8' : 'pt-12'} pb-12 space-y-8`}>
        {proposal.proposal_speakers.map((ps, i) => {
          const speaker = ps.speakers as any;
          if (!speaker) return null;

          const selectedIds = ps.selected_conference_ids;
          const confsToShow = selectedIds && selectedIds.length > 0
            ? speaker.speaker_conferences?.filter((c: SpeakerConference) => selectedIds.includes(c.id)) || []
            : speaker.speaker_conferences?.slice(0, 1) || [];

          return (
            <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card p-6 md:p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-accent/30 bg-muted">
                    {speaker.image_url ? (
                      <img src={speaker.image_url} alt={speaker.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-foreground">{speaker.name}</h2>
                    {speaker.role && <p className="text-sm text-muted-foreground mt-1">{speaker.role}</p>}
                  </div>

                  {speaker.key_points && speaker.key_points.length > 0 && (
                    <ul className="space-y-1.5">
                      {speaker.key_points.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-accent mt-0.5">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {confsToShow.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-4">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {confsToShow.length > 1 ? "Conférences proposées" : "Conférence proposée"}
                      </h3>
                       {confsToShow.map((conf: SpeakerConference, idx: number) => (
                          <ConferenceAccordion key={idx} conf={conf} />
                        ))}
                    </div>
                  )}

                  <a
                    href={`${window.location.origin}/conferencier/${speaker.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Voir son profil complet
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Tariffs Section */}
        <div className="border border-border rounded-2xl bg-card p-6 md:p-8">
          <h2 className="text-xl font-serif font-bold text-foreground mb-4">Tarifs proposés</h2>
          <p className="text-xs text-muted-foreground mb-6 italic">Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Conférencier</th>
                  <th className="text-right py-3 font-medium text-muted-foreground">Tarif HT</th>
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
                      <td className="py-4 text-right">
                        {ps.total_price ? (
                          <span className="font-bold text-foreground text-lg">{ps.total_price.toLocaleString("fr-FR")} € HT</span>
                        ) : "Sur devis"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 space-y-4">
          <p className="text-muted-foreground text-sm">Un profil vous intéresse ? Contactez-nous pour concrétiser votre événement.</p>
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" /> Répondre à cette proposition
          </Button>
        </div>
      </main>

      {/* Response Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Répondre à cette proposition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="company">Nom de la société *</Label>
              <Input id="company" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Votre société" />
            </div>
            <div>
              <Label htmlFor="fullname">Nom complet *</Label>
              <Input id="fullname" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Prénom Nom" />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemple.com" />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" value={formMessage} onChange={(e) => setFormMessage(e.target.value)} rows={3} />
            </div>
            <Button className="w-full" onClick={handleSubmitResponse} disabled={sending}>
              {sending ? (
                <span className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Envoi en cours…</span>
              ) : (
                <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Envoyer</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Les Conférenciers - Proposition confidentielle
      </footer>
    </div>
  );
};

export default ProposalView;
