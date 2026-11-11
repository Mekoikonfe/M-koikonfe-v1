# Vérifications — 25 octobre 2026

## Exécuté avec succès

- 12 assertions sur le moteur pur : dîner avant/après, créneau incompatible, compatibilité à la limite exacte, passage après minuit, format J+1, heures et durées invalides.
- 11 assertions d’intégration dans un contexte JavaScript isolé : catalogue hérité et sélection de séance, avertissement simulation, planification, persistance JSON, agenda, portefeuille non valable, favoris, sauvegarde des préférences, incompatibilité et retrait de l’agenda après annulation.
- Analyse syntaxique de `v2.js` et `planner-core.js` ; exécution du script hérité dans le test d’intégration.
- Comparaison binaire de l’original livré avec le fichier source de Laure.
- Service HTTP local : réponse 200 pour l’entrée de la V2.

Les tests d’intégration vérifient les fonctions de rendu et l’état, avec stockage substitué ; ils ne constituent pas des tests de clics dans un navigateur. Aucun appel à un partenaire ni transaction réelle.

## Limite constatée

Deux tentatives d’ouverture de l’aperçu intégré ont échoué avec un délai d’attachement du navigateur dépassé. Aucune capture ou recette visuelle revendiquée. Les dimensions mobile/desktop, le focus après rendu, l’export réel dans les logiciels de calendrier et les contrôles natifs de formulaire restent à vérifier dans un navigateur.

## Recette manuelle à terminer avant pilote

- Onboarding complet, retour arrière, modification puis annulation ; six billets, clavier, zoom 200 %, mobile étroit, thème sombre et animations réduites.
- Favori ajouté puis retiré ; rechargement ; artistes suivis ; absence de faux envoi d’avis ou de notification.
- Dîner avant puis après, changement de séance et de restaurant, prix spectacle inconnu, 1 et 12 personnes, marche 0/120 min, marges, minuit ; bouton de simulation désactivé si incompatible.
- Brouillon → reprise → simulation → portefeuille → rechargement → annulation ; dossiers annulés conservés dans le portefeuille mais exclus de l’agenda.
- Export JSON, import valide et fichier invalide ; stockage refusé ; export .ics dans deux logiciels. L’export utilise des heures locales flottantes et indique Europe/Paris dans sa description : à remplacer par de vrais instants zonés au stade backend.
- Aucun billet ou QR code fictif présenté comme utilisable ; aucun montant demandé, aucune requête de réservation partenaire, aucune redirection d’achat requise.

## Tests connectés futurs

Voir les cas de transaction et de sécurité détaillés dans ARCHITECTURE.md. Le schéma SQL et les contrats TypeScript sont des supports de conception, pas un backend testé.
