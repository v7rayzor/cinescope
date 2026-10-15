# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.61** / Cache **v42**).

---

## 1. Architecture Globale & Flux de Données

### A. Bouquets SVOD & Diffuseurs Découpés (France)
1. **Bouquets SVOD Payants de Référence (Visibles sur PC & Mobile — Règle 8)** :
   * **Ciné+ OCS** (`aoc`) — 671 œuvres (625 films, 46 séries)
   * **Universal+** (`auc`) — 155 œuvres (76 films, 79 séries)
   * **Action Max** (`aca`) — 51 œuvres (50 films dont *Sans aucun remords*, 1 série)
   * **Total Mobile / Portable** : **864 œuvres SVOD payantes de base** (739 films $\ge 60\text{ min}$, 125 séries).
2. **Chaînes SVOD Spécialisées (Exclusivité PC Desktop — Règle 8)** :
   * **Sooner** (`snr`) — 356 œuvres (cinéma d'auteur, drames, thrillers d'auteur)
   * **Shadowz** (`sdz`, alias `sza`) — 175 œuvres (cinéma de genre, horreur, gore, fantastique)
   * **Insomnia** (`ima`) — 37 œuvres (frisson et épouvante)
   * Logos officiels HD configurés dans `assets/logos/sooner.png`, `assets/logos/shadowz.png`, `assets/logos/insomnia.png`.
   * **Total Catalogue Complet PC** : **1 424 œuvres SVOD payantes** (1 276 films, 148 séries).
3. **Éradication Totale de la TNT & Molotov Gratuit** :
   * Les diffuseurs TNT (`tf1`, `sxp`, `fra`) et Molotov Gratuit (`mlt`) ont été **définitivement retirés** du projet pour une cohérence pure SVOD sans bruit gratuit.

### B. Moteur Dynamique des Logos Réactifs
* **Affichage Réactif selon les Filtres Actifs (`getActiveItemPackages`)** :
  - Sur chaque jaquette (et dans la modale), seuls les logos des diffuseurs qui correspondent **aux filtres actuellement actifs** pour l'utilisateur sont affichés en temps réel.
  - **Dans « Tous les bouquets »** :
    - Les diffuseurs payants de référence (OCS, Action Max, Universal+) sont toujours actifs.
    - Tout diffuseur spécialisé est masqué si le toggle `+ Spécialisées` est éteint.
  - **Sur une puce de bouquet spécifique** (ex: clic sur `[Universal+]` ou `[Action Max]`) :
    - La jaquette n'affiche **strictement que le logo du bouquet sélectionné**.
  - **Conservation multi-diffuseurs dans le catalogue** : Une œuvre disponible à la fois sur OCS et Action Max conserve tous ses diffuseurs réels dans `package_slugs`.

