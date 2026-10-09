// La nuit des monstres — un labyrinthe, des monstres, et Steeve avec son épée.
// JavaScript pur + Canvas : on dessine en 240×192 « vrais » pixels, puis le
// navigateur agrandit l'image sans la lisser (image-rendering: pixelated).
"use strict";

// ---------------------------------------------------------------------------
// Palette et dimensions (mêmes 16 couleurs que Sprite BASIC)
// ---------------------------------------------------------------------------
const PALETTE = [
  "#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
  "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA",
];

const T = 16;            // taille d'une case du labyrinthe = taille d'un sprite
const VW = 15, VH = 11;  // cases visibles à l'écran
const HUD = 16;          // bandeau du haut
const W = VW * T, H = VH * T + HUD;

const canvas = document.getElementById("ecran");
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function ajusterTaille() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / W, (innerHeight - 24) / H)));
  canvas.style.width = W * s + "px";
  canvas.style.height = H * s + "px";
}
addEventListener("resize", ajusterTaille);
ajusterTaille();

// ---------------------------------------------------------------------------
// Sprites : on fabrique une petite image par sprite (+ une version toute
// blanche pour le « flash » quand un monstre prend un coup).
// ---------------------------------------------------------------------------
function fabriquerSprite(hex, blanc) {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const g = c.getContext("2d");
  for (let i = 0; i < 256; i++) {
    const v = parseInt(hex[i], 16);
    if (!v) continue;
    g.fillStyle = blanc ? PALETTE[7] : PALETTE[v];
    g.fillRect(i % 16, i >> 4, 1, 1);
  }
  return c;
}
const IMG = SPRITES.map((h) => fabriquerSprite(h, false));
const IMG_FLASH = SPRITES.map((h) => fabriquerSprite(h, true));
const COULEURS_SPRITE = SPRITES.map((h) =>
  [...new Set([...h].map((c) => parseInt(c, 16)).filter((v) => v > 0))]
);

function spr(n, x, y, retourne = false, flash = false) {
  const img = (flash ? IMG_FLASH : IMG)[n];
  x = Math.round(x);
  y = Math.round(y);
  if (retourne) {
    ctx.save();
    ctx.translate(x + 16, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y);
  }
}

// Numéros des sprites dessinés par l'artiste
const S = { STEEVE: 3, MUR: 21, TORCHE: 24, LUNE: 26 };

// ---------------------------------------------------------------------------
// Petites primitives « pixel »
// ---------------------------------------------------------------------------
function rect(x, y, w, h, c) {
  ctx.fillStyle = PALETTE[c];
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function cercleplein(cx, cy, r, c) {
  ctx.fillStyle = PALETTE[c];
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
  }
}
function cercle(cx, cy, r, c) {
  ctx.fillStyle = PALETTE[c];
  for (let a = 0; a < 360; a += 3) {
    const t = (a * Math.PI) / 180;
    ctx.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 1, 1);
  }
}
const COEUR = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
function coeur(x, y, c) {
  ctx.fillStyle = PALETTE[c];
  COEUR.forEach((ligne, j) => {
    for (let i = 0; i < 7; i++) if (ligne[i] === "#") ctx.fillRect(x + i, y + j, 1, 1);
  });
}

// Police bitmap 3×5 de Sprite BASIC
const GLYPHES = {
  A: ["###", "#.#", "###", "#.#", "#.#"], B: ["##.", "#.#", "##.", "#.#", "##."],
  C: ["###", "#..", "#..", "#..", "###"], D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"], F: ["###", "#..", "##.", "#..", "#.."],
  G: ["###", "#..", "#.#", "#.#", "###"], H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"], J: ["..#", "..#", "..#", "#.#", "###"],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"], L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"], N: ["#.#", "###", "###", "###", "#.#"],
  O: ["###", "#.#", "#.#", "#.#", "###"], P: ["###", "#.#", "###", "#..", "#.."],
  Q: ["###", "#.#", "#.#", "###", "..#"], R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: ["###", "#..", "###", "..#", "###"], T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"], V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "###", "###", "#.#"], X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."], Z: ["###", "..#", ".#.", "#..", "###"],
  0: ["###", "#.#", "#.#", "#.#", "###"], 1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"], 3: ["###", "..#", "###", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"], 5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"], 7: ["###", "..#", ".#.", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"], 9: ["###", "#.#", "###", "..#", "###"],
  ".": ["...", "...", "...", "...", ".#."], "!": [".#.", ".#.", ".#.", "...", ".#."],
  ":": ["...", ".#.", "...", ".#.", "..."], "-": ["...", "...", "###", "...", "..."],
  "+": ["...", ".#.", "###", ".#.", "..."], "/": ["..#", "..#", ".#.", "#..", "#.."],
  "'": [".#.", ".#.", "...", "...", "..."], x: ["...", "#.#", ".#.", "#.#", "..."],
};
function sansAccents(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/×/g, "x");
}
function largeurTexte(s, k = 1) {
  return sansAccents(s).length * 4 * k - k;
}
function texte(s, x, y, c, k = 1) {
  ctx.fillStyle = PALETTE[c];
  let cx = Math.round(x);
  for (const ch of sansAccents(s)) {
    const g = GLYPHES[ch];
    if (g) {
      for (let j = 0; j < 5; j++)
        for (let i = 0; i < 3; i++) if (g[j][i] === "#") ctx.fillRect(cx + i * k, y + j * k, k, k);
    }
    cx += 4 * k;
  }
}
function texteCentre(s, y, c, k = 1, ombre = true) {
  const x = Math.round((W - largeurTexte(s, k)) / 2);
  if (ombre) texte(s, x + k, y + k, 0, k);
  texte(s, x, y, c, k);
}

