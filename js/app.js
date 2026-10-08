/**
 * Application CinéScope - Logique de navigation, streaming temps réel JustWatch V2
 * Tri prioritaire par fin de droits, logos officiels, échelle PC calibrée et synchro hybride.
 */

// Définition des 7 catégories officielles CinéScope
const CATEGORIES_INFO = {
  all: {
    icon: "✨",
    title: "Tous les titres",
    desc: ""
  },
  action_aventure: {
    icon: "🏹",
    title: "Action & Aventure",
    desc: "Pour le grand spectacle, le rythme et le mouvement. Action pure, western, arts martiaux, guerre, survie et grandes épopées."
  },
  thriller_policier: {
    icon: "🔍",
    title: "Thriller & Policier",
    desc: "Pour le mystère, la tension et l'enquête. Polars urbains, enquêtes judiciaires, espionnage, machinations politiques et thrillers psychologiques."
  },
  scifi_fantastique: {
    icon: "🚀",
    title: "Science-fiction & Fantastique",
    desc: "Pour l'évasion, le voyage et l'imaginaire. Voyages dans le temps, espace, anticipation/dystopie, super-héros et mondes magiques."
  },
  horreur_epouvante: {
    icon: "👻",
    title: "Horreur & Épouvante",
    desc: "Pour le frisson, la peur et l'angoisse. Films de monstres, slashers, surnaturel/démons, gore et body horror."
  },
  comedie: {
    icon: "🎭",
    title: "Comédie",
    desc: "Pour décompresser et rire. Comédies populaires, satires, parodies et comédies d'action."
  },
  drame_emotion: {
    icon: "❤️",
    title: "Drame & Émotion",
    desc: "Pour les récits profonds, réalistes et touchants. Drames familiaux, histoires vraies/biopics, chroniques sociales et romances dramatiques."
  },
  animation_famille: {
    icon: "🧸",
    title: "Animation & Famille",
    desc: "Pour un public jeune ou un visionnage tous publics. Films et séries d'animation, aventures jeunesse et contes familiaux."
  }
};

// État global de l'application
const AppState = {
  activeType: 'film',          // 'film' ou 'serie'
  activeCategory: 'all',       // 'all' ou l'une des 7 catégories
  activeStars: 'all',          // 'all', '4', '5'
  activeBouquet: 'all',        // 'all', 'aoc' (OCS), 'aca' (Action), 'auc' (Universal+)
  isExclusiveOnly: false,      // true pour exclure Prime Video et TNT
  isExcludeNoS1: false,        // true pour exclure les séries sans saison 1 disponible
  activeProfile: 'none',       // 'none', 'user', 'ami', 'amie'
  isAutoStars: true,           // true tant que l'utilisateur n'a pas forcé manuellement un choix
  searchQuery: '',             // Requête de recherche par titre (PC uniquement)
  isSyncing: false,
  catalog: []
};

// Vérifier si une œuvre est disponible sur Prime Video ou la TNT
function isItemExcludedByPrimeOrTnt(item) {
  if (!item) return false;
  if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.isItemOnPrimeOrTnt === 'function') {
    return JustWatchEngine.isItemOnPrimeOrTnt(item);
  }
  if (item.on_prime === true || item.on_tnt === true) return true;
  return false;
}

// Vérifier si une série dispose de la Saison 1 complète
function hasSeasonOne(item) {
  if (!item || item.type !== 'serie') return true;
  if (item.saisons_disponibles && item.saisons_disponibles.length > 0) {
    return item.saisons_disponibles.some(s => {
      const sNum = typeof s === 'object' ? s.saison : s;
      return Number(sNum) === 1;
    });
  }
  if (item.saison && Number(item.saison) > 1) return false;
  return true;
}

// Obtenir le premier numéro de saison disponible pour une série
function getFirstAvailableSeason(item) {
  if (!item || item.type !== 'serie') return 1;
  if (item.saisons_disponibles && item.saisons_disponibles.length > 0) {
    const sNums = item.saisons_disponibles.map(s => typeof s === 'object' ? Number(s.saison) : Number(s)).sort((a, b) => a - b);
    return sNums[0] || 1;
  }
  return Number(item.saison) || 1;
}

// Vérification des exclusions impératives pour les profils d'amis (Prime, TNT, rediffusions France TV)
function isItemExcludedForAmis(item) {
  if (!item) return true;
  if (isItemExcludedByPrimeOrTnt(item)) return true;
  const t = (item.titre || '').toLowerCase();
  // Exclusions TNT / Rediffusions formelles
  if (t.includes('professeur t') || t.includes('whitstable pearl') || 
      t.includes('pearl nolan') || t.includes('harry wild') || t.includes('fargo') || 
      t.includes('patience') || t.includes('le sang de la vigne')) {
    return true;
  }
  return false;
}

