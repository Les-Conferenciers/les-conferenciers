
import { useState } from "react";
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
import { Send, CheckCircle2, Star, Shield, Clock, Users, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";
import nellySelfies from "@/assets/nelly-selfies.png";

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
  { name: "Thales", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/thales66cd98d746fb3_150_150.jpg" },
  { name: "EDF", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/edf66bc7f8ead2dc_150_150.png" },
  { name: "Decathlon", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/decathlon66bc7f8eb1fff_150_150.png" },
  { name: "SNCF", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/sncf66bc7f8ea0415_150_150.jpg" },
  { name: "Orange", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/orange66bc7f90f39cc_150_150.jpg" },
  { name: "Hermès", src: "https://www.lesconferenciers.com/wp-content/uploads/continuous-image-carousel-with-lightbox/hermes66bc7f8eaac82_150_150.png" },
];

const REASSURANCE = [
  { icon: Clock, label: "Réponse sous 24h", desc: "Nelly vous répond personnellement" },
  { icon: Users, label: "500+ événements", desc: "Accompagnés avec succès" },
  { icon: Shield, label: "Satisfaction garantie", desc: "Accompagnement sur-mesure" },
];

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    await new Promise((r) => setTimeout(r, 800));
    console.log("Contact form submitted");
    setSubmitted(true);
    toast.success("Votre demande a bien été envoyée !");
    reset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-primary py-14 px-4 text-center">
        <img src={logo} alt="Les Conférenciers" className="h-10 mx-auto mb-6 brightness-0 invert" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3 tracking-tight">
          Trouvez le conférencier idéal
        </h1>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6 text-lg">
          Décrivez votre projet, Nelly vous propose les meilleurs profils sous 24h.
        </p>
        <Button
          size="lg"
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-2 px-8 shadow-lg hover:shadow-xl transition-all"
          onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}
        >
          <Send className="h-5 w-5" />
          Demander un devis gratuit
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>

        {/* Reassurance pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {REASSURANCE.map((r) => (
            <div key={r.label} className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 border border-primary-foreground/15">
              <r.icon className="h-4 w-4 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-14 flex-grow">
        <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">

          {/* Left sidebar - Nelly + trust */}
          <div className="lg:col-span-2 space-y-8">
            {/* Nelly card */}
            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-accent/40 ring-4 ring-accent/10">
                  <img
                    src="https://emmalamagicienne.fr/wp-content/uploads/2017/03/emma.png"
                    alt="Nelly, votre interlocutrice dédiée"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">Nelly</h3>
                  <p className="text-sm text-accent font-semibold">Votre interlocutrice dédiée</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1.5 font-medium">5/5</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                « Forte de 10+ ans d'expérience dans l'événementiel, je vous guide vers le conférencier parfait pour votre projet. »
              </p>
            </div>

            {/* Nelly selfies - reassurance */}
            <div className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-sm">
              <div className="relative">
                <img
                  src={nellySelfies}
                  alt="Nelly aux côtés des conférenciers lors d'événements"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                  <p className="text-white text-sm font-semibold leading-snug">
                    Nelly assiste à chaque conférence et connaît personnellement chaque intervenant.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-accent/5 border-t border-accent/10">
                <p className="text-xs text-muted-foreground italic text-center">
                  « Je sélectionne chaque conférencier avec exigence car je les ai tous vus sur scène. »
                </p>
              </div>
            </div>

            {/* Google Reviews snippet */}
            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span className="font-semibold text-sm text-foreground">Avis Google</span>
                <div className="flex gap-0.5 ml-auto">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">5/5</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Marie L.", text: "Accompagnement exceptionnel, conférencier parfait pour notre séminaire !" },
                  { name: "Thomas B.", text: "Réactivité et professionnalisme. Je recommande vivement." },
                ].map((review) => (
                  <div key={review.name} className="border-l-2 border-accent/40 pl-3">
                    <p className="text-xs text-muted-foreground italic">"{review.text}"</p>
                    <p className="text-xs font-semibold text-foreground mt-1">— {review.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Client logos */}
            <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-4">Ils nous font confiance</p>
              <div className="grid grid-cols-3 gap-4">
                {CLIENT_LOGOS.map((l) => (
                  <div key={l.name} className="flex items-center justify-center h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                    <img src={l.src} alt={l.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div id="contact-form" className="lg:col-span-3 scroll-mt-24">
            <div className="bg-card rounded-2xl border border-border/40 p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-foreground">Réservez un conférencier</h2>
                <p className="text-sm text-muted-foreground mt-1">Remplissez le formulaire, Nelly vous contacte sous 24h.</p>
              </div>

              {submitted ? (
                <div className="text-center py-16 space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-accent mx-auto" />
                  <h3 className="text-2xl font-bold">Merci pour votre demande !</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Nelly vous contactera dans les plus brefs délais pour discuter de votre projet.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                    Envoyer une autre demande
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input id="name" placeholder="Jean Dupont" {...register("name")} />
                      {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel *</Label>
                      <Input id="email" type="email" placeholder="jean@entreprise.fr" {...register("email")} />
                      {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input id="company" placeholder="Nom de l'entreprise" {...register("company")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" {...register("phone")} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Date de l'événement</Label>
                      <Input id="eventDate" type="date" {...register("eventDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Type d'événement</Label>
                      <Input id="eventType" placeholder="Séminaire, conférence, gala..." {...register("eventType")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Décrivez votre projet *</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Thématique souhaitée, nombre de participants, objectifs de l'événement..."
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
                    {isSubmitting ? "Envoi en cours..." : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Envoyer ma demande gratuite
                      </span>
                    )}
                  </Button>

                  {/* Micro-reassurance under CTA */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-accent" /> Sans engagement</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-accent" /> Réponse sous 24h</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Devis gratuit</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