### C. Synchronisation Hybride par Bouquet & Pagination Dynamique
* **Automatisation Serveur (GitHub Actions - `.github/workflows/update_catalog.yml`)** :
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js.
  - **Scanne bouquet par bouquet** de manière dynamique avec pagination par curseur (`hasNextPage` / `endCursor`) sans limite de page rigide.
  - **Quotidien automatique** : Balaye uniquement les 3 bouquets SVOD de base (`aoc`, `aca`, `auc`) en ~28 requêtes légères (0 saturation, 0 VOD payante à l'acte grâce au filtre strict `monetizationTypes: ['FLATRATE']`).
  - **Spécialisées à la demande** : Option `include_specialized: true` disponible dans GitHub Actions (`workflow_dispatch`) pour rafraîchir Sooner, Shadowz et Insomnia.
* **Client Web Résilient & Synchro Manuelle Spécialisées ([`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
  - Démarrage instantané sur le catalogue pré-embarqué `CATALOG_DATA`.
  - **Sur Mobile & PC** : Synchronisation quotidienne automatique des nouveautés/expirations sans changer l'UI mobile.
  - **Sur PC Desktop uniquement** : Bouton dédié `[⚡ Synchro Spécialisées]` affichant la date/heure de la dernière synchro manuelle de Sooner/Shadowz/Insomnia.

---

## 2. Règles Métier & Formules Mathématiques en Vigueur

### A. Règle Fondamentale : 1 Titre = 1 Catégorie Dominante Unique
Chaque film ou série est qualifié dans **strictement une seule** des 7 catégories officielles :
1. `drame_emotion` : Drames profonds, romances, biopics, drames historiques/sociaux, récits d'auteur.
2. `comedie` : Comédies pures, comédies d'action grand public, satires.
3. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, thrillers criminels.
4. `action_aventure` : Action grand spectacle, westerns d'action armée, survie, guerre, arts martiaux.
5. `scifi_fantastique` : Science-fiction, space opera, anticipation, heroic fantasy, super-héros, mystère magique.
6. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore.
7. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (110 œuvres intouchables).

### B. Moteur de Catégorisation Purement Algorithmique (100% Déterministe)
* **Zéro Bidouillage Ad Hoc (Règle 7 d'AGENTS.md)** : Tout arbitrage repose sur des règles logiques universelles déterministes.
* **Rééquilibrage de la Surpuissance du Drame** :
  - Neutralisation du bonus automatique (+30 pts) accordé au tag Drame (`drm`) dès lors que l'œuvre présente des éléments d'action (`act`), de guerre (`war`), de motifs policiers/criminels ou militaires.
  - Restauration équitable d'œuvres majeures étouffées : *Cuisine interne* et *J'ai tué mon mari* passent en `thriller_policier`, *Sentinelles*, *Démineurs* et *Chicago Fire* passent en `action_aventure`.
* **Sanctuarisation de l'Horreur & Épouvante** :
  - Suppression des anciens bypass sans pastille d'âge (`isHorrorWithSciFiWithoutAge` et `isHorrorWithCrimeWithoutAge`). Tout film d'horreur ou de créature sanguinaire (*Good Boy*, *DreadOut*, *Oddity*, *Monster Summer*, etc.) est souverainement orienté vers `horreur_epouvante`.
* **Anticipation Pure & Dystopie** :
  - Prise en compte universelle des fictions d'anticipation/dystopie/virus majeures dénuées de tag SF natif sur JustWatch (*LT-21* réintégrée en `scifi_fantastique`).
* **Règle Souveraine Animation & Dessin Animé** :
  - Pour l'Animation (`ani` ou motif textuel) : Toute œuvre est souveraine et admise dans `animation_famille`, peu importe la pastille d'âge (110 œuvres sanctuarisées).

---

## 3. 2ème Volet Contextuel Science-Fiction & Fantastique (v8.62)

* **Sous-Genre Unique Strict (Zéro Doublon)** :
  - Chaque œuvre de SF possède un **seul sous-genre dominant déterministe** calculé par `computeScifiSubCategory` (en écartant les faux tags Comédie de JustWatch sur les récits dramatiques/survie comme *L'Homme qui rétrécit*, classé exclusivement en `Action & Aventure`).
  - Aucun titre ne se chevauche entre Action, Thriller, Comédie et Drame.
* **Affichage Centré sur Desktop (PC $\ge 1024\text{px}$)** :
  - Les 5 sous-genres (`✨ Tous`, `🏹 Action`, `🔍 Thriller`, `🎭 Comédie`, `❤️ Drame`) sont automatiquement centrés sous le bouton principal `[🚀 Science-fiction & Fantastique]` pour une ergonomie et un équilibre visuel parfaits.
* **Tiroir Latéral Coulissant Mobile (Option B — Smartphone & Tablette $< 1024\text{px}$)** :
  - La barre horizontale est masquée pour préserver l'espace vertical.
  - Un onglet flottant tactile `[🚀 Sous-genres ‹]` apparaît discrètement sur le flanc droit de l'écran lorsque SF est sélectionnée.
  - En tapant dessus, un tiroir latéral sombre (glassmorphism avec voile d'arrière-plan) glisse depuis la droite et liste verticalement les 5 sous-genres avec leurs compteurs réactifs.
  - Un tap sélectionne le sous-genre, filtre la grille et referme le tiroir avec fluidité.

---

## 4. Filtres UI & Ergonomie de Navigation

### A. Interface Mobile & Responsive (Règle 8 AGENTS.md)
* **Sanctuarisation Mobile Stricte & Inviolable** :
  - **AUCUN changement d'interface sur mobile** : La barre complète des bouquets (`.bouquets-bar-section`) et ses séparateurs sont **strictement masqués en permanence** (`display: none !important` pour tout écran $< 1024\text{px}$).
  - **Périmètre du catalogue mobile** : Filtré strictement sur `isItemBasePaid(item)` qui n'admet **QUE Ciné+ OCS (`aoc`), Action Max (`aca`) et Universal+ (`auc`)**.
  - **Contenu visible** : Strictement les **864 œuvres SVOD payantes de base** (739 films, 125 séries).

### B. Organisation Multi-Lignes des Bouquets & Filtres sur Desktop (PC $\ge 1024\text{px}$)
* **Ligne 0A (Ligne 1) : Bouquets SVOD Payants & Spécialisés** :
  `[✨ Tous les bouquets]` `[Ciné+ OCS]` `[Action Max]` `[Universal+]` `[Sooner]` `[Shadowz]` `[Insomnia]`
* **Ligne 0B (Ligne 2) : Toggles d'Inclusion (+), Filtres d'Exclusion (-) & Action Manuelle** :
  1. `[🆕 Nouveautés]` (Toggle PC) : Isole instantanément les œuvres arrivées depuis $\le 7$ jours ou portant le badge officiel `🆕 Nouveauté`. Compteur dynamique réactif en temps réel.
  2. `[🎬 + Spécialisées]` (+) : Inactif par défaut. Un clic ajoute les œuvres Sooner, Shadowz, Insomnia.
  3. `[🛡️ Hors Prime Video]` (-) : Exclut les œuvres du catalogue Prime Video standard.
  4. `[🚫 Exclure sans S1]` (-) : Masque les séries tronquées sans saison 1.
  5. `[⚡ Synchro Spécialisées]` (Action manuelle) : Lance une synchro à la demande de Sooner, Shadowz et Insomnia avec horodatage de la dernière exécution.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([js/catalog.js](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 424** (1 276 films $\ge 60\text{ min}$, 148 séries).
  - **Total œuvres qualifiées Mobile** : **864** (739 films $\ge 60\text{ min}$, 125 séries — STRICTEMENT Ciné+ OCS, Action Max, Universal+).
  - **Conformité 1 catégorie unique** : **1 424 / 1 424 (100% conforme, 0 anomalie)**.
  - **Répartition des 7 catégories officielles** :
    * `drame_emotion` : 487
    * `thriller_policier` : 232
    * `horreur_epouvante` : 221
    * `comedie` : 208
    * `animation_famille` : 110
    * `scifi_fantastique` : 103
    * `action_aventure` : 63
  - **Titres expirés** : **0**.
  - **Nouveautés actives ($\le 7$ jours)** : 12.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.62` (`sw.js` : `cinescope-v8.62-streaming`, assets `?v=8.62`).
  - **Clés LocalStorage Actives** : `_v42` (`cinescope_streaming_catalog_v42`, etc.).
