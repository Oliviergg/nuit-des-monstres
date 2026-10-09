#!/usr/bin/env python3
"""Récupère les sprites d'un projet Sprite BASIC et régénère sprites.js.

Usage : python3 outils/extraire-sprites.py ["la nuit des monstres"]

À relancer quand de nouveaux monstres ont été dessinés dans l'atelier
(https://github.com/Oliviergg/toy-basic) et sauvegardés dans le cloud.
"""
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://ym6nkv9jc8.execute-api.eu-west-3.amazonaws.com"
NB_SPRITES = 32

nom = sys.argv[1] if len(sys.argv) > 1 else "la nuit des monstres"
url = f"{API}/projects/{urllib.parse.quote(nom)}"
with urllib.request.urlopen(url) as r:
    projet = json.load(r)

lignes = [
    f"// Les {NB_SPRITES} sprites dessinés dans Sprite BASIC (projet « {nom} »).",
    "// Un caractère hexa par pixel (0 = transparent, 1..f = couleur de la palette).",
    "// Fichier généré par outils/extraire-sprites.py — ne pas éditer à la main.",
    "const SPRITES = [",
]
for i, sprite in enumerate(projet["sprites"][:NB_SPRITES]):
    lignes.append('  "' + "".join(f"{v:x}" for v in sprite) + f'", // {i}')
lignes.append("];")

sortie = Path(__file__).resolve().parent.parent / "sprites.js"
sortie.write_text("\n".join(lignes) + "\n")
print(f"{sortie.name} régénéré depuis « {nom} »")
