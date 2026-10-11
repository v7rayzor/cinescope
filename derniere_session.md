# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.46** / Cache **v32**).

---

## 1. Architecture Globale & Flux de Données

### A. Bouquets SVOD & Diffuseurs Découpés (France)
1. **Bouquets SVOD Payants (Visibles sur PC & Mobile)** :
   * **Ciné+ OCS** (`aoc`) — 675 œuvres
   * **Universal+** (`auc`) — 155 œuvres
   * **Action Max** (`aca`) — 52 œuvres
   * **Sanctuarisation Payante Absolue** : si une œuvre est disponible sur un bouquet payant, le tag `mlt` et le logo Molotov sont **formellement bannis** (zéro double logo parasite sur les jaquettes payantes, ex: *La Lutte des classes*).
2. **Plateformes Gratuites & TNT Dissociées (Exclusivité PC Desktop — Règle 8)** :
   * **Règle Universelle Molotov ABO (`FLATRATE`)** : Toute œuvre non payante **DOIT impérativement posséder une offre dans la ligne ABO de Molotov (`FLATRATE`)** pour être admise. Cela garantit que 100% des œuvres sont immédiatement visionnables dans l'abonnement Molotov Extended.
   * **M6+** (`sxp`, alias `6pt`, `mms`) — 97 œuvres (replays réels M6, W9, 6ter & Gulli disponibles sur Molotov)
   * **TF1+** (`tf1`, alias `myt`) — 64 œuvres (replays réels TF1, TMC, TFX disponibles sur Molotov)
   * **France TV** (`fra`) — 34 œuvres (replays réels France 2, 3, 5 disponibles sur Molotov)
   * **Molotov Gratuit** (`mlt`) — 487 œuvres (catalogue AVOD Mango & chaînes FAST confirmées ABO)
   * **Sanctuarisation TNT & Règles Anti-Doublons** :
     - **Règle Anti-Doublon TNT** : Si une œuvre est diffusée sur une chaîne TNT (`tf1`, `sxp`, `fra`), le tag et le logo **Molotov Gratuit (`mlt`) sont formellement bannis** de la jaquette. L'œuvre arbore exclusivement son logo officiel de chaîne (ex: *Blade Runner 2049* n'a que le logo **M6+**).
     - **Suppression Définitive d'Arte (`art`) & Novo 19 (`nvn`)** : Vérification faite, ces chaînes ne proposent aucun replay VOD jouable sur Molotov (cul-de-sacs totaux). Leurs boutons et flux ont été formellement supprimés.
     - **ARTE VOD (`atb`) & TFOU MAX (`tfa`)** : Boutiques de location VOD payante et abonnements tiers formellement bannis.
     - **Canal+ (`cpd`, `cns`)** : Formellement exclu de la TNT.

### B. Synchronisation Hybride & Automatisation
* **Automatisation Serveur (GitHub Actions - `.github/workflows/update_catalog.yml`)** :
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js.
  - Couvre les 7 packages officiels ciblés (`aoc`, `aca`, `auc`, `mlt`, `tf1`, `sxp`, `fra`).
  - Filtre strictement les offres `['FLATRATE', 'FREE', 'ADS']` (exclusion native de tout `RENT` et `BUY`).
  - Nettoie, déduplique, qualifie et met à jour [`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js).
* **Client Web Résilient ([`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
  - Démarrage instantané sur le catalogue pré-embarqué `CATALOG_DATA`.
  - Rafraîchissement rapide quotidien calibré à **100 nouveautés fraîches** (2 pages de 50).
  - Rechargement client avec invalidation de cache (`?v=8.46`) et purge automatique des anciennes clés LocalStorage (`_v32`).

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
7. `animation_famille` : Animation jeunesse, aventures familiales Tout Public.

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
* **Zéro Bidouillage Ad Hoc (Règle 7 d'AGENTS.md)** :
  - Tout arbitrage repose sur des règles logiques universelles déterministes, garantissant une cohérence absolue pour l'ensemble du catalogue et les futurs flux.
* **Comédies & Signalétique d'Âge Majeure** :
  - Les œuvres `-16` et `-18` sont formellement interdites de `comedie` et sanctuarisées en `horreur_epouvante` ou `action_aventure`.
* **Animation & Signalétiques d'Avertissement** :
  - Toute œuvre `-12`, `-16` ou `-18` est formellement bannie d'`animation_famille` et réaffectée dans son genre d'intensité.
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
  - Sur smartphone / mobile (largeur $< 1024\text{px}$), toutes les œuvres Molotov Gratuit et TNT sont **strictement masquées en permanence**.
  - Le mobile conserve exclusivement les **878 œuvres SVOD payantes** (752 films, 126 séries) des 3 bouquets payants de référence (`aoc`, `auc`, `aca`).
  - Zéro pollution, zéro bouton gratuit/TNT visible sur mobile.

### B. Filtres Toggles & Fonctionnalités Desktop PC (Règle 8)
* **Barre des Bouquets PC** :
  - Bouquets payants : `[✨ Tous les bouquets]` `[Ciné+ OCS]` `[Action Max]` `[Universal+]`
  - Bouquets gratuits & TNT : `[Molotov Gratuit]` `[TF1+]` `[M6+]` `[France TV]` (Arte et Novo 19 supprimés)
* **Toggle « 📺 Hors Gratuit & TNT »** :
  - Masque instantanément toutes les œuvres gratuites/TNT, basculant en 1 clic sur le catalogue SVOD payant pur (878 œuvres).
* **Toggle « 🛡️ Hors Prime & TNT »** :
  - Exclut les offres incluses dans l'abonnement standard Amazon Prime Video (`prv`, `pva`) et les diffusions TNT / Replay.
* **Toggle « 🚫 Exclure sans S1 »** :
  - Masque les séries tronquées ne disposant pas de leur saison 1 sur les bouquets.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées PC** : **1 544** (1 286 films $\ge 60\text{ min}$, 258 séries).
  - **Total œuvres qualifiées Mobile** : **878** (752 films $\ge 60\text{ min}$, 126 séries).
  - **Conformité 1 catégorie unique** : **1 544 / 1 544 (100% conforme, 0 anomalie)**.
  - **Titres expirés** : **0**.
  - **Distribution des 7 catégories** :
    - `drame_emotion` : 538
    - `thriller_policier` : 346
    - `comedie` : 218
    - `horreur_epouvante` : 143
    - `scifi_fantastique` : 122
    - `animation_famille` : 92
    - `action_aventure` : 85
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.46` (`sw.js` : `cinescope-v8.46-streaming`, assets `?v=8.46`).
  - **Clés LocalStorage Actives** : `_v32` (`cinescope_streaming_catalog_v32`, etc.).