// ---------------------------------------------------------------------------
// Son : bips et la mélodie composée dans Sprite BASIC
// ---------------------------------------------------------------------------
const THEME =
  "la1:3 - do2 si1 do2 mi2:2 - fa2:2 mi2 re2 do2 si1:2 - la1 sol#1 la1 mib2:2 - mi2:3 - -";

let actx = null, maitre = null, muet = false;
function audio() {
  if (!actx) {
    actx = new AudioContext();
    maitre = actx.createGain();
    maitre.gain.value = 0.5;
    maitre.connect(actx.destination);
  }
  if (actx.state === "suspended") actx.resume();
  return actx;
}
function bip(f1, f2, duree, onde = "square", vol = 0.15, retard = 0) {
  if (!actx) return;
  const t = actx.currentTime + retard;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = onde;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f2, 20), t + duree);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duree);
  o.connect(g).connect(maitre);
  o.start(t);
  o.stop(t + duree + 0.02);
}
// bruit blanc qui s'éteint : le « boum » des explosions
function bruit(duree, vol) {
  if (!actx) return;
  const n = Math.floor(actx.sampleRate * duree);
  const tampon = actx.createBuffer(1, n, actx.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = actx.createBufferSource(), filtre = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = tampon;
  filtre.type = "lowpass";
  filtre.frequency.value = 1000;
  g.gain.value = vol;
  src.connect(filtre).connect(g).connect(maitre);
  src.start();
}
const SON = {
  epee: () => bip(1400, 300, 0.07, "square", 0.06),
  touche: () => bip(320, 110, 0.1, "square", 0.15),
  mort: () => { bruit(0.3, 0.5); bip(500, 900, 0.08, "square", 0.08); bip(900, 1500, 0.1, "square", 0.06, 0.08); },
  aie: () => bip(220, 50, 0.35, "sawtooth", 0.2),
  objet: () => { bip(700, 700, 0.06, "triangle", 0.2); bip(1050, 1050, 0.1, "triangle", 0.2, 0.06); },
  portail: () => [523, 659, 784, 1047].forEach((f, i) => bip(f, f, 0.12, "square", 0.08, i * 0.09)),
  perdu: () => [392, 330, 262, 196].forEach((f, i) => bip(f, f * 0.98, 0.25, "sawtooth", 0.12, i * 0.25)),
};

// Même notation que Sprite BASIC : <note>[#|b][octave 1..3][:durée], « - » = silence
function lireMelodie(src) {
  const DEMI = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
  return src.trim().split(/\s+/).map((brut) => {
    const [haut, dur] = brut.split(":");
    const temps = dur ? parseFloat(dur) || 1 : 1;
    const m = /^(sol|do|re|mi|fa|la|si)(#|b)?([1-3])?$/.exec(haut.toLowerCase().replace(/[éè]/g, "e"));
    if (!m) return { freq: null, temps };
    let demi = DEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    const midi = 12 * ((m[3] ? +m[3] : 2) + 3) + demi;
    return { freq: 440 * Math.pow(2, (midi - 69) / 12), temps };
  });
}
const musique = { notes: lireMelodie(THEME), i: 0, prochaine: 0, minuteur: null, sortie: null, debuts: [], temps: 0 };
function lancerMusique() {
  audio();
  arreterMusique();
  musique.sortie = actx.createGain();
  musique.sortie.connect(maitre);
  musique.i = 0;
  musique.prochaine = actx.currentTime + 0.05;
  musique.minuteur = setInterval(planifierMusique, 25);
}
function planifierMusique() {
  const bpm = 120;
  while (musique.prochaine < actx.currentTime + 0.1) {
    const n = musique.notes[musique.i];
    const d = (n.temps * 60) / bpm;
    if (n.freq) {
      const o = actx.createOscillator(), g = actx.createGain();
      const t = musique.prochaine;
      o.type = "sawtooth"; // le timbre « grinçant » choisi dans le BASIC
      o.frequency.value = n.freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.setValueAtTime(0.12, t + d * 0.85);
      g.gain.linearRampToValueAtTime(0, t + d * 0.98);
      o.connect(g).connect(musique.sortie);
      o.start(t);
      o.stop(t + d);
    }
    musique.debuts.push(musique.prochaine);
    musique.prochaine += d;
    musique.i = (musique.i + 1) % musique.notes.length;
  }
}
function arreterMusique() {
  clearInterval(musique.minuteur);
  musique.minuteur = null;
  musique.debuts = [];
  if (musique.sortie) {
    const s = musique.sortie;
    s.gain.setTargetAtTime(0, actx.currentTime, 0.03);
    setTimeout(() => s.disconnect(), 300);
    musique.sortie = null;
  }
}
// équivalent de musicbeat() : nombre de notes déjà jouées
function temposMusique() {
  while (actx && musique.debuts.length && musique.debuts[0] <= actx.currentTime) {
    musique.debuts.shift();
    musique.temps++;
  }
  return musique.temps;
}

// ---------------------------------------------------------------------------
// Clavier (flèches, ou ZQSD sur un clavier AZERTY = WASD en QWERTY)
// ---------------------------------------------------------------------------
const DIRS = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
const TOUCHES = {
  ArrowUp: "haut", KeyW: "haut", ArrowDown: "bas", KeyS: "bas",
  ArrowLeft: "gauche", KeyA: "gauche", ArrowRight: "droite", KeyD: "droite",
};
const tenues = []; // directions enfoncées, la dernière gagne
// une touche juste effleurée compte quand même (sinon perdue si Steeve était en route)
let demande = null;
addEventListener("keydown", (e) => {
  audio();
  const d = TOUCHES[e.code];
  if (d) {
    e.preventDefault();
    if (!tenues.includes(d)) tenues.push(d);
    demande = { d, t: performance.now() };
    return;
  }
  if (e.repeat) return;
  if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); action(); }
  else if (e.code === "KeyM") { muet = !muet; maitre.gain.value = muet ? 0 : 0.5; }
  else if (e.code === "KeyP" || e.code === "Escape") { if (etat === "jeu") pause = !pause; }
  else if (etat === "titre" && !musique.minuteur) lancerMusique();
});
addEventListener("keyup", (e) => {
  const d = TOUCHES[e.code];
  if (d) tenues.splice(tenues.indexOf(d), 1);
});
addEventListener("blur", () => { tenues.length = 0; });
canvas.addEventListener("pointerdown", () => {
  audio();
  if (etat === "titre" && !musique.minuteur) lancerMusique();
});