// Détecter si une œuvre est une nouveauté arrivée depuis moins de 7 jours
function isItemNew(item) {
  if (!item) return false;
  if (item.is_new) return true;
  if (!item.date_ajout) return false;
  const added = new Date(item.date_ajout);
  if (isNaN(added.getTime())) return false;
  const now = new Date();
  const diffTime = now.getTime() - added.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

// Calcul mathématique précis du pourcentage de composante Action (0 à 100%)
function getItemActionPercentage(item) {
  if (!item) return 0;
  const rawTags = (item.raw_genres || []).map(t => (t || '').toLowerCase().trim());
  const cleanText = ((item.titre || '') + ' ' + (item.synopsis || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');

  let animScore = 0;
  let horrorScore = 0;
  let scifiScore = 0;
  let crimeScore = 0;
  let actionScore = 0;
  let comedyScore = 0;
  let dramaScore = 0;

  if (rawTags.includes('ani')) animScore += 100;
  if (rawTags.includes('fml')) animScore += 40;

  if (rawTags.includes('hrr')) horrorScore += 60;

  if (rawTags.includes('scf')) scifiScore += 50;
  if (rawTags.includes('fnt')) scifiScore += 40;

  if (rawTags.includes('crm')) crimeScore += 55;
  if (rawTags.includes('trl')) crimeScore += 35;

  if (rawTags.includes('act')) actionScore += 50;
  if (rawTags.includes('war')) actionScore += 30;
  if (rawTags.includes('wsn')) actionScore += 30;

  if (rawTags.includes('cmy')) comedyScore += 55;

  if (rawTags.includes('drm')) dramaScore += 35;
  if (rawTags.includes('rma')) dramaScore += 40;
  if (rawTags.includes('hst')) dramaScore += 25;

  // Signaux contextuels de pondération
  if (/\b(meurtre|cadavre|crime|criminel|assassin|police|policier|enquete|flic|inspecteur|detective|tueur|braquage|mafia|gang|drogue|cartel|homicide|brigade|gendarme|avocat|proces|temoin|disparition|kidnapping|otage|vol|cambriolage|escroc|tribunal|juge|magistrat)\b/i.test(cleanText)) {
    crimeScore += 35;
  }
  if (/\b(mission|commando|survie|jungle|desert|peril|sauvetage|combattant|guerrier|bataille|mercenaires|fusillade|explosion|artillerie|gladiateur|arts martiaux|kung fu|karate|course poursuite)\b/i.test(cleanText)) {
    actionScore += 25;
  }
  if (/\b(extraterrestre|alien|vaisseau|galaxie|spatial|dystopie|futur|temporel|voyage dans le temps|cyber|ia|intelligence artificielle|robot|androide|clone|mutation|mutant|zombie|apocalypse|post apocalyptique|drome|bouclier)\b/i.test(cleanText)) {
    scifiScore += 30;
  }
  if (/\b(deuil|cancer|maladie|intimite|romance|passion|couple|divorce|separation|pere|mere|fils|fille|famille|noel|romantique|poignant|bouleversant|emouvant|sentiment|solitude|drame)\b/i.test(cleanText)) {
    dramaScore += 35;
  }

  const total = animScore + horrorScore + scifiScore + crimeScore + actionScore + comedyScore + dramaScore;
  if (total <= 0) return 0;
  return Math.round((actionScore / total) * 100);
}

// Détecter si une œuvre est un film ou une série d'animation / dessin animé
function isAnimationItem(item) {
  if (!item) return false;
  const cat = (item.categories && item.categories[0]) ? item.categories[0] : '';
  if (cat === 'animation_famille') return true;
  const syn = (item.synopsis || '').toLowerCase();
  if (syn.includes('dessin animé') || syn.includes('série animée') || syn.includes('série d\'animation') || syn.includes('film d\'animation') || syn.includes('anime japonais') || syn.includes('manga animé')) {
    return true;
  }
  return false;
}

// Calcul d'affinité prédictive sur-mesure pour chaque profil (0 à 100%)
function computeProfileAffinity(item, profile) {
  if (!item || !item.is_eligible || !profile || profile === 'none') return 0;
  const cat = (item.categories && item.categories[0]) ? item.categories[0] : '';
  const titre = (item.titre || '').toLowerCase();
  const syn = (item.synopsis || '').toLowerCase();
  const dur = (item.duree || '').toLowerCase();
  const note = getItemScore(item);

  // 👤 Profil Ami (Homme) : Action, Survie, 1er degré strict, Rythme soutenu / Adrénaline
  // (Exclusion formelle : Zéro lenteur/polars bavards sans action, Zéro animation, Zéro TNT/Prime)
  if (profile === 'ami') {
    if (isItemExcludedForAmis(item)) return 0;
    if (isAnimationItem(item) || cat === 'animation_famille' || cat === 'horreur_epouvante') return 0;

    if (cat === 'drame_emotion' && !syn.includes('survie') && !syn.includes('action') && !syn.includes('militaire')) return 0;

    // Règle Mathématique 100% Automatisée :
    // Dans Thriller & Policier et Comédie, la part d'Action doit être >= 11% (élimine automatiquement tout polar lent, statique ou bavard)
    const actionPct = getItemActionPercentage(item);
    if ((cat === 'thriller_policier' || cat === 'comedie') && actionPct < 11) {
      return 0;
    }

    // Titres socles calibrés
    if (titre.includes('the copenhagen test')) return 90;
    if (titre.includes('reacher')) return 90;
    if (titre.includes('arcadia')) return 85;
    if (titre.includes('almost paradise')) return 85;
    if (titre.includes('orphan black')) return 85;
    if (titre.includes('revival')) return 85;
    if (titre.includes('30 jours max')) return 85;
    if (titre.includes('under the dome')) return 85;
    if (titre.includes('sentinelles')) return 80;

    let score = 0;
    if (cat === 'action_aventure') score += 45;
    if (cat === 'scifi_fantastique' && (syn.includes('survie') || syn.includes('traque') || syn.includes('action') || syn.includes('cyber') || syn.includes('techno') || syn.includes('clone'))) score += 40;
    if (cat === 'thriller_policier' && (syn.includes('action') || syn.includes('traque') || syn.includes('cartel') || syn.includes('braquage') || syn.includes('flic') || syn.includes('commando') || syn.includes('course') || syn.includes('espion') || syn.includes('poursuite'))) score += 35;
    if (cat === 'comedie' && (syn.includes('action') || syn.includes('police') || syn.includes('flic') || syn.includes('braquage'))) score += 35;

    if (syn.includes('survie') || syn.includes('traque') || syn.includes('anticipation') || syn.includes('techno') || 
        syn.includes('dôme') || syn.includes('quarantaine') || syn.includes('clone') || syn.includes('cyber') || 
        syn.includes('conspiration') || syn.includes('cartel') || syn.includes('mission') || syn.includes('commando') ||
        syn.includes('flic') || syn.includes('espion') || syn.includes('opération') || syn.includes('braquage') ||
        syn.includes('course-poursuite')) {
      score += 25;
    }
    if (note >= 8.0) score += 20;
    else if (note >= 7.0) score += 10;
    return Math.min(100, score);
  }

  // 👩 Profil Amie (Femme) : Enquête, Déduction, Tandem, Affaires Judiciaires & Drames / Émotion / Noël
  // (Exigences : Matière grise, psychologie, besoin de temps morts / respirations, Part d'action <= 33%, zéro comédie, zéro animation)
  if (profile === 'amie') {
    if (isItemExcludedForAmis(item)) return 0;
    if (isAnimationItem(item) || cat === 'animation_famille' || cat === 'comedie' || cat === 'horreur_epouvante' || cat === 'action_aventure') {
      return 0;
    }

    // Règle Mathématique : La part d'Action dans l'œuvre ne doit pas dépasser 33%
    const actionPct = getItemActionPercentage(item);
    if (actionPct > 33) {
      return 0;
    }

    // Titres socles calibrés
    if (titre.includes('family law')) return 90;
    if (titre.includes('wild cards')) return 85;
    if (titre.includes('grace')) return 85;
    if (titre.includes('toronto: section criminelle') || titre.includes('toronto criminal intent')) return 85;
    if (titre.includes('castle')) return 90;
    if (titre.includes('bull')) return 85;
    if (titre.includes('my life is murder')) return 85;
    if (titre.includes('allegiance')) return 80;
    if (titre.includes('revival')) return 80;

    let score = 0;
    if (cat === 'thriller_policier') score += 40;
    if (cat === 'drame_emotion') score += 40;

    if (syn.includes('enquête') || syn.includes('déduction') || syn.includes('meurtre') || syn.includes('tandem') || 
        syn.includes('avocat') || syn.includes('profiling') || syn.includes('judiciaire') || syn.includes('indices') || 
        syn.includes('noël') || syn.includes('noel') || syn.includes('romance') || syn.includes('amour') || syn.includes('famille') ||
        syn.includes('émotion') || syn.includes('sentiment') || syn.includes('secret') || syn.includes('passion') || syn.includes('destin') ||
        syn.includes('psychologie') || syn.includes('dialogue') || syn.includes('complicité')) {
      score += 25;
    }
    if (note >= 8.0) score += 15;
    else if (note >= 7.0) score += 10;
    return Math.min(100, score);
  }

  // 👫 Profil Combiné Duo (Ami & Amie) : Équilibre Parfait Action 11-33%, Polars de terrain & Techno-thrillers
  if (profile === 'duo') {
    const sAmi = computeProfileAffinity(item, 'ami');
    const sAmie = computeProfileAffinity(item, 'amie');
    if (sAmi < 50 || sAmie < 50) return 0;
    return Math.round((sAmi + sAmie) / 2);
  }

  // 🧙‍♂️ Profil Utilisateur (Moi) : Mystère Temporel, Imaginaire / Fantastique, Romance Protectrice, Formats 26 min
  // (Exclusion formelle : Zéro animation en séries uniquement ; films d'animation autorisés)
  if (profile === 'user') {
    if (item.type === 'serie' && (isAnimationItem(item) || cat === 'animation_famille') && !titre.includes('spiderwick')) {
      return 0;
    }
    if (syn.includes('guerre mondiale') && cat === 'action_aventure') return 0;
    if (cat === 'horreur_epouvante' && (syn.includes('gore') || syn.includes('massacre') || syn.includes('slasher'))) return 0;

    // Titres socles calibrés
    if (titre.includes('timeless')) return 92;
    if (titre.includes('resident alien')) return 92;
    if (titre.includes('anomalia')) return 90;
    if (titre.includes('le ministère du temps') || titre.includes('ministerio del temps') || titre.includes('ministerio del tiempo')) return 90;
    if (titre.includes('boy 7')) return 90;
    if (titre.includes('desde el mañana') || titre.includes('desde el manana')) return 88;
    if (titre.includes('aspergirl')) return 88;
    if (titre.includes('the spiderwick chronicles') || titre.includes('chroniques de spiderwick')) return 85;
    if (titre.includes('midnight, texas')) return 85;
    if (titre.includes('wild cards')) return 85;
    if (titre.includes('the librarians') || titre.includes('flynn carson')) return 85;
    if (titre.includes('domino day')) return 85;
    if (titre.includes('extra-lucide') || titre.includes('extra lucide')) return 85;
    if (titre.includes('pécheresses') || titre.includes('pecheresses')) return 85;
    if (titre.includes('bull')) return 85;
    if (titre.includes('under the dome')) return 85;
    if (titre.includes('jeune et golri')) return 82;
    if (titre.includes('toutouyoutou')) return 80;
    if (titre.includes('revival')) return 78;
    if (titre.includes('brave new world')) return 72;
    if (titre.includes('lt-21') || titre.includes('lt 21')) return 45;

    let score = 0;
    if (cat === 'scifi_fantastique') score += 40;
    if (cat === 'thriller_policier') score += 25;
    if (cat === 'drame_emotion' || cat === 'comedie') score += 25;
    if (cat === 'animation_famille' && item.type !== 'serie') score += 20;

    if (syn.includes('temps') || syn.includes('temporel') || syn.includes('voyage') || syn.includes('futur') || 
        syn.includes('magie') || syn.includes('artefact') || syn.includes('mystère') || syn.includes('romance') || 
        syn.includes('amour') || syn.includes('complicité') || syn.includes('secret') || syn.includes('télépathie') ||
        syn.includes('vision') || syn.includes('pouvoir') || syn.includes('sorcellerie') || syn.includes('légende') ||
        syn.includes('amnésie') || syn.includes('protecteur') || syn.includes('protectrice')) {
      score += 25;
    }
    if (dur.includes('25') || dur.includes('26') || dur.includes('30 min')) score += 15;
    if (note >= 7.5) score += 15;
    return Math.min(100, score);
  }

  return 0;
}

// Vérifier si une œuvre est éligible pour un profil donné (seuil de matching >= 50%)
function isItemMatchingProfile(item, profile) {
  if (!profile || profile === 'none') return true;
  return computeProfileAffinity(item, profile) >= 50;
}

// Obtenir le score pertinent d'une œuvre (note_globale ou note_avis)
function getItemScore(item) {
  return Number(item.note_globale || item.note_avis || 0);
}

// Vérifier la correspondance avec le palier d'étoiles (4+ = à partir de 7, 5 = à partir de 8)
function matchesStars(item, starTier) {
  if (starTier === 'all') return true;
  const score = getItemScore(item);
  if (starTier === '4') return score >= 7.0 && score <= 10.0;
  if (starTier === '5') return score >= 8.0 && score <= 10.0;
  return true;
}

// Déterminer automatiquement le palier d'étoiles par défaut pour cibler entre 30 et 50 films
function getAutoStarTier(categoryEligibleItems) {
  if (AppState.activeCategory === 'all') {
    return 'all';
  }

  const total = categoryEligibleItems.length;
  if (total <= 50) {
    return 'all';
  }

  const count4 = categoryEligibleItems.filter(item => matchesStars(item, '4')).length;
  const count5 = categoryEligibleItems.filter(item => matchesStars(item, '5')).length;

  if (count4 > 80 && count5 >= 20) {
    return '5';
  }

  if (count5 >= 30 && count5 <= 80) {
    return '5';
  }

  if (count4 >= 15) {
    return '4';
  }

  return 'all';
}

// Générateur de clé de jour (ex: "2026-09-23")
function getDailySeed() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Hachage 32-bit pour ordre déterministe par jour
function getDailyItemHash(item, dailySeed) {
  const key = `${item.id || item.titre || ''}_${dailySeed}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

const _dailyScoresCache = new Map();
let _currentCachedSeed = '';

function getDailyScore(item) {
  const seed = getDailySeed();
  if (_currentCachedSeed !== seed) {
    _dailyScoresCache.clear();
    _currentCachedSeed = seed;
  }
  const key = item.id || item.titre;
  let score = _dailyScoresCache.get(key);
  if (score === undefined) {
    score = getDailyItemHash(item, seed);
    _dailyScoresCache.set(key, score);
  }
  return score;
}

// Helper pour récupérer le nombre de jours restants (adapté au bouquet filtré si applicable)
function getItemDaysLeft(item) {
  if (!item || !item.expiration) return null;
  
  if (AppState.activeBouquet && AppState.activeBouquet !== 'all') {
    const pkgExps = item.expiration.packageExpirations;
    if (pkgExps && pkgExps[AppState.activeBouquet]) {
      const d = new Date(pkgExps[AppState.activeBouquet]);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
  }

  return (item.expiration.daysLeft !== null && item.expiration.daysLeft !== undefined)
    ? item.expiration.daysLeft
    : null;
}

// Helper pour récupérer les infos d'expiration (statut, label, etc.) adaptées au bouquet sélectionné
function getItemExpirationInfo(item) {
  if (!item || !item.expiration) return { status: 'none', label: null, daysLeft: null };
  
  if (AppState.activeBouquet && AppState.activeBouquet !== 'all') {
    const pkgExps = item.expiration.packageExpirations;
    if (pkgExps && pkgExps[AppState.activeBouquet]) {
      const d = new Date(pkgExps[AppState.activeBouquet]);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { status: 'expired', label: 'Expiré', daysLeft };
        if (daysLeft === 0) return { status: 'urgent', label: "⏳ Expire aujourd'hui", daysLeft: 0 };
        if (daysLeft === 1) return { status: 'urgent', label: '⏳ Expire demain', daysLeft: 1 };
        if (daysLeft <= 3) return { status: 'urgent', label: `⏳ Expire dans ${daysLeft} j`, daysLeft };
        if (daysLeft <= 14) return { status: 'warning', label: `⏳ Expire dans ${daysLeft} j`, daysLeft };
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return { status: 'info', label: `📅 Jusqu'au ${day}/${month}`, daysLeft };
      }
    }
  }

  return item.expiration;
}

