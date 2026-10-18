# Synthèse & État Actuel du Projet — Refonte Molotov Abonnements

Ce document constitue la référence vivante et synthétique de l'architecture graphique, des directives de mise en page, des arbitrages visuels et de l'état actif de la **page d'abonnements Molotov** ([`propositions/molotov_abonnements.html`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/propositions/molotov_abonnements.html)).

---

## 1. Architecture Globale & Méthode Studio Pro (Broadcast Standard)

### A. Éradication Définitive de l'Écrasement d'Images
* **Cause racine identifiée de l'ancien rendu déformé** :
  - L'ancien conteneur imposait un étirement destructeur (`object-fit: fill`) sur un ratio 3:1 (1340 × 420 px), ce qui étirait artificiellement les images 16:9 natives de **+80% à l'horizontale**.
  - Conséquences : visages aplatis, formes rondes ovalisées et lettrages peints dans les images devenus gras, fuyants et illisibles.
* **Standard Broadcast Professionnel (Type Netflix / Apple TV / Molotov TV)** :
  - **Fonds panoramiques natifs 3:1 (1920 × 640 px)** : images sources retouchées par inpainting adaptatif pour reconstituer la texture d'arrière-plan sans aucun étirement.
  - **Typographie et logos vectoriels HTML/CSS superposés** : les titres d'offres et les mentions ne sont plus incrustés dans l'image matricielle étirée mais projetés en calques HTML vectoriels purs via `.banner-bottom-left-brand`, garantissant une netteté absolue sur tout écran 4K / Retina.
  - **Règle de cadrage CSS universelle** :
    ```css
    aspect-ratio: 16 / 5.33;
    min-height: 400px;
    max-height: 446px;
    object-fit: cover;
    object-position: center;
    ```

---

## 2. Détail des 5 Bannières Hero Principales (Desktop)