// ---------------------------------------------------------------------------
// Le labyrinthe
// ---------------------------------------------------------------------------
function melanger(t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

// « Creuseur » : on part d'une case et on creuse au hasard en reculant
// quand on est coincé. Puis on casse quelques murs pour faire des boucles
// (sinon un monstre dans un cul-de-sac bloque tout un couloir).
function genererLabyrinthe(cols, lignes) {
  const g = Array.from({ length: lignes }, () => Array(cols).fill(1));
  g[1][1] = 0;
  const pile = [[1, 1]];
  while (pile.length) {
    const [x, y] = pile[pile.length - 1];
    const possibles = melanger([[2, 0], [-2, 0], [0, 2], [0, -2]]).filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx > 0 && ny > 0 && nx < cols - 1 && ny < lignes - 1 && g[ny][nx] === 1;
    });
    if (!possibles.length) { pile.pop(); continue; }
    const [dx, dy] = possibles[0];
    g[y + dy / 2][x + dx / 2] = 0;
    g[y + dy][x + dx] = 0;
    pile.push([x + dx, y + dy]);
  }
  for (let y = 1; y < lignes - 1; y++)
    for (let x = 1; x < cols - 1; x++) {
      if (g[y][x] !== 1) continue;
      const horiz = !g[y][x - 1] && !g[y][x + 1] && g[y - 1][x] && g[y + 1][x];
      const vert = !g[y - 1][x] && !g[y + 1][x] && g[y][x - 1] && g[y][x + 1];
      if ((horiz || vert) && Math.random() < 0.12) g[y][x] = 0;
    }
  return g;
}

// Distance « en marchant » de chaque case jusqu'à (sx, sy)
function distances(sx, sy) {
  const d = grille.map((l) => l.map(() => Infinity));
  d[sy][sx] = 0;
  const file = [[sx, sy]];
  for (let i = 0; i < file.length; i++) {
    const [x, y] = file[i];
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = x + dx, ny = y + dy;
      if (grille[ny][nx] === 0 && d[ny][nx] === Infinity) {
        d[ny][nx] = d[y][x] + 1;
        file.push([nx, ny]);
      }
    }
  }
  return d;
}

// ---------------------------------------------------------------------------
// Les monstres (numéro de sprite, points de vie, ms par case, flair)
// flair = à combien de cases il sent Steeve et le poursuit (0 = il erre)
// ---------------------------------------------------------------------------
const MONSTRES = [
  { spr: 11, nom: "slime", pv: 1, vit: 520, flair: 0, niveau: 1 },
  { spr: 9, nom: "goutte", pv: 1, vit: 480, flair: 0, niveau: 1 },
  { spr: 2, nom: "zombie", pv: 2, vit: 650, flair: 6, niveau: 1 },
  { spr: 17, nom: "araignée", pv: 1, vit: 260, flair: 0, niveau: 1 },
  { spr: 15, nom: "zombie violet", pv: 2, vit: 600, flair: 7, niveau: 2 },
  { spr: 4, nom: "squelette", pv: 2, vit: 420, flair: 5, niveau: 2 },
  { spr: 28, nom: "chauve-souris", pv: 1, vit: 240, flair: 0, niveau: 2 },
  { spr: 1, nom: "gargouille", pv: 2, vit: 480, flair: 4, niveau: 2 },
  { spr: 7, nom: "fantôme", pv: 2, vit: 700, flair: 9, niveau: 3, traverse: true },
  { spr: 12, nom: "loup", pv: 2, vit: 340, flair: 6, niveau: 3 },
  { spr: 13, nom: "flamme", pv: 2, vit: 420, flair: 5, niveau: 3 },
  { spr: 6, nom: "bloc de feu", pv: 3, vit: 500, flair: 5, niveau: 2 },
  { spr: 19, nom: "scorpion", pv: 2, vit: 380, flair: 0, niveau: 3 },
  { spr: 30, nom: "araignée rouge", pv: 2, vit: 280, flair: 3, niveau: 3 },
  { spr: 20, nom: "ninja", pv: 3, vit: 300, flair: 7, niveau: 4 },
  { spr: 23, nom: "gobelin", pv: 2, vit: 400, flair: 6, niveau: 4 },
  { spr: 31, nom: "gobelin", pv: 2, vit: 400, flair: 6, niveau: 4 },
  { spr: 16, nom: "diable", pv: 3, vit: 380, flair: 8, niveau: 4 },
  { spr: 29, nom: "ogre", pv: 5, vit: 650, flair: 8, niveau: 5 },
  { spr: 10, nom: "arbre", pv: 5, vit: 800, flair: 6, niveau: 5 },
  { spr: 14, nom: "squelette double", pv: 4, vit: 420, flair: 6, niveau: 5 },
];

