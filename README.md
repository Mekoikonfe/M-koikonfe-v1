# Mékoikonfé V4 — idées inspirées de Shotgun

Nouvelles sources : connecteur **Ticketmaster** (Discovery API, Paris + 40 km, 42 jours) et **OpenAgenda multi-agendas**, plus mise à jour automatique chaque nuit via GitHub Actions → Cloudflare Pages. Guide pas à pas : `docs/MISE-A-JOUR-AUTO.md`.

Organisateur de soirée masqué (`v5-simple.js`, `PLANNER_ENABLED=false`) : chaque fiche propose « Billets et infos » et « Restaurants autour » (recherche Google Maps autour de la salle). L'onglet redevient « Billets ». Remettre `true` pour réafficher l'organisateur.

Cinéma en pause : `CINEMA_ENABLED=false` (dans `index.html`). « Cinéma » disparaît du quiz, du filtre Envie et de l'organisateur ; les projections du catalogue sont rangées dans « Festivals & ciné-événements » avec l'étiquette « Ciné-événement ». Les profils qui avaient choisi Cinéma passent automatiquement sur Festivals. Remettre `true` pour rouvrir le genre.


Ajouts dans `v4-shotgun.js` et `v4.css`, chargés après `live-ui.js`. Aucun fichier existant n'est réécrit en dehors des deux lignes d'inclusion dans `index.html`.

