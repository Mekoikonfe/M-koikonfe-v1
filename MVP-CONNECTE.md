# MVP connecté — 25 octobre 2026

## Audit et périmètre

La V3 fournie est un seul HTML contenant le catalogue, le quiz, le classement et le rendu, plus une extension v2.js et un calculateur de soirée indépendant. Aucun serveur, flux, compte ou stock de billets n'existait. Les catalogues EVENTS et les annonces de billetterie historiques n'étaient pas revérifiés. Les contrats SQL/TypeScript étaient uniquement des propositions.

Le présent MVP conserve la mise en page, les six billets de Laure, préférences, budgets, favoris, agenda, export/import et simulation de soirée. Les événements historiques conservent leurs identifiants pour reprendre les anciens dossiers, mais leurs séances ne sont plus proposées. Les annonces historiques du portefeuille restent des démonstrations, sans valeur de disponibilité actuelle. Aucun paiement ni réservation extérieure n'est ajouté.

## Démarrer

Python 3.9 ou plus récent, avec données de fuseaux horaires système. Aucune bibliothèque à installer.

```sh
python3 serve.py
```

Ouvrir http://127.0.0.1:8765. Le serveur local démarre immédiatement sur le cache livré et lance une récupération au démarrage puis toutes les six heures. Le processus doit rester ouvert ; fermer l'ordinateur ou arrêter le processus arrête la synchronisation. Recharger la page pour lire les nouvelles données. Ne pas exécuter plusieurs synchronisations simultanées. Pour une publication, un seul worker supervisé doit exécuter `python3 ingestion/sync.py --watch`, et un serveur web doit servir les fichiers. Le MVP n'est pas déployé et n'a pas de supervision de production.

Une récupération ponctuelle : `python3 ingestion/sync.py`. Code de sortie 1 si une source échoue. Aucun secret dans les fichiers livrés. OpenAgenda s'active par variables d'environnement côté serveur `OPENAGENDA_UID` et `OPENAGENDA_KEY` ; ne pas placer la clé dans le navigateur. Changer d'origine/port peut changer le stockage du profil ; exporter d'abord sa sauvegarde.

## Sources et droits documentés

