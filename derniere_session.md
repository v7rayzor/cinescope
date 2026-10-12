# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.52** / Cache **v37**).

---

## 1. Architecture Globale & Flux de Données

### A. Bouquets SVOD & Diffuseurs Découpés (France)
1. **Bouquets SVOD Payants de Référence (Visibles sur PC & Mobile)** :
   * **Ciné+ OCS** (`aoc`) — 671 œuvres (625 films, 46 séries)
   * **Universal+** (`auc`) — 155 œuvres (76 films, 79 séries)
   * **Action Max** (`aca`) — 51 œuvres (50 films, 1 série)
   * **Total Mobile / Portable** : **873 œuvres SVOD payantes de base** (747 films $\ge 60\text{ min}$, 126 séries).
2. **Chaînes SVOD Spécialisées (Exclusivité PC Desktop — Règle 8)** :
   * **Sooner** (`snr`) — 367 œuvres (347 films, 20 séries — cinéma d'auteur, drames, thrillers d'auteur)
   * **Shadowz** (`sdz`, alias `sza`) — 181 œuvres (181 films — cinéma de genre, horreur, gore, fantastique)
   * **Insomnia** (`ima`) — 37 œuvres (34 films, 3 séries — frisson et épouvante)
   * Logos officiels HD configurés dans `assets/logos/sooner.png`, `assets/logos/shadowz.png`, `assets/logos/insomnia.png`.
3. **Plateformes Gratuites & TNT Dissociées (Exclusivité PC Desktop — Règle 8)** :
   * **Règle Universelle Molotov ABO (`FLATRATE`)** : Toute œuvre non payante **DOIT impérativement posséder une offre dans la ligne ABO de Molotov (`FLATRATE`)** pour être admise.
   * **M6+** (`sxp`, alias `6pt`, `mms`) — 95 œuvres (replays réels M6, W9, 6ter & Gulli confirmés ABO)
   * **TF1+** (`tf1`, alias `myt`) — 61 œuvres (replays réels TF1, TMC, TFX confirmés ABO)
   * **France TV** (`fra`) — 30 œuvres (replays réels France 2, 3, 5 confirmés ABO, logo officiel `france.tv` purifié)
   * **Molotov Gratuit** (`mlt`) — 308 œuvres (catalogue AVOD Mango & chaînes FAST confirmées ABO)
   * **Règle Anti-Doublon TNT** : Si une œuvre est diffusée sur une chaîne TNT (`tf1`, `sxp`, `fra`), le tag et le logo **Molotov Gratuit (`mlt`) sont formellement bannis** de la jaquette. L'œuvre arbore exclusivement son logo officiel de chaîne.

### B. Moteur Dynamique des Logos Réactifs
* **Affichage Réactif selon les Filtres Actifs (`getActiveItemPackages`)** :
  - Sur chaque jaquette (et dans la modale), seuls les logos des diffuseurs qui correspondent **aux filtres actuellement actifs** pour l'utilisateur sont affichés en temps réel.
  - **Dans « Tous les bouquets »** :
    - Les diffuseurs payants de référence (OCS, Action Max, Universal+) sont toujours actifs.
    - Tout diffuseur TNT est masqué si le toggle `+ Gratuit & TNT` est éteint (ou si `Hors Prime & TNT` est actif).
    - Tout diffuseur spécialisé est masqué si le toggle `+ Spécialisées` est éteint.
  - **Sur une puce de bouquet spécifique** (ex: clic sur `[Universal+]` ou `[M6+]`) :
    - La jaquette n'affiche **strictement que le logo du bouquet sélectionné**.
  - **Conservation multi-diffuseurs dans le catalogue** : Une œuvre disponible à la fois sur Universal+ et M6+ conserve tous ses diffuseurs réels dans `package_slugs`, sans aucun parasitage visuel.

