import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Cookies = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-grow max-w-3xl">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Politique de cookies</h1>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <p>En utilisant ce site internet vous consentez à l'utilisation des cookies.</p>

          <h2 className="text-xl font-semibold">Qu'est-ce qu'un cookie ?</h2>
          <p>
            Lors de la consultation du Site, des informations relatives à la navigation de votre terminal (ordinateur, tablette, smartphone, etc.) sur ce site internet sont susceptibles d'être enregistrées dans des fichiers « Cookies » installés sur votre terminal, sous réserve de votre accord, que vous pouvez modifier à tout moment.
          </p>
          <p>
            Les cookies permettent à un site web d'identifier le terminal d'un utilisateur chaque fois que ce dernier visite ce même site web, et sont généralement utilisés pour permettre aux sites web de fonctionner plus efficacement, afin d'améliorer l'expérience de l'utilisateur lors de ses visites sur un site, ainsi que pour donner des informations aux responsables du site.
          </p>

          <h2 className="text-xl font-semibold">Comment utilise-t-on les cookies ?</h2>
          <p>
            Comme sur la plupart des sites internet, nous utilisons des cookies pour collecter des informations pendant votre visite sur le site web. Certains cookies sont indispensables pour votre navigation. D'autres sont très utiles pour une utilisation optimale du Site. À aucun moment l'utilisation de cookies ne vous est imposée et vous pouvez à tout moment refuser leur utilisation.
          </p>

          <h2 className="text-xl font-semibold">Liste des cookies utilisés par ce site</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-3 py-2 text-left">Nom</th>
                  <th className="border border-border px-3 py-2 text-left">Fournisseur</th>
                  <th className="border border-border px-3 py-2 text-left">Fonction</th>
                  <th className="border border-border px-3 py-2 text-left">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-3 py-2">_ga</td>
                  <td className="border border-border px-3 py-2">Google</td>
                  <td className="border border-border px-3 py-2">Statistiques et fréquentation du site</td>
                  <td className="border border-border px-3 py-2">730 jours</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">_gid</td>
                  <td className="border border-border px-3 py-2">Google</td>
                  <td className="border border-border px-3 py-2">Statistiques de fréquentation</td>
                  <td className="border border-border px-3 py-2">1 jour</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Concernant les cookies de réseaux sociaux, nous n'avons pas la maîtrise sur les cookies qui peuvent être déposés par les réseaux sociaux et vous invitons à vous rendre sur les différentes plateformes afin de prendre connaissance de l'utilisation faite de ces informations.
          </p>

          <h2 className="text-xl font-semibold">Comment contrôler les cookies ?</h2>
          <p>
            Vous pouvez contrôler l'acceptation des cookies en modifiant les préférences de votre navigateur Internet. Vous avez la faculté d'accepter tous les cookies, d'être averti lorsqu'un cookie est placé ou de refuser tous les cookies. Veuillez noter que si vous choisissez de bloquer tous les cookies, vous ne pourrez peut-être pas accéder à tout ou partie de notre site.
          </p>
          <p>
            Pour en savoir plus sur les moyens de contrôler les cookies, vous pouvez consulter le site de la CNIL à l'adresse :{" "}
            <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              www.cnil.fr
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cookies;
