# Règles du Projet CinéScope (AGENTS.md)

Ce fichier définit les directives et règles impératives que l'agent doit TOUJOURS respecter lors de l'ajout, de la modification ou de la maintenance du catalogue de films et séries.

---

## 1. Règle Fondamentale : 1 Film / Série = 1 Seule Catégorie Unique
- Chaque œuvre (film, téléfilm ou série) doit posséder **STRICTEMENT UNE SEULE CATÉGORIE** dans son tableau `categories` : `categories: ["nom_de_la_categorie"]`.
- Il est strictement interdit d'attribuer plusieurs catégories à une même œuvre.
- La catégorie sélectionnée doit être **la plus véridique, dominante et représentative** de l'œuvre parmi les 7 catégories officielles :
  1. `drame_emotion` : Drames profonds, romances, biopics, drames sociaux, récits d'auteur.
  2. `comedie` : Comédies pures, parodies, satires, comédies d'action/populaires.
  3. `thriller_policier` : Polars, enquêtes policières, espionnage, machinations, néo-noirs, thrillers psychologiques.
  4. `action_aventure` : Action grand spectacle, westerns, arts martiaux, films de survie, sagas d'aventure.
  5. `scifi_fantastique` : Science-fiction, space opéra, voyages temporels, anticipation, super-héros, mondes magiques.
  6. `horreur_epouvante` : Slashers, épouvante, body horror, surnaturel/démons, gore.
  7. `animation_famille` : Films et séries d'animation, aventures jeunesse, contes familiaux.

---

## 2. Vérification Scrupuleuse de la Correspondance du Titre
Avant d'intégrer ou de mettre à jour un film / une série :
- **Affiche (Poster)** : Vérifier que l'image correspond rigoureusement au titre exact et à la bonne version/adaptation de l'œuvre (attention aux pièges d'homonymes ou de traductions similaires, ex: *En garde* vs *Une garde en enfer*, *Rabiat* vs *Rabia*, *Other* vs *The Others*).
- **Note et avis** : La note critique / avis (sur 10) doit correspondre fidèlement à la note réelle de l'œuvre ciblée (ex: Allociné, TMDb, IMDb).
- **Badge d'âge (CSA / PEGI)** : Vérifier si le film possède réellement une signalétique officielle (-10, -12, -16, -18). Ne pas inventer de badge s'il est tous publics.
- **Année et Chaîne** : S'assurer que l'année de sortie et le logo de la chaîne de diffusion (Ciné+ Frisson, Emotion, Family, Festival, etc.) sont exacts.

---

## 3. Critères d'Éligibilité
Une œuvre est éligible (`is_eligible: true`) si et seulement si elle respecte les conditions du catalogue (accès valide, chaîne active, métadonnées complètes).

---

## 4. Qualité des Affiches : Images HD Officielles Obligatoires
- Toutes les affiches du catalogue (`assets/posters/`) doivent être **STRICTEMENT des images haute définition (HD)** officielles de l'œuvre (provenant de TMDb, Allociné, Unifrance, Apple TV ou des distributeurs officiels).
- **Il est FORMELLEMENT INTERDIT d'utiliser des captures d'écran de captures d'écran**, des découpes de l'interface Molotov ou des images basse résolution/floues comme affiches.
- Les captures d'écran présentes dans le dossier `Site/` servent **exclusivement de repère visuel de référence** (pour identifier les acteurs, l'affiche de diffusion et le badge d'âge CSA/PEGI), mais le fichier final dans `assets/posters/` doit toujours être le poster officiel original en haute définition.