// TRI GLOBAL DU CATALOGUE :
// RÈGLE CARDINALE : Les œuvres avec date d'expiration (urgences de départ) passent TOUJOURS en priorité absolue !
// 1. Œuvres avec date d'expiration : triées par ordre croissant de jours restants (0j > 1j > 2j > 5j > 15j...)
//    En cas d'égalité sur daysLeft : score de profil (si profil actif) puis tirage aléatoire quotidien.
// 2. Œuvres sans date d'expiration (ou pérennes) :
//    Triées par score d'affinité profil décroissant (si profil actif) puis tirage aléatoire quotidien.
function sortCatalogItems(items) {
  const withExpiry = [];
  const withoutExpiry = [];

  for (const it of items) {
    const dLeft = getItemDaysLeft(it);
    if (dLeft !== null && dLeft >= 0) {
      withExpiry.push({ item: it, daysLeft: dLeft });
    } else {
      withoutExpiry.push(it);
    }
  }

  // 1. Tri des urgences d'expiration (croissant : les plus proches de quitter le catalogue en premier)
  withExpiry.sort((a, b) => {
    const diff = a.daysLeft - b.daysLeft;
    if (diff !== 0) return diff;

    if (AppState.activeProfile && AppState.activeProfile !== 'none') {
      const scoreDiff = computeProfileAffinity(b.item, AppState.activeProfile) - computeProfileAffinity(a.item, AppState.activeProfile);
      if (scoreDiff !== 0) return scoreDiff;
    }

    return getDailyScore(a.item) - getDailyScore(b.item);
  });

  // 2. Tri des œuvres sans date d'expiration
  withoutExpiry.sort((a, b) => {
    if (AppState.activeProfile && AppState.activeProfile !== 'none') {
      const scoreDiff = computeProfileAffinity(b, AppState.activeProfile) - computeProfileAffinity(a, AppState.activeProfile);
      if (scoreDiff !== 0) return scoreDiff;
    }

    return getDailyScore(a) - getDailyScore(b);
  });

  return [...withExpiry.map(x => x.item), ...withoutExpiry];
}

