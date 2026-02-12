
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";

const DEFAULT_IMAGE = "https://www.lesconferenciers.com/wp-content/uploads/2022/05/thierry-marx-portrait.png";

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
  onThemeClick?: (theme: string) => void;
}

const SpeakerCard = ({ speaker, onThemeClick }: SpeakerCardProps) => {
  const navigate = useNavigate();
  const imageUrl = speaker.image_url && speaker.image_url !== "/placeholder.svg"
    ? speaker.image_url
    : DEFAULT_IMAGE;
  const themes = parseThemes(speaker.themes);

  const handleThemeClick = (e: React.MouseEvent, theme: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onThemeClick) {
      onThemeClick(theme);
    } else {
      navigate(`/speakers?theme=${encodeURIComponent(theme)}`);
    }
  };

  return (
    <Link to={`/speaker/${speaker.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border border-border/40 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-card">
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={imageUrl}
            alt={speaker.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
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
          {themes.slice(0, 3).map((theme) => (
            <button
              key={theme}
              onClick={(e) => handleThemeClick(e, theme)}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${getThemeColor(theme)}`}
            >
              {theme}
            </button>
          ))}
          {themes.length > 3 && (
            <span className="text-xs text-muted-foreground">+{themes.length - 3}</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default SpeakerCard;
