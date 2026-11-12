#!/usr/bin/env bash
# Prépare le dossier dist/ avec uniquement les fichiers publiés sur Cloudflare Pages.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/data
cp index.html _headers v2.js v2.css v4.css v4-shotgun.js v5-simple.js v6-accueil.js v7-retours.js v6.css live-ui.js planner-core.js dist/
cp data/catalog.js dist/data/
echo "dist/ prêt : $(find dist -type f | wc -l) fichiers"
