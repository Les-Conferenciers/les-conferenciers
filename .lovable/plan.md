# Correction affichage photo "Nelly selfies" sur /contact

## Problème

Sur la page `/contact`, le bloc "Nelly, votre interlocutrice" n'affiche que le texte alternatif au lieu de la photo. La photo est référencée via :

```ts
import selfiesAsset from "@/assets/selfies-avec-nelly.png.asset.json";
const selfiesAvecNelly = selfiesAsset.url; // /__l5e/assets-v1/.../selfies-avec-nelly.png
```

Le fichier réel n'est PAS dans le repo : il est servi par le CDN Lovable via un chemin `/__l5e/...`. Ce chemin pose plusieurs soucis en production Netlify :
- bloqué par certains adblockers/filtres entreprise (préfixe inhabituel),
- dépend du proxy Lovable pour résoudre à travers Netlify,
- aucun cache long terme côté Netlify.

Toutes les autres images du site (logos partenaires, blog…) sont servies depuis `/public/` localement — c'est la convention du projet (cf. mémoire `Logo Assets`).

## Solution

Réhéberger l'image directement dans `/public/` et la référencer en chemin statique.

### Étapes

1. Télécharger le binaire depuis le CDN Lovable :
   `curl -o public/selfies-avec-nelly.png https://www.lesconferenciers.com/__l5e/assets-v1/680c7df7-d88d-4c49-b01a-911819887898/selfies-avec-nelly.png`

2. Modifier `src/pages/Contact.tsx` :
   - Supprimer l'import `selfiesAsset` du JSON.
   - Remplacer `const selfiesAvecNelly = selfiesAsset.url;` par `const selfiesAvecNelly = "/selfies-avec-nelly.png";`

3. Supprimer `src/assets/selfies-avec-nelly.png.asset.json` (devenu inutile).

### Vérification

- Build + ouvrir `/contact` dans le preview : la photo doit s'afficher dans le cadre "Nelly, votre interlocutrice".
- Le fichier sera servi par Netlify avec un cache statique long terme.

## Hors scope

Pas de changement de layout, de wording, ni d'autres composants.