// ---------------------------------------------------------------------------
// Tout ce qui bouge de case en case glisse d'une case à l'autre
// ---------------------------------------------------------------------------
function mobile(x, y) {
  return { tx: x, ty: y, fx: x, fy: y, t: 1, duree: 100, dx: 0, dy: 0 };
}
function allerVers(e, nx, ny, duree) {
  e.dx = nx - e.tx; e.dy = ny - e.ty;
  e.fx = e.tx; e.fy = e.ty;
  e.tx = nx; e.ty = ny;
  e.t = 0; e.duree = duree;
}
function avancer(e, dt) {
  if (e.t >= 1) return false;
  e.t = Math.min(1, e.t + dt / e.duree);
  if (e.t === 1) { e.fx = e.tx; e.fy = e.ty; return true; }
  return false;
}
const px = (e) => (e.fx + (e.tx - e.fx) * e.t) * T;
const py = (e) => (e.fy + (e.ty - e.fy) * e.t) * T;

// ---------------------------------------------------------------------------
// État de la partie
// ---------------------------------------------------------------------------
let etat = "titre"; // titre | jeu | bravo | perdu
let pause = false;
let niveau = 1, score = 0, record = 0;
let grille, cols, lignes, vu, distJoueur, portail, portailOuvert;
let steeve, monstres, objets, particules, bulles, explosions;
let tremble = 0, chrono = 0, bandeau = 0, horloge = 0;

try { record = +localStorage.getItem("nuit-des-monstres-record") || 0; } catch {}

function nouvellePartie() {
  niveau = 1;
  score = 0;
  steeve = { ...mobile(1, 1), regard: "droite", retourne: false, coeurs: 3, invincible: 0, coup: 0, recharge: 0, torche: 0 };
  arreterMusique(); // comme dans le BASIC : on coupe l'ambiance au début du jeu
  nouveauNiveau();
  etat = "jeu";
}

function nouveauNiveau() {
  cols = Math.min(15 + 6 * (niveau - 1), 39);
  lignes = Math.min(11 + 4 * (niveau - 1), 27);
  grille = genererLabyrinthe(cols, lignes);
  vu = grille.map((l) => l.map(() => false));
  Object.assign(steeve, mobile(1, 1), { invincible: 1000, torche: 0 });
  distJoueur = distances(1, 1);

  // cases libres, de la plus éloignée de Steeve à la plus proche
  const libres = [];
  for (let y = 1; y < lignes - 1; y++)
    for (let x = 1; x < cols - 1; x++)
      if (grille[y][x] === 0) libres.push({ x, y, d: distJoueur[y][x] });
  libres.sort((a, b) => b.d - a.d);
  portail = libres[0];
  portailOuvert = false;

  const loin = melanger(libres.filter((c) => c.d >= 6 && c !== portail));
  const choix = MONSTRES.filter((m) => m.niveau <= niveau);
  const nb = Math.min(3 + 2 * niveau, 20, loin.length);
  monstres = [];
  for (let i = 0; i < nb; i++) {
    // les monstres les plus récents arrivent plus souvent
    const def = Math.random() < 0.5
      ? choix[Math.floor(Math.random() * choix.length)]
      : choix[choix.length - 1 - Math.floor(Math.random() * Math.min(4, choix.length))];
    const c = loin.pop();
    monstres.push({ ...mobile(c.x, c.y), def, pv: def.pv, flash: 0, etourdi: 0, attente: Math.random() * 800, retourne: false });
  }

  objets = [];
  const nbTorches = 1 + Math.floor(niveau / 2);
  for (let i = 0; i < nbTorches && loin.length; i++) {
    const c = loin.pop();
    objets.push({ x: c.x, y: c.y, type: "torche" });
  }
  particules = [];
  explosions = [];
  bulles = [];
  bandeau = 1800;
}

