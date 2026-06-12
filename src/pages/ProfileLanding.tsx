import { useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

type FaqItem = { question: string; answer: string };
type Profile = {
  id: string;
  slug: string;
  name: string;
  landing_label: string;
  landing_enabled: boolean;
  seo_title: string | null;
  meta_description: string | null;
  intro_html: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_button_label: string | null;
  linked_profile_ids: string[] | null;
  extra_speaker_ids: string[] | null;
  faq: FaqItem[];
};

const BASE_URL = "https://www.lesconferenciers.com";

const ProfileLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["profile-landing", slug, isPreview],
    queryFn: async () => {
      let q = supabase.from("speaker_profiles").select("*").eq("slug", slug!);
      if (!isPreview) q = q.eq("landing_enabled", true);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, faq: Array.isArray(data.faq) ? (data.faq as unknown as FaqItem[]) : [] } as Profile;
    },
    enabled: !!slug,
  });

  const { data: speakers, isLoading: sLoading } = useQuery({
    queryKey: ["profile-speakers", profile?.id, profile?.linked_profile_ids, profile?.extra_speaker_ids],
    enabled: !!profile?.id,
    queryFn: async () => {
      const profileIds = [profile!.id, ...(profile!.linked_profile_ids || [])];
      const extraIds = profile!.extra_speaker_ids || [];

      const byProfilePromise = supabase
        .from("speakers")
        .select("*")
        .eq("archived", false)
        .in("profile_id", profileIds)
        .limit(500);

      const byExtraPromise = extraIds.length
        ? supabase.from("speakers").select("*").eq("archived", false).in("id", extraIds)
        : Promise.resolve({ data: [] as any[], error: null });

      const [r1, r2] = await Promise.all([byProfilePromise, byExtraPromise]);
      if (r1.error) throw r1.error;
      if ((r2 as any).error) throw (r2 as any).error;

      const map = new Map<string, Speaker & { display_order?: number }>();
      [...((r1.data as any[]) || []), ...((r2 as any).data || [])].forEach((s: any) => map.set(s.id, s));
      const list = Array.from(map.values());
      list.sort((a: any, b: any) => {
        const ao = a.display_order ?? 999;
        const bo = b.display_order ?? 999;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name, "fr");
      });
      return list;
    },
  });

  const canonical = `${BASE_URL}/conferencier/profil/${slug}`;

  useEffect(() => {
    if (!profile) return;
    document.title = profile.seo_title || profile.landing_label;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && profile.meta_description) metaDesc.setAttribute("content", profile.meta_description);
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canon) { canon = document.createElement("link"); canon.setAttribute("rel", "canonical"); document.head.appendChild(canon); }
    canon.href = canonical;
    return () => { document.querySelector('link[rel="canonical"]')?.remove(); };
  }, [profile, canonical]);

  useEffect(() => {
    if (!profile?.faq?.length) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: profile.faq.map(f => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
    script.dataset.faqLd = "1";
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [profile]);

  if (!pLoading && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-8 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
            <p className="text-muted-foreground mb-4">Ce profil n'existe pas ou n'est pas publié.</p>
            <Link to="/conferencier"><Button>Voir tous les conférenciers</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="relative bg-primary py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://ibvjijamybwagxrniyjv.supabase.co/storage/v1/object/public/speaker-photos/og/lesconferenciers.jpg')] bg-cover bg-center" aria-hidden="true" />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
            {profile?.landing_label || <Skeleton className="h-10 w-96 mx-auto" />}
          </h1>
          {profile?.subtitle && (
            <p className="text-primary-foreground/80 text-lg">{profile.subtitle}</p>
          )}
          {profile?.intro_html && (
            <div
              className="text-primary-foreground/80 text-lg [&_a]:underline mt-4"
              dangerouslySetInnerHTML={{ __html: profile.intro_html }}
            />
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 flex-grow">
        {(pLoading || sLoading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !speakers || speakers.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">Aucun conférencier pour ce profil pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {speakers.map(s => (
              <SpeakerCard key={s.id} speaker={s} />
            ))}
          </div>
        )}

        <div className="mt-12 max-w-2xl mx-auto text-center bg-card rounded-2xl p-8 shadow-sm border border-border/30">
          <p className="text-foreground text-sm md:text-base leading-relaxed mb-6 whitespace-pre-line">
            {profile?.cta_text || "Tous nos conférenciers ne sont pas présents sur le site. Vous cherchez un profil en particulier ? Contactez-nous pour une proposition personnalisée adaptée à votre événement."}
          </p>
          <Button
            variant="outline"
            className="rounded-xl font-semibold gap-2 border-foreground/20 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
            onClick={() => window.location.href = "/contact"}
          >
            {profile?.cta_button_label || "Nous contacter"} <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>

        {profile?.faq && profile.faq.length > 0 && (
          <section className="max-w-3xl mx-auto mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {profile.faq.map((item, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="border rounded-md px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-line">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProfileLanding;