### C. Synchronisation Hybride & Automatisation
* **Automatisation Serveur (GitHub Actions - `.github/workflows/update_catalog.yml`)** :
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js.
  - Couvre les 10 packages officiels ciblés (`aoc`, `aca`, `auc`, `snr`, `sdz`, `ima`, `mlt`, `tf1`, `sxp`, `fra`).
  - Filtre strictement les offres `['FLATRATE', 'FREE', 'ADS']` (exclusion native de tout `RENT` et `BUY`).
  - Nettoie, déduplique, qualifie et met à jour [`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js).
* **Client Web Résilient ([`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
  - Démarrage instantané sur le catalogue pré-embarqué `CATALOG_DATA`.
  - Rafraîchissement rapide quotidien calibré à **100 nouveautés fraîches** (2 pages de 50).
  - Rechargement client avec invalidation de cache (`?v=8.52`) et purge automatique des anciennes clés LocalStorage (`_v37`).

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
* **Motifs Surnaturels & Fantastiques Universels (`FANTASTIC_PATTERNS`)** :
  - Les créatures surnaturelles et motifs magiques priment sur les mots-clés policiers génériques pour attribuer fidèlement `scifi_fantastique`.

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
  - **AUCUNE ligne de bouquets sur mobile** : La barre complète des bouquets (`.bouquets-bar-section`) et ses séparateurs (`.bouquets-divider-line`) sont **strictement masqués en permanence** (`display: none !important` pour tout écran $< 1024\text{px}$).
  - **Périmètre du catalogue mobile** : Filtré strictement sur `isItemBasePaid(item)` qui n'admet **QUE Ciné+ OCS (`aoc`), Action Max (`aca`) et Universal+ (`auc`)**.
  - **Contenu visible** : Strictement les **873 œuvres SVOD payantes de base** (747 films, 126 séries).
  - **Zéro pollution & Ergonomie Découvrable Déployée** : Zéro chaîne spécialisée, zéro TNT/Gratuit, interface 100% épurée avec ruban tactile horizontal des 8 catégories défilant du bout du doigt (remplace le menu déroulant fermé par un ruban natif fluide auto-centré pour une découverte immédiate et naturelle) + Étoiles/Durée + Affiches.

### B. Organisation Multi-Lignes des Bouquets & Filtres sur Desktop (PC $\ge 1024\text{px}$)
* **Ligne 0A (Ligne 1) : Bouquets SVOD Payants & Spécialisés** :
  `[✨ Tous les bouquets]` `[Ciné+ OCS]` `[Action Max]` `[Universal+]` `[Sooner]` `[Shadowz]` `[Insomnia]`
* **Ligne 0A-bis (Ligne 2) : Bouquets Gratuits & TNT** :
  `[Molotov Gratuit]` `[TF1+]` `[M6+]` `[France TV]` (regroupés proprement sur leur rangée dédiée sans saut de ligne anarchique).
* **Ligne 0B (Ligne 3) : Toggles d'Inclusion (+) et Filtres d'Exclusion (-)** :
  1. `[📺 + Gratuit & TNT]` (+) : Inactif par défaut. Un clic ajoute les 478 œuvres TNT/Molotov.
  2. `[🎬 + Spécialisées]` (+) : Inactif par défaut. Un clic ajoute les 559 œuvres Sooner, Shadowz, Insomnia.
  3. `[🛡️ Hors Prime & TNT]` (-) : Exclut les œuvres Prime Video standard et diffusions TNT.
  4. `[🚫 Exclure sans S1]` (-) : Masque les séries tronquées sans saison 1.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 910** (1 631 films $\ge 60\text{ min}$, 279 séries).
  - **Total œuvres qualifiées Mobile** : **873** (747 films $\ge 60\text{ min}$, 126 séries — STRICTEMENT Ciné+ OCS, Action Max, Universal+).
  - **Conformité 1 catégorie unique** : **1 910 / 1 910 (100% conforme, 0 anomalie)**.
  - **Titres expirés** : **0**.
  - **Distribution des 7 catégories** :
    - `drame_emotion` : 673
    - `thriller_policier` : 403
    - `comedie` : 257
    - `horreur_epouvante` : 223
    - `scifi_fantastique` : 138
    - `animation_famille` : 126
    - `action_aventure` : 90
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.52` (`sw.js` : `cinescope-v8.52-streaming`, assets `?v=8.52`).
  - **Clés LocalStorage Actives** : `_v37` (`cinescope_streaming_catalog_v37`, etc.).
