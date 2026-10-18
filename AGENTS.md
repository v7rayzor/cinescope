# Règles du Projet CinéScope (AGENTS.md)

Ce fichier définit les directives et règles impératives que l'agent doit TOUJOURS respecter lors de l'ajout, de la modification ou de la maintenance du catalogue de films et séries.

## 0. Règle Impérative : Aucune Modification Sans Validation Formelle Explicite
- **Demandes d'avis vs ordres directs** : Lorsque l'utilisateur utilise des formulations interrogatives, réflexives ou de discussion (ex: *« qu'en penses-tu ? »*, *« je pense que... »*, *« est-ce qu'on ne pourrait pas... ? »*, *« un ami m'a dit... »*, *« tu trouves pas que... »*), l'agent doit **STRICTEMENT** traiter le message comme une demande d'analyse, de réflexion ou de conseil, et **JAMAIS** comme un feu vert pour modifier directement le projet.
- **Attente obligatoire d'un accord formel** : L'agent doit analyser la question, partager son avis/recommandation en détail, et **ATTENDRE TOUJOURS la validation formelle explicite** de l'utilisateur (ex: *« d'accord applique »*, *« oui modifie »*, *« valide »*) avant d'effectuer la moindre modification dans le code source, le catalogue, les fichiers de style ou la documentation.

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

---

## 5. Règle Documentaire : Consultation Initiale & Maintenance des Synthèses de Session (`derniere_session_cinescope.md` & `derniere_session_molotov.md`)
- **Consultation obligatoire au début de chaque session selon le contexte de travail** :
  * **Pour CinéScope** (catalogue de films et séries, moteur de streaming JustWatch, filtres de navigation, scoring déterministe, qualification sémantique IA, PWA) : l'agent doit **SYSTÉMATIQUEMENT et OBLIGATOIREMENT lire le fichier [`derniere_session_cinescope.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/derniere_session_cinescope.md)** afin de s'imprégner immédiatement de l'état exact du catalogue, des règles métier et des versions déployées.
  * **Pour Molotov Abonnements** (page de propositions des offres dans `propositions/`, bannières hero panoramiques, chartes broadcast studio, intégration des chaînes) : l'agent doit **SYSTÉMATIQUEMENT et OBLIGATOIREMENT lire le fichier [`derniere_session_molotov.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/derniere_session_molotov.md)** afin de respecter scrupuleusement les proportions dé-écrasées, les calages au pixel près et l'intégrité des visuels validés.
- **Alimentation & Élagage en fin de session** : À la fin de chaque session de travail ou cycle de développement, l'agent doit **SYSTÉMATIQUEMENT et OBLIGATOIREMENT** actualiser et élaguer le document correspondant à la racine du projet.
- **Contenu requis de la synthèse** :
  1. Le récapitulatif des fonctionnalités et corrections récentes du projet ciblé.
  2. Les règles métier, formules mathématiques, ratios d'affichage et arbitrages en vigueur.
  3. L'état exact des fichiers, les statistiques de conformité et les décisions techniques actives.
  4. La version courante de cache PWA et des clés de stockage actives (pour CinéScope).
- **Suppression proactive des informations obsolètes** : L'agent doit **systématiquement supprimer ou condenser** les informations superflues, les étapes de débogage intermédiaires dépassées, les logs de migration anciens et les sections devenues caduques, afin que chaque document reste une synthèse claire, légère et opérationnelle de l'état actuel sans empilement infini.

---

## 6. Règle de Recommandation pour les Amis
- Lors de toute demande de recommandation, conseil ou sélection de films / séries à proposer aux amis de l'utilisateur, l'agent doit **SYSTÉMATIQUEMENT se référer au fichier [`profils_amis.md`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/profils_amis.md)**.
- L'agent doit scrupuleusement appliquer :
  1. **Les règles d'exclusion impératives** : Zéro TNT / Chaînes gratuites (France TV, TF1, M6...), Zéro abonnement standard Prime Video, et pour les séries diffusées sur l'ancien bouquet SFR (Syfy, 13ème RUE), exigence d'avoir **au moins une saison inédite diffusée à partir de 2024**.
  2. **Les exigences de profil** :
     - **Profil Ami (Homme)** : Action, Survie, Anticipation (1er degré strict, physique, aucun grotesque/second degré).
     - **Profil Amie (Femme)** : Enquête, Déduction, Tandem (Cérébral, cosy crime, esprit Poirot/Castle, élégance britannique, zéro rediffusion France 3).
  3. **L'audit des rejets et les programmations validées** déjà répertoriées.

---

## 7. Règle d'Amélioration Algorithmique Universelle (Zéro Bricolage Ad Hoc)
- **Interdiction formelle du bidouillage au cas par cas** : Il est formellement interdit d'écrire des exceptions codées en dur pour une œuvre spécifique (ex: `if (title === "Nom du film")`).
- **Universalité et pérennité obligatoires** : Tout ajustement de calcul, de score ou de catégorisation doit obligatoirement être conçu comme une règle logique, saine, déterministe et générale.
- **Bénéfice pour l'ensemble du catalogue** : Chaque amélioration doit s'appliquer équitablement à toutes les œuvres existantes et garantir que toutes les futures œuvres ingérées lors des synchronisations JustWatch soient correctement qualifiées sans régression.

---

## 8. Règle d'Exclusivité PC (« Juste pour moi » / « Que pour moi »)
- Lorsque l'utilisateur formule une demande avec la mention *« juste pour moi »* ou *« que pour moi »*, celle-ci s'applique **STRICTEMENT et EXCLUSIVEMENT à la version PC (Desktop)** du projet (écrans $\ge 1024\text{px}$).
- Ces fonctionnalités, ajouts de contenus ou filtres ne doivent en aucun cas impacter ou alourdir la version portable / mobile, sur laquelle ils doivent demeurer masqués, exclus ou inactifs.

---

## 9. Règle de Confidentialité & Non-Publication des Propositions Molotov
- Les maquettes, propositions et fichiers de refonte situés dans `propositions/` (dont [`propositions/molotov_abonnements.html`](file:///c:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/propositions/molotov_abonnements.html)) sont **STRICTEMENT RÉSERVÉS À UN USAGE LOCAL PRIVÉ**.
- **Accès direct exclusif pour l'utilisateur** : via l'URL locale `file:///C:/Users/cvand/Documents/Antigravity%20Codium/06%20-%20Molotov/propositions/molotov_abonnements.html`.
- **Interdiction formelle de publication publique** : Ces fichiers ne doivent en aucun cas être commités ou poussés sur le dépôt public GitHub. Ils sont sanctuarisés dans le fichier `.gitignore` du projet.