function libre(x, y, traverse) {
  if (x <= 0 || y <= 0 || x >= cols - 1 || y >= lignes - 1) return false;
  return traverse || grille[y][x] === 0;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
function action() {
  if (etat === "titre") nouvellePartie();
  else if (etat === "perdu" && chrono <= 0) etat = "titre";
  else if (etat === "bravo" && chrono < 1400) passerNiveau();
  else if (etat === "jeu" && !pause) coupDEpee();
}

function coupDEpee() {
  if (steeve.recharge > 0) return;
  steeve.recharge = 230;
  steeve.coup = 160;
  SON.epee();
  const [dx, dy] = DIRS[steeve.regard];
  // zone touchée : la case devant Steeve (et un peu sa propre case)
  const zx = px(steeve) + dx * 12, zy = py(steeve) + dy * 12;
  for (const m of monstres) {
    if (m.mort) continue;
    const mx = px(m) + 2, my = py(m) + 2;
    if (mx < zx + 16 && mx + 12 > zx && my < zy + 16 && my + 12 > zy) frapper(m, dx, dy);
  }
}

function frapper(m, dx, dy) {
  m.pv--;
  m.flash = 140;
  tremble = 3;
  if (m.pv <= 0) {
    m.mort = true;
    m.flash = 80; // une silhouette blanche juste avant l'explosion
    tremble = 5;
    SON.mort();
    const pts = m.def.pv * 100;
    score += pts;
    bulles.push({ x: px(m) + 8, y: py(m), txt: "+" + pts, vie: 900 });
    explosions.push({ x: Math.round(px(m) + 8), y: Math.round(py(m) + 8), age: 0 });
    exploser(px(m) + 8, py(m) + 8, COULEURS_SPRITE[m.def.spr], 36);
    if (steeve.coeurs < 5 && Math.random() < 0.2)
      objets.push({ x: Math.round(px(m) / T), y: Math.round(py(m) / T), type: "coeur" });
    return;
  }
  SON.touche();
  // recul : le monstre est repoussé d'une case s'il y a la place
  const cx = Math.round(px(m) / T), cy = Math.round(py(m) / T);
  Object.assign(m, mobile(cx, cy));
  if (libre(cx + dx, cy + dy, m.def.traverse)) allerVers(m, cx + dx, cy + dy, 90);
  m.etourdi = 500;
}

function exploser(x, y, couleurs, n = 24) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 0.03 + Math.random() * 0.08;
    particules.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.03, k: Math.random() < 0.4 ? 2 : 1,
      vie: 400 + Math.random() * 400, c: couleurs[Math.floor(Math.random() * couleurs.length)],
    });
  }
}

function passerNiveau() {
  niveau++;
  steeve.coeurs = Math.min(5, steeve.coeurs + 1);
  nouveauNiveau();
  etat = "jeu";
}

// ---------------------------------------------------------------------------
// Mise à jour
// ---------------------------------------------------------------------------
function mettreAJour(dt) {
  horloge += dt;
  chrono -= dt;
  if (tremble > 0) tremble = Math.max(0, tremble - dt / 60);
  if (etat === "bravo" && chrono <= 0) passerNiveau();
  if (etat !== "jeu" || pause) return;

  if (bandeau > 0) { bandeau -= dt; if (bandeau > 800) return; }

  // --- Steeve
  const s = steeve;
  s.invincible -= dt; s.coup -= dt; s.recharge -= dt; s.torche -= dt;
  const arrive = avancer(s, dt);
  if (arrive) arriveeSteeve();
  if (s.t >= 1) {
    let d = tenues[tenues.length - 1];
    if (!d && demande && performance.now() - demande.t < 250) d = demande.d;
    demande = null;
    if (d) {
      s.regard = d;
      if (d === "gauche") s.retourne = true;
      if (d === "droite") s.retourne = false;
      const [dx, dy] = DIRS[d];
      if (libre(s.tx + dx, s.ty + dy)) allerVers(s, s.tx + dx, s.ty + dy, 120);
    }
  }

  // --- Monstres
  const occupees = new Set(monstres.filter((m) => !m.mort).map((m) => m.tx + "," + m.ty));
  for (const m of monstres) {
    m.flash -= dt;
    if (m.mort) continue;
    m.etourdi -= dt; m.attente -= dt;
    avancer(m, dt);
    if (m.t < 1 || m.etourdi > 0 || m.attente > 0) continue;
    const dir = choisirDirection(m, occupees);
    if (dir) {
      occupees.delete(m.tx + "," + m.ty);
      allerVers(m, m.tx + dir[0], m.ty + dir[1], m.def.vit);
      occupees.add(m.tx + "," + m.ty);
      if (dir[0]) m.retourne = dir[0] < 0;
    } else {
      m.attente = 250;
    }
  }
  monstres = monstres.filter((m) => !m.mort || m.flash > 0);

  // --- Contact monstre / Steeve
  if (s.invincible <= 0) {
    for (const m of monstres) {
      if (m.mort || m.etourdi > 0) continue;
      if (Math.abs(px(m) - px(s)) < 11 && Math.abs(py(m) - py(s)) < 11) {
        s.coeurs--;
        s.invincible = 1500;
        tremble = 6;
        SON.aie();
        exploser(px(s) + 8, py(s) + 8, [8, 8, 14], 12);
        if (s.coeurs <= 0) {
          etat = "perdu";
          chrono = 1200;
          SON.perdu();
          if (score > record) {
            record = score;
            try { localStorage.setItem("nuit-des-monstres-record", record); } catch {}
          }
        }
        break;
      }
    }
  }

  // --- Plus de monstres : le portail s'ouvre
  if (!portailOuvert && monstres.every((m) => m.mort)) {
    portailOuvert = true;
    SON.portail();
    bulles.push({ x: px(s) + 8, y: py(s) - 4, txt: "le portail est ouvert !", vie: 2500 });
  }

  // --- Particules et textes flottants
  for (const p of particules) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0002 * dt; p.vie -= dt;
  }
  particules = particules.filter((p) => p.vie > 0);
  for (const e of explosions) e.age += dt;
  explosions = explosions.filter((e) => e.age < DUREE_EXPLOSION);
  for (const b of bulles) { b.y -= dt * 0.015; b.vie -= dt; }
  bulles = bulles.filter((b) => b.vie > 0);
}

