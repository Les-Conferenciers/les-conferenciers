import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize name for matching
function normalizeName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z ]/g, '')
    .trim()
    .split(/\s+/).sort().join(' ');
}

// Clean phone number
function cleanPhone(raw: string): string | null {
  if (!raw) return null;
  // Remove agent prefixes, parentheses, dots, dashes, spaces, links
  let p = raw.replace(/agent\s*/gi, '')
    .replace(/\[.*?\]\(.*?\)/g, (m) => m.replace(/.*?tel:/,'').replace(/\)/,''))
    .replace(/[().\-—–\s°|]/g, '')
    .replace(/tel:/gi, '');
  // Take first number-like sequence
  const match = p.match(/\+?\d{8,15}/);
  if (!match) return null;
  let num = match[0];
  // Format French numbers
  if (num.startsWith('33') && num.length >= 11) num = '0' + num.slice(2);
  if (num.startsWith('+33')) num = '0' + num.slice(3);
  if (!num.startsWith('0') && !num.startsWith('+') && num.length === 9) num = '0' + num;
  // Format as 0X XX XX XX XX
  if (num.startsWith('0') && num.length === 10) {
    return num.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return num;
}

// Clean email - take first valid-looking email
function cleanEmail(raw: string): string | null {
  if (!raw) return null;
  const emails = raw.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  return emails ? emails[0].toLowerCase() : null;
}

// Parse fee string to a number (best effort)
function parseFee(raw: string): number | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  // Skip complex/unknown
  if (lower.includes('demande') || lower.includes('vérifier') || lower === '50') return null;
  
  // Try to find a number, handling "K" notation
  // Look for patterns like "4K", "4 K", "4,5k", "4.5k", "4 500", "4500"
  const kMatch = lower.match(/([\d.,]+)\s*k/);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.')) * 1000;
    if (!isNaN(val) && val > 100) return val;
  }
  
  // Look for plain numbers like "4000", "4 000", "4 500"
  const numMatch = raw.match(/([\d\s]+)/);
  if (numMatch) {
    const val = parseInt(numMatch[1].replace(/\s/g, ''));
    if (!isNaN(val) && val >= 500) return val;
  }
  
  return null;
}