// Préchargement proactif des affiches HD et logos
function preloadAllCatalogImages() {
  if (!AppState.catalog || !AppState.catalog.length) return;

  ['10', '12', '16', '18'].forEach(b => {
    const img = new Image();
    img.src = `assets/logos/pegi_${b}.png`;
  });

  const priorityUrls = new Set();
  const secondaryUrls = new Set();

  const addLogos = (item, targetSet) => {
    if (item.logos_chaine && item.logos_chaine.length) {
      item.logos_chaine.forEach(l => { if (l) targetSet.add(l); });
    } else if (item.logo_chaine) {
      targetSet.add(item.logo_chaine);
    }
  };

  const eligible = getCategoryEligibleItems();
  eligible.forEach(item => {
    if (item.poster) priorityUrls.add(item.poster);
    addLogos(item, priorityUrls);
  });

  AppState.catalog.forEach(item => {
    if (item.poster && !priorityUrls.has(item.poster)) secondaryUrls.add(item.poster);
    addLogos(item, secondaryUrls);
  });

  const fullQueue = [...Array.from(priorityUrls), ...Array.from(secondaryUrls)];
  const total = fullQueue.length;
  let cursor = 0;
  const maxConcurrency = 16;
  let activeLoads = 0;

  function processQueue() {
    while (activeLoads < maxConcurrency && cursor < total) {
      const url = fullQueue[cursor++];
      activeLoads++;
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        activeLoads--;
        processQueue();
      };
      img.src = url;
    }
  }

  processQueue();
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSearchBar();
  initBouquetsNavigation();
  initStarsNavigation();
  initDurationFilter();
  initModal();
  initSyncControls();

  // Chargement initial depuis la mémoire locale permanente ou le catalogue officiel
  const cached = JustWatchEngine.getCachedCatalog();
  if (cached && cached.length > 0) {
    AppState.catalog = cached;
  } else if (typeof CATALOG_DATA !== 'undefined' && CATALOG_DATA.length > 0) {
    AppState.catalog = CATALOG_DATA;
    JustWatchEngine.saveCatalogToCache(CATALOG_DATA);
    if (!JustWatchEngine.getLastSyncDate()) {
      JustWatchEngine.saveFullSyncDate();
    }
  }

  refreshApplicationUI();
  updateSyncStatusDisplay();

  // Vérification de synchronisation automatique :
  // - Complète intégrale UNIQUEMENT si catalogue < 300 titres ou > 30 jours
  // - Quotidienne (50 nouveautés) UNIQUEMENT si > 24h ou nouveau jour
  const currentCount = AppState.catalog.length;
  const needsFull = JustWatchEngine.shouldAutoFullSync() || currentCount < 300;
  const needsDaily = JustWatchEngine.shouldAutoRefresh();

  if (needsFull) {
    console.log('[CinéScope] Lancement synchronisation complète (catalogue intégral)...');
    await performLiveSync(true, true);
  } else if (needsDaily) {
    console.log('[CinéScope] Lancement synchronisation quotidienne (50 nouveautés)...');
    await performLiveSync(true, false);
  }
});

// Rafraîchir l'ensemble de l'interface
function refreshApplicationUI() {
  initCounts();
  initBouquetsCounts();
  updateMobileGenreDisplay(AppState.activeCategory);
  updateCategoryAutoStar();
  renderCatalog();
  preloadAllCatalogImages();
  updateFooterDate();
}

// Contrôles de synchronisation JustWatch
function initSyncControls() {
  const refreshBtn = document.getElementById('syncRefreshBtn');
  const syncStatusText = document.getElementById('syncStatusText');
  const syncDot = document.getElementById('syncDot');

  updateSyncStatusDisplay();

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async (e) => {
      if (AppState.isSyncing) return;
      // Clic normal -> Synchro quotidienne rapide (50 nouveautés)
      // Clic avec Shift -> Force la synchro complète (mensuelle)
      const isFull = e.shiftKey;
      await performLiveSync(false, isFull);
    });
  }
}

function updateSyncStatusDisplay() {
  const syncStatusText = document.getElementById('syncStatusText');
  const syncDot = document.getElementById('syncDot');
  if (!syncStatusText || !syncDot) return;

  const lastDate = JustWatchEngine.getLastSyncDate();
  if (lastDate) {
    const isToday = new Date().toDateString() === lastDate.toDateString();
    const hours = lastDate.getHours().toString().padStart(2, '0');
    const minutes = lastDate.getMinutes().toString().padStart(2, '0');
    syncStatusText.textContent = isToday ? `Synchro : Aujourd'hui à ${hours}h${minutes}` : `Synchro : ${lastDate.toLocaleDateString('fr-FR')}`;
    syncDot.className = 'sync-dot';
  } else {
    syncStatusText.textContent = 'Non synchronisé';
  }
}

