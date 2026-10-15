# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.58** / Cache **v39**).

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
7. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux.

### B. Règles d'Admission & Éligibilité au Catalogue
1. **Règle d'Or des Longs-Métrages (CNC)** :
   - Tout film ou téléfilm avec une durée $< 60\text{ min}$ est formellement exclu à l'ingestion (`runtime < 60`).
   - Les formats 26/45 min restent réservés à l'onglet **Séries**.
2. **Éradication Totale de la Télé-Réalité (`rly`)** :
   - Rejet automatique dès l'ingestion de toute émission de télé-réalité / docu-soap.
3. **Barème Sévère de Récence sur 20 Ans Glissants ($2006 = 4.0/10$)** :
   $$\text{minYear} = \text{Année Courante} - 20 = 2006$$
   $$\text{Note Récence} = 4.0 + \left( \frac{\min(\text{Année}, 2026) - 2006}{2026 - 2006} \right) \times 6.0$$
   - Année $\le 2005$ : Note récence $< 4.0 \implies$ **Élimination d'office**.
4. **Calcul de la Note Globale Consolidée** :
   - $\text{Note Avis} = \text{Moyenne critique / public (TMDb, IMDb, Allociné)}$ sur 10.
   - $\text{Note Globale} = \text{Math.round}\left(\frac{\text{Note Avis} + \text{Note Récence}}{2} \times 10\right) / 10$.
   - **Seuil d'éligibilité** : $\text{Note Globale} \ge 6.0 / 10$.

### C. Moteur de Catégorisation Purement Algorithmique (100% Déterministe)
* **Zéro Bidouillage Ad Hoc (Règle 7 d'AGENTS.md)** : Tout arbitrage repose sur des règles logiques universelles déterministes.
* **Règle Souveraine Animation & Pastilles d'Âge** :
  - **Pour l'Animation (`ani` ou motif textuel)** : Toute œuvre d'animation est souveraine et admise dans `animation_famille`, **peu importe la pastille d'âge** (Tout Public, -10, -12, -16 ou -18).
  - **Pour la Famille en Prises de Vue Réelles (`fml` sans `ani`)** : Tout badge (-10, -12, -16, -18) exclut l'œuvre d'`animation_famille` (qui exige un Tout Public strict en live action).
* **Comédies & Signalétique d'Âge Majeure** :
  - Les œuvres `-16` et `-18` sont formellement interdites de `comedie` et sanctuarisées en `horreur_epouvante` ou `action_aventure`.
* **Motifs Surnaturels & Fantastiques Universels (`FANTASTIC_PATTERNS` & `SCIFI_PATTERNS`)** :
  - Les créatures surnaturelles, motifs magiques et anomalies temporelles/prémonitions (*« fragments du futur »*, *« visions du futur »*, *« boucle temporelle »*) priment sur les mots-clés policiers génériques pour attribuer fidèlement `scifi_fantastique` (ex: requalification universelle de *Desde el mañana*).

---

## 3. Gestion des Séries Multi-Saisons & Fins de Droits

* **1 Seule Affiche par Série** :
  - Déduplication stricte par `item.id` et `${normTitle}_serie`.
  - Plage d'années consolidée `[Année début] - [Année fin]` calculée exclusivement sur les saisons disponibles.
  - Sélecteur dynamique interactif de saisons dans la modale.
* **Badges Visuels & Tri par Urgence** :
  - **Priorité 1 absolue** : Titres expirants triés par `daysLeft` croissant (`⏳ Expire aujourd'hui`, etc.).
  - **Badge « 🆕 Nouveauté »** : Priorité visuelle sur l'affiche pendant les 7 premiers jours d'arrivée.
  - **Priorité 2** : Titres pérennes ordonnés par tirage aléatoire déterministe stable pour la journée.

---

## 4. Filtres UI & Ergonomie de Navigation

### A. Interface Mobile & Responsive (Règle 8 AGENTS.md)
* **Sanctuarisation Mobile Stricte & Inviolable** :
  - **AUCUN changement d'interface sur mobile** : La barre complète des bouquets (`.bouquets-bar-section`) et ses séparateurs sont **strictement masqués en permanence** (`display: none !important` pour tout écran $< 1024\text{px}$).
  - **Périmètre du catalogue mobile** : Filtré strictement sur `isItemBasePaid(item)` qui n'admet **QUE Ciné+ OCS (`aoc`), Action Max (`aca`) et Universal+ (`auc`)**.
  - **Contenu visible** : Strictement les **864 œuvres SVOD payantes de base** (739 films, 125 séries).
  - **Fonctionnement identique en arrière-plan** : La synchronisation quotidienne des nouveautés s'exécute de façon transparente sans perturber l'ergonomie mobile.

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
  - **Titres expirés** : **0**.
  - **Nouveautés actives ($\le 7$ jours)** : 12.
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.58` (`sw.js` : `cinescope-v8.58-streaming`, assets `?v=8.58`).
  - **Clés LocalStorage Actives** : `_v39` (`cinescope_streaming_catalog_v39`, etc.).
  - **Optimisation** : Élimination de 490 œuvres parasites TNT/AVOD, épuration totale du header (suppression du bloc de statut/actualiser obsolète), perfectionnement universel des motifs temporels SF.
