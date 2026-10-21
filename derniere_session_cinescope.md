# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.94** / Cache **cinescope-v8.94-streaming**).

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

## 2. Règles Métier & Arbitrages Algorithmiques (v8.84)

### A. Règle Fondamentale : 1 Titre = 1 Catégorie Dominante Unique
Chaque film ou série est qualifié dans **strictement une seule** des 7 catégories officielles :
1. `drame_emotion` : Drames profonds, romances d'auteur, biopics, drames historiques/sociaux (396 œuvres).
2. `comedie` : Comédies pures, comédies romantiques, comédies policières, parodies et satires (300 œuvres).
3. `horreur_epouvante` : Slashers, épouvante, body horror, démons/possession, monstres, gore (213 œuvres).
4. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, thrillers criminels (185 œuvres).
5. `scifi_fantastique` : Science-fiction, space opera, anticipation, cyborgs, mondes magiques (159 œuvres).
6. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux (101 œuvres).
7. `action_aventure` : Action grand spectacle, westerns d'action, survie, guerre, arts martiaux (60 œuvres).

### B. Retour au Système de Calcul Déterministe du 17/10/2026 & Archivage IA (v8.78)
* **Rétablissement du Moteur Algorithmique Déterministe Purement Souverain** :
  - Suite au constat d'incohérences et de dérives induites par la catégorisation LLM (DeepSeek / GPT-4o mini), retour intégral au moteur déterministe actif le 17/10/2026 (`computeCategory` dans [`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js)).
  - Réapplication immédiate du calcul mathématique pur sur les 1 414 œuvres du catalogue.
  - Suppression de tout forçage ou surcharge par IA dans [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) et dans le workflow GitHub Actions ([`.github/workflows/update_catalog.yml`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/.github/workflows/update_catalog.yml)).
* **Sanctuarisation & Archivage des Données IA pour Consultation Future** :
  - **Archive intégrale préservée** : [`data/ai_categories_archive_18102026.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_categories_archive_18102026.json) (1 431 fiches complètes avec répartitions sur 100%, justifications et sources).
  - Les registres [`data/ai_categories.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_categories.json), [`data/audit_deepseek_results.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/audit_deepseek_results.json) et [`suivi_categorisation.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/suivi_categorisation.md) demeurent archivés pour réutilisation ponctuelle si souhaité.

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
* **Arbitrage Universel Action vs Thriller (v8.79)** :
  - Priorité souveraine à l'Action (`action_aventure`) sur le Thriller (`thriller_policier`) lorsque l'œuvre cumule `act` + `trl`, **sauf si le tag Crime (`crm`) est présent**.
  - Réhabilitation immédiate de 11 purs films d'action armée et de combat physique (*Hunter Killer*, *Triple Threat*, *Stratton*, *Non-Stop*, *Final Score*, *Rogue*, *Hounds of War*, *Tokarev*, *Actes de Vengeance*, etc.).
  - Sanctuarisation absolue des séries procédurales d'enquête policière (*New York, crime organisé*, *B.R.I*) et des polars noirs/psychologiques (*The Batman*, *Drive*, *Les Lyonnais*, *Un traître idéal*) protégés par la présence formelle du tag `crm`.
