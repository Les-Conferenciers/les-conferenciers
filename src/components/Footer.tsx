import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import nugget from "@/assets/nugget.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={nugget} alt="" className="h-7 w-7" />
              <span className="font-serif font-bold text-xl">Les Conférenciers</span>
            </Link>
            <p className="text-primary-foreground/70 max-w-md leading-relaxed text-sm">
              Agence de conférenciers et de célébrités. Trouvez le conférencier idéal pour vos événements professionnels.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Navigation</h4>
            <ul className="space-y-2 text-primary-foreground/70 text-sm">
              <li><Link to="/" className="hover:text-accent transition-colors">Accueil</Link></li>
              <li><Link to="/conferenciers" className="hover:text-accent transition-colors">Nos Conférenciers</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" /> 06 95 93 97 91
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" /> contact@lesconferenciers.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> Paris, France
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-primary-foreground/50">
          <p>© {new Date().getFullYear()} Agence - Les Conférenciers. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-accent transition-colors">RGPD</a>
            <a href="#" className="hover:text-accent transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
