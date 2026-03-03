
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
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
  specialty: string | null;
  languages?: string[] | null;
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
    <Link to={`/speakers/${speaker.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border border-border/40 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-card">
        <div className="flex justify-center pt-6 pb-2">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-accent/20 shadow-lg group-hover:border-accent/40 transition-all duration-300">
            <img
              src={imageUrl}
              alt={`${speaker.name} - conférencier professionnel`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>
        </div>
        <CardHeader className="pt-2 pb-1 text-center">
          <h3 className="text-lg font-bold leading-tight group-hover:text-accent transition-colors">
            {speaker.name}
          </h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
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
