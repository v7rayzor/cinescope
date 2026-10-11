# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.42** / Cache **v28**).

---

## 1. Architecture Globale & Flux de Données

### A. Bouquets SVOD & Plateformes Ciblées (France)
* **Ciné+ OCS** (`aoc`)
* **Universal+** (`auc`)
* **Action Max** (`aca`)
* **Molotov** (`mlt`) *(Intégration complète avec exclusivité PC selon la Règle 8)*

### B. Synchronisation Hybride & Automatisation
* **Automatisation Serveur (GitHub Actions - `.github/workflows/update_catalog.yml`)** :
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js (sans contrainte CORS).
  - Récupère le flux complet JustWatch GraphQL sur les 4 bouquets cibles (`aoc`, `aca`, `auc`, `mlt`).
  - Nettoie, déduplique, qualifie et met à jour [`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js).
* **Client Web Résilient ([`js/justwatch_engine.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/justwatch_engine.js))** :
  - Démarrage instantané sur le catalogue pré-embarqué `CATALOG_DATA`.
  - Rechargement client avec invalidation de cache (`?t=timestamp`) et recalcul en direct des jours restants (`daysLeft`).
  - Purge automatique proactive des anciennes versions de clés LocalStorage.

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
   - Rejet automatique dès l'ingestion de toute émission de télé-réalité / docu-soap (*Below Deck*, *The Real Housewives*, etc.).
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
  - Tout arbitrage repose sur des règles logiques universelles pérennes, applicables à tout le catalogue existant et aux futures synchronisations JustWatch.
* **Comédies & Signalétique d'Âge Majeure** :
  - Les œuvres avec pastilles adultes **`-16` et `-18`** sont **formellement interdites de `comedie`** et sanctuarisées en `horreur_epouvante` ou `action_aventure`.
  - Les pastilles `-10`, `-12` et Tout Public restent autorisées en `comedie` si le ton humoristique/burlesque domine (*Monster on a Plane*, *The Creeps*, *Benny t'aime très fort*).
* **Animation & Signalétiques d'Avertissement** :
  - Toute œuvre portant une pastille **`-12`, `-16` ou `-18` est formellement bannie d'`animation_famille`** et reclassée dans son genre d'intensité (`scifi_fantastique`, `action_aventure`, `drame_emotion`...).
* **Westerns vs Drames Historiques/Poétiques** :
  - Un western (`wsn`) n'est qualifié en `action_aventure` que s'il comporte le tag `act` ou des motifs de combat armé (`WESTERN_ACTION_PATTERNS`).
* **Horreur Pure, Slashers & Surnaturel / SF / Fantastique Universel** :
  - Les véritables intrigues d'horreur/possession/gore et les slashers (`SLASHER_PATTERNS` combiné au tag `hrr`) sont systématiquement sanctuarisés en **`horreur_epouvante`**.
  - **Motifs Surnaturels & Fantastiques Universels (`FANTASTIC_PATTERNS`)** : pour toute œuvre Tout Public ou avec tag `fnt`/`scf`, les motifs fantastiques et créatures surnaturelles (*sorcière, monstre, fantôme, créature, magie, force mystérieuse, malédiction...*) priment universellement sur les mots-clés policiers génériques (*détective, enquête*). Cela garantit l'attribution naturelle et exacte en **`scifi_fantastique`** pour les récits d'aventures surnaturelles (*Monster Summer*, *Chasseuse de géants*, *Le Règne animal*, *T.I.M.*).

---

## 3. Gestion des Séries Multi-Saisons & Fins de Droits

* **1 Seule Affiche par Série** :
  - Déduplication stricte par `item.id` et `${normTitle}_serie`.
  - Plage d'années consolidée `[Année début] - [Année fin]` calculée exclusivement sur les **saisons disponibles sur les bouquets actifs**.
  - Note d'avis calculée par moyenne des notes des saisons disponibles.
* **Sélecteur de Saisons Dynamique dans la Modale** :
  - Menu déroulant interactif listant chaque saison disponible avec actualisation de son année au changement.
* **Badges Visuels & Tri par Urgence d'Expiration** :
  - **Priorité 1 absolue** : Titres expirants triés par `daysLeft` croissant (`⏳ Expire aujourd'hui`, `⏳ Expire demain`, `⏳ Expire dans X j`, `📅 Jusqu'au JJ/MM`).
  - **Badge « 🆕 Nouveauté »** : Priorité visuelle sur l'affiche pendant les **7 premiers jours** d'arrivée au catalogue.
  - **Priorité 2** : Titres pérennes ordonnés par tirage aléatoire déterministe stable pour la journée.

---

## 4. Filtres UI & Ergonomie de Navigation

### A. Interface Mobile & Responsive
* **Sélecteur Déroulant Mobile « Filtre »** :
  - Sur mobile ($\le 768\text{px}$), le bouton déroulant arbore l'intitulé **« Filtre »** (plus incitatif, parlant et standardisé sur smartphone que l'ancien terme « Genre »), couplé au badge dynamique affichant la sélection active en temps réel (*Tous les titres*, *Action & Aventure*, etc.).
