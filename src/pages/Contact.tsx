
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

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
    // For now just simulate a submission
    await new Promise((r) => setTimeout(r, 800));
    console.log("Contact form submitted");
    setSubmitted(true);
    toast.success("Votre demande a bien été envoyée !");
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="bg-primary py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
          Contactez-nous
        </h1>
        <p className="text-primary-foreground/80 max-w-2xl mx-auto">
          Une question, un projet d'événement ? Remplissez le formulaire et notre équipe vous répondra sous 24h.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Restons en contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Notre équipe d'experts vous accompagne dans la sélection du conférencier idéal pour votre événement.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <p className="text-muted-foreground text-sm">contact@speaker-agency.fr</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Téléphone</p>
                  <p className="text-muted-foreground text-sm">+33 1 23 45 67 89</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Adresse</p>
                  <p className="text-muted-foreground text-sm">Paris, France</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="lg:col-span-2 border border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <h3 className="text-xl font-bold">Réservez un conférencier</h3>
              <p className="text-sm text-muted-foreground">Décrivez votre projet et nous vous proposerons les meilleurs profils.</p>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-16 space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-accent mx-auto" />
                  <h3 className="text-2xl font-bold">Merci pour votre demande !</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Notre équipe vous contactera dans les plus brefs délais pour discuter de votre projet.
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
                      <Label htmlFor="email">Email *</Label>
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
                    <Label htmlFor="message">Votre message *</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Décrivez votre événement, le profil de conférencier recherché, le nombre de participants..."
                      {...register("message")}
                    />
                    {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    {isSubmitting ? "Envoi en cours..." : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Envoyer ma demande
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;