function arriveeSteeve() {
  const s = steeve;
  distJoueur = distances(s.tx, s.ty);
  for (const o of objets) {
    if (o.pris || o.x !== s.tx || o.y !== s.ty) continue;
    o.pris = true;
    SON.objet();
    if (o.type === "coeur") {
      s.coeurs = Math.min(5, s.coeurs + 1);
      bulles.push({ x: o.x * T + 8, y: o.y * T, txt: "+1 coeur", vie: 900 });
    } else {
      s.torche = 20000;
      bulles.push({ x: o.x * T + 8, y: o.y * T, txt: "torche !", vie: 900 });
    }
  }
  objets = objets.filter((o) => !o.pris);
  if (portailOuvert && s.tx === portail.x && s.ty === portail.y) {
    etat = "bravo";
    chrono = 2200;
    score += 500;
    SON.portail();
  }
}

function choisirDirection(m, occupees) {
  const s = steeve;
  const options = Object.values(DIRS).filter(([dx, dy]) => {
    const nx = m.tx + dx, ny = m.ty + dy;
    return libre(nx, ny, m.def.traverse) && !occupees.has(nx + "," + ny);
  });
  if (!options.length) return null;

  // Poursuite : le monstre a senti Steeve
  if (m.def.flair) {
    if (m.def.traverse) {
      // le fantôme passe à travers les murs : il va tout droit vers Steeve
      const ex = s.tx - m.tx, ey = s.ty - m.ty;
      if (Math.abs(ex) + Math.abs(ey) <= m.def.flair) {
        const bons = options.filter(([dx, dy]) => dx * Math.sign(ex) > 0 || dy * Math.sign(ey) > 0);
        if (bons.length) return bons[Math.floor(Math.random() * bons.length)];
      }
    } else if (distJoueur[m.ty][m.tx] <= m.def.flair) {
      let meilleur = null, dMin = distJoueur[m.ty][m.tx];
      for (const o of options) {
        const d = distJoueur[m.ty + o[1]][m.tx + o[0]];
        if (d < dMin) { dMin = d; meilleur = o; }
      }
      if (meilleur) return meilleur;
    }
  }

  // Errance : tout droit si possible, pas de demi-tour sauf cul-de-sac
  const toutDroit = options.find(([dx, dy]) => dx === m.dx && dy === m.dy);
  if (toutDroit && Math.random() < 0.75) return toutDroit;
  const sansDemiTour = options.filter(([dx, dy]) => !(dx === -m.dx && dy === -m.dy) || (m.dx === 0 && m.dy === 0));
  const liste = sansDemiTour.length ? sansDemiTour : options;
  return liste[Math.floor(Math.random() * liste.length)];
}

// ---------------------------------------------------------------------------
// Dessin
// ---------------------------------------------------------------------------
// Motifs de tramage pour la nuit : 1/4, 1/2, 3/4 de pixels noirs
function trame(motif) {
  const c = document.createElement("canvas");
  c.width = c.height = 4;
  const g = c.getContext("2d");
  g.fillStyle = "#000";
  for (let i = 0; i < 16; i++) if (motif[i] === "#") g.fillRect(i % 4, i >> 2, 1, 1);
  return ctx.createPattern(c, "repeat");
}
const NUIT = [
  null,
  trame("#.......#......."),
  trame("#.#..#.##.#..#.#"),
  trame("###.#.#####.#.#."), // cases déjà visitées : on s'en souvient, mais dans le noir
];

// Petit sol moucheté, trois variantes
const SOLS = [0, 1, 2].map((v) => {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const g = c.getContext("2d");
  g.fillStyle = PALETTE[0];
  g.fillRect(0, 0, 16, 16);
  g.fillStyle = PALETTE[1];
  for (let i = 0; i < 5 + v * 2; i++) g.fillRect((i * 7 + v * 5) % 16, (i * 11 + v * 3) % 16, 1, 1);
  return c;
});

function dessiner() {
  ctx.fillStyle = PALETTE[0];
  ctx.fillRect(0, 0, W, H);
  if (etat === "titre") return dessinerTitre();
  dessinerJeu();
  if (etat === "bravo") {
    rect(0, H / 2 - 22, W, 44, 1);
    texteCentre("bravo !", H / 2 - 16, 10, 3);
    texteCentre("niveau " + (niveau + 1) + " ...", H / 2 + 6, 7);
  }
  if (etat === "perdu") {
    rect(0, H / 2 - 34, W, 68, 0);
    texteCentre("game over", H / 2 - 26, 8, 3);
    texteCentre("score " + score + "   niveau " + niveau, H / 2 - 4, 7);
    texteCentre("record " + record, H / 2 + 6, 10);
    if (chrono <= 0 && Math.floor(horloge / 400) % 2) texteCentre("espace pour rejouer", H / 2 + 20, 6);
  }
  if (pause) {
    rect(0, H / 2 - 10, W, 20, 1);
    texteCentre("pause", H / 2 - 5, 7, 2);
  }
}