- **Ta semaine** : en haut de l'accueil, une idée par soir pour les sept prochains jours (meilleure suggestion du profil).
- **Salles suivies** : dans Portefeuille, choix parmi les lieux qui ont le plus de dates au catalogue, plus bouton « Suivre » sur chaque fiche. Les événements de ces salles gagnent des points d'affinité (« une salle que vous suivez ») et une rubrique « Du nouveau dans vos salles » apparaît sur l'accueil.
- **Liste d'attente** : sur les dates en partie complètes des annonces et sur chaque fiche. La disponibilité réelle n'étant pas connectée, l'inscription est enregistrée localement, sans notification.
- **Mes sorties et badges** (page `#sorties`, accessible depuis l'accueil et le Profil) : carnet alimenté par « J'y suis allé·e » et par la confirmation des soirées passées de l'agenda, 10 badges, invitation à copier (badge Ambassadeur·rice).

Stockage : clé locale `mekoikonfe-v4`, séparée des clés V2/V3. Ces données ne sont pas encore incluses dans l'export/import JSON.

Avis des testeurs : envoyés par e-mail via Formspree (`https://formspree.io/f/xaeoyqzb`), hors de Claude.

Tests : `node tests/v4.test.cjs` (19 assertions), en plus des suites existantes, qui passent toujours.

---

# Mékoikonfé V3 — MVP connecté

Démarrer avec `python3 serve.py`, puis ouvrir http://127.0.0.1:8765. Synchronisation des événements publics au démarrage puis toutes les six heures tant que le service reste ouvert. Un cache réel est fourni.

Voir [le guide du MVP connecté](docs/MVP-CONNECTE.md) pour l’audit, les sources, les limites, les tests et les accès partenaires nécessaires. Les explications ci-dessous décrivent les versions antérieures.

---

# Mékoikonfé V3 — dans la continuité de Laure

La V2 et l’original de Laure sont conservés. Cette V3 reprend la même direction artistique et les mêmes parcours. Le nom est un choix de travail, sans validation de disponibilité de marque.

## Changements V3

- Nom visible Mékoikonfé, titre du navigateur et noms des exports actualisés.
- Quatre choix de budget spectacle par personne : jusqu’à 25 €, jusqu’à 60 €, plaisir jusqu’à 1 000 €, ou « Peu importe, j’vois large 😅 » sans plafond.
- Aucun minimum : choisir un budget élevé ne pénalise pas les spectacles moins chers. Le mode sans plafond n’accorde ni bonus ni malus au prix, y compris au-delà de 1 000 €. Les prix inconnus restent à vérifier.
- Les plafonds sont des préférences de classement, pas des filtres stricts : un spectacle plus cher peut encore apparaître. Les critères explicites de prix dans la recherche restent prioritaires pour cette recherche.
- Dîner en supplément, comme indiqué dans l’organisateur de soirée.
- Les clés de stockage V2 restent identiques pour retrouver les données sur la même origine (adresse et port). L’export/import JSON permet de changer d’origine. Garder une sauvegarde V2 avant de réutiliser les données dans les deux versions.

## Utiliser et vérifier

Ouvrir index.html avec ses fichiers annexes, ou servir ce dossier sur une adresse locale stable. Dans Profil → Pratique, modifier le budget ; recharger pour vérifier sa conservation. Tester aussi le choix dans le dernier billet de l’onboarding. Les tests s’exécutent avec `node tests/planner.test.cjs` et `node tests/integration.test.cjs`.

Les fichiers techniques v2.js et v2.css conservent leurs noms pour limiter les modifications. Les documents historiques dans docs/ décrivent la base V2 ; cette page documente les évolutions V3. Le catalogue existant n’est pas enrichi artificiellement de spectacles à 1 000 €.

Achat, paiement et réservation restent simulés. Aucun nouvel accord partenaire, API ni backend n’est ajouté par ce changement.

---

## Documentation de la base V2

# Entracte V2 — prolongement du travail de Laure

Livraison locale du 25 octobre 2026. L’original est conservé dans `original/` ; `index.html` reprend directement son code et sa direction artistique. Les ajouts sont dans `v2.js`, `v2.css` et `planner-core.js`.

## Ouvrir

Décompresser l’archive et ouvrir **index.html** dans un navigateur récent. Garder les trois fichiers annexes à côté. Aucun serveur ni installation n’est nécessaire pour l’utilisation locale ; stockage et téléchargements peuvent dépendre des restrictions du navigateur en mode fichier. Pour une origine locale stable, depuis ce dossier :

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Puis ouvrir http://127.0.0.1:8765. Ne pas passer alternativement du fichier au serveur en attendant de retrouver les mêmes données : le stockage est lié à l’origine du navigateur. Les préférences héritées sont réutilisées seulement si elles existent sur cette même origine. Utiliser l’export JSON du profil pour transporter une sauvegarde V2.

## Essayer le parcours

1. Remplir les six billets de Laure, puis ouvrir un spectacle. Le premier billet propose désormais une tranche d’âge facultative, avec « Je cultive le mystère ». Ce choix est modifiable dans Profil → Identité, conservé localement et inclus dans les exports/imports. Les anciennes sauvegardes sans âge restent compatibles. L’âge des enfants accompagnants reste distinct. Cette donnée ne modifie pas encore le classement des recommandations.
2. Choisir « Organiser ma soirée », la séance, le nombre de personnes, le dîner avant/après et un restaurant de démonstration.
3. Ajuster le créneau. Déplier les hypothèses pour modifier durée du spectacle, dîner, marche et marge. Une incompatibilité bloque la simulation.
4. Enregistrer le brouillon dans l’agenda, ou simuler la réservation pour créer un dossier **non valable** dans le portefeuille.
5. Reprendre le dossier, exporter le programme calendrier ou annuler localement. Les modifications d’un dossier simulé ne changent aucune réservation extérieure : elles remplacent uniquement le test local.
6. Recharger le navigateur ; retrouver les dossiers et favoris. Dans Profil, exporter/restaurer les données ou les effacer après confirmation.

## Fonctionnel / démonstration / conception

| Disponible localement | Démonstration uniquement | Architecture future |
|---|---|---|
| Quiz, suggestions heuristiques, favoris et artistes | Catalogue non revérifié, sans stock réel | Catalogue synchronisé, disponibilité vérifiée |
| Calculs horaires, modification, agenda et export .ics | Restaurants, prix restaurant, créneaux et temps de marche fictifs | Recherche autour du lieu, itinéraires et disponibilité partenaire |
| Sauvegarde locale, export/import JSON | Confirmation spectacle et dîner simulée, référence locale | Compte, synchronisation, notifications serveur |
| Portefeuille et annulation des tests | Aucun paiement, billet d’accès ou table réservée | Achat et réservation dans Entracte, émission, annulations et remboursements |

Aucun accord ni accès API TheFork ou billetterie n’est supposé. Les liens vers les sources héritées sont informatifs ; ils ne constituent pas l’architecture cible d’achat. Aucun numéro de carte n’est demandé. Le prix spectacle est un tarif éditorial de départ et non un devis pour une catégorie ou une quantité de places.

## Documents

- `docs/AUDIT.md` : constats précis, changements et priorités.
- `docs/ARCHITECTURE.md` : backend, comptes, transactions, paiements et intégrations.
- `docs/TESTS.md` : résultats, limites et recette à réaliser.
- `architecture/contracts.ts` et `schema.sql` : contrats et schéma initiaux de conception, non branchés à l’interface et non déployés.

## Vérifications automatisées

Node.js récent, sans dépendance :

```sh
node tests/planner.test.cjs
node tests/integration.test.cjs
node --check v2.js
```

Le catalogue étant borné, l’application peut ne plus proposer de dates au-delà de sa période. Il faut brancher des sources autorisées avant un usage durable. Ne pas utiliser cette livraison pour vendre de vraies places.
