
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import nugget from "@/assets/nugget.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "Conférenciers", path: "/speakers" },
    { name: "Contact", path: "/contact" }, // Placeholder route
  ];

  const isActive = (path: string) => {
    return location.pathname === path ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold font-serif tracking-tight text-primary">
          <img src={nugget} alt="" className="h-8 w-8" />
          <span>Agence <span className="text-accent">-</span> Les Conférenciers</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm transition-colors ${isActive(link.path)}`}
            >
              {link.name}
            </Link>
          ))}
          <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Réserver un talent
          </Button>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b animate-fade-in">
          <div className="flex flex-col p-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-lg py-2 ${isActive(link.path)}`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Button className="w-full bg-primary text-primary-foreground">
              Réserver un talent
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
