# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.75** / Cache **v46**).

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

### C. Synchronisation Hybride par Bouquet & Inférence IA
* **Automatisation Serveur (GitHub Actions - `.github/workflows/update_catalog.yml`)** :
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js.
  - Scanne bouquet par bouquet de manière dynamique avec pagination par curseur (`hasNextPage` / `endCursor`) sans limite de page rigide.
  - Scanne uniquement les 3 bouquets SVOD de base (`aoc`, `aca`, `auc`) en ~28 requêtes légères (filtre strict `monetizationTypes: ['FLATRATE']`).
* **Client Web Résilient & Synchro Manuelle Spécialisées ([`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
  - Démarrage instantané sur le catalogue pré-embarqué `CATALOG_DATA`.
  - Bouton dédié `[⚡ Synchro Spécialisées]` sur PC Desktop avec horodatage de la dernière exécution.

---

## 2. Règles Métier & Arbitrages Algorithmiques (v8.75)

### A. Règle Fondamentale : 1 Titre = 1 Catégorie Dominante Unique
Chaque film ou série est qualifié dans **strictement une seule** des 7 catégories officielles :
1. `drame_emotion` : Drames profonds, romances d'auteur, biopics, drames historiques/sociaux (416 œuvres).
2. `comedie` : Comédies pures, comédies romantiques, comédies policières et parodies (305 œuvres).
3. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, thrillers criminels (220 œuvres).
4. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore (209 œuvres).
5. `scifi_fantastique` : Science-fiction, space opera, anticipation, cyborgs, mondes magiques (118 œuvres).
6. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (101 œuvres).
7. `action_aventure` : Action grand spectacle, westerns d'action, survie, guerre, arts martiaux (62 œuvres).

### B. Instauration du Registre Persistant de Qualification Sémantique IA (v8.75)
* **Architecture de Cache Persistant ([`data/ai_categories.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_categories.json))** :
  - Séparation nette entre scraping brut et qualification sémantique fine.
  - Chaque œuvre mémorisée dans le registre conserve sa clé unique, sa répartition détaillée sur 100%, sa justification éditoriale et sa catégorie dominante unique.
  - **Zéro re-calcul inutile** : Toute œuvre présente dans le registre est injectée instantanément (0 ms de calcul, 0 coût).
* **Moteur Automatique GitHub Models / Azure AI (`scripts/sync_justwatch.cjs`)** :
  - Intégration native de l'inférence **GPT-4o mini** via `GH_MODELS_TOKEN` (ou `DEEPSEEK_API_KEY`).
  - Lors du scan quotidien de 06:00 UTC, seules les nouvelles œuvres non répertoriées sont transmises à l'IA pour qualification.
  - Fallback déterministe automatique en cas d'indisponibilité réseau pour garantir qu'aucune mise à jour n'échoue.