const speakerData = [
  { name: "Ackerman Jean-Philippe", fee: "4 500 à 6 500", email: "jpackermann@vivaldi-conseil.com", phone: "661122545" },
  { name: "Agresti Blaise", fee: "2 500 à 5 000", email: "blaise@mountain-path.com", phone: "685312181" },
  { name: "Aguilar Michael", fee: "5,5k", email: "ma@michaelaguilar.fr", phone: "643223438" },
  { name: "Alexandre Laurent", fee: "entre 8K et 10K", email: "", phone: "" },
  { name: "Allain Carol", fee: "6K", email: "carol@carolallain.ca", phone: "514 293.6600" },
  { name: "Alletru Alex", fee: "5K", email: "contactaxelalletru@gmail.com", phone: "652021346" },
  { name: "André Boyet Laura", fee: "7,5K", email: "", phone: "685112391" },
  { name: "Ansellem Bernard", fee: "2 500", email: "bernardans@hotmail.com", phone: "672747787" },
  { name: "Antoine Guillaume", fee: "1500", email: "guillaume.antoine2@wanadoo.fr", phone: "06 81 19 05 24" },
  { name: "Arbelaez Juan", fee: "6K", email: "laurene@juan-arbelaez.com", phone: "(0)6.19.76.30.85" },
  { name: "Arthus Bertrand Yann", fee: "12000", email: "bureau1@yab.fr", phone: "6 21 27 24 91" },
  { name: "Audet Maryse", fee: "2430", email: "maryse@maryseaudet.com", phone: "438-378-8678" },
  { name: "Aufaure Marie-Aude", fee: "2,5k", email: "marie-aude.aufaure@datarvest.com", phone: "611024205" },
  { name: "Autissier Isabelle", fee: "6000", email: "isabelle.autissier@free.fr", phone: "06 20 50 40 32" },
  { name: "Baillet Karine", fee: "4000", email: "karine@karinebaillet-organisation.com", phone: "06 63 03 05 52" },
  { name: "Bajolet Jean-Sébastien", fee: "2500", email: "jsbajolet@gmail.com", phone: "06 34 31 20 00" },
  { name: "Barba Catherine", fee: "7000", email: "cbarba@cbgroup.fr", phone: "6 89 02 34 12" },
  { name: "Barnier Romain", fee: "3,5k", email: "r.barnier@cnmarseille.com", phone: "06 73811055" },
  { name: "Bas Olivier", fee: "3500", email: "olivier.bas@havas.com", phone: "609911613" },
  { name: "Basch Lucie", fee: "5K", email: "murmuria.lb@gmail.com", phone: "788179046" },
  { name: "Baudry Patrick", fee: "6000", email: "baudrypby@gmail.com", phone: "607495484" },
  { name: "Beaudoin Vanessa", fee: "2 500", email: "contact@vanessa-beaudoin.fr", phone: "0670882392" },
  { name: "Bentata Pierre", fee: "3,5k", email: "pierre.bentata@yahoo.fr", phone: "620047730" },
  { name: "Bellin Sébastien", fee: "4K", email: "", phone: "" },
  { name: "Beretti Nicolas", fee: "4000", email: "", phone: "669772480" },
  { name: "Beretta Laurent", fee: "4000", email: "laurentberetta@gmail.com", phone: "637069431" },
  { name: "Besset Delphine", fee: "2500", email: "", phone: "682197469" },
  { name: "Betsen Serge", fee: "4500", email: "marielaure@sergebetsen.net", phone: "" },
  { name: "Bihouix Philippe", fee: "3500", email: "PHILIPPE.BIHOUIX@arep.fr", phone: "" },
  { name: "Blanchard Mathieu", fee: "7K", email: "mathieublanchard@fraichtouch.com", phone: "Agent 0631724710" },
  { name: "Blavier Arnaud", fee: "2500", email: "arnaud.blavier@hotmail.com", phone: "324792344" },
  { name: "Bloch", fee: "6,5K", email: "", phone: "" },
  { name: "Bondeau Eric", fee: "8K", email: "eric.blondeau@gmail.com", phone: "336 2207 6326" },
  { name: "Bobineau Olivier", fee: "", email: "olivier.bobineau@theolivebranch.fr", phone: "611074562" },
  { name: "Boeuf Gilles", fee: "2500", email: "gilles.boeuf@mnhn.fr", phone: "607863119" },
  { name: "Boghossian Laurent", fee: "3500", email: "laurent@pandoraprod.fr", phone: "612876983" },
  { name: "Boichard Vincent", fee: "2000", email: "vincent.boichard@hls-meilleur.com", phone: "633090358" },
  { name: "Borde Thierry", fee: "2K", email: "contact@thierryborde.fr", phone: "666908025" },
  { name: "Bouchet Peggy", fee: "6000", email: "peggy.bouchet@gmail.com", phone: "611955658" },
  { name: "Boucher Gwendal", fee: "2K", email: "lignedeforce@lignedeforce.com", phone: "" },
  { name: "Boukerchi Malek", fee: "5500", email: "contact@malekboukerchi.com", phone: "622311746" },
  { name: "Boulanger Philippe", fee: "4000", email: "phil@philippeboulanger.com", phone: "689314619" },
  { name: "Bourc'his Morgan", fee: "4000", email: "", phone: "611212876" },
  { name: "Bourneton Dorine", fee: "4000", email: "dbourneton@gmail.com", phone: "633050139" },
  { name: "Bouzou Nicolas", fee: "6000", email: "cpoetschke@asteres.fr", phone: "662680893" },
  { name: "Brabec Maximilien", fee: "4K", email: "brabec@novategie.fr", phone: "(0) 6 22 34 84 68" },
  { name: "Breton Thierry", fee: "40K", email: "", phone: "" },
  { name: "Brillant Tatiana", fee: "5K", email: "tatiana.brillant@gmail.com", phone: "06.45.69.63.76" },
  { name: "Brogniart Stephane", fee: "4000", email: "stephane.brogniart@gmail.com", phone: "672477925" },
  { name: "Bronner Gerald", fee: "5K", email: "gerald.bronner@gmail.com", phone: "06 83 06 33 53" },
  { name: "Butzi", fee: "4000", email: "contact@butzi-speaker.com", phone: "631986525" },
  { name: "Cabaye Yohan", fee: "6K", email: "", phone: "" },
  { name: "Cadain Alexandre", fee: "entre 6K et 10K", email: "", phone: "" },
  { name: "Calkins Isabelle", fee: "4000", email: "isacalkins@gmail.com", phone: "608510759" },
  { name: "Chabot Eric", fee: "3K", email: "eric@ericchabot.fr", phone: "06 84 82 18 51" },
  { name: "Carbone Lucie", fee: "6K", email: "luciecarbone.pro@gmail.com", phone: "683950554" },
  { name: "Carré Benoît", fee: "3K", email: "contact@benoitcarre.com", phone: "06 20 36 33 28" },
  { name: "Catteau Jean-Charles", fee: "5K", email: "jc.catteau@adhoc-com.com", phone: "" },
  { name: "Caupenne Christophe", fee: "4200", email: "christophe@caupenne-conseil.com", phone: "6) 18 97 24 01" },
  { name: "Cavazza Fred", fee: "3000", email: "", phone: "" },
  { name: "Chabaud Catherine", fee: "7K", email: "", phone: "" },
  { name: "Chaminade Benjamin", fee: "2900", email: "florence@benjaminchaminade.com", phone: "Agent 06 03 86 29 84" },
  { name: "Chapron Tony", fee: "4K", email: "tony.chapron@gmail.com", phone: "06 87 20 27 21" },
  { name: "Caron Nicolas", fee: "5,5k", email: "", phone: "" },
  { name: "Chatelain Gael", fee: "3900", email: "gael@chatelain-berry.fr", phone: "683240787" },
  { name: "Cissé Djibril", fee: "10K", email: "", phone: "" },
  { name: "Chuet Pierre-Henry", fee: "6,5K", email: "laurence@mach3.org", phone: "06 32 67 10 26" },
  { name: "Clerc Vincent", fee: "4500", email: "assistant@teamone-groupe.com", phone: "561291825" },
  { name: "Clos Christian", fee: "7500", email: "", phone: "" },
  { name: "Colantonio Fred", fee: "3800", email: "contact@fredcolantonio.com", phone: "32486995868" },
  { name: "Collet Vincent", fee: "7K", email: "", phone: "" },
  { name: "Combalbert Laurent", fee: "7,5K", email: "", phone: "0686783113" },
  { name: "Comte Sponville André", fee: "8000", email: "a.c-s@orange.fr", phone: "07 85 63 27 47" },
  { name: "Constantini Daniel", fee: "5K", email: "dcost1995.com", phone: "650712871" },
  { name: "Couchet Céline", fee: "2500", email: "couchetceline9@gmail.com", phone: "660708312" },
  { name: "Cuilleron Gregory", fee: "3500", email: "cuilleron@gmail.com", phone: "615576466" },
  { name: "Coumba Barradji", fee: "2000", email: "coumbattitude.coaching@gmail.com", phone: "615724021" },
  { name: "Coutanceau Christopher", fee: "8000", email: "agence@alicecoutanceau.com", phone: "Agent 0611104294" },
  { name: "Cremer Clarisse", fee: "7K", email: "", phone: "" },
  { name: "Croizon Philippe", fee: "8000", email: "philippecroizon@hotmail.com", phone: "610419505" },
  { name: "Crozer-Delbourg Esther", fee: "1200", email: "delbourg.esther@gmail.com", phone: "0627564853" },
  { name: "Curin Théo", fee: "9000", email: "sophie@bayard-unlimited.com", phone: "Agent 0678758824" },
  { name: "Cyrulnik Boris", fee: "4K", email: "", phone: "" },
  { name: "Dali Kenza", fee: "4K", email: "contactnumero6@gmail.com", phone: "" },
  { name: "Darroze Hélène", fee: "19K", email: "contact@helenedarroze.com", phone: "3 7 62 12 60 70" },
  { name: "De Brabandère", fee: "5K", email: "", phone: "" },
  { name: "De Funes Julia", fee: "8000", email: "contact.juliadefunes@gmail.com", phone: "635438587" },
  { name: "Dejoux Cécile", fee: "4K", email: "cecile.dejoux@lecnam.net", phone: "" },
  { name: "De la Ferrière Laurence", fee: "5000", email: "contact@laurencedelaferriere.com", phone: "06 12 21 17 81" },
  { name: "De Lasteyrie Cyril", fee: "6500", email: "", phone: "" },
  { name: "De Richemont Blanche", fee: "", email: "derichemontblanche@gmail.com", phone: "" },
  { name: "Denis Jean-Philippe", fee: "3000", email: "jphd@iqsog.com", phone: "" },
  { name: "Déroulède Pauline", fee: "10K", email: "ingrid@wsportconsulting.fr", phone: "Agent 06 09 67 22 76" },
  { name: "Descollanges Charlène", fee: "4K", email: "charlenedescollonges@gmail.com", phone: "" },
  { name: "Desportes Vincent", fee: "6K", email: "", phone: "" },
  { name: "De Villiers Pierre", fee: "10000", email: "", phone: "" },
  { name: "Dessertine Philippe", fee: "6K", email: "", phone: "" },
  { name: "Destivelle Catherine", fee: "4000", email: "catherine.destivelle@gmail.com", phone: "676053586" },
  { name: "Devillers Laurence", fee: "5000", email: "devil@limsi.fr", phone: "612434312" },
  { name: "De Rovira", fee: "entre 5K et 8K", email: "", phone: "612519658" },
  { name: "Desprez Pierre Louis", fee: "4K", email: "pld@kaosconsulting.com", phone: "06 09 68 39 99" },
  { name: "Dewez Erwan", fee: "4K", email: "neuroperformanceconsulting@gmail.com", phone: "683555649" },
  { name: "Diagana Stéphane", fee: "7K", email: "yves.coupier@forsept.fr", phone: "Agent 06 75 13 10 53" },
  { name: "Diebold Stéphane", fee: "3000", email: "sdiebold@affen.fr", phone: "611815535" },
  { name: "Di Muzio Laura", fee: "2,5K", email: "", phone: "695933231" },
  { name: "Dion Cyril", fee: "5000", email: "assistante.cd@posteo.net", phone: "Agent 0623251816" },
  { name: "Doré Anne", fee: "2,5K", email: "anne.dore@adhel.fr", phone: "6 60 26 27 48" },
  { name: "Dolveck François", fee: "1500", email: "francois.dolveck@ghsif.fr", phone: "06 79 83 89 18" },
  { name: "Domingo Clément", fee: "3,9k", email: "", phone: "" },
  { name: "Dorange Violette", fee: "20K", email: "", phone: "" },
  { name: "Douillet David", fee: "8500", email: "", phone: "" },
  { name: "Deltour Estelle", fee: "5K", email: "contactnumero6@gmail.com", phone: "669535192" },
  { name: "Duez Emmanuelle", fee: "10K", email: "", phone: "" },
  { name: "Dufour Marie-Laure", fee: "2900", email: "marielaure@faireplus.com", phone: "603499266" },
  { name: "Duflo Esther", fee: "", email: "michaelh@leighbureau.com", phone: "" },
  { name: "Dujardin Jean", fee: "", email: "c.jacquemin@vma.fr", phone: "" },
  { name: "Ejnaïni Salim", fee: "5K", email: "", phone: "" },
  { name: "Enthoven Raphaël", fee: "9K", email: "", phone: "" },
  { name: "Estanguet Tony", fee: "40K", email: "contacttonyestanguet@gmail.com", phone: "787020556" },
  { name: "Estier Julien", fee: "2450", email: "julien.estier@links-accompagnement.com", phone: "06 18 17 04 53" },
  { name: "Etchebest Philippe", fee: "30K", email: "", phone: "" },
  { name: "Etienne Jean-Louis", fee: "10000", email: "nfarion@oceanpolaire.org", phone: "Agent 09 73 88 01 45" },
  { name: "Facelina Xavier", fee: "3300", email: "", phone: "" },
  { name: "Felger Nicolas", fee: "5500", email: "nicolas@nicolasfelger.com", phone: "662450596" },
  { name: "Fernagu Solveig", fee: "1500", email: "sfernagu@cesi.fr", phone: "788581676" },
  { name: "Fernandez Jérôme", fee: "6K", email: "", phone: "" },
  { name: "Ferrand Franck", fee: "5K", email: "aureliendervaux.assist@gmail.com", phone: "670314270" },
  { name: "Ferry Luc", fee: "8K", email: "", phone: "" },
  { name: "Fleury Cynthia", fee: "7K", email: "cynthiafleuryperkins@gmail.com", phone: "06 09 22 02 46" },
  { name: "Fontenoy Maud", fee: "12000", email: "secretariat@maudfontenoyfondation.fr", phone: "" },
  { name: "Forest Céline", fee: "3,5K", email: "", phone: "" },
  { name: "Fournier Philippe", fee: "5500", email: "pfournier@dominante.com", phone: "636483000" },
  { name: "Fournier Vincent", fee: "3000", email: "vincent@vincentfournier.ca", phone: "" },
  { name: "François Vincent", fee: "3500", email: "vince@negociateurdelite.com", phone: "687725951" },
  { name: "Gabilliet Philippe", fee: "5000", email: "gabilliet@escp.eu", phone: "607830078" },
  { name: "Gagnaire Pierre", fee: "9K", email: "magali@pierregagnaire.com", phone: "" },
  { name: "Ganascia Jean Gabriel", fee: "3K", email: "jean-gabriel.ganascia@lip6.fr", phone: "685074565" },
  { name: "Galfione Jean", fee: "5K", email: "jeangalf@aol.com", phone: "621037618" },
  { name: "Galthié Fabien", fee: "15K", email: "", phone: "" },
  { name: "Garnier Valérie", fee: "5K", email: "", phone: "" },
  { name: "Gaubert Thierry", fee: "2500", email: "sofa26@wanadoo.fr", phone: "681227045" },
  { name: "Gauthier Stéphane", fee: "4K", email: "stephane.gauthier0@orange.fr", phone: "06.23.17.86.03" },
  { name: "Georges Laura", fee: "4K", email: "contactnumero6@gmail.com", phone: "669535192" },
  { name: "Gentina Elodie", fee: "3,5k", email: "e.gentina@ieseg.fr", phone: "678644768" },
  { name: "Ginola David", fee: "28K", email: "", phone: "" },
  { name: "Gibault Guillaume", fee: "9K", email: "goulven@fraichtouch.com", phone: "681027677" },
  { name: "Gicquel Stéphanie", fee: "6000", email: "stephaniegicquel.sport@gmail.com", phone: "663039164" },
  { name: "Gilot Fabien", fee: "6,5k", email: "", phone: "" },
  { name: "Giraud Olivier", fee: "9720", email: "claudie@oliviergiraud.com", phone: "6 98 57 45 98" },
  { name: "Gomart Thomas", fee: "4K", email: "gomart@ifri.org", phone: "" },
  { name: "Gori Roland", fee: "2000", email: "roland.gori@orange.fr", phone: "689109090" },
  { name: "Goulvestre Laurent", fee: "", email: "divers@goulvestre.com", phone: "607569438" },
  { name: "Grosjean Romain", fee: "10K", email: "", phone: "" },
  { name: "Grospiron Edgar", fee: "9500", email: "edgar@grospiron.net", phone: "609668000" },
  { name: "Guei Floria", fee: "4K", email: "contact.fguei@gmail.com", phone: "Agent 0662702841" },
  { name: "Guyot Virginie", fee: "8500", email: "v.g@virginieguyot.com", phone: "609865930" },
  { name: "Hababou Ralph", fee: "7,5K", email: "rhababou@pbrhconseil.com", phone: "" },
  { name: "Habets Florence", fee: "1,5k", email: "florence.habets@ens.fr", phone: "" },
  { name: "Haage Christophe", fee: "10K", email: "", phone: "637842289" },
  { name: "Haigneré Claudie", fee: "5K", email: "haignereclaudie@gmail.com", phone: "611669792" },
  { name: "Haumont Pascal", fee: "4K", email: "", phone: "637700099" },
  { name: "Hamant Olivier", fee: "1000", email: "olivier.hamant@ens-lyon.fr", phone: "" },
  { name: "Haziza Emma", fee: "6k", email: "", phone: "Agent John 06 32 03 68 37" },
  { name: "Hébel Pascale", fee: "3,5K", email: "pascale.hebel@c-ways.com", phone: "07 86 70 21 13" },
  { name: "Henin Justine", fee: "8500", email: "hello@justinehenin.be", phone: "32488573000" },
  { name: "Henrique Brigitte", fee: "5K", email: "", phone: "" },
  { name: "Herbreteau Thais", fee: "2450", email: "t.herbreteau@links-accompagnement.com", phone: "688712082" },
  { name: "Heyer Eric", fee: "4000", email: "eric.heyer@ofce.sciences-po.fr", phone: "610250091" },
  { name: "Hinsen Peter", fee: "20K", email: "", phone: "" },
  { name: "Hirsch Martin", fee: "5K", email: "", phone: "" },
  { name: "Horn Mike", fee: "30K", email: "message@mikehorn.com", phone: "" },
  { name: "Houdet Stephane", fee: "7500", email: "stephane.houdet.usa@gmail.com", phone: "" },
  { name: "Hudry Jean-Luc", fee: "4000", email: "contact@jeanluchudry.com", phone: "667256867" },
  { name: "Illouz Eva", fee: "3K", email: "eva.illouz@ehess.fr", phone: "767212833" },
  { name: "Jancovici Jean-Marc", fee: "7000", email: "jean-marc.jancovici@polytechnique.org", phone: "" },
  { name: "Jean Aurelie", fee: "17K", email: "", phone: "" },
  { name: "Jeanmonod Grégoire", fee: "3,2K", email: "g.jeanmonod@47eme-rue.com", phone: "682239548" },
  { name: "Jolly Matthieu", fee: "2500", email: "matthieu@seenapse.fr", phone: "" },
  { name: "Jolly Thomas", fee: "15K", email: "magali@embleme-studio.com", phone: "06 13 303142" },
  { name: "Joseph Dailly Emmanuelle", fee: "5000", email: "emmajid@gmail.com", phone: "664268326" },
  { name: "Jubien Alexandre", fee: "4K", email: "ajubien@gmail.com", phone: "681118315" },
  { name: "Julia Luc", fee: "5K", email: "julialuc@gmail.com", phone: "695157519" },
  { name: "Kalifa Josette", fee: "3K", email: "info@josettekalifa.com", phone: "630683690" },
  { name: "Karaki Samah", fee: "3K", email: "samahkaraki@gmail.com", phone: "677317649" },
  { name: "Kateb Alexandre", fee: "1500", email: "alexandre.kateb@competencefinance.com", phone: "638877282" },
  { name: "Klein Etienne", fee: "", email: "conferences@etienneklein.fr", phone: "" },
  { name: "Krauze Nicolas", fee: "3K", email: "nskartpro@gmail.com", phone: "632150539" },
  { name: "Krumbholz Olivier", fee: "8K", email: "", phone: "" },
  { name: "Labigne Julien", fee: "5K", email: "labignejulien@gmail.com", phone: "683415842" },
  { name: "Lachaud Jean-Philippe", fee: "1,5K", email: "jp.lachaux@inserm.fr", phone: "" },
  { name: "Lacourt Camille", fee: "8K", email: "", phone: "689121343" },
  { name: "Lacroix Alexandre", fee: "2,5K", email: "alacroix@philomag.com", phone: "06 78 55 60 00" },
  { name: "Lamri Jéremy", fee: "4K", email: "jeremy.lamri@tomorrowtheory.com", phone: "" },
  { name: "Lange Laura", fee: "4500", email: "contact@lauralange.fr", phone: "06.78.52.96.37" },
  { name: "Langlois Mathieu", fee: "3K", email: "matthieulanglois@me.com", phone: "662460588" },
  { name: "Lanta Christian", fee: "3500", email: "", phone: "" },
  { name: "Laroche David", fee: "40K", email: "arielle@paradox-ext.com", phone: "" },
  { name: "Larousse Rémi", fee: "5K", email: "remi.larrousse@tricksterprod.com", phone: "671277904" },
  { name: "Laubie Raphaëlle", fee: "6K", email: "raphaelle@lecdl.net", phone: "622840376" },
  { name: "Lavaud Sophie", fee: "4K", email: "", phone: "" },
  { name: "Laville Elisabeth", fee: "4K", email: "laville@utopies.com", phone: "662444300" },
  { name: "Laye Miel Elodie", fee: "4800", email: "contact@lasemiologie.com", phone: "603733161" },
  { name: "Le Drian Jean-Yves", fee: "15K", email: "daniel.nedzela@affidia.fr", phone: "680160461" },
  { name: "Lebot Benoît", fee: "1000", email: "lebotbenoit@gmail.com", phone: "677569643" },
  { name: "Lecomte Jacques", fee: "3K", email: "jacques.lecomte442@orange.fr", phone: "620520091" },
  { name: "Lefur Marie-Amélie", fee: "4K", email: "marieamelie26@hotmail.fr", phone: "06.81.94.98.37" },
  { name: "Legay Marlène", fee: "2000", email: "marlenelegay@vaguedesens.fr", phone: "640454181" },
  { name: "Legrand Sandra", fee: "5K", email: "s.legrand@confandco.com", phone: "06 85 31 11 11" },
  { name: "Lenglet François", fee: "13K", email: "francois.lenglet@gmail.com", phone: "" },
  { name: "Lepage Juliette", fee: "1500", email: "lecoupdoeildejuliette@gmail.com", phone: "619462011" },
  { name: "Leboeuf Franck", fee: "6K", email: "", phone: "" },
  { name: "Leroy Clément", fee: "4K", email: "clement@clement-leroy.com", phone: "698999314" },
  { name: "Lescarmontier Lydie", fee: "1,5K", email: "lescarmontier.lydie@gmail.com", phone: "675091335" },
  { name: "Lévy Provençal Michel", fee: "6K", email: "michel@brightness.fr", phone: "" },
  { name: "Liévremont Marc", fee: "6k", email: "marc.lievremont@orange.fr", phone: "633315315" },
  { name: "Lobert Jonathan", fee: "4K", email: "", phone: "" },
  { name: "Loine Thierry", fee: "3K", email: "thierryloine@gmail.com", phone: "612535099" },
  { name: "Lughinbul Aurélie", fee: "4K", email: "delphine@positiel.fr", phone: "626982558" },
  { name: "Mailly Jean-Claude", fee: "1,5K", email: "", phone: "660266460" },
  { name: "Mallard Stéphane", fee: "5K", email: "", phone: "659192008" },
  { name: "Manaudou Laure", fee: "9K", email: "", phone: "" },
  { name: "Mansson Annika", fee: "2K", email: "amansson@happy-at-work.ch", phone: "41793041485" },
  { name: "Marie Valérie", fee: "4K", email: "valeriemarie.officiel@gmail.com", phone: "662020056" },
  { name: "Marion Bruno", fee: "3K", email: "bruno@brunomarion.com", phone: "+33 6 80 45 07 13" },
  { name: "Marcié Vanessa", fee: "3K", email: "vanessa@leadingwithhumour.com", phone: "07 86 53 91 48" },
  { name: "Marx Thierry", fee: "8,5K", email: "abuzias@thierrymarx.com", phone: "676825864" },
  { name: "Masnada Florence", fee: "2,5K", email: "flo.masnada3@gmail.com", phone: "673686379" },
  { name: "Mastalski Pierre", fee: "4K", email: "pierre@icicommencelaventure.com", phone: "624333071" },
  { name: "Massonie Karine", fee: "5K", email: "kmassonnie@gmail.com", phone: "6 63 14 60 28" },
  { name: "Matuidi Blaise", fee: "28K", email: "", phone: "" },
  { name: "Mazella Frédéric", fee: "20K", email: "frederic.mazzella@gmail.com", phone: "7 60 26 89 68" },
  { name: "Meier Erin", fee: "25K", email: "eric@yourculturemap.com", phone: "" },
  { name: "Meillaud Laurent", fee: "1,5K", email: "", phone: "609566996" },
  { name: "Merk Michaela", fee: "5K", email: "michaela.merk@merk-vision.com", phone: "619111065" },
  { name: "Mery Marwan", fee: "8K", email: "mmery@adngroup.com", phone: "" },
  { name: "Mesnier Eric", fee: "3,5K", email: "eric.mesnier.conference@gmail.com", phone: "06.09.32.87.91" },
  { name: "Metayer Nina", fee: "8K", email: "marie-madeleine@ninametayer.com", phone: "0630919674" },
  { name: "Meunier Bernard", fee: "2K", email: "bernard.meunier@soutienpsy-dijon.fr", phone: "625233294" },
  { name: "Mignard Laurent", fee: "6K", email: "lm@laurentmignard.com", phone: "0660287373" },
  { name: "Monfils Gaël", fee: "22K", email: "sebastien@bignetworkers.com", phone: "" },
  { name: "Monfort Nelson", fee: "5K", email: "nelsonmonfort44@gmail.com", phone: "672967691" },
  { name: "Moré Cyril", fee: "3K", email: "cyrilmore@gmail.com", phone: "668893707" },
  { name: "Moscato", fee: "8K", email: "", phone: "Agent 0669535192" },
  { name: "Mossely Estelle", fee: "6K", email: "contactnumero6@gmail.com", phone: "Agent 0669535192" },
  { name: "Nal Raphael", fee: "4K", email: "nal.raphael@gmail.com", phone: "6 26 09 85 28" },
  { name: "Nassur Samire", fee: "5K", email: "salime@maars.cc", phone: "684362800" },
  { name: "Nery Guillaume", fee: "8,5K", email: "contact@guillaumenery.com", phone: "668692715" },
  { name: "Olicard Fabien", fee: "7500", email: "", phone: "Agent 0661714712" },
  { name: "Onesta Claude", fee: "10K", email: "marina@onestacollab.fr", phone: "Agent 0608071344" },
  { name: "Orsenna Eric", fee: "7K", email: "", phone: "680079700" },
  { name: "Pachulski Alex", fee: "8K", email: "", phone: "" },
  { name: "Panis Olivier", fee: "10K", email: "", phone: "684081364" },
  { name: "Papin Jean-Pierre", fee: "8K", email: "", phone: "" },
  { name: "Pardo Déborah", fee: "4K", email: "", phone: "787966043" },
  { name: "Parmentier Bruno", fee: "1,5K", email: "brunoparmentier@nourrir-manger.com", phone: "06 46 42 59 78" },
  { name: "Pauleta", fee: "7K", email: "", phone: "" },
  { name: "Pélabère Julien", fee: "6000", email: "", phone: "647981846" },
  { name: "Pellegrin Fleur", fee: "9K", email: "", phone: "" },
  { name: "Pelous Fabien", fee: "5K", email: "fabien.pelous@wanadoo.fr", phone: "631505505" },
  { name: "Pépin Charles", fee: "7K", email: "lauduguet@yahoo.fr", phone: "622362615" },
  { name: "Pérec Marie-José", fee: "9K", email: "", phone: "" },
  { name: "Pesquet Thomas", fee: "60K", email: "om@speaktoceo.com", phone: "699962653" },
  { name: "Petit Emmanuel", fee: "7K", email: "", phone: "" },
  { name: "Petre Bernard", fee: "1500", email: "bernard.petre@gmail.com", phone: "32495293261" },
  { name: "Peyron Loïc", fee: "10K", email: "margotpeyron@gmail.com", phone: "0609724443" },
  { name: "Pic Anne-Sophie", fee: "15K", email: "damien.chalvet@groupe-pic.com", phone: "(0)6 87 56 92 65" },
  { name: "Picq Pascal", fee: "7K", email: "", phone: "" },
  { name: "Piege Jean-François", fee: "10K", email: "", phone: "" },
  { name: "Philippe Pierre", fee: "2,8k", email: "philippe.pierre22@wanadoo.fr", phone: "677073936" },
  { name: "Pierrot Franck", fee: "4K", email: "fp@franckpierrot.com", phone: "785290459" },
  { name: "Piton Gaëlle", fee: "1500", email: "gaelle.sophrocoach@gmail.com", phone: "683189429" },
  { name: "Pitron Guillaume", fee: "5K", email: "guillaume_pitron@hotmail.com", phone: "678648887" },
  { name: "Podolak Michel", fee: "5K", email: "contact@mpodolak.com", phone: "608607320" },
  { name: "Portemer Nils", fee: "2,5K", email: "portemer.nils@gmail.com", phone: "660482663" },
  { name: "Poulaert Michel", fee: "3,5K", email: "michelpoulaert@orange.fr", phone: "612636438" },
  { name: "Pratt Christopher", fee: "4,5K", email: "lorenzo@marsail.com", phone: "06 60 36 58 69" },
  { name: "Prost Alain", fee: "15K", email: "", phone: "41792102210" },
  { name: "Quemar Benoît", fee: "2450", email: "", phone: "676131785" },
  { name: "Raimbault Nicolas", fee: "3,5K", email: "nicolas@nicolasraimbault.com", phone: "609466702" },
  { name: "Rauscher John", fee: "3K", email: "john@services-40.com", phone: "618701420" },
  { name: "Regen Isalou", fee: "4K", email: "isalouregen1@gmail.com", phone: "660519171" },
  { name: "Riner Teddy", fee: "50K", email: "media@teddyriner.com", phone: "608689892" },
  { name: "Robert Marie", fee: "5K", email: "philosophyissexyzoom@gmail.com", phone: "06 11 21 50 11" },
  { name: "Rodet Philippe", fee: "3K", email: "", phone: "" },
  { name: "Rose", fee: "2K", email: "", phone: "Agent 0660527264" },
  { name: "Rydhal Malène", fee: "7K", email: "contact@malenerydahl.com", phone: "" },
  { name: "Saada Yoni", fee: "1,5K", email: "", phone: "603462624" },
  { name: "Sacko Mory", fee: "8K", email: "contact@mory-sacko.fr", phone: "06.20.91.92.35" },
  { name: "Saint-Etienne Christian", fee: "3K", email: "", phone: "" },
  { name: "Sanchez Stéphane", fee: "4,5K", email: "stephane.sanchez@maneges-conseil.fr", phone: "620501872" },
  { name: "Sancho Pascal", fee: "3,5K", email: "psancho@wanadoo.fr", phone: "608863217" },
  { name: "Sannié Quentin", fee: "3K", email: "", phone: "" },
  { name: "Servan-Schreiber Florence", fee: "10K", email: "fanny@essentia.fr", phone: "0616981320" },
  { name: "Servan-Schreiber Emile", fee: "6K", email: "emiless@gmail.com", phone: "" },
  { name: "Shara Inma", fee: "5K", email: "inmashara@inmashara.com", phone: "" },
  { name: "Si Alex", fee: "1,5K", email: "book@alex-si.com", phone: "32498870784" },
  { name: "Solignac Thomas", fee: "2800", email: "solignac.t@gmail.com", phone: "" },
  { name: "Soulier Morgane", fee: "2K", email: "morgane.soulier@gmail.com", phone: "672466269" },
  { name: "Sy Hapsatou", fee: "3K", email: "direction@mith-international.com", phone: "" },
  { name: "Tarcher Maxime", fee: "3,5K", email: "maximetarcher@gmail.com", phone: "673140500" },
  { name: "Tesson Sylvain", fee: "10K", email: "", phone: "" },
  { name: "Thellier Bernard", fee: "5K", email: "thellier.bernard@gmail.com", phone: "668036365" },
  { name: "Thiercelin Marc", fee: "5,2K", email: "florence@marcthiercelin.com", phone: "06 03 86 29 84" },
  { name: "Tisseron Serge", fee: "3,5K", email: "serge.tisseron@gmail.com", phone: "06.62.73.25.21" },
  { name: "Thibaut Inshape", fee: "15K", email: "", phone: "Agent 0781813272" },
  { name: "Thiebaud Mélanie", fee: "3K", email: "levythiebaut.m@gmail.com", phone: "672862712" },
  { name: "Thomas Anne-Laure", fee: "2K", email: "annelaure_t@yahoo.fr", phone: "662024485" },
  { name: "Toupe David", fee: "1,5K", email: "david.toupe@ffbad.org", phone: "620361728" },
  { name: "Tourin Lebret Dorian", fee: "3K", email: "dorian@gaiactica.net", phone: "" },
  { name: "Valet Maxime", fee: "1,5K", email: "maxime.valet@live.fr", phone: "603007290" },
  { name: "Vanier Nicolas", fee: "7K", email: "olivia@taiga-fr.com", phone: "Agent 0662667074" },
  { name: "Vermersch Benoît", fee: "3K", email: "boostepartners@gmail.com", phone: "686820103" },
  { name: "Viard Jean", fee: "6K", email: "jean.viard@wanadoo.fr", phone: "Agent 0490072510" },
  { name: "Viscuso Franck", fee: "3,5K", email: "", phone: "685529575" },
  { name: "Vignieu Sonia", fee: "1,5K", email: "sonianutritionfrance@gmail.com", phone: "617869361" },
  { name: "Vitaud Laetitia", fee: "4K", email: "laetitia.vitaud@gmail.com", phone: "" },
  { name: "Voeckler Thomas", fee: "6K", email: "yves.coupier@forsept.fr", phone: "" },
  { name: "Voelpoet Ivan", fee: "2,5k", email: "ivan.volpoet@ekteos.fr", phone: "07 82 98 37 83" },
  { name: "Vuccino Anne-Charlotte", fee: "5K", email: "anne-charlotte@yogist.fr", phone: "06 13 46 54 55" },
  { name: "Watelet Thierry", fee: "5K", email: "twatelet@osenor.com", phone: "671856953" },
  { name: "Weisz Alain", fee: "3,5k", email: "", phone: "" },
  { name: "Winner Charlie", fee: "3K", email: "charles@winnerinc.fr", phone: "682673219" },
  { name: "Ziouani Zahia", fee: "5K", email: "mareva.naprix@losd.fr", phone: "07 64 26 45 08" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all speakers
    const { data: speakers, error } = await supabase
      .from('speakers')
      .select('id, name, slug, base_fee, email, phone');
    
    if (error) throw error;

    const results: any[] = [];
    let matched = 0;
    let updated = 0;

    for (const entry of speakerData) {
      const normalizedEntry = normalizeName(entry.name);
      
      // Try to match by normalized name
      const match = speakers?.find(s => {
        const normalizedSpeaker = normalizeName(s.name);
        // Exact match
        if (normalizedSpeaker === normalizedEntry) return true;
        // Check if one contains the other (for partial names like "Bloch" matching "Bloch Daphné")
        if (normalizedEntry.split(' ').length === 1 && normalizedSpeaker.includes(normalizedEntry)) return true;
        // Check last name match for compound names
        const entryParts = normalizedEntry.split(' ');
        const speakerParts = normalizedSpeaker.split(' ');
        // Match on last name + first name in any order
        if (entryParts.length >= 2 && speakerParts.length >= 2) {
          const entrySet = new Set(entryParts);
          const speakerSet = new Set(speakerParts);
          const intersection = [...entrySet].filter(x => speakerSet.has(x));
          if (intersection.length >= 2) return true;
        }
        return false;
      });

      if (match) {
        matched++;
        const fee = parseFee(entry.fee);
        const email = cleanEmail(entry.email);
        const phone = cleanPhone(entry.phone);
        
        const updateData: any = {};
        if (fee !== null) updateData.base_fee = fee;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('speakers')
            .update(updateData)
            .eq('id', match.id);
          
          if (!updateError) {
            updated++;
            results.push({ 
              status: 'updated', 
              excelName: entry.name, 
              dbName: match.name, 
              updates: updateData 
            });
          } else {
            results.push({ 
              status: 'error', 
              excelName: entry.name, 
              dbName: match.name, 
              error: updateError.message 
            });
          }
        } else {
          results.push({ 
            status: 'no_data', 
            excelName: entry.name, 
            dbName: match.name 
          });
        }
      } else {
        results.push({ 
          status: 'not_found', 
          excelName: entry.name 
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      total: speakerData.length,
      matched,
      updated,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
