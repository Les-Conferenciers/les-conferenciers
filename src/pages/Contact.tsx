import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, CheckCircle2, Clock, Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import nellyBuste from "@/assets/nelly-buste-medaillon.png";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100, "100 caractères max"),
  email: z.string().trim().email("Email invalide").max(255),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  eventType: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Le message est requis").max(2000, "2000 caractères max"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const CLIENT_LOGOS = [
  { name: "Thales", src: "/logos/thales66cd98d746fb3.jpg" },
  { name: "EDF", src: "/logos/edf66bc7f8ead2dc.png" },
  { name: "Decathlon", src: "/logos/decathlon66bc7f8eb1fff.png" },
  { name: "SNCF", src: "/logos/sncf66bc7f8ea0415.jpg" },
  { name: "Orange", src: "/logos/orange66bc7f90f39cc.jpg" },
  { name: "Hermès", src: "/logos/hermes66bc7f8eaac82.png" },
];

const SocialProofCard = () => {
  const [review, setReview] = useState<any>(null);
  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("google_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.[0]) setReview(data[0]);
    };
    load();
  }, []);

  const item = review || {
    author_name: "SERVICE RH SEMARDEL",
    comment:
      "Un accompagnement de qualité et réactif. Merci à toute l'équipe pour leur professionnalisme et leur disponibilité.",
  };

  return (
    <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
      <Quote className="h-4 w-4 text-accent mb-1.5" />
      <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">"{item.comment}"</p>
      <div className="flex items-center gap-1.5 mt-2">
        <div className="flex gap-px">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-[11px] font-medium text-foreground">— {item.author_name}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">50+ entreprises · 5/5 Google</p>
    </div>
  );
};

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contact - Demandez un devis gratuit | Les Conférenciers";
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        "Contactez notre agence de conférenciers. Recevez une proposition personnalisée sous 24h. Devis gratuit, accompagnement sur mesure pour votre événement.",
      );
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = "https://www.lesconferenciers.com/contact";
    return () => {
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, []);
  const [searchParams] = useSearchParams();
  const speakerName = searchParams.get("speaker") || "";
  const conferenceName = searchParams.get("conference") || "";
  const prefillMessage = searchParams.get("message") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    if (prefillMessage) {
      setValue("message", prefillMessage);
    } else if (speakerName) {
      const prefill = conferenceName
        ? `Je suis intéressé(e) par la conférence « ${conferenceName} » de ${speakerName}.`
        : `Je suis intéressé(e) par le profil de ${speakerName}.`;
      setValue("message", prefill);
    }
  }, [speakerName, conferenceName, prefillMessage, setValue]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setSubmitted(true);
      toast.success("Votre demande a bien été envoyée !");
      reset();
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero compact */}
      <div className="bg-primary py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3 tracking-tight">
            Trouvez le conférencier idéal
          </h1>
          <p className="text-primary-foreground/75 max-w-lg mx-auto text-base">
            Parlez-nous de votre projet et recevez une proposition personnalisée sous 24h.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Form — takes priority */}
          <div id="contact-form" className="lg:col-span-2 order-1">
            <div className="bg-card rounded-2xl border border-border/40 p-7 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-foreground">Demandez un devis gratuit</h2>
                <p className="text-sm text-muted-foreground mt-1">Nelly vous répond personnellement sous 24h.</p>
              </div>

              {submitted ? (
                <div className="text-center py-14 space-y-4">
                  <CheckCircle2 className="h-14 w-14 text-accent mx-auto" />
                  <h3 className="text-2xl font-bold text-foreground">Merci pour votre demande !</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Nelly vous contactera dans les plus brefs délais.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                    Envoyer une autre demande
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input id="name" placeholder="Jean Dupont" {...register("name")} />
                      {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email professionnel *</Label>
                      <Input id="email" type="email" placeholder="jean@entreprise.fr" {...register("email")} />
                      {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input id="company" placeholder="Nom de l'entreprise" {...register("company")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" type="tel" placeholder="06 12 34 56 78" {...register("phone")} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="eventDate">Date de l'événement</Label>
                      <Input id="eventDate" type="date" {...register("eventDate")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eventType">Type d'événement</Label>
                      <Input id="eventType" placeholder="Séminaire, conférence…" {...register("eventType")} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Votre projet *</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Thématique, nombre de participants, objectifs…"
                      {...register("message")}
                    />
                    {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base h-12 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting ? (
                      "Envoi en cours…"
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Envoyer ma demande
                      </span>
                    )}
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-5 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-accent" /> Réponse sous 24h
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Devis gratuit
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right sidebar — reassurance épurée */}
          <div className="lg:col-span-1 order-2 space-y-6">
            {/* Nelly card */}
            <div className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-sm">
              <div className="flex justify-center bg-muted/30 pt-4 px-4">
                <img
                  src={nellyBuste}
                  alt="Nelly, fondatrice de l'agence"
                  className="w-44 h-auto object-contain drop-shadow-lg"
                />
              </div>
              <div className="px-5 pb-5 pt-3 text-center">
                <h3 className="font-serif font-bold text-foreground text-base">Nelly, votre interlocutrice</h3>
                <p className="text-muted-foreground text-xs leading-relaxed mt-1.5">
                  Elle vous accompagne personnellement de A à Z pour trouver le conférencier idéal pour votre événement.
                </p>
                <p className="text-xs text-accent font-medium mt-3 italic">
                  « Un seul interlocuteur, une relation de confiance. »
                </p>
              </div>
            </div>

            {/* Preuve sociale */}
            <SocialProofCard />

            {/* Logos clients — en couleur */}
            <div className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-3">
                Ils nous font confiance
              </p>
              <div className="grid grid-cols-3 gap-3">
                {CLIENT_LOGOS.map((l) => (
                  <div
                    key={l.name}
                    className="flex items-center justify-center h-14 hover:scale-105 transition-transform"
                  >
                    <img src={l.src} alt={l.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
