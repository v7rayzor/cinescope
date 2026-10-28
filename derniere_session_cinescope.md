# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v9.16** / Cache **cinescope-v9.16-streaming** / Stockage **_v48**).

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
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js.
  - Scanne bouquet par bouquet de manière dynamique avec pagination par curseur (`hasNextPage` / `endCursor`) sans limite de page rigide.
  - Scanne uniquement les 3 bouquets SVOD de base (`aoc`, `aca`, `auc`) en ~28 requêtes légères (filtre strict `monetizationTypes: ['FLATRATE']`).
* **Client Web Résilient & Synchro Manuelle Spécialisées ([`js/justwatch_engine.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
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
  - Suite au constat d'incohérences et de dérives induites par la catégorisation LLM (DeepSeek / GPT-4o mini), retour intégral au moteur déterministe actif le 17/10/2026 (`computeCategory` dans [`js/justwatch_engine.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js)).
  - Réapplication immédiate du calcul mathématique pur sur les 1 414 œuvres du catalogue.
  - Suppression de tout forçage ou surcharge par IA dans [`scripts/sync_justwatch.cjs`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) et dans le workflow GitHub Actions ([`.github/workflows/update_catalog.yml`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/.github/workflows/update_catalog.yml)).
* **Purge des Registres d'Audit & Allégement du Dépôt (v9.03)** :
  - Suppression définitive des anciens fichiers de log d'audit temporaires d'octobre 2026 (~2.6 Mo libérés). Seuls le cache persistant actif des duels IA ([`data/ai_duel_cache.json`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_duel_cache.json) et [`data/ai_duel_cache.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_duel_cache.js)) est conservé pour le moteur de qualification.

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
  - **Sécurité et intégrité (`isEligibleDuelEntry`)** : Dans [`js/justwatch_engine.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js) et [`scripts/sync_justwatch.cjs`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs), le cache IA n'est appliqué que si l'œuvre respecte rigoureusement les prérequis stricts de son duel respectif.

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
  `[✨ Tous les bouquets]` `[Ciné+ OCS]` `[Action Max]` `[Universal+]` `[Sooner]` `[Shadowz]` `[Insomnia]` `[Amazon Prime]`
* **Ligne 0B (Ligne 2) : Toggles d'Inclusion (+), Filtres d'Exclusion (-) & Synchro** :
  1. `[📦 Mode Amazon]` *(Exclusivité PC - Règle 8)* : Bascule exclusive vers le catalogue dédié Amazon Prime Video synchronisé ([`data/prime_catalog.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/data/prime_catalog.js)).
  2. `[➕ + Amazon]` *(Exclusivité PC - Règle 8)* : Ajoute les œuvres Amazon Prime Video aux bouquets actifs sans les masquer.
  3. `[🔄 Synchro Amazon]` *(Nouveau v9.03 - Exclusivité PC - Règle 8)* : Déclenche la synchronisation manuelle à la demande du catalogue Prime Video avec horodatage de la dernière synchro (`--/--` ou `JJ/MM`).
  4. `[🎬 + Spécialisées]` : Inactif par défaut. Clic ajoute Sooner, Shadowz, Insomnia.
  5. `[🔄 Synchro Spéc.]` : Déclenche la synchro JustWatch à la demande pour Sooner, Shadowz et Insomnia.
  6. `[🛡️ Hors Prime Video]` : Exclut les œuvres du catalogue Prime Video standard (masqué automatiquement en Mode Amazon).
  7. `[🚫 Exclure sans S1]` : Masque les séries tronquées sans saison 1.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([js/catalog.js](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 263** (1 115 films $\ge 60\text{ min}$ et 148 séries sortis entre 2006 et 2026).
  - **Application stricte des 20 ans glissants ($\ge 2006$)** : Recalibrage universel déterministe (2006 = 4.0, 2026 = 10.0, élimination stricte de 67 œuvres historiques dont la note globale recalculée descendait sous 6.0).
  - **Règle des séries multi-saisons respectée** : Calcul basé sur l'année moyenne $\frac{\text{Saison début} + \text{Saison fin}}{2}$.
  - **Conformité 1 catégorie unique** : **1 263 / 1 263 (100% conforme, 0 anomalie)**.
  - **Répartition issue de la qualification v9.04 (1 263 titres)** :
    * `drame_emotion` : 320 (25.3%)
    * `comedie` : 241 (19.1%)
    * `horreur_epouvante` : 191 (15.1%)
    * `thriller_policier` : 189 (15.0%)
    * `scifi_fantastique` : 151 (12.0%)
    * `animation_famille` : 105 (8.3%)
    * `action_aventure` : 66 (5.2%)
  - **Titres expirés** : **0**.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : **v9.04** (`sw.js` : `cinescope-v9.04-streaming`).
  - **Optimisation Affichage, RAM & Fluidité** : Suppression du préchargement agressif en mémoire vive, activation de `content-visibility: auto` (avec `contain-intrinsic-size: 190px 280px`) sur `.poster-card` pour décharger les cartes hors écran du GPU/RAM, et délégation d'événements centralisée sur `#postersGrid` éliminant 2 800+ closures V8 en mémoire. Seules les affiches visibles sont décodées via `loading="lazy"` natif.
  - **Clés LocalStorage Actives** : `_v47` (`cinescope_streaming_catalog_v47`, `cinescope_streaming_last_sync_v47`, `cinescope_streaming_last_full_sync_v47`, `cinescope_streaming_autosync_v47`).
  - **Registre Persistant des Arbitrages IA** : [`data/ai_duel_cache.json`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_duel_cache.json) (Node.js/CI) et [`data/ai_duel_cache.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/data/ai_duel_cache.js) (`window.AI_DUEL_CACHE` pour le client navigateur et hors-ligne), garantissant la pérennité totale des duels (*T.I.M.* en SF, *Cloud* en Polar).
  - **Harnais de Préservation Catégorielle Client** : Dans `mergeCatalog()`, préservation absolue de `refreshed.categories` s'il est déjà qualifié dans `catalog.js`, évitant toute régression par le calcul brut `computeCategory`.
  - **Règle Séries Famille / Animation** : Exigence formelle du tag `ani` pour les séries en `animation_famille`.
  - **Workflow GitHub Actions** : Clé secrète `DEEPSEEK_API_KEY` injectée et commit automatique du cache IA (.json et .js).

---

## 6. Historique des Retours Utilisateur & Calibrage Curation
* **Boutons Profils Curation PC & Sélecteur d'Affichage [ 1 ] / [ 2 ] (28/10/2026 - v9.16 - Règles 6, 7 & 8)** :
  - **Boutons Profils Curation (`🧙‍♂️ Moi`, `👤 Ami`, `👩 Amie`, `👫 Duo`)** : Intégrés dans le même flux continu que les sous-catégories, séparés par un diviseur vertical subtil (sans retour à la ligne forcé).
  - **Ordre Rectifié des Sous-Catégories** : Repositionnement rigoureux des 4 sous-catégories d'Horreur (*Slasher*, *Surnaturel*, *Monstres*, *Angoisse*) **avant** Comédie, aligné parfaitement sur la barre des catégories mères.
  - **Couplage Dynamique avec le Sélecteur `Affichage : [ 1 ] [ 2 ]`** :
    * **Mode `[ 1 ]`** : Affiche exclusivement les **7 propositions de la semaine** dans la grille normale, avec de grandes affiches pleine taille non compressées. Compteur réglé sur 7 titres.
    * **Mode `[ 2 ]`** : Affiche **toutes les œuvres éligibles au profil en colonnes de catégories** étanches (Action & Aventure, Thriller, SF, Horreur, Comédie, Drame, Famille).
  - **Fiche Markdown Dédiée d'Évaluation** : Création de [`propositions_films_semaine.md`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/propositions_films_semaine.md) pour consigner les 7 films hebdomadaires et noter le bilan en fin de semaine (`[ ] Vu / Pas vu`, `[ ] OK / Pas OK`).
  - **Calibrage Profil Duo Ami + Amie (KO Action Pure / OK Aventure)** : Remplacement du seuil arithmétique de 33% par l'arbitrage sémantique — exclusion stricte de l'Action pure (commandos, guerre, fusillades, baston brute) mais pleine ouverture à l'Aventure (quêtes, expéditions, trésors, survie nature comme *La fortuna* et *Jungle*).
  - **Calibrage Profil Amie (Comédies douces & Noël)** : Clarification formelle validée — 0 comédie conne / potache / vulgaire, mais les comédies douces, romantiques, familiales et comédies de Noël feel-good sont pleinement autorisées et appréciées.
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

* **Optimisation Majeure des Performances & Consommation RAM (26/10/2026 - v8.97)** :
  - **Suppression du préchargement agressif d'images** : Élimination de `preloadAllCatalogImages` qui chargeait simultanément des centaines d'affiches en mémoire dès le démarrage.
  - **Virtualisation de Rendu CSS (`content-visibility: auto`)** : Les cartes hors de l'écran ne sont plus calculées et peintes par le moteur du navigateur tant qu'elles ne sont pas visibles (`contain-intrinsic-size: 200px 300px`), allégeant drastiquement l'empreinte mémoire vive.
  - **Délégation d'Événements Unique sur la Grille** : Remplacement des listeners `addEventListener('click')` individuels sur chaque carte par un listener unique délégué sur `#postersGrid`.
  - **Nettoyage strict des résidus** : Retrait des logs volumineux et libération des références superflues en mémoire.

* **Mode Dédié Amazon Prime Video pour PC Desktop (26/10/2026 - v8.97 - Règle 8 Exclusivité PC)** :
  - **Catalogue dédié isolé** : Fichier [`data/prime_catalog.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/data/prime_catalog.js) contenant 1 530 titres SVOD Prime Video (1 371 films, 159 séries) avec notes, métadonnées, durées et affiches HD officielles.
  - **Bouton Toggle exclusif PC (`[📦 Mode Amazon]`)** : Permet de basculer en un clic entre le bouquet CinéScope standard et l'univers Prime Video complet.
  - **Règle d'exclusivité stricte** : Lorsqu'activé, le bouquet Amazon isole ses œuvres et masque l'ensemble des autres bouquets. La désactivation rétablit instantanément le catalogue CinéScope normal.
  - **Script de synchronisation dédié** : [`scripts/sync_prime.cjs`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_prime.cjs) configuré avec pagination dynamique.

* **Refonte Ergonomique & Centrage des Filtres Mobile / Portable (26/10/2026 - v8.98)** :
  - **Inversion des Lignes** :
    * Ligne Durée / Temps positionnée en tête (`order: 1`).
    * Ligne Étoiles de note positionnée en deuxième (`order: 3`), avec séparateur fin (`.mobile-divider-1`, `order: 2`).
  - **Bouton de Tri `📅 Date de sortie` Déployé sur Mobile** :
    * Placé en ligne sous les étoiles (`order: 5`), séparé par `.mobile-divider-2` (`order: 4`).
    * Libellé explicite `📅 Date de sortie` sur mobile (sobre `📅 Date` sur desktop).
    * Bouton `💬 Avis` masqué sur smartphone à la demande explicite de l'utilisateur (`.avis-sort-btn { display: none !important; }`), préservé sur PC desktop.
    * Tri chronologique dynamique opérationnel au clic.
  - **Centrage Intégral & Préservation Catégories** :
    * Éléments des rangées filtres (durée, étoiles, date de sortie) centrés (`justify-content: center`) sur mobile.
    * Ligne Filtre / Catégories conservée dans son comportement d'origine.
  - **Fiabilisation Immédiate Mode Amazon Prime Video PC** :
    * Déclaration globale `window.PRIME_CATALOG_DATA` dès le chargement de `data/prime_catalog.js`.
    * Invalidation totale du cache navigateur et PWA via bumping `v=8.98` dans `index.html` et `sw.js` (incluant `data/prime_catalog.js` dans `CORE_ASSETS`), affichant instantanément les 1 041 films et 489 séries sans résidu 0.

* **Bouton Complémentaire `[➕ Amazon]` sur PC Desktop (26/10/2026 - v8.98 - Règle 8 Exclusivité PC)** :
  - **Inclusion sans masquage des autres bouquets** : Le bouton `[➕ Amazon]` ajoute les 1 530 titres Prime Video au catalogue standard en conservant tous les autres bouquets actifs (Ciné+ OCS, Universal+, Action Max, Spécialisées).
  - **Dédoublonnage automatique & Puce bouquet `[prv]`** : Les œuvres multi-diffuseurs cumulent leurs logos réactifs et le filtre bouquet Amazon Prime Video (`prv`) devient consultable sans exclure le reste du catalogue.
  - **Alternance intelligente** : L'activation de `[➕ Amazon]` désactive le mode exclusif `[📦 Mode Amazon]`, et inversement.

* **Bouton de Tri Interactif par Étoiles `[⭐ Étoiles]` sur PC Desktop (26/10/2026 - v8.98 - Règle 8 Exclusivité PC)** :
  - **Tri en 3 états** : `⭐ Étoiles ↓` (Meilleures notes/étoiles 5 $\rightarrow$ 1), `⭐ Étoiles ↑` (Moins bonnes notes 1 $\rightarrow$ 5), `⭐ Étoiles` (Réinitialisation par défaut).
  - **Départage mathématique précis** : Trie d'abord par le nombre d'étoiles (1 à 5), puis départage par la note globale exacte sur 10 (`note_globale` / `note_avis`), les urgences d'expiration, et enfin l'année de sortie la plus récente.
  - **Exclusivité mutuelle avec Date et Avis** : Activer le tri par étoiles réinitialise automatiquement le tri par date et le tri par avis.
  - **Thème visuel & Sanctuarisation mobile** : Habillage doré satiné (`#facc15`), strictement réservé au grand écran PC Desktop ($\ge 1024\text{px}$) et totalement masqué sur portable (`display: none !important;`).

* **Sélecteur d'Affichage `Affichage : [1] [2]` sur PC Desktop (26/10/2026 - v8.99 - Règle 8 Exclusivité PC)** :
  - **Emplacement d'élite sur la même ligne** : Positionné immédiatement à gauche de la pastille du compteur « *x* titres affichés » dans l'en-tête de section (`.filter-stats`), sur un alignement horizontal strict (`display: flex; align-items: center; gap: 0.65rem;`).
  - **Design soigné & discret** :
    * Label textuel sobre `Affichage :` en typographie secondaire.
    * Deux boutons carrés compacts 28x28px (`[1]` et `[2]`), fond carte sombre (`var(--bg-card)`), bordure fine et transition au survol.
    * État actif rehaussé d'une lueur rouge néon (`var(--accent-red)` et ombre portée subtile).
  - **Modes de présentation (v9.11 - Extension Universelle Genre & Sous-genres)** :
    * **Bouton `[1]` sur « Tous les titres »** : Active la vue en 6 colonnes thématiques parallèles (Action/Horreur, Thriller, Sci-Fi, Comédie, Drame, Famille) avec leurs en-têtes et compteurs dédiés.
    * **Bouton `[1]` sur un Genre spécifique** : Active la vue découpée en colonnes indépendantes par **sous-genre** pour la catégorie active (ex: 2 colonnes pour Action, 4 pour Comédie, 3 pour Drame, etc.), chacune surmontée de son en-tête pilule avec icône, nom et compteur exact cliquable pour filtrer.
    * **Bouton `[2]`** : Active la grande grille classique unifiée continue (`.posters-grid`), regroupant tous les titres du filtre dans une mosaïque continue.
  - **Persistance locale** : Le choix est sauvegardé dans le `localStorage` (`cinescope_theme_columns`) et restitué automatiquement à chaque session.
  - **Visibilité contextuelle & Sanctuarisation Mobile (Règle 8)** :
    * Strictement masqué sur mobile et tablette (`display: none !important;`).
    * Visible sur PC sur « Tous les titres » et sur chaque genre, masqué uniquement lors d'une recherche textuelle ou d'un filtrage exclusif sur un sous-genre unique.

* **Tri par Défaut par Note Étoile, Bouton Expiration PC & Épuration Mobile (26/10/2026 - v9.00 - Règle 8 AGENTS.md)** :
  - **Tri par Défaut par Note Étoile (PC & Mobile)** : Le classement standard de l'application s'effectue désormais automatiquement par nombre d'étoiles décroissant (`5 ➔ 4 ➔ 3 ➔ 2 ➔ 1`), avec départage fin par note globale/critique exacte sur 10, urgences d'expiration, année la plus récente et tirage quotidien.
  - **Bouton de Tri `[⏳ Expiration]` sur PC Desktop** : Remplace l'ancien bouton de tri étoiles dans la barre de tri PC (`[📅 Date]` `[💬 Avis]` `[⏳ Expiration]`). Deux états actifs : `↓` (titres quittant bientôt le catalogue en premier) et `↑` (titres restant le plus longtemps d'abord).
  - **Épuration Ergonomique Mobile / Portable** :
    * Retrait complet de la ligne Date et de son séparateur sur smartphone.
    * Retrait complet de la pastille compteur de titres affichés (`.filter-stats`, `.stats-pill { display: none !important; }`), préservant uniquement le titre épuré de la catégorie.
    * Inversion des lignes filtres : ligne Étoiles positionnée en tête (`order: 1`), suivie du séparateur fin (`order: 2`), puis ligne Durée / Temps (`order: 3`), toutes deux harmonieusement centrées.

* **Éradication Totale des Documentaires & Hiérarchie de Tri Souveraine (26/10/2026 - v9.02 - Règles 7 & 8 AGENTS.md)** :
  - **Exclusion Universelle des Documentaires (`doc`)** :
    * Ajout de l'exclusion stricte du tag `doc` dans `processTitleNode` ([js/justwatch_engine.js](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js)) au même titre que la télé-réalité (`rly`).
    * **Purge immédiate des catalogues** : 132 documentaires supprimés du catalogue Amazon Prime Video (1 398 titres 100% fiction) et 91 documentaires supprimés du catalogue CinéScope de base (1 329 titres 100% fiction).
    * **Libération de Drame & Émotion** : Élimination définitive des 160 documentaires (faits divers, musique, sport, making-of) qui encombraient artificiellement la catégorie.
  - **Hiérarchie du Tri par Défaut (PC & Mobile)** :
    1. **1) Nouveautés d'abord** : Les œuvres arrivées récemment (`isItemNew`) sont mises en avant.
    2. **2) Date d'expiration** : Les œuvres quittant bientôt le catalogue (`getItemDaysLeft`, ordre d'urgence croissant) arrivent immédiatement ensuite.
    3. **3) Note d'étoiles** : Classement par nombre d'étoiles décroissant (`5 ⭐ ➔ 4 ⭐ ➔ 3 ⭐ ➔ 2 ⭐ ➔ 1 ⭐`), départagé par la note globale exacte, l'année la plus récente et le tirage quotidien.
  - **Barre de Tri PC Desktop** :
    * Suppression du bouton de tri Expiration.
    * Rétablissement du bouton **`[⭐ Étoiles]`** positionné immédiatement à gauche de Date (`[⭐ Étoiles]` `[📅 Date]` `[💬 Avis]`) avec thème doré satiné (`#facc15`).

