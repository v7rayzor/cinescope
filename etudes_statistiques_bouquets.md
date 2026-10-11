# Études Statistiques des Bouquets SVOD & Molotov — CinéScope

> **Date de référence des données : 11 octobre 2026**  
> **Source :** API GraphQL JustWatch France (flux temps réel)  
> **Critères d'admission CinéScope appliqués :** Durée film $\ge 60\text{ min}$, Récence $\ge 2006$ ($\text{Note Récence} \ge 4.0/10$), $\text{Note Avis} \ge 4.0/10$, $\text{Note Globale} \ge 6.0/10$, 0 télé-réalité (`rly`).

---

## 📅 Règle d'Utilisation en Session
Lorsque l'utilisateur demande des chiffres sur ces bouquets, l'agent doit :
1. Rappeler immédiatement la date de référence de l'étude (**11 octobre 2026**).
2. Présenter les chiffres enregistrés ci-dessous.
3. Demander systématiquement à l'utilisateur s'il souhaite les actualiser en direct via l'API JustWatch.

---

## 1. Étude d'Intégration : Sooner, Shadowz & Insomnia

### A. Taux d'Exclusivité & Recoupements Croisés
* **Catalogue CinéScope Actuel :** 883 œuvres qualifiées (Ciné+ OCS, Universal+, Action Max).
* **Sooner (`snr`) :** 391 œuvres éligibles (40,5% d'admission sur 966 bruts).
  * 25 doublons avec CinéScope actuel (6,4%).
  * 24 doublons avec Shadowz (6,1%).
  * 1 doublon avec Insomnia (*The Jane Doe Identity* - 0,3%).
  * **87,2 % d'exclusivités absolues** (341 œuvres uniques).
* **Shadowz (`sdz`, `sza`) :** 188 œuvres éligibles (46,1% d'admission sur 408 bruts).
  * 28 doublons avec CinéScope/Sooner (14,9%, dont 24 avec Sooner et 4 avec Ciné+ OCS).
  * 1 doublon avec Insomnia (*Insidious* - 0,5%).
  * **85,1 % d'exclusivités absolues** (160 œuvres uniques).
* **Insomnia (`ima`) :** 38 œuvres éligibles (52,8% d'admission sur 72 bruts).
  * 2 doublons avec CinéScope/Sooner (*Blood*, *Jane Doe* - 5,3%).
  * 1 doublon avec Shadowz (*Insidious* - 2,6%).
  * **92,1 % d'exclusivités absolues** (35 œuvres uniques, dont 3 séries d'horreur).

---

### B. Détail par Chaîne (Films vs Séries)

#### 1. Sooner (`snr`) — 391 œuvres (371 films, 20 séries)
* **Films (371)** :
  * `drame_emotion` : 187 | `comedie` : 52 | `thriller_policier` : 51 | `animation_famille` : 30 | `horreur_epouvante` : 26 | `scifi_fantastique` : 20 | `action_aventure` : 5
  * ⭐⭐⭐ (3★) : 132 | ⭐⭐⭐⭐ (4★) : 186 | ⭐⭐⭐⭐⭐ (5★) : 53
* **Séries (20)** :
  * `drame_emotion` : 11 | `thriller_policier` : 7 | `comedie` : 1 | `action_aventure` : 1 | (0 SF, 0 Horreur, 0 Animation)
  * ⭐⭐⭐ (3★) : 0 | ⭐⭐⭐⭐ (4★) : 10 | ⭐⭐⭐⭐⭐ (5★) : 10 *(100% de 4★ et 5★)*

#### 2. Shadowz (`sdz` / `sza`) — 188 œuvres (188 films, 0 série)
* **Films (188)** :
  * `horreur_epouvante` : 104 | `thriller_policier` : 29 | `comedie` : 23 | `scifi_fantastique` : 15 | `drame_emotion` : 12 | `animation_famille` : 3 | `action_aventure` : 2
  * ⭐⭐⭐ (3★) : 47 | ⭐⭐⭐⭐ (4★) : 123 | ⭐⭐⭐⭐⭐ (5★) : 18

#### 3. Insomnia (`ima`) — 38 œuvres (35 films, 3 séries)
* **Films (35)** :
  * `horreur_epouvante` : 25 | `thriller_policier` : 4 | `comedie` : 3 | `scifi_fantastique` : 3 | (0 Drame, 0 Action, 0 Animation)
  * ⭐⭐⭐ (3★) : 17 | ⭐⭐⭐⭐ (4★) : 16 | ⭐⭐⭐⭐⭐ (5★) : 2
* **Séries (3)** :
  * `horreur_epouvante` : 3 (*Creepshow*, *The Guest*, *Priest*)
  * ⭐⭐⭐⭐ (4★) : 3 (100%)

---

### C. Apport NET & Évolution du Catalogue Global (883 $\to$ 1 443 œuvres, +63,4%)

* **Nouveautés nettes dédupliquées :** **+560 œuvres** (+537 films, +23 séries).

#### 1. Évolution par Paliers d'Étoiles
* ⭐⭐⭐ (3★) : 347 $\to$ 521 (**+174**, **+50,1 %**)
* ⭐⭐⭐⭐ (4★) : 339 $\to$ 647 (**+308**, **+90,9 %** 🔥)
* ⭐⭐⭐⭐⭐ (5★) : 197 $\to$ 275 (**+78**, **+39,6 %**)

#### 2. Évolution par Catégorie
| Catégorie | Actuel | Ajout Net | Final | Évolution (%) |
| :--- | :---: | :---: | :---: | :---: |
| 🩸 `horreur_epouvante` | 45 | +128 | **173** | **+284,4 %** 🚀 |
| 🎭 `drame_emotion` | 328 | +203 | **531** | **+61,9 %** |
| 🔍 `thriller_policier` | 162 | +86 | **248** | **+53,1 %** |
| 😂 `comedie` | 147 | +75 | **222** | **+51,0 %** |
| 🚀 `scifi_fantastique` | 75 | +34 | **109** | **+45,3 %** |
| 🧸 `animation_famille` | 76 | +28 | **104** | **+36,8 %** |
| 💥 `action_aventure` | 50 | +6 | **56** | **+12,0 %** |

---

### D. Évolution avec le Filtre « Hors Prime & TNT » (683 $\to$ 1 178 œuvres, +72,5%)

* **Nouveautés nettes Hors Prime/TNT :** **+495 œuvres** (348 Sooner, 170 Shadowz, 31 Insomnia, dédupliquées).
* ⭐⭐⭐ (3★) : 235 $\to$ 374 (**+139**, **+59,1 %**)
* ⭐⭐⭐⭐ (4★) : 265 $\to$ 545 (**+280**, **+105,7 %** 🔥)
* ⭐⭐⭐⭐⭐ (5★) : 183 $\to$ 259 (**+76**, **+41,5 %**)
* **Horreur Pure Hors Prime/TNT :** 28 $\to$ 140 œuvres (**+400,0 %** — multiplié par 5).

---

## 2. Étude du « Molotov Résiduel » (Sans Exclure Prime Video)

### A. Clarification sur le tag « Molotov TV » (`mlt`)
Sur JustWatch, `mlt` est une étiquette globale qui regroupe tout ce qui passe sur l'application Molotov (TNT gratuite, replay, AVOD Mango, et bouquets payants OCS, Action, Universal+...). 

### B. Périmètre de l'Isolement Strict
* **Exclusions appliquées :**
  * Ciné+ OCS (`aoc`), Universal+ (`auc`), Action Max (`aca`).
  * Sooner (`snr`, `rac`), Shadowz (`sdz`, `sza`), Insomnia (`ima`).
  * TNT gratuite & Replay (TF1+, M6+, France TV, Arte, Pluto TV, Rakuten...).
* **Conservation explicite :** Prime Video (`prv`, `pva`) est **conservé** (car Molotov n'a aucun lien avec Prime Video, et Prime Video est un abonnement payant indépendant).

### C. Bilan Chiffré : 117 Œuvres Éligibles Restantes

Sur les 1 960 titres récents analysés sur Molotov TV, **117 œuvres éligibles** subsistent sur le réseau des chaînes de Molotov (hors bouquets cibles et hors TNT gratuite).

#### 1. Répartition Films (92 films) & Séries (25 séries)
* **Films (92)** :
  * `drame_emotion` : 39 | `thriller_policier` : 21 | `horreur_epouvante` : 10 | `action_aventure` : 9 | `comedie` : 7 | `scifi_fantastique` : 5 | `animation_famille` : 1
  * ⭐⭐⭐ (3★) : 48 | ⭐⭐⭐⭐ (4★) : 40 | ⭐⭐⭐⭐⭐ (5★) : 4
* **Séries (25)** :
  * `drame_emotion` : 7 | `thriller_policier` : 7 | `scifi_fantastique` : 6 | `animation_famille` : 3 | `horreur_epouvante` : 1 (*Supernatural*) | `comedie` : 1 (*En Famille*)
  * ⭐⭐⭐ (3★) : 6 | ⭐⭐⭐⭐ (4★) : 8 | ⭐⭐⭐⭐⭐ (5★) : 11

#### 2. Total Cumulé (117 œuvres)
| Catégorie | Volume Total | ⭐⭐⭐ (3★) | ⭐⭐⭐⭐ (4★) | ⭐⭐⭐⭐⭐ (5★) |
| :--- | :---: | :---: | :---: | :---: |
| `drame_emotion` | **46** | 18 | 25 | 3 |
| `thriller_policier` | **28** | 13 | 11 | 4 |
| `scifi_fantastique` | **11** | 5 | 2 | 4 |
| `horreur_epouvante` | **11** | 8 | 3 | 0 |
| `action_aventure` | **9** | 5 | 4 | 0 |
| `comedie` | **8** | 4 | 3 | 1 |
| `animation_famille` | **4** | 1 | 0 | 3 |
| **TOTAL** | **117** | **54** (46,2%) | **48** (41,0%) | **15** (12,8%) |

#### 3. Origine des Contenus Résiduels sur Molotov
Ces 117 œuvres proviennent des chaînes thématiques payantes du câble/satellite incluses dans **Molotov Extended** ou packs thématiques :
* **Mangas (Mediawan)** : Grands animés japonais (*Solo Leveling* [9.1], *Jujutsu Kaisen* [8.8], *Black Clover* [8.5], *Tsugai*).
* **RTL9 & Téva** : Téléfilms dramatiques/sentimentaux, téléfilms de Noël, séries policières (*Castle*).
* **Warner TV / Série Club** : Séries américaines cultes (*The Big Bang Theory*, *Supernatural*, *Fringe*, *Superman & Loïs*).
* **TV Breizh** : Polars et téléfilms d'enquête.
* **Paramount Channel** : Films de studio (*Wild*, *The Battery*, *Rituel meurtrier*).

---

## 4. Impact Chiffré de la Refonte du Filtre TNT (11 Octobre 2026)

### A. Comparatif Global « Hors Prime & TNT » à Isopérimètre Strict (Base : 878 Œuvres Actuelles)
> **Note méthodologique :** Pour isoler l'impact pur du filtre, la comparaison est effectuée à **isopérimètre strict sur le même catalogue fixe de 878 œuvres** *(les 5 œuvres d'écart avec les 883 précédentes correspondent à des titres expirés au 10/10/2026 qui ont été purgés lors du flux du matin : Lucky, Jamais sans mon psy, Vingt Dieux, Les femmes au balcon, Blood Star)*.

| Métrique | Ancien Filtre<br>*(regex manuelles + FAST/AVOD)* | Nouveau Filtre<br>*(diffuseurs TNT officiels stricts)* | Évolution Nette |
| :--- | :---: | :---: | :---: |
| **Total catalogue qualifié** | **878** | **878** | **0 (identique)** |
| **Exclus par Prime & TNT** | 199 | 188 | **-11** |
| **VISIBLES « Hors Prime & TNT »** | **679** | **690** | **+11 œuvres gagnées** |
| • Films visibles | 577 | **584** | **+7 films** |
| • Séries visibles | 102 | **106** | **+4 séries** |

---

### B. Détail par Étoiles & Catégories (Visibles Hors Prime & TNT sur 878 œuvres fixes)

| Métrique | Ancien Filtre (sur 878) | Nouveau Filtre (sur 878) | Évolution |
| :--- | :---: | :---: | :---: |
| ⭐⭐⭐ (3★) | 235 | **240** | **+5** |
| ⭐⭐⭐⭐ (4★) | 262 | **263** | **+1** |
| ⭐⭐⭐⭐⭐ (5★) | 182 | **187** | **+5** |
| `drame_emotion` | 284 | **285** | +1 |
| `thriller_policier` | 100 | **105** | **+5** |
| `comedie` | 130 | **132** | **+2** |
| `animation_famille` | 63 | **60** | -3 |
| `scifi_fantastique` | 53 | **55** | **+2** |
| `horreur_epouvante` | 27 | **29** | **+2** |
| `action_aventure` | 22 | **24** | **+2** |

---

### C. Mouvements Clés du Catalogue
1. **20 œuvres légitimes récupérées (+20)** *(exclues à tort auparavant par Rakuten/Pluto/Plex ou regex en dur)* :
   * **Films cinéma payants :** *T.I.M.*, *Pour elle*, *Haute Couture*, *Notorious Nick*, *Sang d'acier*, *USS Indianapolis*, *Enlèvement*, *Wild Bill*, *Birdman*, *Piégés*...
   * **Séries payantes Universal+ :** *Candice Renoir*, *Le Voyageur*, *Harry Wild*, *Professeur T*, *Whitstable Pearl*, *Hudson & Rex*, *Motive* (replays TNT en clair expirés, devenues exclusivités SVOD 13ème RUE).
2. **7 œuvres nouvellement exclues (-7)** *(détectées avec précision grâce aux slugs officiels `sxp` M6+ et `fra` France TV)* :
   * *Noir comme neige : Morts au Sommet* (polar France 2 / France TV)
   * *Aurora Teagarden : Meurtre au bord du lac* (téléfilm M6+ / TF1+)
   * *Volontaire* (TF1+ / M6+)
   * *L’Impasse* (diffusé en clair)
   * Séries d'animation jeunesse diffusées sur Gulli / M6+ (*Dragons*, *Les Croods*, *Madagascar*).

---

## 5. Étude d'Ajout : Molotov Gratuit Pur (Offre Gratuite Molotov : Hors TNT & Hors Bouquets Payants Molotov) (11 Octobre 2026)

### A. Vue d'Ensemble & Périmètre Strict
Cette étude isole le catalogue **gratuit propre à Molotov (notamment l'offre Mango / AVOD gratuite)**, en excluant strictement :
1. **Toutes les chaînes de la TNT gratuite et leurs replays** (*TF1+, M6+, France TV, Arte, RMC, Gulli*...).
2. **Les seuls bouquets payants réellement commercialisés sur Molotov** (*Ciné+ OCS, Universal+, Action Max, Sooner, Shadowz, Insomnia*).  
   *(Filmo, Outbuster et ADN ne sont pas vendus par Molotov et ne sont donc pas exclus ; de même que Netflix, Disney+, Paramount+ ou Prime Video dont la présence conjointe n'affecte pas la gratuité du flux sur Molotov).*
3. **Les doublons déjà présents dans le catalogue actuel CinéScope**.

* **Volume Total Ajouté :** **+216 œuvres nettes éligibles**
  * **Films :** **+190 films** (Runtime $\ge 60\text{ min}$)
  * **Séries :** **+26 séries**

---

### B. Détail FILMS : +190 Films Ajoutés

| Catégorie | Total Films | ⭐⭐⭐ (3★) | ⭐⭐⭐⭐ (4★) | ⭐⭐⭐⭐⭐ (5★) |
| :--- | :---: | :---: | :---: | :---: |
| `drame_emotion` | **60** | 32 | 25 | 3 |
| `thriller_policier` | **54** | 39 | 14 | 1 |
| `horreur_epouvante` | **24** | 16 | 8 | 0 |
| `action_aventure` | **19** | 12 | 7 | 0 |
| `comedie` | **16** | 11 | 4 | 1 |
| `scifi_fantastique` | **13** | 6 | 7 | 0 |
| `animation_famille` | **4** | 2 | 2 | 0 |
| **TOTAL FILMS** | **190** | **118** (62,1%) | **67** (35,3%) | **5** (2,6%) |

*Films 5★ notables :* *Allah n'est pas obligé* (Drame, 8.4/10), *Des blessures invisibles* (Thriller, 8.0/10), *Prison Heart* (Drame, 8.0/10), *Noël à Goose Lane* (Comédie, 8.0/10), *Mademoiselle* (Drame, 8.1/10).

---

### C. Détail SÉRIES : +26 Séries Ajoutées

| Catégorie | Total Séries | ⭐⭐⭐ (3★) | ⭐⭐⭐⭐ (4★) | ⭐⭐⭐⭐⭐ (5★) |
| :--- | :---: | :---: | :---: | :---: |
| `thriller_policier` | **8** | 1 | 4 | 3 |
| `drame_emotion` | **7** | 2 | 4 | 1 |
| `scifi_fantastique` | **6** | 2 | 0 | 4 |
| `animation_famille` | **3** | 0 | 0 | 3 |
| `comedie` | **1** | 1 | 0 | 0 |
| `horreur_epouvante` | **1** | 0 | 1 | 0 |
| `action_aventure` | **0** | 0 | 0 | 0 |
| **TOTAL SÉRIES** | **26** | **6** (23,1%) | **9** (34,6%) | **11** (42,3%) |

*Séries 5★ notables :* *Solo Leveling* (SF, 9.1/10), *Tsugai* (SF, 8.9/10), *Black Clover* (Animation/Aventure, 8.5/10), *The Great* (Drame, 8.5/10), *Sherlock et sa fille* (Thriller, 8.4/10), *Sous pression* (Thriller, 8.4/10), *Les Évaporés* (Thriller, 8.3/10), *Lucifer* (SF, 8.0/10), *Mao* (Animation, 8.0/10).

---

### D. TOTAL CUMULÉ (Films + Séries) : +216 Œuvres Ajoutées

| Catégorie | Total Ajouté | ⭐⭐⭐ (3★) | ⭐⭐⭐⭐ (4★) | ⭐⭐⭐⭐⭐ (5★) |
| :--- | :---: | :---: | :---: | :---: |
| `drame_emotion` | **67** | 34 | 29 | 4 |
| `thriller_policier` | **62** | 40 | 18 | 4 |
| `horreur_epouvante` | **25** | 16 | 9 | 0 |
| `scifi_fantastique` | **19** | 8 | 7 | 4 |
| `action_aventure` | **19** | 12 | 7 | 0 |
| `comedie` | **17** | 12 | 4 | 1 |
| `animation_famille` | **7** | 2 | 2 | 3 |
| **TOTAL CUMULÉ** | **216** | **124** (57,4%) | **76** (35,2%) | **16** (7,4%) |




