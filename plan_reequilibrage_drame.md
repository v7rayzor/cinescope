# Plan d'Action : Rééquilibrage Drame, Comédie & Thriller
> **Fiche Opérationnelle pour la Prochaine Session**  
> **Auteurs :** cvand & Antigravity  
> **Date :** 15 octobre 2026  
> **Version cible :** v8.64

---

## 1. Objectifs & Constat Initial

Suite au signalement de l'utilisateur sur la surreprésentation du Drame (ex: *Resident Alien* classé en Drame au lieu de Comédie, *Orphan Black: Echoes* classé en Drame au lieu de Thriller), un double audit a été réalisé sur le catalogue (1 424 œuvres) :
1. **Sous-genre SF** : 46 œuvres sur 103 (45%) sont captées par le Drame.
2. **Genre Principal** : 487 œuvres sur 1 424 (34,2%) sont classées en Drame, dont des comédies populaires évidentes et des thrillers de haute tension.

---

## 2. Analyse Technique des Causes Racines

### Cause A : Sous-genre SF (`computeScifiSubCategory`)
1. **Suppression aveugle du tag Comédie** :
   - Le code filtrait le tag `cmy` des œuvres hybrides dès lors qu'il existait un tag sérieux (`drm`, `trl`, `crm`) sans mot-clé réducteur (*« burlesque »*, *« gag »*, *« hilarant »*) dans le synopsis.
   - *Resident Alien*, *Generation Z*, *Vampire humaniste* perdaient leur tag `cmy` et atterrissaient en Drame.
2. **Surpondération historique du Drame** :
   - En présence de `drm` (35 pts) et `trl` (35 pts), un bonus automatique de **+30 points** était octroyé au Drame sans motif intime avéré.
   - *Orphan Black: Echoes*, *Rubikon*, *Contagion* étaient aspirés par le Drame.
3. **Fallback par défaut défaillant** :
   - Pour les thrillers spatiaux purs comme *Mission Titan* ou *The Artifice Girl* (ayant uniquement `trl` et `scf`), le moteur attribuait des points à la catégorie SF. N'étant pas un sous-genre valide, la fonction appliquait son repli de secours : `return 'drame_emotion'`.

### Cause B : Genre Principal (`getAllowedCategories` & `computeCategory`)
1. **Verrou d'âge excessif sur la Comédie** :
   - La règle `isHybridWithAge` interdisait formellement la Comédie dès lors qu'une œuvre hybride possédait une simple signalétique **-10 ou -12**.
   - Or, en France, les comédies populaires ou satiriques (ados, comédies romantiques, comédies absurdes) reçoivent très fréquemment une pastille -10 ou -12 (juron, scène de nu légère, alcool).
   - Des films comme *Crazy, Stupid, Love* (badge 12), *LOL* (badge 12), *Starbuck*, *Happiness Therapy*, *Swiss Army Man* (badge 12), *Bridget Jones* ou la série *Irresponsable* (badge 10) étaient ainsi expulsés de la Comédie au profit du Drame.
2. **Thrillers de haute tension masqués par un tag Drame** :
   - Des films de pure tension, de machination ou d'angoisse (*5 septembre*, *L'Origine du mal*, *Homejacking*, *The Girl in the Pool*) se faisaient écraser par le bonus Drame automatique.

---

## 3. Règles d'Arbitrage Universelles (Règle 7 d'AGENTS.md)

### Règle Universelle 1 : Sous-genre SF équitable
- **Égalité stricte des 4 sous-genres** (`action_aventure`, `thriller_policier`, `comedie`, `drame_emotion`).
- Le tag `cmy` n'est plus filtré arbitrairement dans la SF.
- Le tag `trl` ou `crm` prime sur le tag `drm` standard pour la SF, à moins d'un motif dramatique intime explicite (`DRAMA_INTIME_PATTERNS` ou `rma`).
- Élimination du fallback aveugle sur le Drame.

### Règle Universelle 2 : Genre Principal — Assouplissement du verrou d'âge Comédie
- Les signalétiques de simple avertissement **-10 et -12 n'interdisent plus la catégorie Comédie**.
- Seules les signalétiques d'interdiction formelle aux mineurs (**-16 et -18**) excluent la comédie hybride au profit de l'Horreur ou du Drame.
- Réhabilitation immédiate des comédies populaires en `comedie`.

### Règle Universelle 3 : Genre Principal — Sanctuarisation du Thriller
- Si une œuvre possède `trl` et `drm` :
  - Si le synopsis relève de la tension, du complot, de la prise d'otages, de la traque ou du suspense policier (`POLICE_CRIME_PATTERNS` ou `THRILLER_TENSION_PATTERNS`), l'œuvre va en **`thriller_policier`**.
  - Si le synopsis relève du drame intime, du deuil, de la maladie ou d'une fresque d'auteur (*Lost in Translation*, *Mektoub My Love*, *Dark Waters*, *Tom à la ferme*, *La Mesías*, *Inland Empire*), elle reste sanctuarisée en **`drame_emotion`**.

---

## 4. Résultats Simuels & Équilibre Projeté

### Sous-genre SF (103 œuvres SF) :
* 🏹 **Action & Aventure** : **34** *(39 auparavant)*
* 🔍 **Thriller & Policier** : **23** *(11 auparavant, +12 dont Orphan Black, Rubikon, Mission Titan, Childhood's End)*
* 🎭 **Comédie** : **22** *(7 auparavant, +15 dont Resident Alien, Generation Z, SOS Fantômes, Vampire humaniste)*
* ❤️ **Drame & Émotion** : **24** *(46 auparavant, recentré sur les vrais drames SF : The Lobster, Megalopolis, Arcadia, The Ark)*

### Genre Principal (1 424 œuvres) :
* **drame_emotion** : **439** (30,8%) *(487 auparavant)*
* **comedie** : **244** (17,1%) *(208 auparavant, +36 comédies réhabilitées)*
* **thriller_policier** : **244** (17,1%) *(232 auparavant, +12 thrillers de tension réhabilités)*
* **horreur_epouvante** : **221** (15,5%) *(Intact)*
* **scifi_fantastique** : **103** (7,2%) *(Intact)*
* **animation_famille** : **110** (7,7%) *(Intact)*
* **action_aventure** : **63** (4,4%) *(Intact)*

---

## 5. Feuille de Route d'Exécution (Démarrage Immédiat Demain)

1. **Édition de `js/justwatch_engine.js`** :
   - Ajuster `getAllowedCategories` et `isHybridWithAge` (-10/-12 autorisés en comédie).
   - Ajuster `computeCategory` pour départager sainement `trl` et `drm`.
   - Réécrire `computeScifiSubCategory` avec le calcul à 4 branches équitables.
2. **Édition de `js/catalog.js`** :
   - Mettre à jour les catégories officielles des œuvres concernées avec stricte conformité (1 œuvre = 1 catégorie unique).
3. **Contrôle & Validation** :
   - Lancer `node scripts/verify_compliance.cjs` (100% de conformité exigée, 0 anomalie).
   - Vérifier le bon affichage de la barre de sous-genres SF (*Resident Alien* en Comédie, *Orphan Black* en Thriller).
4. **Livraison & Cache** :
   - Passer la version en `v8.64` / Cache `v43` dans `sw.js` et `index.html`.
   - Mettre à jour `derniere_session.md`.
   - Commit & Push sur GitHub (`origin main`).