* **Bouton `[🔄 Synchro Amazon]` & Retrait du Filtre Nouveautés (26/10/2026 - v9.03 - Règle 8 AGENTS.md)** :
  - **Remplacement direct** : Le bouton `[🆕 Nouveautés]` a été retiré de la Ligne 0B au profit du nouveau bouton dédié **`[🔄 Synchro Amazon]`**, positionné immédiatement à droite de `[➕ + Amazon]`.
  - **Fonctionnement miroir aux Spécialisées** :
    * Affiche l'icône tournante `🔄`, le libellé `Synchro Amazon` et la pastille de date de dernière mise à jour (`--/--` ou `JJ/MM`).
    * Au clic, lance la synchronisation du catalogue Prime Video (rechargement sans cache et interroge les ajouts récents), applique l'animation de rotation `spinSync` sur l'icône, enregistre l'horodatage dans le stockage local persistant (`cinescope_last_amazon_sync_v48`) et actualise l'UI en temps réel.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.03-streaming` et `?v=9.03` sur l'ensemble des scripts et styles.

* **Fusion Multi-Diffuseurs Amazon & Recalibrage Récence / Note Globale (27/10/2026 - v9.04 - Règles 7 & 8 AGENTS.md)** :
  - **Fusion Multi-Diffuseurs Réactifs (`getActiveCatalog`)** :
    * Correction de l'assemblage dans `js/app.js` lors de l'activation de `[➕ + Amazon]` : détection des œuvres communes au catalogue standard et à Prime Video (par ID et clé titre/année/type).
    * Cumul dynamique des diffuseurs dans `package_slugs` (`['auc', 'prv']`), des chaînes et des logos vectoriels HD officiels.
    * Affichage côte à côte des logos (Universal+ et Prime Video) sur la jaquette et dans la modale de fiche détail, avec compatibilité totale sur les filtres par bouquet individuels.
  - **Harmonisation Récence 20 ans glissants & Condition Éliminatoire Note Globale $\ge 6.0$** :
    * Recalcul déterministe universel de `note_recence` sur les 20 ans glissants ($2026 - 20 = 2006$, où 2006 vaut exactement 4.0/10).
    * Application stricte de la règle éliminatoire : toute œuvre dont la note globale recalculée $\frac{\text{note avis} + \text{note récence}}{2} < 6.0$ est écartée du catalogue.
    * 67 œuvres historiques aux notes recalculées $< 6.0$ (dont *OSS 117 : Le Caire*, *OSS 117 : Rio ne répond plus*, *Burn After Reading*, *MR 73*, etc.) éliminées, maintenant un catalogue de 1 263 œuvres 100% conformes et de haute qualité.
  - **Cache et PWA** : Mise à niveau globale vers `v9.04` (`sw.js` : `cinescope-v9.04-streaming` et `?v=9.04` sur `index.html`).

* **Intégration Permanente du Bouquet Amazon Prime & Logo Vectoriel Officiel HD (27/10/2026 - v9.05 - Règles 4 & 8 AGENTS.md)** :
  - **Affichage Permanent du Bouquet Amazon Prime en Ligne 0A** :
    * La puce `[Amazon Prime]` (`#pkgAmazon`, data-package="prv") est désormais affichée en permanence sur PC Desktop aux côtés de Ciné+ OCS, Universal+, Action Max, Sooner, Shadowz et Insomnia.
    * Le compteur dynamique affiche fidèlement le nombre de titres Prime Video disponibles pour le type de média sélectionné (945 films).
    * Au clic sur `[Amazon Prime]`, le catalogue charge et affiche instantanément les œuvres Prime Video. Le clic sur un autre bouquet désactive proprement le mode exclusif.
  - **Remplacement Officiel du Logo Prime Video par le Vectoriel Blanc HD** :
    * Nouveau fichier vectoriel SVG officiel pur ([`assets/logos/prime_video.svg`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/assets/logos/prime_video.svg)) extrait de la charte de référence et conforme rigoureusement à la capture d'écran de l'utilisateur (lettres *prime* blanches et flèche-sourire emblématique).
    * Rendu ultra-net à toute résolution, sans cartouche artificiel, parfaitement positionné sur les cartes et dans la pastille de bouquet.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.05-streaming` et `?v=9.05` sur l'ensemble des scripts et styles.

* **Harmonisation Neutre & Calibrage Optique de la Puce Amazon Prime (27/10/2026 - v9.06 - Règle 8 AGENTS.md)** :
  - **État Inactif Neutre Garanti** : Retrait des bordures et teintes cyan par défaut sur `.bouquet-btn-amazon` afin d'aligner rigoureusement sa sobriété visuelle sur l'ensemble des autres bouquets (`.bouquet-btn`). La surbrillance cyan satiné (`#00a8e1`) n'intervient désormais qu'au survol ou à l'état actif (`.active`).
  - **Calibrage Optique du Logo Prime** : Ajustement de `.bouquet-btn-amazon .pkg-logo-img` à `height: 13px; max-width: 28px;`, supprimant la disproportion visuelle dans la barre des bouquets pour un alignement millimétré avec les logos OCS, Universal+ et Action Max.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.06-streaming` et `?v=9.06` sur l'ensemble des scripts et styles.

* **Arbitrage Expert des Sous-Catégories par IA DeepSeek (27/10/2026 - v9.09 - Règles 1, 7 & 8 AGENTS.md)** :
  - **Qualification Sémantique Complète (2 586 œuvres arbitrées)** :
    * Création du script d'arbitrage automatisé [`scripts/classify_subcategories_deepseek.cjs`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/classify_subcategories_deepseek.cjs) interrogeant l'API `deepseek-chat` par lots de 10 titres.
    * Résolution des limites du balisage brut JustWatch : analyse approfondie des synopsis pour attribuer rigoureusement à chaque œuvre la sous-catégorie la plus juste tout en respectant strictement sa catégorie principale officielle.
    * **Distribution équilibrée et réaliste sur le catalogue CinéScope (1 263 œuvres)** :
      - *Action & Aventure* : Action (49), Aventure (17) (des films comme *Rogue* ou de grandes expéditions enfin qualifiés en Aventure).
      - *Horreur & Épouvante* : Angoisse (68), Surnaturel (79), Slasher (23), Monstres (21) (répartition spectaculaire débloquant les slashers et films de monstres/fantômes jusqu'ici piégés dans Angoisse).
      - *Drame & Émotion* : Social (204), Histoire (60), Romance (56).
      - *Thriller & Policier* : Policier (121), Thriller (68).
      - *Comédie* : Dramatique (109), Humour (77), Romantique (49), Musical (6).
      - *Science-fiction & Fantastique* : SF (92), Fantastique (59).
      - *Animation & Famille* : Animation (92), Famille (13).
  - **Registre Persistant Hors-Ligne & 0 Latence (`data/ai_subcategories_cache.js`)** :
    * Stockage de l'ensemble des 2 586 arbitrages dans `window.AI_SUBCATEGORIES_CACHE` (219 Ko).
    * Zéro appel API en direct sur le site : exécution 100% hors-ligne, zéro latence pour l'utilisateur, compatible Service Worker PWA.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.09-streaming` et `?v=9.09` sur l'ensemble des scripts et styles.

