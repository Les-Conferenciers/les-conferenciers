import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const RGPD = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-grow max-w-3xl">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Protection des données (RGPD)</h1>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <h2 className="text-xl font-semibold">Une relation de confiance</h2>
          <p>
            Nous portons une attention toute particulière à la protection de vos données personnelles. La présente Charte de protection des données décrit de quelle manière nous traitons vos données personnelles.
          </p>
          <p>
            Nous nous engageons à respecter la loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés, modifiée par le règlement européen 2016/679 du 27 avril 2016 relatif à la protection des données personnelles.
          </p>
          <p>
            En utilisant les services mis à votre disposition, vous acceptez la collecte et l'utilisation de vos données personnelles de la manière décrite dans la présente Charte.
          </p>

          <h2 className="text-xl font-semibold">Le responsable du traitement</h2>
          <p>Les Conférenciers est la personne morale qui contrôle, qui collecte et qui traite les données personnelles sous format papier ou électronique.</p>

          <h2 className="text-xl font-semibold">Pourquoi traitons-nous vos données ?</h2>
          <h3 className="text-lg font-medium">Visiteurs du site</h3>
          <ul className="list-disc pl-5">
            <li>Données statistiques de fréquentation du site</li>
            <li>Informations via la page contact pour créer une relation</li>
          </ul>

          <h2 className="text-xl font-semibold">À qui sont destinées vos données ?</h2>
          <p>Le destinataire de vos données personnelles est Les Conférenciers. Nous ne partageons pas vos données personnelles avec des tiers.</p>

          <h2 className="text-xl font-semibold">Où sont conservées vos données ?</h2>
          <p>Toutes vos données sont hébergées en France et ne sont pas transférées en dehors de l'Union Européenne.</p>

          <h2 className="text-xl font-semibold">Durée de conservation de vos données</h2>
          <p>
            Nous conserverons vos données le temps nécessaire à l'accomplissement de l'objectif poursuivi lors de leur collecte, nos délais de conservation se basent sur les normes CNIL et les dispositions législatives.
            À l'issue de la durée de conservation prévue pour chaque traitement, vos données seront supprimées ou anonymisées.
          </p>

          <h2 className="text-xl font-semibold">Comment protégeons-nous vos données ?</h2>
          <p>
            Nous nous engageons à protéger la confidentialité de vos données personnelles, et avons pour cela répertorié des mesures de sécurité organisationnelle, logique et physique pour la protection de vos données stockées.
            Un délégué à la protection des données (DPO) a été désigné en interne.
          </p>

          <h2 className="text-xl font-semibold">Quels sont vos droits ?</h2>
          <p>Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification, et en cas de motifs légitimes, d'opposition, de portabilité et de suppression pour toutes les informations personnelles vous concernant.</p>
          
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Droit d'accès :</strong> Vous pouvez nous demander la liste de vos données personnelles que nous traitons.</li>
            <li><strong>Droit de rectification :</strong> Vous pouvez nous demander la modification et la mise à jour de vos informations inexactes.</li>
            <li><strong>Droit d'opposition :</strong> Vous pouvez nous demander de ne plus apparaître sur nos fichiers de contacts à tout moment.</li>
            <li><strong>Droit à la portabilité :</strong> Vous pouvez demander à ce que vos données personnelles soient transmises dans un format structuré.</li>
            <li><strong>Droit de suppression :</strong> Vous pouvez nous demander l'effacement de vos données stockées dans nos bases.</li>
          </ul>

          <p>
            Pour exercer ces droits, vous pouvez adresser à notre DPO une demande datée et signée par courrier (Les Conférenciers – À l'attention du DPO – 4 rue de Vanves – 92130 Issy-les-Moulineaux) ou par mail à{" "}
            <a href="mailto:contact@lesconferenciers.com" className="text-accent hover:underline">contact@lesconferenciers.com</a>.
          </p>

          <h2 className="text-xl font-semibold">Loi et juridiction applicable</h2>
          <p>La présente charte relative à la protection de vos données personnelles est régie par la loi française et tout litige à son sujet relèvera de la compétence exclusive des tribunaux français.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RGPD;
