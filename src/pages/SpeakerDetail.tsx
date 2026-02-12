
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Mail, Linkedin, Twitter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";
import { useEffect } from "react";

const DEFAULT_IMAGE = "https://www.lesconferenciers.com/wp-content/uploads/2022/05/thierry-marx-portrait.png";

const SpeakerDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: speaker, isLoading } = useQuery({
    queryKey: ["speaker", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // SEO
  useEffect(() => {
    if (speaker) {
      document.title = speaker.seo_title || `${speaker.name} - Speaker Agency`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", speaker.meta_description || "");
      } else {
        const meta = document.createElement('meta');
        meta.name = "description";
        meta.content = speaker.meta_description || "";
        document.head.appendChild(meta);
      }
    }
  }, [speaker]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Conférencier non trouvé</h1>
            <Button onClick={() => navigate("/speakers")}>Retour à la liste</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Image & Quick Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="max-w-[240px] mx-auto lg:mx-0">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-border/40">
                <img 
                  src={speaker.image_url || DEFAULT_IMAGE} 
                  alt={speaker.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-4">
               <h3 className="font-serif font-bold text-xl">Réseaux Sociaux</h3>
               <div className="flex gap-4">
                 <Button variant="outline" size="icon" className="rounded-full">
                   <Linkedin className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="icon" className="rounded-full">
                   <Twitter className="h-4 w-4" />
                 </Button>
               </div>
            </div>

            <div className="bg-secondary/30 p-6 rounded-lg border border-secondary">
              <h3 className="font-serif font-bold text-lg mb-4">Intéressé par ce profil ?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contactez-nous pour vérifier la disponibilité de {speaker.name} pour votre événement.
              </p>
              <Button className="w-full gap-2">
                <Mail className="h-4 w-4" /> Demander un devis
              </Button>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-9 space-y-8">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {parseThemes(speaker.themes).map((theme: string) => (
                  <button
                    key={theme}
                    onClick={() => navigate(`/speakers?theme=${encodeURIComponent(theme)}`)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition-colors hover:opacity-80 cursor-pointer ${getThemeColor(theme)}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">
                {speaker.name}
              </h1>
              <p className="text-xl text-muted-foreground font-medium uppercase tracking-wide">
                {speaker.role}
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
              {speaker.biography?.split('\n').map((paragraph: string, idx: number) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>

            <div className="bg-card shadow-sm border rounded-xl p-8 mt-8">
              <h3 className="text-2xl font-serif font-bold mb-6 text-primary flex items-center gap-2">
                <span className="w-1 h-8 bg-accent block rounded-full"></span>
                Points Clés
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {speaker.key_points?.map((point: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors">
                    <div className="mt-1 bg-accent/10 p-1 rounded-full">
                      <Check className="h-4 w-4 text-accent" />
                    </div>
                    <span className="font-medium text-foreground">{point}</span>
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

export default SpeakerDetail;