* **Affichage Permanent & Filtrage Indépendant des Sous-Catégories (27/10/2026 - v9.10 - Règles 1, 7 & 8 AGENTS.md)** :
  - **Émancipation Totale des 19 Sous-Catégories sur PC Desktop** :
    * La rangée de sous-catégories est désormais **affichée en permanence sur PC Desktop**, même lorsque l'utilisateur est sur *Tous les genres* (`activeCategory === 'all'`).
    * Les 19 sous-catégories sont présentées avec leur palette chromatique dédiée (bordure gauche et lueur subtile au survol).
    * Chaque puce affiche son compteur dynamique en temps réel calculé sur le mode actif (films/séries, bouquets).
  - **Filtrage Indépendant Direct en 1 Clic** :
    * Clic direct sur n'importe quelle sous-catégorie (ex: `Slasher`, `Aventure`, `Histoire`) : filtre instantanément le catalogue sans nécessiter de sélection préalable d'une catégorie mère.
    * Synchronisation visuelle harmonieuse avec la catégorie mère correspondante.
    * Titre dynamique de section actualisé avec précision (`Slasher (Films)`, `Aventure (Films)`, etc.).
  - **Sanctuaire Mobile Préservé (Règle 8)** :
    * La barre reste exclusivement visible sur PC ($\ge 1024\text{px}$) et masquée sur smartphone (`.subcategories-pc-only`) pour ne pas encombrer l'écran tactile.
