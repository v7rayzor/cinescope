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
1. `drame_emotion` : Drames profonds, romances d'auteur, biopics, drames historiques/sociaux (446 œuvres).
2. `comedie` : Comédies pures, comédies romantiques, comédies policières, parodies et satires (351 œuvres).
3. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore (192 œuvres).
4. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, thrillers criminels (135 œuvres).
5. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (127 œuvres).
6. `scifi_fantastique` : Science-fiction, space opera, anticipation, cyborgs, mondes magiques (97 œuvres).
7. `action_aventure` : Action grand spectacle, westerns d'action, survie, guerre, arts martiaux (83 œuvres).

### B. Instauration du Registre Persistant de Qualification Sémantique IA (v8.75)
* **Architecture de Cache Persistant 100% Intégral ([`data/ai_categories.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_categories.json))** :
  - **1 431 / 1 431 œuvres (100% du catalogue)** sont désormais qualifiées avec précision et mémorisées dans le registre persistant.
  - L'ancien algorithme de calcul déterministe est désormais rétrogradé au rang strict de **roue de secours** (fallback de sécurité en cas de panne réseau).
  - Chaque œuvre mémorisée possède sa clé unique, sa répartition détaillée sur 100%, sa justification éditoriale concise et sa catégorie dominante unique.
  - **Zéro re-calcul inutile** : Lors du scan quotidien ou du lancement local, 100% des œuvres existantes bénéficient d'un cache hit immédiat (0 ms, 0 coût).
* **Grand Assainissement Sémantique Intégral (211 œuvres corrigées et réhabilitées)** :
  - **Comédies réhabilitées en `comedie` (347 au total)** : *La Machine à démonter le temps (1 & 2)*, *Mandibules* (Dupieux), *Discount*, *S.O.S. Fantômes*, *Kaamelott : Deuxième Volet*, *Cop Secret*, *Ne coupez pas !*, *The Trip*, *The Outlaws*, *Tschugger*, *Secrets de famille*, *Vampire Zombies From Space!*, *Satanic panic*, *Haut les mains !*, *Burn After Reading*, *En liberté !*, *Je fais le mort*, *Ocean's 8*, *Insaisissables 2*, *The Voices*, *Bienvenue à Zombieland*, etc.
  - **Action pure & Arts martiaux réhabilités en `action_aventure` (87 au total)** : *The Raid* (Gareth Evans / Iko Uwais), *Triple Threat* (Tony Jaa / Scott Adkins), *Kickboxer : Vengeance* (JCVD), *Avengement*, *Final Score*, *Stratton*, *Rogue*, *64 Minutes Chrono*, *Actes de Vengeance*, *Brothers In Arms*, *Sous haute surveillance*, *Tokarev*, *The Cash Collector 2*, *Non-Stop*, *Hunter Killer*, *Hounds of War*, etc.
  - **Science-Fiction & Anticipation réhabilitées en `scifi_fantastique` (132 au total)** : *RoboCop (2014)*, *The Walking Dead : Dead City*, *Cloverfield*, *Nope*, *M3GAN*, *Under the Skin*, *Super Icyclone*, *Corrective Measures*, *Redux Redux*, *Battlestar Galactica : The Plan*, *Curvature*, *Radius*, *T.I.M.*, *Osiris*, *Monolith*, etc.
  - **Polars et Enquêtes assainis en `thriller_policier` (153 au total)** : Élimination de tous les faux-positifs comiques et d'action pure. Recentrage sur les véritables enquêtes, néo-noirs et machinations criminelles (*The Batman*, *Drive*, *Old Boy*, *Elle*, *Mr Wolff*, *B.R.I*, *Les Lyonnais*, *Burning*, *Golden Glove*).
* **Workflow GitHub Actions ([`.github/workflows/update_catalog.yml`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/.github/workflows/update_catalog.yml))** :
  - Inférence native **GPT-4o mini** via `GH_MODELS_TOKEN` (ou `DEEPSEEK_API_KEY`).
  - Lors du scan quotidien de 06:00 UTC, seules les éventuelles *nouvelles* œuvres non encore enregistrées interrogent l'IA.
  - Commit et synchronisation automatique de `js/catalog.js` et `data/ai_categories.json`.

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
  - **Total œuvres qualifiées PC** : **1 414** (1 266 films $\ge 60\text{ min}$ et 148 séries sortis entre 2006 et 2026).
  - **Application stricte des 20 ans glissants ($\ge 2006$)** : 17 films unitaires historiques (< 2006) ont été purgés.
  - **Règle des séries multi-saisons respectée** : Calcul basé sur l'année moyenne $\frac{\text{Saison début} + \text{Saison fin}}{2}$ (*Battlestar Galactica* 2004–2008 = moyenne 2006 $\ge 2006$, 100% conforme).
  - **Conformité 1 catégorie unique** : **1 414 / 1 414 (100% conforme, 0 anomalie)**.
  - **Répartition actuelle des 7 catégories officielles (après application des 269 victoires nettes DeepSeek)** :
    * `drame_emotion` : 622 (44.0%)
    * `comedie` : 180 (12.7%)
    * `thriller_policier` : 180 (12.7%)
    * `horreur_epouvante` : 178 (12.6%)
    * `scifi_fantastique` : 88 (6.2%)
    * `action_aventure` : 85 (6.0%)
    * `animation_famille` : 81 (5.7%)
  - **Titres expirés** : **0**.
* **Audit Croisé Intégral DeepSeek (`deepseek-chat`, température 0.0) sur les 1 414 Œuvres** :
  - **1 031 œuvres (72,9%)** : Accord parfait dès le départ.
  - **269 victoires nettes (> 50% et écart > 15%)** : Appliquées et enregistrées dans `js/catalog.js` et `data/ai_categories.json`.
  - **114 matches serrés (écart <= 15% ou dominance <= 50%)** : Documentés intégralement dans `matches_serres_arbitrage.md` avec 100% de la répartition pour arbitrage.

* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : **v8.76** (`sw.js` : `cinescope-v8.76-streaming`).
  - **Clés LocalStorage Actives** : `_v46` (`cinescope_streaming_catalog_v46`, `cinescope_last_specialized_sync_v46`, etc.).

---

## 6. Historique des Retours Utilisateur & Calibrage Curation
* **Enregistrement des retours récents dans [`profils_amis.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/profils_amis.md)** :
  - *It Feeds* : **75/100** (Validé — Surnaturel concret, menace directe, premier degré efficace sans prétention).
  - *Heretic* : **60/100** (Mitigé/bon — Concept brillant et joute verbale avec Hugh Grant, mais trop bavard/statique).
  - *Les Maudites* (*El llanto*) : **25/100** (Rejeté & archivé dans l'audit des exclusions — Faux film de genre, drame festivalier lent sans action ni tension).
  - *The Batman* (2022) vs *Batman v Superman* : Recommandation duo formalisée (*The Batman* validé comme le compromis parfait entre l'action brute 1er degré de l'Ami et l'enquête/déduction à la *Seven* de l'Amie).
  - **Aversion formalisée** : Rejet strict des faux films d'horreur contemplatifs / drames lents de festival.

* **Nouvelle Fonctionnalité : Tri par Date (18/10/2026 - Règle 8 Exclusivité PC)** :
  - Bouton interactif `📅 Date` inséré sur la Ligne 2 (Étoiles & Durée) immédiatement à droite du filtre Durée.
  - Alternance 3 états en boucle au clic : `📅 Date ↓` (Récent $\rightarrow$ Ancien : 2026 $\rightarrow$ 2006) $\rightarrow$ `📅 Date ↑` (Ancien $\rightarrow$ Récent : 2006 $\rightarrow$ 2026) $\rightarrow$ `📅 Date` (Défaut : Fins de droits prioritaires + tirage quotidien).
  - Gestion des séries conforme : Calcul basé sur `annee_moyenne` $= \frac{\text{Saison début} + \text{Saison fin}}{2}$.
  - Strictement invisible sur mobile (`display: none !important` sous 1024px).

* **Nettoyage & Maintenance du Dossier (18/10/2026)** :
  - **Archive réseau supprimée** : Suppression définitive du dump `www.molotov.tv_Archive [26-10-17 14-03-08].har` (245 Ko).
  - **Dossiers et fichiers résiduels purgés** : Suppression du dossier temporaire vide `scratch/` et des résidus de parsing obsolètes dans `Site/Films/` (`parsed.json`, `pdf_text.txt`, `tmdb_ocs_results.json`).
  - **État du workspace** : Dépôt git 100% propre, aucune fuite de fichiers ou d'artefacts orphelins.