* **Sanctuarisation Mobile Stricte (Règle 8 AGENTS.md)** :
  - Sur smartphone, les œuvres issues purement de Molotov & TNT sont **formellement masquées en permanence** : le mobile conserve strictement les 876 œuvres des 3 bouquets payants de référence (Ciné+ OCS, Action Max, Universal+).
  - Les boutons spécifiques PC (`Molotov`, `Hors Molotov`) sont totalement invisibles sur mobile.

### B. Filtres Toggles & Fonctionnalités Desktop PC (Règle 8)
* **Barre de Recherche de Titres Dédiée** :
  - Intégrée au header (écrans $\ge 1024\text{px}$), recherche NFD insensible à la casse et aux accents, bouton d'effacement `✕`, raccourci touche `Échap`.
* **Bouton Bouquet « 📺 Molotov »** :
  - Intégré dans la rangée des bouquets sur PC pour filtrer en 1 clic l'ensemble des contenus disponibles sur Molotov (1 129 œuvres).
* **Toggle « 📺 Hors Molotov »** :
  - Masque instantanément toutes les œuvres issues uniquement de Molotov & de la TNT (771 œuvres), permettant de basculer en un clic sur le catalogue SVOD payant pur.
* **Toggle « 🛡️ Hors Prime & TNT »** :
  - Exclut les offres incluses dans l'abonnement standard Amazon Prime Video (`prv`, `pva`) et les diffusions TNT / Replay gratuit des diffuseurs hertziens nationaux officiels (`tf1`, `myt`, `sxp`, `6pt`, `art`, `fra`, `rmc`, `bfm`, `gum`).
  - **100% Déterministe & Pérenne** : Zéro liste manuelle de titres en dur (`KNOWN_TNT_PATTERNS` définitivement supprimé), et exclusion formelle des plateformes FAST / AVOD (Pluto TV, Rakuten TV, Plex qui ne sont pas de la TNT).
* **Toggle « 🚫 Exclure sans S1 »** :
  - Masque les séries tronquées ne disposant pas de leur saison 1 sur les bouquets (`⚠️ Débute SX` sur les cartes si inactif).

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées** : **1 647** (1 379 films $\ge 60\text{ min}$, 268 séries).
  - **Conformité 1 catégorie unique** : **1 647 / 1 647 (100% conforme, 0 anomalie)**.
  - **Titres expirés** : **0**.
  - **Distribution des 7 catégories** :
    - `drame_emotion` : 576
    - `thriller_policier` : 378
    - `comedie` : 231
    - `horreur_epouvante` : 153
    - `scifi_fantastique` : 126
    - `action_aventure` : 92
    - `animation_famille` : 91
  - **Répartition PC vs Mobile** :
    - Version Mobile : **876 œuvres SVOD payantes** (752 films, 124 séries) — 0 pollution Molotov/TNT.
    - Version PC : **1 647 œuvres totales** (dont 771 purement Molotov/TNT masquables via « Hors Molotov »).
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.42` (`sw.js` : `cinescope-v8.42-streaming`, assets `?v=8.42`).
  - **Clés LocalStorage Actives** : `_v28` (`cinescope_streaming_catalog_v28`, etc.).

