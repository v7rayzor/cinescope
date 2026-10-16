# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.64** / Cache **v43**).

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
   * Les diffuseurs TNT (`tf1`, `sxp`, `fra`) et Molotov Gratuit (`mlt`) ainsi que tous leurs logos obsolètes ont été **définitivement supprimés** pour une cohérence pure SVOD.

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
  - Scanne bouquet par bouquet de manière dynamique avec pagination par curseur (`hasNextPage` / `endCursor`) sans limite de page rigide.
  - Scanne uniquement les 3 bouquets SVOD de base (`aoc`, `aca`, `auc`) en ~28 requêtes légères (filtre strict `monetizationTypes: ['FLATRATE']`).
* **Client Web Résilient & Synchro Manuelle Spécialisées ([`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
  - Démarrage instantané sur le catalogue pré-embarqué `CATALOG_DATA`.
  - Bouton dédié `[⚡ Synchro Spécialisées]` sur PC Desktop avec horodatage de la dernière exécution.

---

## 2. Règles Métier & Arbitrages Algorithmiques (v8.64)

### A. Règle Fondamentale : 1 Titre = 1 Catégorie Dominante Unique
Chaque film ou série est qualifié dans **strictement une seule** des 7 catégories officielles :
1. `drame_emotion` : Drames profonds, romances d'auteur, biopics, drames historiques/sociaux (439 œuvres).
2. `comedie` : Comédies pures, comédies romantiques et populaires, comédies d'action grand public, satires (244 œuvres).
3. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, suspense/angoisse, thrillers criminels (244 œuvres).
4. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore (221 œuvres).
5. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (110 œuvres).
6. `scifi_fantastique` : Science-fiction, space opera, anticipation, heroic fantasy, super-héros, mystère magique (103 œuvres).
7. `action_aventure` : Action grand spectacle, westerns d'action armée, survie, guerre, arts martiaux (63 œuvres).

### B. Moteur de Catégorisation Purement Algorithmique (100% Déterministe)
* **Zéro Bidouillage Ad Hoc (Règle 7 d'AGENTS.md)** : Tout arbitrage repose sur des règles logiques universelles déterministes.
* **Rééquilibrage Universel Drame vs Comédie (v8.64)** :
  - **Assouplissement du verrou d'âge** : Les pastilles de simple sensibilité `-10` et `-12` n'excluent plus la catégorie `comedie` (seules les pastilles adultes `-16` et `-18` l'excluent).
  - **Romance & Comédie** : Dans une comédie romantique (`cmy` + `rma`), le tag romance ne neutralise plus la comédie et ne donne plus de bonus automatique de drame intime.
  - **Réhabilitation de 36 comédies populaires majeures** : *Crazy Stupid Love*, *LOL*, *Starbuck*, *Bridget Jones*, *Happiness Therapy*, *Irresponsable*, *En attendant Bojangles*, *Good Bye Lenin!*, *La Belle Époque*, *Molière*, *Swiss Army Man*, etc.
* **Réhabilitation des Thrillers de Tension (v8.64)** :
  - Prise en compte de `THRILLER_TENSION_PATTERNS` (angoisse, manipulation, piège, huis clos, homejacking, disparition, vengeance).
  - Neutralisation du bonus Drame automatique en présence d'un thriller de tension ou d'enquête.
  - **Réhabilitation de 12 thrillers majeurs** : *Corporate*, *5 septembre*, *L'Origine du mal*, *Sans pitié*, *Gangs of Taïwan*, *Espion(s)*, *Le Client*, *The Girl in the Pool*, *Homejacking*, *L'Espion de Dieu*, *Sweetness*, *8 months*.
* **2ème Volet Contextuel SF & Fantastique (v8.64)** :
  - Égalité stricte des 4 sous-genres SF (`action_aventure`: 36, `thriller_policier`: 24, `comedie`: 23, `drame_emotion`: 20).
  - Élimination du filtre destructeur sur le tag `cmy` (*Resident Alien*, *Generation Z*, *Vampire humaniste* en Comédie SF).
  - Détection équitable des thrillers spatiaux et d'anticipation (*Untitled Orphan Black Project*, *Rubikon*, *Mission Titan* en Thriller SF).
  - Élimination du repli aveugle sur le Drame.

---

## 3. Purge Complète des Fichiers Morts (v8.64)

* **Suppression de `assets/posters/` (68.5 Mo libérés)** :
  - 776 fichiers d'affiches locales obsolètes supprimés de Git et du disque.
  - 100% des jaquettes (1 424 œuvres) sont servies en haute résolution officielle via le CDN direct JustWatch (`https://images.justwatch.com/poster/...`).
* **Suppression des Logos Obsolètes TNT & Chaînes Défuntes (`assets/logos/`)** :
  - 15 fichiers orphelins supprimés (`molotov.png`, `tf1.png`, `m6_plus.png`, `france_tv.png`, `gulli.png`, `arte.png`, `novo19.svg`, `13eme_rue.png`, `scifi.png`, `ocs.png`, `cine_classic.png`, `cine_emotion.png`, `cine_family.png`, `cine_festival.png`, `cine_frisson.png`).
  - Purge des entrées TNT correspondantes dans `sw.js` et dans `js/justwatch_engine.js`.
* **Suppression des Scripts de Migration Ponctuels (`scripts/`)** :
  - 6 anciens scripts à usage unique supprimés (`apply_universal_mlt_flatrate.cjs`, `clean_catalog_arte_tnt.cjs`, `clean_catalog_tnt_and_tf1.cjs`, `clean_france_tv_logo.cjs`, `recompute_catalog_categories.cjs`, `setup_new_logos.cjs`).
  - Scripts actifs conservés : `scripts/sync_justwatch.cjs` (automatisation GitHub Actions) et `scripts/verify_compliance.cjs` (audit conformité).
* **Nettoyage des Dossiers Temporaires** :
  - Suppression intégrale de `dist/` et de `scratch/`.

---

## 4. Filtres UI & Ergonomie de Navigation

### A. Interface Mobile & Responsive (Règle 8 AGENTS.md)
* **Sanctuarisation Mobile Stricte & Inviolable** :
  - Barre des bouquets (`.bouquets-bar-section`) strictement masquée (`display: none !important` pour $< 1024\text{px}$).
  - Périmètre mobile : Strictement les **864 œuvres SVOD payantes de base** (Ciné+ OCS, Action Max, Universal+).
  - 2ème volet SF : Barre des sous-genres glissable horizontalement au doigt (*swipe* fluide).

### B. Organisation Multi-Lignes sur Desktop (PC $\ge 1024\text{px}$)
* **Ligne 0A (Ligne 1) : Bouquets SVOD Payants & Spécialisés** :
  `[✨ Tous les bouquets]` `[Ciné+ OCS]` `[Action Max]` `[Universal+]` `[Sooner]` `[Shadowz]` `[Insomnia]`
* **Ligne 0B (Ligne 2) : Toggles d'Inclusion (+), Filtres d'Exclusion (-) & Synchro** :
  1. `[🆕 Nouveautés]` : Isole instantanément les œuvres arrivées depuis $\le 7$ jours ou portant le badge officiel `🆕 Nouveauté`.
  2. `[🎬 + Spécialisées]` : Inactif par défaut. Clic ajoute Sooner, Shadowz, Insomnia.
  3. `[🛡️ Hors Prime Video]` : Exclut les œuvres du catalogue Prime Video standard.
  4. `[🚫 Exclure sans S1]` : Masque les séries tronquées sans saison 1.
  5. `[⚡ Synchro Spécialisées]` : Déclenche la synchro JustWatch à la demande pour Sooner, Shadowz et Insomnia.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([js/catalog.js](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 424** (1 276 films $\ge 60\text{ min}$, 148 séries).
  - **Total œuvres qualifiées Mobile** : **864** (739 films $\ge 60\text{ min}$, 125 séries).
  - **Conformité 1 catégorie unique** : **1 424 / 1 424 (100% conforme, 0 anomalie)**.
  - **Répartition des 7 catégories officielles** :
    * `drame_emotion` : 439
    * `comedie` : 244
    * `thriller_policier` : 244
    * `horreur_epouvante` : 221
    * `animation_famille` : 110
    * `scifi_fantastique` : 103
    * `action_aventure` : 63
  - **Titres expirés** : **0**.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.64` (`sw.js` : `cinescope-v8.64-streaming`, assets `?v=8.64`).
  - **Clés LocalStorage Actives** : `_v43` (`cinescope_streaming_catalog_v43`, `cinescope_last_specialized_sync_v43`, etc.).
