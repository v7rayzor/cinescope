# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.68** / Cache **v45**).

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

## 2. Règles Métier & Arbitrages Algorithmiques (v8.66)

### A. Règle Fondamentale : 1 Titre = 1 Catégorie Dominante Unique
Chaque film ou série est qualifié dans **strictement une seule** des 7 catégories officielles :
1. `drame_emotion` : Drames profonds, romances d'auteur, biopics, drames historiques/sociaux (441 œuvres).
2. `comedie` : Comédies pures, comédies romantiques et populaires, comédies d'action grand public, satires (245 œuvres).
3. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, suspense/angoisse, thrillers criminels (244 œuvres).
4. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore (225 œuvres).
5. `scifi_fantastique` : Science-fiction, space opera, anticipation, heroic fantasy, super-héros, mystère magique (104 œuvres).
6. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (102 œuvres).
7. `action_aventure` : Action grand spectacle, westerns d'action armée, survie, guerre, arts martiaux (63 œuvres).

### B. Moteur de Catégorisation Purement Algorithmique (100% Déterministe)
* **Zéro Bidouillage Ad Hoc (Règle 7 d'AGENTS.md)** : Tout arbitrage repose sur des règles logiques universelles déterministes.
* **Sanctuarisation de l'Horreur & Protection Animation / Famille (v8.66)** :
  - **Exclusion stricte des pastilles adultes `-16` et `-18`** de la catégorie `animation_famille`.
  - **Exclusion formelle de l'Horreur (`hrr`)** de `animation_famille`, sauf œuvres expressément étiquetées Famille (`fml`) et Tout Public (comme *Petit vampire* de Joann Sfar et *Une Nuit Au Zoo*).
  - **Protection des mangas jeunesse et anime ados** : Les œuvres comme *Kuroko's Basket* (`ani, cmy, drm, spt`, badge `-12`), *Dragon Ball Z* (-12) ou les enquêtes Tout Public (*Détective Conan*) restent bien dans `animation_famille`.
  - **Reclassement naturel des œuvres adultes / horrifiques** :
    * *Bloodline* (`ani, crm, hrr, trl`, -12, Shadowz) $\rightarrow$ `horreur_epouvante`.
    * *Stopmotion* (`ani, hrr, trl`, -16, Shadowz) $\rightarrow$ `horreur_epouvante`.
    * *Mad God* (`ani, fnt, hrr, scf`, Shadowz) $\rightarrow$ `horreur_epouvante`.
    * *The Spine of Night* (`act, ani, fnt, hrr, scf`, Shadowz) $\rightarrow$ `horreur_epouvante`.
    * *Warehouse 13* (`act, ani, scf...`, -16) $\rightarrow$ `scifi_fantastique`.
    * *La Jeune fille et les paysans* (`ani, drm, hst`, -16) $\rightarrow$ `drame_emotion`.
    * *Flee* (`ani, doc, drm`, -16) $\rightarrow$ `drame_emotion`.
    * *Totem* (`ani, cmy, hrr`, TP) $\rightarrow$ `comedie`.
* **Rééquilibrage Universel Drame vs Comédie (v8.64)** :
  - **Assouplissement du verrou d'âge** : Les pastilles de simple sensibilité `-10` et `-12` n'excluent plus la catégorie `comedie` (seules les pastilles adultes `-16` et `-18` l'excluent).
  - **Romance & Comédie** : Dans une comédie romantique (`cmy` + `rma`), le tag romance ne neutralise plus la comédie et ne donne plus de bonus automatique de drame intime.
  - **36 comédies populaires majeures réhabilitées** : *Crazy Stupid Love*, *LOL*, *Starbuck*, *Bridget Jones*, *Happiness Therapy*, *Irresponsable*, *En attendant Bojangles*, *Good Bye Lenin!*, *La Belle Époque*, *Molière*, *Swiss Army Man*, etc.
* **Réhabilitation des Thrillers de Tension (v8.64)** :
  - Prise en compte de `THRILLER_TENSION_PATTERNS` (angoisse, manipulation, piège, huis clos, homejacking, disparition, vengeance).
  - Neutralisation du bonus Drame automatique en présence d'un thriller de tension ou d'enquête (*Corporate*, *5 septembre*, *L'Origine du mal*, *Sans pitié*, *Espion(s)*, etc.).
* **Suppression Définitive du 2ème Volet de Sous-Genres SF & Retour au Modèle Pur 1 Catégorie (v8.67)** :
  - **Épure & Symétrie Parfaite de l'Interface** : Suppression intégrale de la barre de sous-genres SF (`index.html`, `css/style.css`, `js/app.js`, `js/justwatch_engine.js`).
  - **Zéro Ambiguïté & Allègement** : Éradication de la fonction isolée `computeScifiSubCategory`, des compteurs partiels et des recalculs d'alignement géométrique complexe.
  - **Modèle Universel Uniforme** : Chaque catégorie de l'application fonctionne désormais exactement de la même manière : 1 clic = 1 catégorie dominante directe.
  - **Intégrité Totale du Catalogue** : Les 104 œuvres de Science-fiction & Fantastique demeurent intactes et préservées dans leur catégorie.

---

## 3. Purge Complète des Fichiers Morts (v8.64)

* **Suppression de `assets/posters/` (68.5 Mo libérés)** :
  - 776 fichiers d'affiches locales obsolètes supprimés de Git et du disque.
  - 100% des jaquettes (1 424 œuvres) sont servies en haute résolution officielle via le CDN direct JustWatch (`https://images.justwatch.com/poster/...`).
* **Suppression des Logos Obsolètes TNT & Chaînes Défuntes (`assets/logos/`)** :
  - 15 fichiers orphelins supprimés. Purge dans `sw.js` et `js/justwatch_engine.js`.
* **Suppression des Scripts de Migration Ponctuels (`scripts/`)** :
  - Scripts actifs conservés : `scripts/sync_justwatch.cjs` et `scripts/verify_compliance.cjs`.
* **Nettoyage des Dossiers Temporaires** :
  - Suppression intégrale de `dist/` et de `scratch/`.

---

## 4. Filtres UI & Ergonomie de Navigation

### A. Interface Mobile & Responsive (Règle 8 AGENTS.md)
* **Sanctuarisation Mobile Stricte & Inviolable** :
  - Barre des bouquets (`.bouquets-bar-section`) strictement masquée (`display: none !important` pour $< 1024\text{px}$).
  - Périmètre mobile : Strictement les **864 œuvres SVOD payantes de base** (Ciné+ OCS, Action Max, Universal+).
  - Interface épurée : Plus aucune sous-barre glissable, affichage direct et fluide des jaquettes.

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

* **Réhabilitation Universelle SF & Fantastique vs Faux Positifs Horreur (v8.68)** :
  - **Règle `isSciFiFantasyHybrid`** : Neutralisation universelle du court-circuit horreur aveugle pour les œuvres cumulant la double étiquette Science-Fiction + Fantastique (`fnt` + `scf`) en prises de vue réelles sans motifs d'horreur stricte (`!rawTags.includes('ani') && !isStrictHorror && !cleanText.includes('creepshow') && !cleanText.includes('cauchemar')`).
  - **Triomphe du calcul de points réel** : Laisse s'exprimer naturellement le score écrasant de la Science-Fiction & Fantastique (ex: *Le Règne animal* avec 130 pts contre 60 pts d'horreur).
  - **5 œuvres majeures réhabilitées dans leur catégorie légitime `scifi_fantastique`** :
    * *Le règne animal* (Thomas Cailley, 5 César, anticipation génétique) $\rightarrow$ `scifi_fantastique`.
    * *Glass* (M. Night Shyamalan avec Bruce Willis et James McAvoy, suite super-héros d'*Incassable*) $\rightarrow$ `scifi_fantastique`.
    * *Paradise Hills* (dystopie futuriste en sanatorium) $\rightarrow$ `scifi_fantastique`.
    * *Else* (anticipation poétique / mutation) $\rightarrow$ `scifi_fantastique`.
    * *My Mother's Eyes* (SF technologie / implants bioniques) $\rightarrow$ `scifi_fantastique`.
  - **Sanctuarisation totale de l'horreur pure** : Maintien strict en `horreur_epouvante` des animations gores pour adultes (*Mad God*, *The Spine of Night*), des séries anthologiques de terreur (*Creepshow*), des rituels macabres (*Muse*) et de 100% des films de possession et d'épouvante.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([js/catalog.js](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 431** (1 283 films $\ge 60\text{ min}$, 148 séries).
  - **Total œuvres qualifiées Mobile** : **864** (739 films $\ge 60\text{ min}$, 125 séries).
  - **Conformité 1 catégorie unique** : **1 431 / 1 431 (100% conforme, 0 anomalie)**.
  - **Répartition des 7 catégories officielles** :
    * `drame_emotion` : 395
    * `comedie` : 287
    * `thriller_policier` : 267
    * `horreur_epouvante` : 220
    * `scifi_fantastique` : 109
    * `animation_famille` : 101
    * `action_aventure` : 52
  - **Titres expirés** : **0**.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : **v8.68** (`sw.js` : `cinescope-v8.68-streaming`).
  - **Clés LocalStorage Actives** : `_v45` (`cinescope_streaming_catalog_v45`, `cinescope_last_specialized_sync_v45`, etc.).