* **Recalibration Sémantique Déterministe Policier vs Thriller (27/10/2026 - v9.12 - Règles 1 & 7 AGENTS.md)** :
  - **Affinement du Modèle de Qualification** :
    * Intégration du critère procédural (*1 épisode = 1 enquête résolue*) et du point de vue d'investigation pour *Policier* (forces de l'ordre, brigade criminelle, police scientifique, médecine légale).
    * Qualification en *Thriller* des intrigues feuilletonnantes criminelles continues, des cavales, machinations et jeux de dupes vécus du côté des témoins, fugitifs ou civils en sursis (*Cheyenne et Lola*, *Drive*, *Sneaky Pete*, *Jack Ryan*, *Bloodline*, *Sicario*).
    * Conservation formelle en *Policier* des séries et films procéduraux d'enquête pure (*Almost Paradise*, *Falco*, *Aurora Teagarden*, *Muzzle*, *Reacher*, etc.).
  - **Recalcul Automatique Global** : Ré-arbitrage de 457 œuvres de la sphère policière et criminelle via DeepSeek et mise à jour synchronisée de `data/ai_subcategories_cache.json` et `data/ai_subcategories_cache.js`.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.12-streaming` et `?v=9.12` sur l'ensemble des scripts et styles.

* **Correction du Harnais de Cache Client & Réhabilitation des Duels IA au Démarrage (27/10/2026 - v9.13 - Règles 1 & 7 AGENTS.md)** :
  - **Correction Chirurgicale de `loadCatalogFromCache()` ([`js/justwatch_engine.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
    * Correction de l'écrasement aveugle des catégories lors de la lecture du cache `localStorage`.
    * Intégration du contrôle prioritaire de duel IA (`resolveDuelEntry`) avec passage de `refreshed.id` et préservation absolue de `refreshed.categories` lorsqu'il est déjà qualifié dans `catalog.js`.
    * Réhabilitation immédiate du film ***Le Secret de Khéops*** (2025) en catégorie officielle `action_aventure` (avec sous-catégorie `Aventure`).
  - **Migration du Stockage Local Client (`_v48`)** : Clés de stockage synchronisées vers `cinescope_streaming_catalog_v48` avec purge automatique proactive des versions obsolètes.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.13-streaming` et `?v=9.13` sur l'ensemble des scripts et styles.

* **Souveraineté Déterministe Animation vs Famille (27/10/2026 - v9.14 - Règles 1 & 7 AGENTS.md)** :
  - **Critère Binaire Objectif Pur (Zéro Inférence IA)** :
    * Dans la catégorie `animation_famille`, le tag officiel `ani` sépare à 100% sans ambiguïté les œuvres d'animation graphique (`raw_genres.includes('ani')` ou `type === 'serie'` ➔ `Animation`) des films familiaux en prises de vue réelles avec de vrais acteurs humains (`!raw_genres.includes('ani')` ➔ `Famille`).
    * Règle appliquée avec priorité souveraine déterministe dans `computeSubCategory()` ([`js/justwatch_engine.js`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js)) et dans [`scripts/classify_subcategories_deepseek.cjs`](file:///home/cedric/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/classify_subcategories_deepseek.cjs).
  - **Correction des 10 Incohérences IA dans le Cache Persistant** :
    * Réhabilitation en `Famille` des films avec acteurs réels piégés par leur synopsis : *Jim Bouton & la cité des dragons*, *Master spy*, *L'Imperméable magique*, *Le brigand Briquambroque*, *La Formule magique*, *A.R.I.*, *L'étage secret*, *Ninja Turtles 2*.
    * Rétablissement en `Animation` des dessins animés purs : *Heidi et le lynx des montagnes*, *Les Aventures de the Chosen*.
  - **Cache et PWA** : Cache service worker mis à niveau vers `cinescope-v9.14-streaming` et `?v=9.14` sur l'ensemble des scripts et styles.