async function performLiveSync(isSilent = false, isFullSync = false) {
  AppState.isSyncing = true;
  const refreshBtn = document.getElementById('syncRefreshBtn');
  const syncDot = document.getElementById('syncDot');
  const syncStatusText = document.getElementById('syncStatusText');

  if (refreshBtn) refreshBtn.classList.add('is-refreshing');
  if (syncDot) syncDot.className = 'sync-dot is-syncing';
  if (syncStatusText) {
    syncStatusText.textContent = isFullSync ? 'Synchro complète en cours...' : 'Actualisation des nouveautés...';
  }

  try {
    const freshData = await JustWatchEngine.fetchJustWatchData(isFullSync);
    if (freshData && freshData.length > 0) {
      AppState.catalog = freshData;
      refreshApplicationUI();
      if (syncDot) syncDot.className = 'sync-dot';
      updateSyncStatusDisplay();
    } else {
      throw new Error('Aucune donnée valide reçue');
    }
  } catch (err) {
    console.error('[CinéScope Sync Error]:', err);
    if (syncDot) syncDot.className = 'sync-dot is-error';
    if (syncStatusText) syncStatusText.textContent = 'Échec de connexion';
  } finally {
    AppState.isSyncing = false;
    if (refreshBtn) refreshBtn.classList.remove('is-refreshing');
  }
}

function updateFooterDate() {
  const footerDate = document.getElementById('footerDate');
  if (footerDate) {
    const last = JustWatchEngine.getLastSyncDate();
    const count = AppState.catalog.length;
    if (last) {
      footerDate.textContent = `Flux JustWatch connecté — ${count} œuvres qualifiées (Dernière synchro : ${last.toLocaleString('fr-FR')})`;
    } else {
      footerDate.textContent = `Flux JustWatch connecté — ${count} œuvres qualifiées`;
    }
  }
}

// Calcul des compteurs totaux pour les types de médias
function initCounts() {
  const eligibleFilms = AppState.catalog.filter(item => (item.type === 'film' || item.type === 'telefilm') && item.is_eligible);
  const eligibleSeries = AppState.catalog.filter(item => item.type === 'serie' && item.is_eligible);

  const filmsBadge = document.getElementById('filmsCount');
  const seriesBadge = document.getElementById('seriesCount');

  if (filmsBadge) filmsBadge.textContent = eligibleFilms.length;
  if (seriesBadge) seriesBadge.textContent = eligibleSeries.length;
}

// Calcul des compteurs de bouquets & profils
function initBouquetsCounts() {
  const eligibleTypeItems = AppState.catalog.filter(item => {
    if (!item.is_eligible) return false;
    return AppState.activeType === 'film' 
      ? (item.type === 'film' || item.type === 'telefilm')
      : (item.type === 'serie');
  });

  const countAll = eligibleTypeItems.length;
  const countOcs = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('aoc')).length;
  const countAction = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('aca')).length;
  const countUniversal = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('auc')).length;
  
  // Scope du filtre selon le bouquet actif
  const currentScope = (AppState.activeBouquet && AppState.activeBouquet !== 'all')
    ? eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes(AppState.activeBouquet))
    : eligibleTypeItems;
  const countExclusive = currentScope.filter(i => !isItemExcludedByPrimeOrTnt(i)).length;

  // Compteur séries sans S1
  const countNoS1 = AppState.activeType === 'serie' 
    ? currentScope.filter(i => !hasSeasonOne(i)).length 
    : 0;

  // Compteurs des 4 profils
  const countProfileUser = currentScope.filter(i => isItemMatchingProfile(i, 'user')).length;
  const countProfileAmi = currentScope.filter(i => isItemMatchingProfile(i, 'ami')).length;
  const countProfileAmie = currentScope.filter(i => isItemMatchingProfile(i, 'amie')).length;
  const countProfileDuo = currentScope.filter(i => isItemMatchingProfile(i, 'duo')).length;

  const elAll = document.getElementById('countPkgAll');
  const elOcs = document.getElementById('countPkgOcs');
  const elAction = document.getElementById('countPkgAction');
  const elUniv = document.getElementById('countPkgUniversal');
  const elExclusive = document.getElementById('countPkgExclusive');
  const elExcludeNoS1 = document.getElementById('countExcludeNoS1');
  const elProfileUser = document.getElementById('countProfileUser');
  const elProfileAmi = document.getElementById('countProfileAmi');
  const elProfileAmie = document.getElementById('countProfileAmie');
  const elProfileDuo = document.getElementById('countProfileDuo');

  if (elAll) elAll.textContent = countAll;
  if (elOcs) elOcs.textContent = countOcs;
  if (elAction) elAction.textContent = countAction;
  if (elUniv) elUniv.textContent = countUniversal;
  if (elExclusive) elExclusive.textContent = countExclusive;
  if (elExcludeNoS1) elExcludeNoS1.textContent = countNoS1;
  if (elProfileUser) elProfileUser.textContent = countProfileUser;
  if (elProfileAmi) elProfileAmi.textContent = countProfileAmi;
  if (elProfileAmie) elProfileAmie.textContent = countProfileAmie;
  if (elProfileDuo) elProfileDuo.textContent = countProfileDuo;
}

// Navigation par bouquets, Filtre d'exclusion Prime/TNT, Filtre sans S1 & Profils Amis
function initBouquetsNavigation() {
  const bouquetBtns = document.querySelectorAll('.bouquets-chips-group .bouquet-btn[data-package]');
  bouquetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bouquetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeBouquet = btn.dataset.package || 'all';
      initBouquetsCounts();
      updateCategoryAutoStar();
      renderCatalog();
    });
  });

  const exclusiveBtn = document.getElementById('pkgExclusive');
  if (exclusiveBtn) {
    exclusiveBtn.addEventListener('click', () => {
      AppState.isExclusiveOnly = !AppState.isExclusiveOnly;
      exclusiveBtn.classList.toggle('active', AppState.isExclusiveOnly);
      updateCategoryAutoStar();
      renderCatalog();
    });
  }

  const excludeNoS1Btn = document.getElementById('pkgExcludeNoS1');
  if (excludeNoS1Btn) {
    excludeNoS1Btn.addEventListener('click', () => {
      AppState.isExcludeNoS1 = !AppState.isExcludeNoS1;
      excludeNoS1Btn.classList.toggle('active', AppState.isExcludeNoS1);
      updateCategoryAutoStar();
      renderCatalog();
    });
  }

  const profileBtns = document.querySelectorAll('.bouquets-chips-group .profile-btn');
  profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedProfile = btn.dataset.profile;
      if (AppState.activeProfile === selectedProfile) {
        // Désactivation au deuxième clic
        AppState.activeProfile = 'none';
        btn.classList.remove('active');
      } else {
        AppState.activeProfile = selectedProfile;
        profileBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Verrouillage automatique sur 'Tous les titres'
        setCategory('all');
      }
      updateCategoryAutoStar();
      renderCatalog();
    });
  });
}

// Navigation par type et catégories
function initNavigation() {
  const mediaTabs = document.querySelectorAll('.nav-tab');
  mediaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      mediaTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      AppState.activeType = tab.dataset.type;
      initBouquetsCounts();
      updateCategoryAutoStar();
      renderCatalog();
    });
  });

  const catButtons = document.querySelectorAll('.category-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetCat = btn.dataset.category;
      setCategory(targetCat);
    });
  });

  const dropdownBtn = document.getElementById('genreDropdownBtn');
  const dropdownMenu = document.getElementById('genreDropdownMenu');
  const genreOptions = document.querySelectorAll('.genre-option');

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains('open');
      if (isOpen) {
        closeGenreDropdown();
      } else {
        openGenreDropdown();
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        closeGenreDropdown();
      }
    });

    genreOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const targetCat = opt.dataset.category;
        setCategory(targetCat);
        closeGenreDropdown();
      });
    });
  }
}

