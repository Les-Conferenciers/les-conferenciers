import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const SpeakersHelpCard = () => (
  <div className="h-full min-h-[360px] rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-between text-center p-8 shadow-sm">
    <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Les Conférenciers</p>
    <div>
      <h2 className="text-3xl font-bold leading-tight">
        Vous êtes
        <br />
        <span className="italic text-accent">perdu ?</span>
      </h2>
      <p className="mt-4 text-sm text-primary-foreground/80 leading-relaxed">
        Parlez-nous de votre événement : nous vous proposons une sélection sur mesure sous 24 h.
      </p>
    </div>
    <Link
      to="/contact"
      className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
    >
      On vous guide <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

export default SpeakersHelpCard;
