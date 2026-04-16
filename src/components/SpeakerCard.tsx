
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";
import { getImagePositionStyle, parseImagePosition } from "@/lib/imagePosition";
import { User } from "lucide-react";

export interface Speaker {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  themes: string[] | null;
  image_url: string | null;
  image_position: string | null;
  biography: string | null;
  specialty: string | null;
  languages?: string[] | null;
}

interface SpeakerCardProps {
  speaker: Speaker;
  onThemeClick?: (theme: string) => void;
  onNavigate?: () => void;
}

const SpeakerCard = ({ speaker, onThemeClick, onNavigate }: SpeakerCardProps) => {
  const navigate = useNavigate();
  const imageUrl = speaker.image_url && speaker.image_url !== "/placeholder.svg"
    ? speaker.image_url
    : null;
  const themes = parseThemes(speaker.themes);
  const imageSettings = parseImagePosition(speaker.image_position);

  const handleThemeClick = (e: React.MouseEvent, theme: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onThemeClick) {
      onThemeClick(theme);
    } else {
      navigate(`/conferencier?theme=${encodeURIComponent(theme)}`);
    }
  };

  return (
    <Link to={`/conferencier/${speaker.slug}`} className="group block h-full" onClick={onNavigate}>
      <Card className="h-full overflow-hidden border border-border/40 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-card">
        <div className="flex justify-center pt-6 pb-2">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-accent/20 shadow-lg group-hover:border-accent/40 transition-all duration-300 bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${speaker.name} - conférencier professionnel`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={getImagePositionStyle(imageSettings)}
                loading="lazy"
                decoding="async"
                width={128}
                height={128}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 md:w-14 md:h-14 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
        <CardHeader className="pt-2 pb-1 text-center">
          <h3 className="text-lg font-bold leading-tight group-hover:text-accent transition-colors">
            {speaker.name}
          </h3>
          <p className="text-muted-foreground/80 text-xs italic leading-snug tracking-wide">
            {speaker.specialty || speaker.role}
          </p>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-1.5 pt-0 mt-auto pb-5 justify-center">
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