function dessinerJeu() {
  const s = steeve;
  const sx = px(s), sy = py(s);
  // caméra centrée sur Steeve, sans sortir du labyrinthe
  const mondeW = cols * T, mondeH = lignes * T;
  let camX = Math.max(0, Math.min(mondeW - W, sx + 8 - W / 2));
  let camY = Math.max(0, Math.min(mondeH - VH * T, sy + 8 - (VH * T) / 2));
  if (tremble > 0) { camX += (Math.random() - 0.5) * tremble * 2; camY += (Math.random() - 0.5) * tremble * 2; }
  camX = Math.round(camX); camY = Math.round(camY);

  const rayon = s.torche > 0 ? 7 : 4.5;
  const lumiere = (x, y) => Math.hypot(x - (sx + 8), y - (sy + 8)) / T;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, HUD, W, VH * T);
  ctx.clip();
  ctx.translate(-camX, HUD - camY);

  const x0 = Math.max(0, Math.floor(camX / T)), y0 = Math.max(0, Math.floor(camY / T));
  const x1 = Math.min(cols - 1, x0 + VW + 1), y1 = Math.min(lignes - 1, y0 + VH + 1);

  // sol et murs
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const d = lumiere(x * T + 8, y * T + 8);
      if (d <= rayon) vu[y][x] = true;
      if (!vu[y][x] && d > rayon + 1) continue;
      if (grille[y][x]) { rect(x * T, y * T, T, T, 1); spr(S.MUR, x * T, y * T); }
      else ctx.drawImage(SOLS[(x * 7 + y * 13) % 3], x * T, y * T);
    }

  // portail : visible fermé si on l'a déjà vu, tourbillonne une fois ouvert
  if (portailOuvert || vu[portail.y][portail.x]) dessinerPortail(portail.x * T, portail.y * T, portailOuvert);

  // objets (visibles seulement dans la lumière)
  for (const o of objets) {
    if (lumiere(o.x * T + 8, o.y * T + 8) > rayon + 0.5) continue;
    const b = Math.round(Math.sin(horloge / 200) * 1.5);
    if (o.type === "coeur") coeur(o.x * T + 4, o.y * T + 5 + b, 8);
    else spr(S.TORCHE, o.x * T, o.y * T + b);
  }

  // monstres
  for (const m of monstres) {
    const mx = px(m), my = py(m);
    if (lumiere(mx + 8, my + 8) > rayon + 0.5) continue;
    const pas = m.t < 1 && Math.floor(m.t * 2) % 2 ? -1 : 0;
    const oscille = m.def.traverse ? Math.round(Math.sin(horloge / 250) * 2) : 0;
    if (m.def.traverse) ctx.globalAlpha = 0.75;
    const blanc = m.mort || (m.flash > 0 && Math.floor(m.flash / 40) % 2 === 0);
    spr(m.def.spr, mx, my + pas + oscille, m.retourne, blanc);
    ctx.globalAlpha = 1;
  }

  // Steeve (clignote quand il est invincible)
  if (s.invincible <= 0 || Math.floor(s.invincible / 80) % 2) {
    const pas = s.t < 1 && s.t > 0.5 ? -1 : 0;
    spr(S.STEEVE, sx, sy + pas, s.retourne);
  }
  if (s.coup > 0) dessinerCoup(sx + 8, sy + 8, s.regard, 1 - s.coup / 160);

  // la nuit : trame de plus en plus dense en s'éloignant de Steeve
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const d = lumiere(x * T + 8, y * T + 8);
      let n = d < rayon - 1 ? 0 : d < rayon ? 1 : d < rayon + 1 ? 2 : vu[y][x] ? 3 : 4;
      if (portailOuvert && x === portail.x && y === portail.y) n = 0;
      if (n === 0) continue;
      if (n === 4) { ctx.fillStyle = "#000"; ctx.fillRect(x * T, y * T, T, T); }
      else { ctx.fillStyle = NUIT[n]; ctx.fillRect(x * T, y * T, T, T); }
    }

  // explosions et débris par-dessus la nuit : ça éclaire !
  for (const e of explosions) dessinerExplosion(e);
  for (const p of particules) rect(p.x, p.y, p.k, p.k, p.c);

  for (const b of bulles) {
    const k = largeurTexte(b.txt);
    const bx = Math.max(camX + 2, Math.min(camX + W - k - 2, b.x - k / 2));
    texte(b.txt, bx + 1, Math.round(b.y) + 1, 0);
    texte(b.txt, bx, Math.round(b.y), 10);
  }
  ctx.restore();

  // flèche vers le portail s'il est hors de l'écran
  if (portailOuvert && Math.floor(horloge / 300) % 2) {
    const ex = portail.x * T + 8 - camX, ey = portail.y * T + 8 - camY + HUD;
    if (ex < 0 || ex > W || ey < HUD || ey > H) {
      const fx = Math.max(3, Math.min(W - 6, ex)), fy = Math.max(HUD + 3, Math.min(H - 6, ey));
      rect(fx - 1, fy - 1, 4, 4, 10);
    }
  }

  dessinerHud();
  if (bandeau > 0) {
    rect(0, H - 34, W, 28, 1);
    texteCentre("niveau " + niveau, H - 29, 7, 2);
    texteCentre(monstres.length + " monstres a chasser", H - 15, 6);
  }
}

