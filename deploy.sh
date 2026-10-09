#!/bin/sh
# Publie le jeu sur https://monstres.oliviergg.fr (site statique « monstres »
# géré par l'outil `site` sur boring-news-srv). Pas besoin de redéployer le
# conteneur : il lit directement le dossier html/.
set -e
cd "$(dirname "$0")"
rsync -av index.html game.js sprites.js boring-news-srv:sites/monstres/html/
echo "→ https://monstres.oliviergg.fr"