* **Grand Assainissement Sémantique Exhaustif (40 œuvres verrouillées au registre)** :
  - **18 nouvelles comédies, comédies policières et de braquage assainies en `comedie`** :
    * *Haut les mains !* (comédie éco-féministe burlesque de braquage) : `thriller_policier` ➔ `comedie`.
    * *Burn After Reading* (frères Coen, satire mordante avec Brad Pitt & George Clooney) : `thriller_policier` ➔ `comedie`.
    * *En liberté !* (Pierre Salvadori avec Adèle Haenel, comédie burlesque) : `thriller_policier` ➔ `comedie`.
    * *Je fais le mort* (François Damiens, comédie policière loufoque) : `thriller_policier` ➔ `comedie`.
    * *Ocean's 8* (Sandra Bullock & Cate Blanchett, comédie de braquage chic) : `thriller_policier` ➔ `comedie`.
    * *Insaisissables 2* (braquage d'illusionnisme grand public et fun) : `thriller_policier` ➔ `comedie`.
    * *The Voices* (Ryan Reynolds, comédie noire déjantée avec ses animaux) : `thriller_policier` ➔ `comedie`.
    * *Bienvenue à Zombieland* (Woody Harrelson, comédie d'action zombiesque culte) : `horreur_epouvante` ➔ `comedie`.
    * *Deadstream* (comédie horrifique satirique d'un streamer) : `horreur_epouvante` ➔ `comedie`.
    * *Jakob's Wife* (comédie vampirique décalée) : `thriller_policier` ➔ `comedie`.
    * *Braquage à l'Allemande*, *Une pure affaire* (François Damiens), *Omar La Fraise*, *RATS!* : `thriller_policier` ➔ `comedie`.
  - **Science-Fiction & Anticipation réhabilitées en `scifi_fantastique`** :
    * *RoboCop* (2014, cyborg policier d'anticipation cyberpunk) : `thriller_policier` ➔ `scifi_fantastique`.
    * *Corrective Measures : Mutants surpuissants* (prison pour super-vilains mutants) : `thriller_policier` ➔ `scifi_fantastique`.
    * *Redux Redux* (voyages à travers les univers parallèles et multivers) : `thriller_policier` ➔ `scifi_fantastique`.
  - **Biopics & Drames d'auteur réhabilités en `drame_emotion`** :
    * *Lady Nazca* (biopic historique émouvant de l'archéologue Maria Reiche au Pérou) : `action_aventure` ➔ `drame_emotion`.
* **Workflow GitHub Actions ([`.github/workflows/update_catalog.yml`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/.github/workflows/update_catalog.yml))** :
  - Injection chiffrée des secrets `GH_MODELS_TOKEN` et `DEEPSEEK_API_KEY`.
  - Sauvegarde automatique et commit synchronisé de `js/catalog.js` et `data/ai_categories.json`.

### C. Moteur de Catégorisation Algorithmique (Filet de Sécurité Déterministe)
* **Sanctuarisation de l'Horreur & Protection Animation / Famille (v8.66)** :
  - Exclusion stricte des pastilles adultes `-16` et `-18` de la catégorie `animation_famille`.
  - Exclusion formelle de l'Horreur (`hrr`) de `animation_famille`, sauf œuvres expressément étiquetées Famille (`fml`) et Tout Public.
* **Rééquilibrage Universel Drame vs Comédie (v8.64)** :
  - Assouplissement du verrou d'âge : `-10` et `-12` n'excluent plus la comédie.
  - Romance & Comédie : Dans une comédie romantique (`cmy` + `rma`), le tag romance ne neutralise pas la comédie.
* **Réhabilitation des Thrillers de Tension (v8.64)** :
  - Prise en compte de `THRILLER_TENSION_PATTERNS`. Neutralisation du bonus Drame automatique en présence d'un thriller de tension ou d'enquête.
* **Réhabilitation Universelle SF & Fantastique vs Faux Positifs Horreur (v8.68)** :
  - Règle `isSciFiFantasyHybrid` pour les œuvres cumulant `fnt` + `scf` sans motifs d'horreur stricte (*Le Règne animal*, *Glass*).
* **Verrou de Genre Obligatoire (Genre-Gating Strict) (v8.69)** :
  - Une œuvre ne peut être affiliée à une catégorie thématique sans disposer d'au moins un tag officiel correspondant.

---

## 3. Purge Complète des Fichiers Morts & Clarté Git (v8.75)

* **Éradication Totale des Fichiers Morts Molotov Abonnements (~1 350 fichiers purgés)** :
  - Suppression intégrale de tous les fichiers scratch/test (~830 fichiers) dans `propositions/`.
  - Purge chirurgicale de `propositions/assets/` (517 fichiers morts supprimés) : retrait des extractions PDF, dossier `framer`, formats `.avif`/`.webp` obsolètes et logos hors offre.
  - Nettoyage de la racine : suppression des fichiers `.har` (7 Mo), de `Officiel.pdf` et des scripts d'extraction ponctuels.
  - Protection `.gitignore` : ajout de `*.har` et `*.pdf`.
  - Disparition du badge « 1K+ » : Git stabilisé à ~70 éléments propres.
* **Suppression de `assets/posters/` (68.5 Mo libérés)** :
  - 100% des jaquettes (1 431 œuvres) servies en haute résolution officielle via le CDN direct JustWatch.

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

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([js/catalog.js](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 431** (1 283 films $\ge 60\text{ min}$, 148 séries).
  - **Total œuvres qualifiées Mobile** : **864** (739 films $\ge 60\text{ min}$, 125 séries).
  - **Conformité 1 catégorie unique** : **1 431 / 1 431 (100% conforme, 0 anomalie)**.
  - **Répartition des 7 catégories officielles** :
    * `drame_emotion` : 416
    * `comedie` : 305
    * `thriller_policier` : 220
    * `horreur_epouvante` : 209
    * `scifi_fantastique` : 118
    * `animation_famille` : 101
    * `action_aventure` : 62
  - **Titres expirés** : **0**.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : **v8.75** (`sw.js` : `cinescope-v8.75-streaming`).
  - **Clés LocalStorage Actives** : `_v46` (`cinescope_streaming_catalog_v46`, `cinescope_last_specialized_sync_v46`, etc.).

---

## 6. Historique des Retours Utilisateur & Calibrage Curation
* **Enregistrement des retours récents dans [`profils_amis.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/profils_amis.md)** :
  - *It Feeds* : **75/100** (Validé — Surnaturel concret, menace directe, premier degré efficace sans prétention).
  - *Heretic* : **60/100** (Mitigé/bon — Concept brillant et joute verbale avec Hugh Grant, mais trop bavard/statique).
  - *Les Maudites* (*El llanto*) : **25/100** (Rejeté & archivé dans l'audit des exclusions — Faux film de genre, drame festivalier lent sans action ni tension).
  - *The Batman* (2022) vs *Batman v Superman* : Recommandation duo formalisée (*The Batman* validé comme le compromis parfait entre l'action brute 1er degré de l'Ami et l'enquête/déduction à la *Seven* de l'Amie).
  - **Aversion formalisée** : Rejet strict des faux films d'horreur contemplatifs / drames lents de festival.
