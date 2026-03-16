import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Legal = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-grow max-w-3xl">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Mentions légales</h1>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <h2 className="text-xl font-semibold">Éditeur</h2>
          <p>
            Agence Les Conférenciers<br />
            4 rue de Vanves<br />
            92130 Issy-les-Moulineaux<br />
            <a href="tel:0695939791" className="text-accent hover:underline">06 95 93 97 91</a><br />
            <a href="mailto:contact@lesconferenciers.com" className="text-accent hover:underline">contact@lesconferenciers.com</a>
          </p>
          <p>La directrice de la publication du site internet est Nelly SABDE.</p>

          <h2 className="text-xl font-semibold">Hébergement</h2>
          <p>
            OVH<br />
            2 rue Kellermann – 59100 Roubaix – France – Tél. 0820 698 765<br />
            RCS Roubaix – Tourcoing n°424 761 419
          </p>

          <h2 className="text-xl font-semibold">Informations sur les produits & services</h2>
          <p>
            Les informations présentes sur le Site sont susceptibles d'évoluer à tout moment sans préavis.
            Les Conférenciers s'efforcera d'assurer leur mise à jour au fur et à mesure des évolutions apportées aux produits et services, ainsi qu'en fonction des évolutions législatives ou réglementaires éventuelles.
          </p>
          <p>
            En toute hypothèse, Les Conférenciers ne pourra en aucun cas être tenu pour responsable en cas de retard de mise à jour, d'erreur et/ou d'omission quant au contenu d'une ou plusieurs des pages du Site. Il ne saurait pas plus être tenu pour responsable des dommages directs et indirects résultant de l'accès ou de l'usage du site et/ou de son contenu.
          </p>

          <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
          <p>
            La structure générale, ainsi que les textes, images animées ou fixes, sons, graphismes, documents téléchargeables, bases de données et tout autre élément composant le site sont soumis à la législation en vigueur sur le droit d'auteur et demeurent la propriété exclusive de Les Conférenciers. Toute reproduction et rediffusion de tout ou partie de ces contenus sont soumises à l'autorisation préalable, écrite et expresse de Les Conférenciers.
          </p>
          <p>
            Les marques et logos de Les Conférenciers et ceux de ses partenaires, présents sur le Site, appartiennent à leurs propriétaires respectifs. Toute reproduction, totale ou partielle, de l'un quelconque ou de plusieurs de ces marques et/ou de ces logos effectués à partir des éléments du Site sans l'autorisation préalable, écrite et expresse du ou des titulaires des droits est formellement et expressément interdite.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Legal;
