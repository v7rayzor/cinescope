# Synthèse & État Actuel du Projet — CinéScope

Ce document constitue la référence vivante et synthétique de l'architecture, des règles métier, des algorithmes en vigueur et de l'état actif du catalogue **CinéScope** (Version active : **v8.37** / Cache **v24**).

---

## 1. Architecture Globale & Flux de Données

### A. Bouquets SVOD Officiels Ciblés (France)
* **Ciné+ OCS** (`aoc`)
* **Universal+** (`auc`)
* **Action Max** (`aca`)

### B. Synchronisation Hybride & Automatisation
* **Automatisation Serveur (GitHub Actions - `.github/workflows/update_catalog.yml`)** :
  - Exécution quotidienne planifiée à **06:00 UTC** via [`scripts/sync_justwatch.cjs`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/scripts/sync_justwatch.cjs) sous Node.js (sans contrainte CORS).
  - Récupère le flux complet JustWatch GraphQL (`availableFromTime`, saisons, scores, âges, tags, fins de droits).
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
* **Comédies & Signalétique d'Âge Majeure** :
  - Les œuvres avec pastilles adultes **`-16` et `-18`** sont **formellement interdites de `comedie`** et sanctuarisées en `horreur_epouvante` ou `action_aventure`.
  - Les pastilles `-10`, `-12` et Tout Public restent autorisées en `comedie` si le ton humoristique/burlesque domine.
* **Animation & Signalétiques d'Avertissement** :
  - Toute œuvre portant une pastille **`-12`, `-16` ou `-18` est formellement bannie d'`animation_famille`** et reclassée dans son genre d'intensité (`scifi_fantastique`, `action_aventure`, `drame_emotion`...).
* **Westerns vs Drames Historiques/Poétiques** :
  - Un western (`wsn`) n'est qualifié en `action_aventure` que s'il comporte le tag `act` ou des motifs de combat armé (`WESTERN_ACTION_PATTERNS` : *gâchette, hors-la-loi, shérif, fusillade, duel, chasseur de primes, cow-boy, braquage, attaque*).
  - Sans motifs d'action, les composantes dramatiques et historiques l'emportent naturellement en **`drame_emotion`** (*Le Mystérieux regard du flamant rose*).
* **Horreur Pure & Slashers Sanctuarisés** :
  - Les véritables intrigues d'horreur/possession/gore et les slashers avec tueur masqué ou meurtrier sanguinaire (`SLASHER_PATTERNS` combiné au tag `hrr`, ex: *Un Noël sans fin*, *Blood Star*, *Maniac*) sont systématiquement sanctuarisés en **`horreur_epouvante`** sans dériver vers le polar ou la comédie.
  - Les hybrides Tout Public sans composante horrifique lourde sont ventilés en `scifi_fantastique` (*Monster Summer*, *T.I.M.*) ou `comedie` (*Monster on a Plane*, *Benny t'aime très fort*).

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
  - **Priorité 2** : Titres pérennes (sans expiration) ordonnés par affinité profil (si actif) puis tirage aléatoire déterministe stable pour la journée.

---

## 4. Filtres UI & Moteurs de Recommandations PC

### A. Filtres Exclusifs Desktop PC
* **Barre de Recherche de Titres Dédiée** :
  - Intégrée au header (écrans $\ge 1024\text{px}$), recherche NFD insensible à la casse et aux accents, bouton d'effacement `✕`, raccourci touche `Échap`.
* **Toggle « 🛡️ Hors Prime & TNT »** :
  - Exclut les offres incluses dans l'abonnement standard Amazon Prime Video (`prv`, `pva`) et les diffusions TNT / Replay gratuit (`fpt`, `tf1`, `6pt`, `art`, `rmc`...).
* **Toggle « 🚫 Exclure sans S1 »** :
  - Masque les séries tronquées ne disposant pas de leur saison 1 sur les bouquets.
  - Lorsque le filtre est inactif, un badge vectoriel net `⚠️ Débute SX` apparaît sur la carte des séries concernées.

### B. Moteur de Recommandations par Profils ([`profils_amis.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/profils_amis.md))
* **`🧙‍♂️ Pour Moi`** :
  - Mystère temporel, imaginaire/fantastique riche sans kitsch, paranormal feutré & horreur paranormale/possession (*Timeless*, *Resident Alien*, *Chambre 1408*, *Desde el mañana*, *Midnight, Texas*, *Wild Cards*, *Aspergirl*, *Anomalia*, *The Spiderwick Chronicles*).
  - 0 boucherie militaire/torture porn, 0 panique de masse/hécatombe, 0 narration déconstruite/allers-retours confus, 0 série d'animation.
* **`👤 Ami`** :
  - Action physique 1er degré strict, survie face à des monstres (*30 jours de nuit*, *Cloverfield*), horreur de possession/hantise (*Chambre 1408*, *Paranormal Activity*, *Annabelle*, *Black Phone*), anticipation et techno-thrillers (*The Copenhagen Test*, *Arcadia*, *Orphan Black: Echoes*, *Almost Paradise*, *Revival*, *30 jours max*).
  - Règle mathématique : **$\% \text{ Action} \ge 11\%$** sur Polars/Comédies, 0 animation, exclusions strictes Prime/TNT.
* **`👩 Amie`** :
  - Cérébral, matière grise, enquêtes posées, duos complices esprit *Castle* (*Family Law*, *Wild Cards*, *Grace*, *Toronto: Section Criminelle*, *Bull*) et drames/romances émouvants.
  - Règle mathématique : **$\% \text{ Action} \le 33\%$**, 0 comédie potache/farce, 0 animation, 0 gore, exclusions Prime/TNT.
* **`👫 Duo Amis`** :
  - Intersection mathématique stricte ($11\% \le \% \text{ Action} \le 33\%$), score moyen combiné $\ge 50\%$, genres partagés `thriller_policier` et `scifi_fantastique`.

---

## 5. État Actuel du Catalogue & Versions Déployées

* **Audit de Conformité Catalogue ([`js/catalog.js`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/js/catalog.js))** :
  - **Total œuvres qualifiées** : **878** (754 films $\ge 60\text{ min}$, 124 séries).
  - **Conformité 1 catégorie unique** : **878 / 878 (100% conforme, 0 anomalie)**.
  - **Titres expirés** : **0**.
  - **Distribution des 7 catégories** :
    - `drame_emotion` : 328
    - `thriller_policier` : 164
    - `comedie` : 142
    - `animation_famille` : 74
    - `scifi_fantastique` : 72
    - `action_aventure` : 51
    - `horreur_epouvante` : 47
* **Traçabilité Technique & Cache** :
  - **Version Application / PWA** : `v8.37` (`sw.js` : `cinescope-v8.37-streaming`, assets `?v=8.37`).
  - **Clés LocalStorage Actives** : `_v24` (`cinescope_streaming_catalog_v24`, etc.).
