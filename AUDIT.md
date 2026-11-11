# Audit du fichier de Laure — 25 octobre 2026

Source : `original/Entracte (Copy).html`, 1 138 lignes. Original conservé octet pour octet. Lecture du code complet et tests de la logique ; aucune validation des programmations auprès des salles.

## Ce qui existe et mérite d’être conservé

- Direction artistique cohérente : billet découpé, orange, jaune, violet, typographies Bricolage / Instrument Sans / DM Mono ; thème sombre, réduction des animations, adaptation mobile.
- Six étapes de quiz, modification des préférences avec annulation, goûts, artistes, groupe, âges, ambiance et budget.
- Catalogue éditorial, occurrences récurrentes, recherche par règles en français, suggestions par occasion ; cartes, week-ends, découverte par gestes et clavier.
- Favoris, artistes et alertes dans `localStorage`, clé `entracte2`. Le moteur adapte un bonus par catégorie après les gestes.

## Constats concrets et traitement

| Code initial | Conséquence | V2 |
|---|---|---|
| `pageDetail`, actions `data-soon` | Réserver et dîner ne font qu’afficher un message | Planificateur complet, brouillon et simulation intégrée |
| `pageAgenda` : seulement `picksFor` | Aucun programme personnel | Soirées enregistrées, chronologie et export calendrier |
| `pageTickets` : `ONSALE` | Pas de billets ni de commandes | Portefeuille de dossiers explicitement fictifs ; annonces conservées en section secondaire |
| `score` : prix nul traité comme budget compatible | Favorise une information manquante | Aucun bonus si prix inconnu |
| `score` : ville égale = « tout près » | Distance non calculée présentée comme proximité | Mention de la ville, sans promesse de distance |
| `homeAlerts` : délai négatif accepté | Ouvertures passées annoncées pour aujourd’hui | Exclusion des dates passées du bandeau |
| `sendAvis` : tout site HTTP supposé Netlify | Un succès HTTP pouvait laisser croire à un envoi | Collecte distante désactivée hors environnement d’origine ; copie disponible |
| Données statiques datées, nombreuses `approx:true` | Inventaire, prix, dates non garantis | Avertissement global et dans le parcours ; aucun appel d’achat réel |
| `JSON.parse` + `Object.assign` sans schéma complet | État local malformé possible | Validation des champs structurants ; sauvegarde invalide signalée pour les dossiers ; import contrôlé |
| Texte utilisateur dans les raisons du score | Risque d’injection HTML par nom d’artiste | Échappement des raisons dans les gabarits concernés |

## Limites restantes

Le pourcentage historique est une heuristique, pas une probabilité mesurée. Les cartes de liste utilisent désormais des points d’affinité ; certaines vues héritées gardent leur présentation en pourcentage. La recherche est un analyseur de règles, pas un assistant IA. La proximité des restaurants et les temps de marche ne sont pas calculés : toutes les propositions restaurant sont fictives. Le catalogue ne contient pas les coordonnées, durées officielles ni stocks nécessaires à une réservation fiable.

Le code hérité reste principalement monolithique, avec rendu `innerHTML` et gestionnaires réattachés. L’extension isole les calculs et les nouvelles vues sans réécrire brutalement Laure ; une extraction progressive est préférable avant production. Pas d’audit de sécurité exhaustif ni de conformité déclaré. Stockage navigateur sans chiffrement ni synchronisation. Les polices Google nécessitent Internet ; les polices système servent de repli.

## Priorités proposées

1. **P0 — Valider le produit local** : tester le quiz et la soirée avec Laure et des utilisateurs ; confirmer les règles de marge, durée, annulation, budget et besoins d’accessibilité. Finir les tests visuels mobile/desktop.
2. **P0 — Lever les dépendances commerciales** : obtenir par écrit le droit de distribuer, encaisser, réserver et gérer les annulations dans Entracte. Sans capacités intégrées accordées, ne pas ouvrir le paiement. Aucun accord TheFork ou billetterie présumé.
3. **P1 — Socle connecté** : backend, comptes, catalogue normalisé et vérifié, itinéraires, disponibilité, devis expirants, tests contractuels en sandbox partenaire.
4. **P1 — Transaction complète** : commandes à deux composantes, gestion des succès partiels, remboursements et rapprochement. Pilote fermé avec un fournisseur de billets et un fournisseur restaurant.
5. **P2 — Personnalisation mesurée** : filtres stricts de budget/distance/âge, diversité, retours explicites, explications cohérentes, alertes serveur consenties.

L’achat intégré est une exigence cible. La V2 livrée permet de tester l’expérience ; elle ne constitue pas une plateforme transactionnelle prête à être exploitée.