// Le portail : une arche de pierre (# = pierre sombre, + = pierre claire,
// o = l'intérieur). Fermé, l'intérieur est noir ; ouvert, il tourbillonne.
const ARCHE = [
  "....########....",
  "..##++++++++##..",
  ".#++oooooooo++#.",
  ".#+oooooooooo+#.",
  ...Array(11).fill("#+oooooooooooo+#"),
  "################",
];
const TOURBILLON = [2, 13, 14, 12];
function dessinerPortail(x0, y0, ouvert) {
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const ch = ARCHE[y][x];
      if (ch === ".") continue;
      let c;
      if (ch === "#") c = 5;
      else if (ch === "+") c = 6;
      else if (!ouvert) c = (x + y) % 5 ? 0 : 1;
      else {
        const dx = x - 7.5, dy = y - 9;
        const r = Math.hypot(dx, dy);
        const spirale = Math.atan2(dy, dx) / (Math.PI * 2) * 3 + r * 0.35 - horloge * 0.004;
        c = r < 1.5 ? 7 : TOURBILLON[((Math.floor(spirale) % 4) + 4) % 4];
      }
      rect(x0 + x, y0 + y, 1, 1, c);
    }
  // étincelles autour du portail ouvert
  if (ouvert)
    for (let i = 0; i < 3; i++) {
      const a = horloge * 0.003 + (i * Math.PI * 2) / 3;
      rect(x0 + 7 + Math.cos(a) * 10, y0 + 8 + Math.sin(a) * 10, 1, 1, Math.floor(horloge / 100 + i) % 2 ? 7 : 14);
    }
}

// Explosion pixel : éclair blanc, boule jaune/orange/rouge qui grossit,
// puis un anneau de fumée qui s'effiloche.
const DUREE_EXPLOSION = 380;
function dessinerExplosion(e) {
  const t = e.age / DUREE_EXPLOSION;
  const r = Math.round(3 + t * 11);
  if (e.age < 60) { cercleplein(e.x, e.y, r + 2, 7); return; }
  if (t < 0.5) {
    cercleplein(e.x, e.y, r, 8);
    cercleplein(e.x, e.y, r - 2, 9);
    if (r > 5) cercleplein(e.x, e.y, r - 5, 10);
    return;
  }
  // fumée : de moins en moins de pixels sur l'anneau
  const densite = 1 - (t - 0.5) * 2;
  for (let a = 0; a < 360; a += 8) {
    if (Math.random() > densite) continue;
    const ang = (a * Math.PI) / 180;
    const c = Math.random() < 0.5 ? 5 : 6;
    rect(e.x + Math.cos(ang) * r, e.y + Math.sin(ang) * r, 2, 2, c);
  }
}

// l'épée : un arc de pixels blancs qui balaie devant Steeve
function dessinerCoup(cx, cy, regard, avance) {
  const base = { droite: 0, bas: 90, gauche: 180, haut: 270 }[regard];
  const fin = -70 + 140 * Math.min(1, avance * 1.6);
  for (let a = -70; a <= fin; a += 6) {
    const t = ((base + a) * Math.PI) / 180;
    for (let r = 8; r <= 14; r++) {
      const c = r >= 12 ? 7 : r >= 10 ? 6 : 12;
      rect(cx + Math.cos(t) * r, cy + Math.sin(t) * r, 1, 1, c);
    }
  }
}

function dessinerHud() {
  rect(0, 0, W, HUD, 0);
  rect(0, HUD - 1, W, 1, 1);
  for (let i = 0; i < 5; i++) coeur(3 + i * 9, 5, i < steeve.coeurs ? 8 : 1);
  texte("niv " + niveau, 52, 6, 6);
  const restants = monstres.filter((m) => !m.mort).length;
  texte(restants ? "monstres " + restants : "va au portail !", 84, 6, restants ? 14 : 10);
  if (steeve.torche > 0) spr(S.TORCHE, 160, 0);
  const sc = String(score).padStart(5, "0");
  texte(sc, W - largeurTexte(sc) - 3, 6, 10);
}

// Écran titre : reprend celui écrit en BASIC (lune blafarde, vert sombre,
// rouge sang), plus un défilé de monstres poursuivis par Steeve.
const ETOILES = Array.from({ length: 40 }, (_, i) => ({ x: (i * 97) % W, y: (i * 53) % 120, p: i % 7 }));
function dessinerTitre() {
  for (const e of ETOILES) if ((Math.floor(horloge / 300) + e.p) % 7) rect(e.x, e.y, 1, 1, e.p % 2 ? 5 : 6);
  cercleplein(200, 30, 12, 6);
  cercleplein(196, 27, 3, 5);
  cercleplein(204, 35, 2, 5);
  if (temposMusique() % 4 === 0 && musique.minuteur) cercle(200, 30, 15, 5);

  texteCentre("la nuit", 50, 3, 4);
  texteCentre("des monstres", 76, 8, 3);

  // défilé
  const defile = [2, 4, 7, 11, 17, 12, 20, 29];
  const vitesse = horloge * 0.03;
  const longueur = defile.length * 22 + 60;
  for (let i = 0; i < defile.length; i++) {
    const x = ((i * 22 - vitesse) % longueur + longueur) % longueur - 20;
    spr(defile[i], x, 112 + (Math.floor(horloge / 150 + i) % 2 ? -1 : 0), true);
  }
  const xs = ((defile.length * 22 + 20 - vitesse) % longueur + longueur) % longueur - 20;
  spr(S.STEEVE, xs, 112 + (Math.floor(horloge / 120) % 2 ? -1 : 0), true);
  for (let x = 0; x < W; x += 16) spr(S.MUR, x, 128);

  if (Math.floor(horloge / 450) % 2) texteCentre("appuie sur espace", 152, 6);
  texteCentre("fleches ou zqsd : bouger   espace : epee", 168, 13);
  texteCentre("m : son   p : pause" + (record ? "   record " + record : ""), 178, 5);
}

// ---------------------------------------------------------------------------
// Boucle principale
// ---------------------------------------------------------------------------
let avant = performance.now();
function boucle(maintenant) {
  const dt = Math.min(50, maintenant - avant);
  avant = maintenant;
  mettreAJour(dt);
  dessiner();
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);