function openGenreDropdown() {
  const dropdownBtn = document.getElementById('genreDropdownBtn');
  const dropdownMenu = document.getElementById('genreDropdownMenu');
  if (!dropdownMenu || !dropdownBtn) return;
  dropdownMenu.classList.add('open');
  dropdownBtn.classList.add('open');
  dropdownBtn.setAttribute('aria-expanded', 'true');
}

function closeGenreDropdown() {
  const dropdownBtn = document.getElementById('genreDropdownBtn');
  const dropdownMenu = document.getElementById('genreDropdownMenu');
  if (!dropdownMenu || !dropdownBtn) return;
  dropdownMenu.classList.remove('open');
  dropdownBtn.classList.remove('open');
  dropdownBtn.setAttribute('aria-expanded', 'false');
}

function setCategory(targetCat) {
  // Si on clique sur une catégorie spécifique et qu'un profil était actif, désactiver le profil
  if (targetCat !== 'all' && AppState.activeProfile !== 'none') {
    AppState.activeProfile = 'none';
    const profileBtns = document.querySelectorAll('.bouquets-chips-group .profile-btn');
    profileBtns.forEach(b => b.classList.remove('active'));
  }

  AppState.activeCategory = targetCat;
  AppState.isAutoStars = true;

  const catButtons = document.querySelectorAll('.category-btn');
  catButtons.forEach(b => {
    b.classList.toggle('active', b.dataset.category === targetCat);
  });

  const genreOptions = document.querySelectorAll('.genre-option');
  genreOptions.forEach(o => {
    const isSelected = o.dataset.category === targetCat;
    o.classList.toggle('active', isSelected);
    o.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });

  updateMobileGenreDisplay(targetCat);
  updateCategoryAutoStar();
  renderCatalog();
}

function updateMobileGenreDisplay(categoryKey) {
  const info = CATEGORIES_INFO[categoryKey] || CATEGORIES_INFO.all;
  const iconEl = document.getElementById('selectedGenreIcon');
  const textEl = document.getElementById('selectedGenreText');
  if (iconEl) iconEl.textContent = info.icon;
  if (textEl) textEl.textContent = info.title;
}

// Filtre des étoiles
function initStarsNavigation() {
  const starButtons = document.querySelectorAll('.star-btn');
  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      starButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeStars = btn.dataset.stars;
      AppState.isAutoStars = false;
      renderCatalog();
    });
  });
}

// Filtre de Durée
function parseDurationMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return null;
  const match = durationStr.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  if (hours === 0 && minutes === 0) return null;
  return hours * 60 + minutes;
}

function getDurationMinMinutes() {
  const h = parseInt(document.getElementById('durationMinH')?.value || '0', 10) || 0;
  const m = parseInt(document.getElementById('durationMinM')?.value || '0', 10) || 0;
  if (h === 0 && m === 0 && !document.getElementById('durationMinH')?.value && !document.getElementById('durationMinM')?.value) {
    return null;
  }
  return h * 60 + m;
}

function getDurationMaxMinutes() {
  const h = parseInt(document.getElementById('durationMaxH')?.value || '0', 10) || 0;
  const m = parseInt(document.getElementById('durationMaxM')?.value || '0', 10) || 0;
  if (h === 0 && m === 0 && !document.getElementById('durationMaxH')?.value && !document.getElementById('durationMaxM')?.value) {
    return null;
  }
  return h * 60 + m;
}

function initDurationFilter() {
  const minH = document.getElementById('durationMinH');
  const minM = document.getElementById('durationMinM');
  const maxH = document.getElementById('durationMaxH');
  const maxM = document.getElementById('durationMaxM');
  const resetBtn = document.getElementById('durationResetBtn');

  const updateResetBtnVisibility = () => {
    const hasValue = (minH?.value || minM?.value || maxH?.value || maxM?.value);
    if (resetBtn) resetBtn.classList.toggle('visible', !!hasValue);
  };

  const validateAndFormatDurationGroup = (hInput, mInput) => {
    let hVal = parseInt(hInput.value, 10);
    let mVal = parseInt(mInput.value, 10);
    if (isNaN(hVal) && isNaN(mVal)) {
      hInput.value = '';
      mInput.value = '';
      return;
    }
    if (isNaN(hVal)) hVal = 0;
    if (isNaN(mVal)) mVal = 0;
    if (mVal >= 60) {
      hVal += Math.floor(mVal / 60);
      mVal = mVal % 60;
    }
    if (hVal > 9) hVal = 9;
    hInput.value = hVal.toString();
    mInput.value = mVal.toString().padStart(2, '0');
  };

  const onDurationInput = () => {
    updateResetBtnVisibility();
    updateCategoryAutoStar();
    renderCatalog();
  };

  const setupGroup = (hInput, mInput) => {
    if (!hInput || !mInput) return;
    const handleBlur = (e) => {
      setTimeout(() => {
        const active = document.activeElement;
        if (active !== hInput && active !== mInput) {
          if (hInput.value !== '' || mInput.value !== '') {
            validateAndFormatDurationGroup(hInput, mInput);
            updateResetBtnVisibility();
            updateCategoryAutoStar();
            renderCatalog();
          }
        }
      }, 50);
    };

    hInput.addEventListener('input', () => {
      const clean = hInput.value.replace(/\D/g, '');
      if (clean !== hInput.value) hInput.value = clean;
      onDurationInput();
      if (hInput.value.length >= 1) mInput.focus();
    });

    hInput.addEventListener('focus', () => hInput.select());
    hInput.addEventListener('blur', handleBlur);
    hInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        validateAndFormatDurationGroup(hInput, mInput);
        updateResetBtnVisibility();
        hInput.blur();
        updateCategoryAutoStar();
        renderCatalog();
      }
    });

    mInput.addEventListener('input', () => {
      const clean = mInput.value.replace(/\D/g, '');
      if (clean !== mInput.value) mInput.value = clean;
      onDurationInput();
    });

    mInput.addEventListener('focus', () => mInput.select());
    mInput.addEventListener('blur', handleBlur);
    mInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        validateAndFormatDurationGroup(hInput, mInput);
        updateResetBtnVisibility();
        mInput.blur();
        updateCategoryAutoStar();
        renderCatalog();
      } else if (e.key === 'Backspace' && mInput.value === '') {
        hInput.focus();
        hInput.select();
      }
    });
  };

  setupGroup(minH, minM);
  setupGroup(maxH, maxM);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (minH) minH.value = '';
      if (minM) minM.value = '';
      if (maxH) maxH.value = '';
      if (maxM) maxM.value = '';
      resetBtn.classList.remove('visible');
      updateCategoryAutoStar();
      renderCatalog();
    });
  }
}