### 1. Bannière Molotov Extended (v8.70 Pro)
* **Visuel Panoramique** : Kiefer Sutherland et le palais de Westminster respectant 100% de l'anatomie et de l'architecture (`assets/banner_extended_inpainted.png`).
* **Titrage Vectoriel** : `MOLOTOV <span class="accent-yellow">EXTENDED</span>` (2.1rem bold) et sous-titre `Toute la TNT + 150 chaînes` (1.05rem).
* **Grille Showcase 10 Chaînes (2x5)** : Cases uniformes de **58px × 58px** (MYTF1, M6+, Universal+, RTL9, Paris Première, Téva, AB1, Toute l'Histoire, Mangas, Canal J).
  - *Calibrage optique* : Canal J remplace Science & Vie TV avec un logo calé à 30px pour préserver la respiration du conteneur.
* **Prix** : Badge jaune `À PARTIR DE 4,99€ /MOIS` en haut à gauche.

### 2. Bannière Molotov Grand Cinéma (v8.72 Pro)
* **Visuel Sonic & Shadow 100% Rond & Net** : Proportions authentiques de Sonic et Shadow sans aplatissement (`assets/banner_grand_cinema_inpainted.png`).
* **Titrage & Signature Studio** : `MOLOTOV <span class="accent-yellow">GRAND CINÉMA</span>`, sous-titre harmonisé `10 chaînes cinéma séries` (sans le `+`) et signature studio officielle `CINÉ+ OCS | SONIC 3 LE FILM` en bas à droite.
* **Showcase 10 Chaînes (2x5)** : OCS, Ciné+ Frisson, Émotion, Festival, Family, Classic, Sooner, Action, Insomnia, Shadowz, rigoureusement aligné sur le prix `19,99€ /MOIS`.

### 3. Bannière Ligue 1+ (v8.71 Pro)
* **Restauration HD Chirurgicale Zéro Brouillage** : Préservation intégrale des textures du sponsor `CMA CGM`, du blason de l'OM et des logos sur le maillot de Harit (`assets/banner_ligue1_inpainted.png`), reconstitution exacte du badge circulaire `boulanger` et du maillot de Giroud (LOSC) sans aucun flou, fond de stade nocturne pur.
* **Logo Officiel Géométrique 1+** : Vrai mark vectorisé transparent (`assets/logo_ligue1_plus_hd.png`) avec le `1` stylisé et le `+` bleu électrique, sous-titre net `La Ligue 1 McDonald's`, signature studio `LIGUE 1 | M` en bas à droite.
* **Showcase 10 Canaux (2x5)** : Canaux 1 à 10 alignés sur le CTA prix `À PARTIR DE 16,66€ /MOIS`.

### 4. Bannière Society+ (v8.72 Pro)
* **Restauration de l'Arrière-Plan & Morphologie de Zlatan** : Fond reconstitué sans texte matriciel étiré (`assets/banner_society_hero.png`), texture du maillot et du ballon régénérées, extension panoramique 1920 × 640 préservant 100% de la silhouette de Zlatan Ibrahimovic.
* **Titrage Vectoriel** : Logo officiel HD (`assets/logos/society_plus.png`), sous-titre `La chaîne 100% documentaire`, badge prix `4,90€ /MOIS (7J OFFERTS)` en haut à gauche et signature officielle `BECOMING ZLATAN` en bas à droite.

### 5. Bannière Dorcel (v8.74 Pro)
* **Visuel Panoramique Native Studio (1920 × 640)** : Lingerie rouge, talons aiguilles et anatomie du modèle préservés à 100% sans distorsion (`assets/banner_dorcel_hero.png`).
* **Restauration Zonale Chirurgicale de l'Avant-Bras (Zéro Carré Beige & Zéro Flou)** :
  - *Délimitation mathématique de l'arête (`x_edge(y)`)* : Séparation stricte entre les cheveux et la peau.
  - *Cheveux noirs soyeux restaurés (`x < x_edge`)* : Remplacement de l'ancien aplat beige erroné par la véritable texture noire profonde (`BGR ~ [2, 2, 2]`) tombant sur le tapis bordeaux.
  - *Avant-bras net et reflet naturel* : Peau circonscrite à l'intérieur du contour réel (`x_edge <= x <= x_edge + 52`).
  - *Élimination des pixels transparents / flous* : Rétablissement de la fente d'ombre obscure nette (`BGR ~ [8, 16, 55]`) derrière le bras.
* **Pastille -18 Originale Maintenue à sa Place Authentique** :
  - Conservation intégrale du badge `-18` natif présent sur l'affiche source en bas à droite (`X = 1854`, `Y = 569`). Zéro pastille artificielle recréée.
  - La colonne HTML des 3 chaînes (*Dorcel TV, Dorcel XXX, Vixen*) est alignée verticalement à `left: 96.57%` dans `.banner-right-showcase`, centrant son axe exactement au-dessus de la pastille `-18` native.
* **Typographie Vectorielle Haute Couture** : Titrage serif éditorial `DORCEL` en Playfair Display (900 uppercase) et mention `3 chaînes sans limite`.

---

## 3. Bouquets Internationaux (Section 6)

* **Version Épurée Rétablie (Plein Espace 50% / 50%)** :
  - **Le bouquet Africain** (`assets/banner_africain_hero.png`) à 11,99€/mois : 4 meilleures chaînes en grille 2x2 (*Nollywood TV, Novelas TV, A+, Trace Africa*).
  - **Le bouquet Maghreb** (`assets/banner_maghreb_hero.png`) à 8,99€/mois : 4 meilleures chaînes en grille 2x2 (*2M, Nessma, Samira TV, Echorouk TV*).
  - Suppression de tout mot parasite (*PREMIUM*), calage compact du logo au-dessus de la description, zéro démarcation ou double cadre.

---

## 4. Header Officiel & Navigation Molotov Desktop

* **Hauteur officielle 38px** avec fond sombre flouté (`rgba(0, 0, 0, 0.95)`, backdrop-filter: 12px).
* **Logo Molotov Officiel Image** : `assets/molotov_logo.png` (hauteur 19px, zéro doublon de texte).
* **Icônes d'action nettoyées** : Recherche (`assets/search_clean.png`), roue crantée 6 dents (`assets/gear_clean.png`), avatar utilisateur Cédric en gris non sélectionné.
* **Navigation active** : Onglet `Abonnements` mis en valeur.

---

## 5. Structure Propre des Fichiers & Isolation CinéScope

* **Fichier HTML Principal (Accès Local Privé — Règle 9)** :
  - **URL locale directe** : `file:///C:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/propositions/molotov_abonnements.html`
  - **Confidentialité & Non-publication** : Ce dossier est strictement privé et sanctuarisé dans `.gitignore`. Il ne doit jamais être publié ni poussé sur GitHub.
* **Dossier des Assets Dédié** : [`propositions/assets/`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/propositions/assets/) :
  - Strictement **64 fichiers légitimes** (les 5 grandes bannières retouchées, les 2 bannières internationales, les 10 bannières secondaires, les logos de chaînes réellement affichés, les icônes de header et la feuille CSS `molotov-official.css`).
  - **Zéro fichier mort** : Tous les fichiers scratch, masques intermédiaires, logs d'extraction et formats obsolètes ont été définitivement purgés.
* **Isolation absolue** : Cette maquette est totalement indépendante du catalogue principal CinéScope et n'interfère pas avec les flux SVOD ou le service worker PWA.
