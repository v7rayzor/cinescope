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
| `drame_emotion` | **46** | 21 | 20 | 5 |
| `thriller_policier` | **28** | 8 | 15 | 5 |
| `horreur_epouvante` | **11** | 7 | 3 | 1 |
| `scifi_fantastique` | **11** | 2 | 4 | 5 |
| `action_aventure` | **9** | 5 | 4 | 0 |
| `comedie` | **8** | 5 | 3 | 0 |
| `animation_famille` | **4** | 1 | 0 | 3 |
| **TOTAL** | **117** | **54** (46,2%) | **48** (41,0%) | **15** (12,8%) |

#### 3. Origine des Contenus Résiduels sur Molotov
Ces 117 œuvres proviennent des chaînes thématiques payantes du câble/satellite incluses dans **Molotov Extended** ou packs thématiques :
* **Mangas (Mediawan)** : Grands animés japonais (*Solo Leveling* [9.1], *Jujutsu Kaisen* [8.8], *Black Clover* [8.5], *Tsugai*).
* **RTL9 & Téva** : Téléfilms dramatiques/sentimentaux, téléfilms de Noël, séries policières (*Castle*).
* **Warner TV / Série Club** : Séries américaines cultes (*The Big Bang Theory*, *Supernatural*, *Fringe*, *Superman & Loïs*).
* **TV Breizh** : Polars et téléfilms d'enquête.
* **Paramount Channel** : Films de studio (*Wild*, *The Battery*, *Rituel meurtrier*).
