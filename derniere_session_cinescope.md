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
1. `drame_emotion` : Drames profonds, romances d'auteur, biopics, drames historiques/sociaux (415 œuvres).
2. `comedie` : Comédies pures, comédies romantiques et populaires, comédies d'action grand public, satires (291 œuvres).
3. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, suspense/angoisse, thrillers criminels (235 œuvres).
4. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore (211 œuvres).
5. `scifi_fantastique` : Science-fiction, space opera, anticipation, heroic fantasy, super-héros, mystère magique (115 œuvres).
6. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (101 œuvres).
7. `action_aventure` : Action grand spectacle, westerns d'action armée, survie, guerre, arts martiaux (63 œuvres).

### B. Instauration du Registre Persistant de Qualification Sémantique IA (v8.75)
* **Architecture de Cache Persistant ([`data/ai_categories.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_categories.json))** :
  - Séparation nette entre scraping brut et qualification sémantique fine.
  - Chaque œuvre mémorisée dans le registre conserve sa clé unique, sa répartition détaillée sur 100%, sa justification éditoriale et sa catégorie dominante unique.
  - **Zéro re-calcul inutile** : Toute œuvre présente dans le registre est injectée instantanément (0 ms de calcul, 0 coût).
* **Moteur Automatique GitHub Models / Azure AI (`scripts/sync_justwatch.cjs`)** :
  - Intégration native de l'inférence **GPT-4o mini** via `GH_MODELS_TOKEN` (ou `DEEPSEEK_API_KEY`).
  - Lors du scan quotidien de 06:00 UTC, seules les nouvelles œuvres non répertoriées sont transmises à l'IA pour qualification.
  - Fallback déterministe automatique en cas d'indisponibilité réseau pour garantir qu'aucune mise à jour n'échoue.
* **Application immédiate & Réhabilitation Massive (21 œuvres corrigées)** :
  - *Hounds of War* (Frank Grillo, Isaac Florentine, 2024) : Reclassé de `thriller_policier` à `action_aventure`.
  - **10 chefs-d'œuvre et blockbusters d'action pure réhabilités en `action_aventure`** :
    * *Hunter Killer* (Gerard Butler, Navy SEALs et sous-marins de combat) : `thriller_policier` ➔ `action_aventure`.
    * *La Vengeance dans le Corps* (Jean-Claude Van Damme, vendetta martiale) : `thriller_policier` ➔ `action_aventure`.
    * *L'Étranger* (film de mercenaires armés avec Craig Fairbrass) : `thriller_policier` ➔ `action_aventure`.
    * *Braquage de sang* (fusillades tactiques de braqueurs) : `thriller_policier` ➔ `action_aventure`.
    * *Détective Dee : La Légende du dragon des mers* (Tsui Hark, combats martiaux wuxia grand spectacle) : `thriller_policier` ➔ `action_aventure`.
    * *Baby Assassins: Nice Days* (duels martiaux d'adolescentes tueuses) : `thriller_policier` ➔ `action_aventure`.
    * *Hansel & Gretel : Witch Hunters* (action fantastique grand spectacle de Jeremy Renner) : `horreur_epouvante` ➔ `action_aventure`.
    * *Monster Summer* (Mel Gibson, aventure jeunesse d'ados à vélo façon *Goonies*) : `horreur_epouvante` ➔ `action_aventure`.
    * *7 Guardians of the Tomb* (expédition archéologique et pièges périlleux) : `horreur_epouvante` ➔ `action_aventure`.
    * *Marco* (vendetta physique violente) : `thriller_policier` ➔ `action_aventure`.
  - **4 comédies majeures réhabilitées en `comedie`** :
    * *Game Night* (comédie policière culte avec Jason Bateman et Rachel McAdams) : `thriller_policier` ➔ `comedie`.
    * *The Big Short : Le Casse du Siècle* (satire mordante d'Adam McKay) : `drame_emotion` ➔ `comedie`.
    * *Rock'n Chili* (comédie parodique avec Antonio Banderas en rock-star) : `thriller_policier` ➔ `comedie`.
    * *Les Nettoyeurs* (comédie noire burlesque) : `thriller_policier` ➔ `comedie`.
  - **7 œuvres d'anticipation et de SF pure réhabilitées en `scifi_fantastique`** :
    * *Battlestar Galactica : The Plan* (space opera spatial et Cylons) : `drame_emotion` ➔ `scifi_fantastique`.
    * *Curvature* (ingénierie et voyage dans le temps) : `horreur_epouvante` ➔ `scifi_fantastique`.
    * *Radius* (onde et phénomène d'anticipation) : `horreur_epouvante` ➔ `scifi_fantastique`.
    * *T.I.M.* (androïde d'intelligence artificielle domestique) : `horreur_epouvante` ➔ `scifi_fantastique`.
    * *Osiris* (science-fiction spatiale et survie interstellaire) : `horreur_epouvante` ➔ `scifi_fantastique`.
    * *Monolith* (enquête sur un artefact extraterrestre) : `horreur_epouvante` ➔ `scifi_fantastique`.
    * *Things Will Be Different* (faille et distorsion temporelle) : `horreur_epouvante` ➔ `scifi_fantastique`.
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
    * `drame_emotion` : 415
    * `comedie` : 291
    * `thriller_policier` : 235
    * `horreur_epouvante` : 211
    * `scifi_fantastique` : 115
    * `animation_famille` : 101
    * `action_aventure` : 63
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
