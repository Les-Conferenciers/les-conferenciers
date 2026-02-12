
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

const SpeakerCard = ({ speaker }: SpeakerCardProps) => {
  return (
    <Link to={`/speaker/${speaker.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-card">
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={speaker.image_url || "/placeholder.svg"}
            alt={speaker.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <span className="text-white font-medium flex items-center gap-2">
              Voir le profil <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
        <CardHeader className="pt-6 pb-2">
          <h3 className="text-xl font-bold font-serif leading-tight group-hover:text-accent transition-colors">
            {speaker.name}
          </h3>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            {speaker.role}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
            {speaker.biography}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-0 mt-auto">
          {speaker.themes?.slice(0, 3).map((theme) => (
            <Badge key={theme} variant="secondary" className="bg-secondary/50 text-secondary-foreground hover:bg-secondary">
              {theme}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default SpeakerCard;