* **Architecture Quintuple Duel IA Ciblé (v8.86)** :
  - **Duel 1 (Action vs Thriller)** : Strictement réservé aux œuvres cumulant `act` + `trl` sans aucun genre dominant (`!cmy`, `!hrr`, `!scf`, `!fnt`, `!ani`, `!doc`).
  - **Duel 2 (Horreur vs Science-Fiction / Fantastique)** : Déclenché pour les œuvres cumulant `hrr` et (`scf` ou `fnt`) sans être des comédies ni de l'animation. Départage entre anticipation technologique/IA/voyage temporel/cosmique et terreur viscérale/monstres/gore.
    - *Pépites SF sauvées* : ***T.I.M.***, ***Radius***, ***Curvature***, ***Things Will Be Different***, ***Monolith***, ***Nope***, ***Under the Skin***, ***Avant que nous disparaissions*** reclassés en `scifi_fantastique`.
  - **Duel 3 (Horreur vs Polar Criminel)** : Déclenché pour les œuvres cumulant `hrr` et `crm` sans fantastique ni SF.
    - *Cyber-polars et enquêtes sauvés* : ***Cloud*** (2024, de Kiyoshi Kurosawa), ***Les Chambres rouges***, ***Le Mangeur d'âmes***, ***Dead Mail***, ***Broadcast Signal Intrusion***, ***Green Room***, ***Becky***, ***Laissez bronzer les cadavres***, ***Devil in Disguise: John Wayne Gacy***, ***The Lost Footage of Leah Sullivan*** reclassés en `thriller_policier`.
    - *Pure épouvante sanctuarisée* : ***Maniac***, ***Savageland***, ***The Guest***, ***Godless: The Eastfield Exorcism*** confirmés en `horreur_epouvante`.
  - **Duel 4 (Horreur vs Action / Aventure)** : Déclenché pour les œuvres cumulant `hrr` et `act` (ou `wsn`/`war`) sans crime, SF ni fantastique.
    - *Survie physique réhabilitée* : ***Fear the Night*** (Maggie Q vétérane en riposte tactique armée) et ***Saýara*** (arts martiaux et vengeance physique pure) réhabilités en `action_aventure`.
    - *Pure horreur animale et sadisme sanctuarisés* : ***Cub***, ***Aux portes de l'enfer***, ***Beaten to Death***, ***Piégés*** confirmés en `horreur_epouvante`.
  - **Duel 5 (Tri-Duel Comédie vs Action vs Thriller / Polar)** : Déclenché pour les œuvres cumulant `cmy` avec `act`, `crm` ou `trl` sans fantastique ni horreur. Évaluation par pourcentages croisés sur les 3 composantes.
    - *Polars noirs et braquages libérés* : ***Sang Froid*** (2019, Liam Neeson : 60% Thriller, 30% Action, 0% Comédie), ***Ocean's 8***, ***Mi$e à prix***, ***Amsterdam***, ***Dark Web: Cicada 3301***, ***Head Count***, ***Les Nettoyeurs*** réhabilités en `thriller_policier`.
    - *Action physique pure réhabilitée* : ***Insaisissables 2***, ***Novocaïne***, ***Railroad Tigers*** (Jackie Chan), ***The Cash Collector 1 & 2***, ***Baby Assassins: Nice Days***, ***Le Secret de Khéops*** réhabilités en `action_aventure`.
    - *Pures comédies sanctuarisées* : ***OSS 117*** (tous), ***Hundreds of Beavers***, ***Burn After Reading***, ***Game Night***, ***Projet X***, ***Yannick*** confirmés en `comedie`.
  - **Règle Jeunesse Tout Public (Films en prises de vue réelles)** : Déverrouillage d'`animation_famille` pour les films Tout Public portant le tag `fml` et axés sur l'enfance, l'école et la jeunesse (***La Formule magique***, ***Les Blagues de Toto***, ***Drôle de prof 2, 3, 4***, ***Mon frère chasse les dinosaures***, ***Ma folle semaine avec Tess***, ***Master spy***, ***L'École buissonnière***).
  - **Sécurité et intégrité (`isEligibleDuelEntry`)** : Dans [`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js) et [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs), le cache IA n'est appliqué que si l'œuvre respecte rigoureusement les prérequis stricts de son duel respectif.

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
  - **Application stricte des 20 ans glissants ($\ge 2006$)** : 17 films unitaires historiques (< 2006) purgés.
  - **Règle des séries multi-saisons respectée** : Calcul basé sur l'année moyenne $\frac{\text{Saison début} + \text{Saison fin}}{2}$ (*Battlestar Galactica* 2004–2008 = moyenne 2006 $\ge 2006$, conforme).
  - **Conformité 1 catégorie unique** : **1 414 / 1 414 (100% conforme, 0 anomalie)**.
  - **Répartition issue de la qualification v8.86 (1 414 titres - Architecture Quintuple Duel IA & Jeunesse)** :
    * `drame_emotion` : 396 (28.0%)
    * `comedie` : 278 (19.7%)
    * `thriller_policier` : 202 (14.3%)
    * `horreur_epouvante` : 201 (14.2%)
    * `scifi_fantastique` : 159 (11.2%)
    * `animation_famille` : 110 (7.8%)
    * `action_aventure` : 68 (4.8%)
  - **Titres expirés** : **0**.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : **v8.88** (`sw.js` : `cinescope-v8.88-streaming`).
  - **Optimisation Affichage & Fluidité** : Affiches avec `loading="lazy"` natif et préchargement d'arrière-plan temporisé (4 requêtes max via `requestIdleCallback`) éliminant toute congestion réseau.
  - **Clés LocalStorage Actives** : `_v46` (`cinescope_streaming_catalog_v46`, `cinescope_last_specialized_sync_v46`, etc.).
  - **Cache Arbitrage IA** : [`data/ai_duel_cache.json`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_duel_cache.json) (162 arbitrages enregistrés et verrouillés).
  - **Règle Séries Famille / Animation** : Exigence formelle du tag `ani` pour les séries en `animation_famille`.
  - **Workflow GitHub Actions** : Clé secrète `DEEPSEEK_API_KEY` injectée et commit automatique du cache IA.

---

## 6. Historique des Retours Utilisateur & Calibrage Curation
* **Enregistrement des retours récents dans [`profils_amis.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/profils_amis.md)** :
  - *It Feeds* : **75/100** (Validé — Surnaturel concret, menace directe, premier degré efficace sans prétention).
  - *Heretic* : **60/100** (Mitigé/bon — Concept brillant et joute verbale avec Hugh Grant, mais trop bavard/statique).
  - *Les Maudites* (*El llanto*) : **25/100** (Rejeté & archivé dans l'audit des exclusions — Faux film de genre, drame festivalier lent sans action ni tension).
  - *The Batman* (2022) vs *Batman v Superman* : Recommandation duo formalisée (*The Batman* validé comme le compromis parfait entre l'action brute 1er degré de l'Ami et l'enquête/déduction à la *Seven* de l'Amie).
  - **Aversion formalisée** : Rejet strict des faux films d'horreur contemplatifs / drames lents de festival.

* **Boutons de Tri Interactifs (Date & Avis critique) (21/10/2026 - v8.94 - Règle 8 Exclusivité PC)** :
  - **Bouton `📅 Date`** : Alternance 3 états (`📅 Date ↓` Récent $\rightarrow$ Ancien, `📅 Date ↑` Ancien $\rightarrow$ Récent, `📅 Date` Défaut).
  - **Bouton `💬 Avis`** : Inséré immédiatement à côté de `📅 Date` sur la barre des filtres avec l'icône bulle `💬` identique à la pastille cyan de la fiche détail. Trie rigoureusement sur la **note critique spectateurs/presse (`note_avis`)** et non sur la note générale :
    * `💬 Avis ↓` : Meilleures notes critiques en premier (10 $\rightarrow$ 4).
    * `💬 Avis ↑` : Moins bonnes notes critiques en premier (4 $\rightarrow$ 10).
    * `💬 Avis` : Réinitialisation du tri par défaut.
    * **Thème visuel** : Surbrillance cyan satiné (`#38bdf8`) à l'état actif, harmonisé avec la pastille Avis de la fiche.
  - **Exclusivité mutuelle** : L'activation de l'un réinitialise automatiquement l'autre pour une clarté totale de la navigation.
  - **Strictement invisible sur mobile** : Masqué sous 1024px (`display: none !important`).

* **Affichage par Colonnes Thématiques Indépendantes sur PC Desktop (20/10/2026 - v8.88 - Règle 8 AGENTS.md)** :
  - **Condition d'activation** : Exclusivité PC ($\ge 1024\text{px}$), activé sur la vue générale « Tous les titres » (`activeCategory === 'all'`) en l'absence de recherche textuelle.
  - **Architecture 6 Couloirs Verticaux Indépendants** (`.theme-column`) :
    1. **Col 1** : 🏹 **Action & Horreur** (Action 68 titres, puis séparateur `👻 Horreur & Épouvante`, suivi des 201 titres d'horreur $\rightarrow$ **269 titres au total**)
    2. **Col 2** : 🔍 **Thriller & Policier** (202 titres)
    3. **Col 3** : 🚀 **Science-Fiction & Fantastique** (159 titres)
    4. **Col 4** : 🎭 **Comédie** (278 titres)
    5. **Col 5** : ❤️ **Drame & Émotion** (396 titres)
    6. **Col 6** : 🧸 **Animation & Famille** (110 titres)
  - **Règle Stricte d'Isolation Thématique (Zéro Parasitage)** :
    Chaque colonne est strictement réservée à son propre genre. Lorsqu'une colonne a terminé la liste de ses œuvres (ex: Famille après 110 œuvres), **elle s'arrête naturellement et reste vide en dessous**, sans jamais être polluée par des titres d'autres thèmes.
  - **Maintien intégral du tri souverain** :
    Dans chaque colonne, les œuvres respectent fidèlement le tri officiel (`sortCatalogItems`) : expiration en tête par ordre d'urgence, puis tirage aléatoire quotidien (ou tri chronologique 2026 $\rightarrow$ 2006 si le bouton `📅 Date` est actif).
  - **En-tête de colonnes interactif** : Pilule « Action & Horreur » avec compteur combiné (269) et compteurs individuels cliquables au sommet de chaque colonne.
  - **Sanctuarisation mobile** : Strictement masqué sur mobile / tablettes ($< 1024\text{px}$), conservant la grille responsive classique 1 ou 2 colonnes sans régression.

* **Améliorations Modale & Exclusivité PC Desktop (21/10/2026 - v8.89 - Règle 8 AGENTS.md)** :
  - **Actualisation Officielle du Logo Shadowz** : Remplacement de `assets/logos/shadowz.png` par la version haute résolution officielle issue de Molotov Abonnements (`propositions/assets/logos/shadowz.png`).
  - **Comptage Dynamique des Épisodes des Séries (`.modal-episodes-badge`)** :
    * **Typographie & Style alignés exactement sur les années** : Rendu en texte sobre sans capsule ni bordure (`color: var(--text-muted); font-size: 0.95rem; font-weight: 700; white-space: nowrap`), identique à `.modal-year`.
    * **Menu déroulant sobre préservé à l'identique** : Options simples `Saison 1`, `Saison 2`, etc. sans surcharge.
    * **À côté du sélecteur par défaut** : Affiche directement le nombre total d'épisodes disponibles pour toute la série (ex: `44 épisodes`).
    * **Au clic sur une saison spécifique** : S'actualise instantanément pour n'afficher que le nombre d'épisodes de la saison choisie (ex: `16 épisodes` pour la Saison 2).
    * **Calage visuel garanti sur une seule ligne** : `.modal-card` élargi à `720px` sur PC avec `white-space: nowrap`, évitant tout retour à la ligne ou collision avec le bouton de fermeture `(X)`.
  - **Sous-Notes Distinctes Stylisées (`.modal-sub-ratings`)** :
    * Sous la note globale dorée, affichage de deux pastilles colorées harmonieuses :
      - **Avis Critique** (Cyan `#38bdf8`) : `💬 Avis : 7.0/10` (TMDb / IMDb / Rotten Tomatoes).
      - **Fraîcheur / Récence** (Émeraude `#34d399`) : `⏳ Récence : 8.5/10` (Algorithme chronologique CinéScope).
    * Adaptation dynamique : reflète la note de saison spécifique si une saison est sélectionnée.
  - **Sanctuarisation Mobile Stricte (Règle 8)** :
    * `.modal-episodes-badge` et `.modal-sub-ratings` strictement masqués via `@media (max-width: 1023px) { display: none !important; }`. Mobile intact et épuré.