| Source | État réel | Couverture et accès | Conditions / suite |
| --- | --- | --- | --- |
| [Paris Data — Que Faire à Paris](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/information/) | Connecté et testé en direct | Agenda participatif modéré de la Ville, Paris/région ; théâtre, concert, musée/exposition, projections selon les contributions ; API Explore v2.1 publique sans clé | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) : attribution et obligations de partage à l'identique pour la base dérivée redistribuée. Le catalogue dérivé de cette livraison reste sous ODbL. Ne pas présenter chaque contributeur comme une institution officielle. |
| [OpenAgenda API](https://developers.openagenda.com/) | Connecteur préparé, non testé avec une clé réelle | Agendas de lieux et institutions choisis explicitement ; authentification requise même en lecture | Obtenir clé et UID, contrôler schéma/quotas avec le fournisseur. [Licence par événement](https://developers.openagenda.com/licence/) : liste d'acceptation Etalab 2.0 / CC BY 4.0, concédant obligatoire. Autres licences rejetées. Valider sur agenda choisi avant activation. |
| Billetteries des théâtres / salles / musées | Non connectées | Horaires et offres contractuels | Obtenir documentation et accord de chaque partenaire pour prix à jour, catégories, stock, achat et éventuelle affiliation. Aucun accès partenaire supposé. |
| Cinémas : séances commerciales exhaustives | Non connectées | Le flux parisien contient des projections culturelles, pas toutes les séances commerciales | Identifier avec les exploitants un fournisseur contractuel de séances, droits de rediffusion et fréquence ; aucun scraping de programmes, aucune API de billetterie inventée. |

Le MVP n'utilise ni images ni descriptions HTML intégrales afin de limiter les questions de droits photographiques et d'injection. Il affiche les courts textes introductifs, les attributions et le lien de chaque source. Avant une exploitation commerciale plus large, contrôler les conditions de chaque nouvelle source et les obligations ODbL de la base combinée. Les données d'agenda n'accordent aucun droit de distribution de billets.

## Contrat des données

`data/catalog.json` : schemaVersion, generatedAt (date de tentative/publication du lot), sources (états séparés), events. Chaque événement porte key source:id, title, category, description, lieu/adresse/coordonnées si fournis, sessions avec débuts/fins ISO à fuseau explicite et projection Europe/Paris, période brute éventuelle, priceText, priceVerified=false, availability=unknown, source et sources fusionnées, updatedAt éditeur, lastCheckedAt (dernière récupération réussie), qualité et avertissements.

Les montants textuels ne sont jamais interprétés comme un prix payable ni comme un minimum garanti. Le champ prix du classement reste inconnu. L'âge et le public ne sont pas déduits du titre ; les recommandations familiales ne sont pas qualifiées par cette source. Le MVP classe les catégories par mots-clés des tags, sans prétendre à une classification éditoriale exhaustive.

Seules les occurrences explicitement publiées sont utilisées, dans un horizon de 42 jours. Les périodes de plus de 18 heures ne sont pas déployées en jours d'ouverture inventés : elles apparaissent dans « Événements sans séance exploitable », avec lien source. Les occurrences invalides, inversées, sans fuseau ou hors horizon sont écartées. Les offsets fournis par l'éditeur sont respectés puis convertis en Europe/Paris ; une incohérence éditoriale nécessite correction à la source.

Toutes les séances explicites restent dans les données normalisées ; l'interface héritée et son organisateur utilisent la première séance de chaque jour, et l'indiquent. Une sélection entre plusieurs horaires d'une même journée est un prolongement à faire. Les durées du programme, restaurants, marches et créneaux de dîner restent des hypothèses de démonstration.

## Synchronisation et doublons

La licence ODbL est contrôlée dans les métadonnées Paris avant chaque collecte ; un changement inattendu refuse la nouvelle collecte.

Paris : pagination de 100 en 100, ordre par id, filtre de fin future côté source, filtrage culturel et horizon côté normalisation. Reprise complète plutôt qu'incrémentale : permet de retirer une fiche supprimée ou devenue hors périmètre à la prochaine lecture réussie. Pagination incomplète : refus du lot. Une API mutable pendant la pagination peut nécessiter une nouvelle synchronisation ; pas de garantie transactionnelle amont.

Trois tentatives réseau, délai exponentiel, temporisation entre pages. En cas d'échec d'une source, conservation de son cache avec sa date de dernière réussite inchangée et état d'erreur visible. Les autres sources peuvent avancer. Écriture par remplacement atomique de chaque fichier ; le navigateur consomme le seul catalog.js, sans lecture partielle. Le cache n'est pas un justificatif de disponibilité ; au-delà de deux jours depuis la récupération, la fiche porte un avertissement de vieillissement.

Doublons : titre normalisé (casse/accents), lieu, ville et mêmes débuts de séances. Sans séance, les périodes doivent aussi correspondre. Fusion conservatrice des provenances ; aucune fusion floue de titres proches. Risque de doublons résiduels (variantes de nom de lieu), préférable à fusionner deux représentations différentes. Pas de registre d'identité intersource en production : une fusion peut changer l'identifiant principal si la source dominante disparaît. Les identifiants numériques adaptés à l'ancien parcours sont déterministes, et une collision bloque le chargement au lieu de mélanger les dossiers.

## Vérifications

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/planner.test.cjs
node tests/integration.test.cjs
node tests/live.test.cjs
```

Tests de normalisation, fuseau et changement d'heure, séances multiples, périodes, dates invalides, URL non sûre, catégories, dédoublonnage, licence refusée, pagination, panne/cache sans fausse fraîcheur, retrait après succès. Tests existants de budgets, soirées, persistance et annulation conservés. Intégration du vrai cache livré : fiche sourcée, tarif inconnu et organisation d'une soirée. Le test OpenAgenda ne certifie pas l'accès API sans clé : recette partenaire encore nécessaire.

## Limites avant production

Installer le worker sur un hébergement persistant, verrou de synchronisation, métriques/alertes, sauvegardes et suivi d'évolution du schéma. Ajouter une vue de supervision avec dernier succès de chaque source, contrôle d'effondrement anormal du catalogue et reprise manuelle. Mettre en place un registre d'identité si plusieurs sources sont activées, puis étendre les horaires/périodes et la qualification des publics. Un service de stock, de paiement ou de notification nécessite un chantier et des accords distincts.

## Recherche directe depuis l’organisateur

Le billet « Organiser ma soirée » permet de rechercher par date et genre, avec « À deux » par défaut (deux personnes, sans qualification romantique inventée). Théâtre et horaires à partir de 18 h sont proposés par défaut. Les résultats ne sont pas limités aux goûts du profil. Le choix reprend la date et la séance explicitement affichées ; les 30 premières idées sont montrées et un jour précis permet d’affiner. Tests supplémentaires : théâtre, horaire du soir, date, choix à deux, message de catalogue partiel sans résultat.

## Correctif recherche en langage courant

Les mots de date, de genre et de compagnie sont exclus de la reconnaissance approximative des titres et lieux. « Un théâtre la semaine prochaine » reconnaissait à tort « Semaine des galeries parisiennes » et renvoyait zéro résultat. La phrase affiche désormais les 20 premiers résultats correspondants ; tests de régression sur demandes génériques, vrais titres et vraies salles.
