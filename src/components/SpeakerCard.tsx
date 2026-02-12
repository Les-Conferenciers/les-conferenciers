
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export interface Speaker {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  themes: string[] | null;
  image_url: string | null;
  biography: string | null;
}

interface SpeakerCardProps {
  speaker: Speaker;
}

const GRADIENT_PALETTES = [
  "from-primary to-accent",
  "from-accent to-primary",
  "from-primary/80 to-accent/60",
  "from-accent/80 to-primary/60",
  "from-primary to-muted-foreground",
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
};

const SpeakerCard = ({ speaker }: SpeakerCardProps) => {
  const hasImage = speaker.image_url && speaker.image_url !== "/placeholder.svg";

  return (
    <Link to={`/speaker/${speaker.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border border-border/40 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-card">
        <div className="aspect-[3/4] overflow-hidden relative">
          {hasImage ? (
            <img
              src={speaker.image_url!}
              alt={speaker.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getGradient(speaker.name)} flex items-center justify-center`}>
              <span className="text-5xl font-bold text-primary-foreground/90 select-none tracking-widest">
                {getInitials(speaker.name)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <span className="text-white font-medium flex items-center gap-2">
              Voir le profil <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
        <CardHeader className="pt-5 pb-1">
          <h3 className="text-lg font-bold leading-tight group-hover:text-accent transition-colors">
            {speaker.name}
          </h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {speaker.role}
          </p>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {speaker.biography}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-1.5 pt-0 mt-auto pb-5">
          {speaker.themes?.slice(0, 3).map((theme) => (
            <Badge key={theme} variant="secondary" className="bg-secondary/50 text-secondary-foreground text-xs">
              {theme}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default SpeakerCard;
