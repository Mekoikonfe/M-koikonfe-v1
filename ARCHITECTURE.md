# Architecture cible et passage à la réservation réelle

Document de conception, non backend déployé. Les contrats locaux joints décrivent le domaine et ne représentent pas les API de TheFork ou des billetteries.

## Frontières

Navigateur Entracte → API Entracte/BFF → services Catalogue, Recommandations, Planification, Commandes, Portefeuille → adaptateurs partenaires. PostgreSQL pour les données, file de travaux pour les confirmations et rapprochements, stockage privé pour les billets. Un environnement de simulation reste séparé de la production et utilise des références distinctes.

Le navigateur ne possède aucun secret fournisseur et ne décide jamais du prix ou du statut payé. Le serveur recalcule le devis, les quantités, l’itinéraire, la compatibilité et les frais à partir de données fraîches. Chaque séance porte une date avec fuseau IANA `Europe/Paris`, un instant de début, une durée et sa provenance ; chaque devis expose expiration, devise, conditions, prix et dernière vérification. Les heures approximatives bloquent la commande réelle.

## Capacités partenaires, sans supposition d’accès

Chaque adaptateur déclare : recherche, disponibilité en temps réel, devis, option temporaire, achat intégré, réservation intégrée, émission des billets, annulation, remboursement, webhooks et consultation de statut. Toutes ces capacités sont **désactivées par défaut**. Pas de repli silencieux vers une redirection d’achat. Si la capacité intégrée n’est pas contractuellement et techniquement accordée, Entracte reste en planification ou simulation, avec un motif explicite.

Pour TheFork : documenter l’interlocuteur, le périmètre géographique, l’autorisation de réserver dans Entracte, les champs requis, quotas, sandbox, traitement des données et règles de confirmation/annulation. Même travail par billetterie : droit de distribution, stock, placement, durée des options, livraison et service client. Ce document ne prétend pas que ces endpoints existent ou soient accessibles.

## Contrats Entracte proposés

- `GET /v1/events` et `/performances` : catalogue normalisé, source, fraîcheur, tarif connu/inconnu.
- `POST /v1/evening-quotes` : performance, participants, restaurant, créneau et préférences ; retourne devis détaillé, trajet et expiration. Montants en centimes ; inconnus à `null`, jamais zéro.
- `POST /v1/orders` : identifiant de devis, consentement aux conditions identifiées, `Idempotency-Key`. Retourne un dossier en cours, jamais une confirmation prématurée.
- `GET /v1/orders/:id` : statut global et par composante, actions possibles et raisons d’échec.
- `POST /v1/orders/:id/cancellation-quotes` puis `/cancellations` : estimation des conséquences puis demande idempotente.
- `POST /v1/webhooks/:provider` : vérification de signature, horodatage, anti-rejeu, déduplication, traitement asynchrone et rapprochement périodique.

## Transaction spectacle + dîner

Une transaction atomique entre deux fournisseurs ne peut pas être promise. Utiliser une saga persistée : `quoted → holding → awaiting_payment → confirming → confirmed`. Branches explicites `expired`, `failed`, `partially_confirmed`, `cancelling`, `cancelled`, `refund_pending`, `refunded`, `manual_review`.

1. Vérifier les stocks et le créneau ; poser des options quand disponibles.
2. Autoriser le paiement via un prestataire adapté, avec authentification forte si nécessaire. L’interface peut employer ses composants sécurisés intégrés ; Entracte ne collecte jamais les données carte brutes.
3. Confirmer chaque composante et attendre les références fournisseur. Capturer selon les possibilités réelles des contrats ; ne pas capturer une commande présentée comme entièrement confirmée avant d’avoir les deux confirmations.
4. Si une composante échoue : libérer l’autre option ou demander annulation/remboursement selon les conditions. Si compensation impossible, passer en succès partiel / intervention et informer l’utilisateur. Jamais de nouvelle tentative aveugle après délai réseau : consulter d’abord le statut avec la clé idempotente.
5. Émettre le portefeuille uniquement à partir des références réelles et des billets reçus. Montrer séparément confirmation spectacle, table et paiement. Les webhooks complètent les statuts, ils ne remplacent pas le rapprochement.

À décider avant développement connecté : qui vend et encaisse chaque composante, frais, reversements, factures, remboursements, support et responsabilité d’une soirée partiellement confirmée. Faire valider ces choix avec les partenaires et les conseils compétents.

## Authentification, données et exploitation

Identité via fournisseur OIDC, session serveur en cookie HttpOnly/Secure/SameSite, protection CSRF, limitation de débit, autorisation sur chaque ressource et isolation par utilisateur. Consultation de catalogue possible sans compte ; rattachement d’un brouillon après connexion avec accord explicite. Aucun mot de passe ou jeton dans `localStorage`.

Secrets dans un gestionnaire dédié, environnements et comptes séparés. Chiffrement en transit et au repos, journaux sans données carte ni billets complets, durée de conservation définie, export/suppression des données et conservation des pièces transactionnelles traités séparément. Notifications et analytics avec préférences explicites. Sauvegardes restaurées en exercice, alertes sur échecs partenaires et paiements, journal de transitions, file des interventions et indicateurs de réservation partielle.

## Tests avant mise en production

Tests contractuels par adaptateur avec données sandbox ; stock épuisé après devis ; créneau retiré ; option expirée ; changement de prix ; double clic ; webhook dupliqué ou désordonné ; délai réseau après achat ; paiement refusé ou authentification abandonnée ; confirmation restaurant tardive ; annulation et remboursement partiels ; changement d’heure été/hiver ; voyage après minuit ; contrôle d’accès entre deux utilisateurs. Recette d’accessibilité clavier et lecteur d’écran, test de charge et revue de sécurité indépendante avant pilote payant.