// Barre de recherche par titre (PC uniquement)
function initSearchBar() {
  const searchInput = document.getElementById('titleSearchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  if (!searchInput) return;

  const handleSearchInput = (val) => {
    AppState.searchQuery = (val || '').trim();
    if (clearBtn) {
      clearBtn.classList.toggle('visible', AppState.searchQuery.length > 0);
    }
    updateCategoryAutoStar();
    renderCatalog();
  };

  searchInput.addEventListener('input', (e) => {
    handleSearchInput(e.target.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      handleSearchInput('');
      searchInput.blur();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      handleSearchInput('');
      searchInput.focus();
    });
  }
}

// Items éligibles avant filtre d'étoiles
function getFilteredItemsBeforeStars() {
  let items = getCategoryEligibleItems();
  const minMin = getDurationMinMinutes();
  const maxMin = getDurationMaxMinutes();

  if (minMin !== null || maxMin !== null) {
    items = items.filter(item => {
      const dur = parseDurationMinutes(item.duree);
      if (dur === null) return false;
      if (minMin !== null && dur < minMin) return false;
      if (maxMin !== null && dur > maxMin) return false;
      return true;
    });
  }

  return items;
}

function updateCategoryAutoStar() {
  const categoryEligible = getFilteredItemsBeforeStars();
  updateStarButtonsCounts(categoryEligible);

  if (AppState.isAutoStars) {
    const autoTier = getAutoStarTier(categoryEligible);
    AppState.activeStars = autoTier;
    
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.stars === autoTier);
    });
  }
}

