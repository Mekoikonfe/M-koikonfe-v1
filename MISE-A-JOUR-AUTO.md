# Mise à jour automatique du catalogue — Ville de Paris + Ticketmaster + OpenAgenda

Chaque nuit, GitHub lance `ingestion/sync.py`, vérifie le catalogue puis republie le site sur Cloudflare Pages (projet `sorties-test-laure`). Les clés restent dans les « secrets » GitHub : elles n'apparaissent jamais dans le site ni dans le chat.

## 1. Récupérer les clés (ne les collez jamais dans le chat)
- **Ticketmaster** : developer.ticketmaster.com → *My Apps* → copier la **Consumer Key**.
- **OpenAgenda** : openagenda.com → votre profil → *Paramètres* → **clé API**. Noter aussi le **numéro (UID)** de chaque agenda à suivre (ville, département, salles). Plusieurs agendas : séparés par des virgules.
- **Cloudflare** :
  - *My Profile* → *API Tokens* → *Create Token* → *Custom token* avec la permission **Account → Cloudflare Pages → Edit**. Copier le jeton.
  - *Workers & Pages* → colonne de droite : **Account ID**.

## 2. Mettre le projet sur GitHub
1. Créer un compte sur github.com puis un dépôt **privé** (`mekoikonfe`).
2. *uploading an existing file* : glisser tout le contenu du dossier `mekoikonfe-v4`.
3. Le dossier `.github` est souvent masqué sur Mac/Windows : le créer à la main avec *Add file → Create new file*, nom `.github/workflows/sync.yml`, et coller le contenu du fichier `sync.yml` fourni.

## 3. Renseigner les secrets
Dépôt → *Settings* → *Secrets and variables* → *Actions* :
- onglet **Secrets** : `TICKETMASTER_KEY`, `OPENAGENDA_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` ;
- onglet **Variables** : `OPENAGENDA_UIDS` (ex. `12345678,87654321`).
Une source sans clé est simplement ignorée (état « accès à configurer »).

## 4. Lancer et vérifier
Onglet *Actions* → *Mise à jour du catalogue* → **Run workflow**. Au bout de quelques minutes, le bas de page du site indique les sources actives (« Agenda : Que faire à Paris…, Ticketmaster ») et la date de mise à jour. Ensuite, tout se fait seul chaque nuit vers 4 h 30.

## Garde-fous
- Si une source échoue, son ancien cache est conservé ; les autres avancent.
- Si le catalogue tombe sous 200 événements, la publication est annulée.
- Ticketmaster : les billets renvoient vers la page officielle de l'événement (charte d'utilisation de l'API). Quota par défaut : 5 000 appels/jour ; la synchronisation en utilise une trentaine.
- La branche de production du projet Cloudflare doit être `main` (valeur par défaut). Sinon, adapter `--branch=` dans `sync.yml`.
