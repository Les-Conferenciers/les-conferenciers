import { Star, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

const GoogleReviews = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Elfsight widget script
    const script = document.createElement("script");
    script.src = "https://static.elfsight.com/platform/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up if needed
      const existing = document.querySelector('script[src="https://static.elfsight.com/platform/platform.js"]');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <section className="py-20 px-4 bg-secondary/20" id="avis">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-card border border-border/60 rounded-full px-5 py-2.5 shadow-sm mb-6">
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="font-semibold text-foreground">Avis Google</span>
            <div className="flex gap-0.5 ml-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-foreground">5/5</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Ce que disent nos clients
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Découvrez les retours authentiques de nos clients sur Google
          </p>
        </div>

        {/* Elfsight Google Reviews Widget */}
        <div className="max-w-5xl mx-auto" ref={widgetRef}>
          <div className="elfsight-app-47b0c4db-8ddf-4010-b498-0151a20e4ef6" data-elfsight-app-lazy></div>
        </div>

        {/* Fallback / CTA */}
        <div className="text-center mt-10">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open("https://www.google.com/search?q=lesconferenciers.com+avis", "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            Voir tous les avis sur Google
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