function getCategoryEligibleItems() {
  return AppState.catalog.filter(item => {
    if (!item.is_eligible) return false;

    // Filtre Recherche Titre (PC uniquement)
    if (AppState.searchQuery) {
      const cleanQuery = AppState.searchQuery
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const cleanTitle = (item.titre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (!cleanTitle.includes(cleanQuery)) {
        return false;
      }
    }
    
    // Filtre Type
    if (AppState.activeType === 'film') {
      if (item.type !== 'film' && item.type !== 'telefilm') return false;
    } else {
      if (item.type !== AppState.activeType) return false;
    }

    // Filtre Bouquet
    if (AppState.activeBouquet && AppState.activeBouquet !== 'all') {
      if (!item.package_slugs || !item.package_slugs.includes(AppState.activeBouquet)) {
        return false;
      }
    }

    // Filtre d'Exclusion Stricte (Hors Prime Video & Hors TNT)
    if (AppState.isExclusiveOnly) {
      if (isItemExcludedByPrimeOrTnt(item)) {
        return false;
      }
    }

    // Filtre d'Exclusion des Séries sans Saison 1
    if (AppState.isExcludeNoS1) {
      if (item.type === 'serie' && !hasSeasonOne(item)) {
        return false;
      }
    }

    // Filtre de Profils Recommandés (Moi, Ami, Amie)
    if (AppState.activeProfile && AppState.activeProfile !== 'none') {
      if (!isItemMatchingProfile(item, AppState.activeProfile)) {
        return false;
      }
    }

    // Filtre Catégorie
    if (AppState.activeCategory !== 'all') {
      if (!item.categories || !item.categories.includes(AppState.activeCategory)) return false;
    }

    return true;
  });
}

function updateStarButtonsCounts(items) {
  const cAll = items.length;
  const c4 = items.filter(it => matchesStars(it, '4')).length;
  const c5 = items.filter(it => matchesStars(it, '5')).length;

  const elAll = document.getElementById('countStarAll');
  const el4 = document.getElementById('countStar4');
  const el5 = document.getElementById('countStar5');

  if (elAll) elAll.textContent = cAll;
  if (el4) el4.textContent = c4;
  if (el5) el5.textContent = c5;
}

// Rendu du catalogue
function renderCatalog() {
  const grid = document.getElementById('postersGrid');
  const emptyState = document.getElementById('emptyState');
  const titleEl = document.getElementById('currentCategoryTitle');
  const descEl = document.getElementById('currentCategoryDesc');
  const countEl = document.getElementById('displayedCount');

  const catInfo = CATEGORIES_INFO[AppState.activeCategory] || CATEGORIES_INFO.all;
  if (titleEl) {
    const mediaLabel = AppState.activeType === 'film' ? 'Films' : 'Séries';
    if (AppState.activeProfile && AppState.activeProfile !== 'none') {
      if (AppState.activeProfile === 'user') {
        titleEl.textContent = `Recommandations — Pour Moi (${mediaLabel})`;
      } else if (AppState.activeProfile === 'ami') {
        titleEl.textContent = `Recommandations — Pour mon Ami (${mediaLabel})`;
      } else if (AppState.activeProfile === 'amie') {
        titleEl.textContent = `Recommandations — Pour mon Amie (${mediaLabel})`;
      } else if (AppState.activeProfile === 'duo') {
        titleEl.textContent = `Recommandations — Pour Ami & Amie (Duo) (${mediaLabel})`;
      }
    } else {
      titleEl.textContent = AppState.activeCategory === 'all' 
        ? `Tous les ${mediaLabel.toLowerCase()}` 
        : `${catInfo.title} (${mediaLabel})`;
    }
  }
  if (descEl) {
    if (AppState.activeProfile && AppState.activeProfile !== 'none') {
      if (AppState.activeProfile === 'user') {
        descEl.textContent = '✨ Sélection sur-mesure : Mystère temporel, imaginaire fantastique, complicité protectrice & formats 26 min.';
      } else if (AppState.activeProfile === 'ami') {
        descEl.textContent = '🎯 Sélection 1er degré strict : Action grand spectacle, survie, anticipation & techno-thrillers.';
      } else if (AppState.activeProfile === 'amie') {
        descEl.textContent = '🔍 Sélection matière grise & déduction : Polars d\'enquête, duos complices, procès & joutes judiciaires.';
      } else if (AppState.activeProfile === 'duo') {
        descEl.textContent = '👫 Sélection commune : Équilibre idéal d\'action (11 à 33%), polars d\'investigation rythmés & techno-thrillers sans comédie potache.';
      }
      descEl.style.display = 'block';
    } else {
      descEl.textContent = catInfo.desc || '';
      descEl.style.display = catInfo.desc ? 'block' : 'none';
    }
  }

  let items = getFilteredItemsBeforeStars();
  updateStarButtonsCounts(items);
  items = items.filter(item => matchesStars(item, AppState.activeStars));

  // Tri intelligent : Fins de droits en tête par ordre d'urgence, puis aléatoire quotidien (ou affinité profil si actif)
  const sortedItems = sortCatalogItems(items);
  if (countEl) countEl.textContent = sortedItems.length;

  if (sortedItems.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    const emptyDesc = emptyState.querySelector('.empty-desc');
    if (emptyDesc) {
      emptyDesc.textContent = AppState.searchQuery 
        ? `Aucun titre ne correspond à « ${AppState.searchQuery} » pour cette sélection.`
        : 'Aucun contenu ne correspond aux critères stricts pour cette sélection actuellement.';
    }
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = '';

  sortedItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'poster-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Voir les détails de ${item.titre}`);
    card.title = item.titre;

    // Badge CSA / PEGI
    const badgeHtml = item.badge 
      ? `<div class="csa-badge-container"><img class="csa-badge-img" src="assets/logos/pegi_${item.badge}.png" alt="-${item.badge}"></div>` 
      : '';

    // Badge de Nouveauté (7 jours) ou Compte à rebours d'expiration
    // RÈGLE VISUELLE : Si l'œuvre est arrivée dans le catalogue depuis <= 7 jours, le badge "🆕 Nouveauté" prime sur l'affiche
    const expInfo = getItemExpirationInfo(item);
    let expiryHtml = '';
    if (isItemNew(item)) {
      expiryHtml = `<div class="card-expiry-badge badge-new" title="Nouveauté ajoutée au catalogue il y a moins de 7 jours">🆕 Nouveauté</div>`;
    } else if (expInfo && expInfo.label && expInfo.status !== 'none' && expInfo.status !== 'available') {
      expiryHtml = `<div class="card-expiry-badge expiry-${expInfo.status}">${expInfo.label}</div>`;
    }

    // Badge de Saison disponible (si la série n'a pas la S1 complète)
    let seasonBadgeHtml = '';
    if (item.type === 'serie' && !hasSeasonOne(item)) {
      const firstS = getFirstAvailableSeason(item);
      seasonBadgeHtml = `
        <div class="card-season-badge">
          <svg class="season-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Débute S${firstS}</span>
        </div>`;
    }

    // Logos des chaînes
    const logosList = item.logos_chaine && item.logos_chaine.length 
      ? item.logos_chaine 
      : (item.logo_chaine ? [item.logo_chaine] : []);
    const chainesList = item.chaines && item.chaines.length 
      ? item.chaines 
      : (item.chaine ? [item.chaine] : []);

    let channelLogoHtml = '';
    if (logosList.length > 0) {
      channelLogoHtml = logosList.map((logoUrl, i) => {
        const chName = chainesList[i] || item.chaine || '';
        return `<img class="card-channel-logo ${logosList.length > 1 ? 'is-multi-channel' : ''}" src="${logoUrl}" alt="${chName}">`;
      }).join('');
    } else {
      channelLogoHtml = `<span class="card-channel-text">${item.chaine}</span>`;
    }

    card.innerHTML = `
      <div class="poster-img-container">
        <img class="poster-img" src="${item.poster}" alt="Affiche ${item.titre}" decoding="async">
        ${expiryHtml}
        ${badgeHtml}
        ${seasonBadgeHtml}
        <div class="channel-logo-container ${logosList.length > 1 ? 'has-multiple-logos' : ''}">
          ${channelLogoHtml}
        </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(item));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(item);
      }
    });

    grid.appendChild(card);
  });
}

// Modale de détails
let savedScrollY = 0;

function initModal() {
  const modal = document.getElementById('movieModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    
    window.scrollTo({
      top: savedScrollY,
      left: 0,
      behavior: 'instant'
    });
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollY);
    });
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

function openModal(item) {
  savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

  const modal = document.getElementById('movieModal');
  const poster = document.getElementById('modalPoster');
  const title = document.getElementById('modalTitle');
  const typeBadge = document.getElementById('modalTypeBadge');
  const csaBadge = document.getElementById('modalCsaBadge');
  const year = document.getElementById('modalYear');
  const channel = document.getElementById('modalChannel');
  const duration = document.getElementById('modalDuration');
  const durationRow = document.getElementById('modalDurationRow');
  const durationLabel = document.getElementById('modalDurationLabel');
  const categories = document.getElementById('modalCategories');
  const rating = document.getElementById('modalRating');
  const ratingDetails = document.getElementById('modalRatingDetails');
  const expiry = document.getElementById('modalExpiry');
  const expiryRow = document.getElementById('modalExpiryRow');
  const synopsis = document.getElementById('modalSynopsis');

  poster.src = item.poster;
  poster.alt = item.titre;
  title.textContent = item.titre;
  typeBadge.textContent = item.type === 'serie' ? 'Série' : 'Film';
  if (item.type === 'serie' && item.annee_fin && item.annee_fin !== item.annee) {
    year.textContent = `${item.annee} - ${item.annee_fin}`;
  } else {
    year.textContent = item.annee || '-';
  }

  // Menu déroulant des saisons disponibles pour les séries
  const seasonWrapper = document.getElementById('modalSeasonSelectorWrapper');
  const seasonSelect = document.getElementById('modalSeasonSelect');

  if (item.type === 'serie') {
    const seasons = (item.saisons_disponibles && item.saisons_disponibles.length > 0)
      ? item.saisons_disponibles
      : [{ saison: 1, annee: item.annee, note: item.note_avis }];

    if (seasonWrapper && seasonSelect) {
      seasonSelect.innerHTML = '';
      seasons.forEach((s, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Saison ${s.saison}`;
        seasonSelect.appendChild(opt);
      });
      seasonWrapper.style.display = 'inline-flex';

      seasonSelect.onchange = (e) => {
        const selected = seasons[parseInt(e.target.value, 10)];
        if (selected && selected.annee) {
          year.textContent = selected.annee;
        }
      };
    }
  } else {
    if (seasonWrapper) {
      seasonWrapper.style.display = 'none';
    }
  }

  if (item.badge) {
    csaBadge.innerHTML = `<img class="modal-csa-badge-img" src="assets/logos/pegi_${item.badge}.png" alt="-${item.badge}">`;
    csaBadge.style.display = 'inline-flex';
  } else {
    csaBadge.innerHTML = '';
    csaBadge.style.display = 'none';
  }

  const chainesDisplay = item.chaines && item.chaines.length ? item.chaines.join(' • ') : (item.chaine || '-');
  channel.textContent = chainesDisplay;

  if (durationRow && duration) {
    if (item.duree) {
      durationRow.style.display = 'flex';
      duration.textContent = item.duree;
      if (durationLabel) durationLabel.textContent = item.type === 'serie' ? '⏱️ Épisode' : '⏱️ Durée';
    } else {
      durationRow.style.display = 'none';
    }
  }

  // Disponibilité / Expiration
  const expInfo = getItemExpirationInfo(item);
  if (expiryRow && expiry) {
    if (expInfo && expInfo.label && expInfo.status !== 'none' && expInfo.status !== 'available') {
      expiryRow.style.display = 'flex';
      expiry.textContent = expInfo.label;
      expiry.className = `info-value modal-expiry-val expiry-${expInfo.status}`;
    } else {
      expiryRow.style.display = 'none';
    }
  }

  // Catégorie unique
  categories.innerHTML = '';
  if (item.categories && item.categories.length) {
    item.categories.forEach(catKey => {
      const cat = CATEGORIES_INFO[catKey];
      if (cat) {
        const chip = document.createElement('span');
        chip.className = 'modal-cat-chip';
        chip.textContent = `${cat.icon} ${cat.title}`;
        categories.appendChild(chip);
      }
    });
  }

  // Note + Étoiles dans la capsule dorée (ex: 8.0 / 10 ★★★★★)
  if (rating) {
    const scoreVal = item.note_globale || item.note_avis || '-';
    const numScore = Number(scoreVal) || 0;
    const starCount = item.etoiles || (numScore >= 8 ? 5 : (numScore >= 7 ? 4 : 3));
    rating.innerHTML = `<span>${scoreVal} / 10</span><span class="modal-stars-pure">${'★'.repeat(starCount)}</span>`;
  }

  // Synopsis
  if (synopsis) {
    synopsis.textContent = item.synopsis || 'Aucun résumé disponible pour ce titre.';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}
