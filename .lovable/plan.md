Je vais corriger le problème en ciblant les fenêtres modales de gestion propositions/contrats qui restent trop hautes sur écran type MacBook Air.

Plan :
1. Modifier les dialogs concernés dans `ContractInvoiceManager` pour utiliser une hauteur réellement contrainte au viewport : `max-height: calc(100dvh - marge)` plutôt que seulement `90vh`.
2. Donner à ces dialogs une largeur responsive avec marges fixes (`min(largeur, 100vw - 2rem)`) et garder `overflow-x-hidden` pour éviter tout retour du scroll horizontal.
3. Structurer les dialogs longs en conteneur scrollable fiable : header visible, contenu qui défile, bouton d'action accessible en bas même sur petit écran.
4. Appliquer la même règle aux popups contrat/facture/email liées aux propositions, sans changer la logique métier ni les emails.
5. Vérifier en viewport proche MacBook Air (`1139x779`) que la fenêtre complète reste visible et que le contenu est accessible par scroll vertical interne.