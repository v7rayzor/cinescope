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

// Configuration des sous-catégories déterministes en 1 mot (Exclusivité PC - Règle 8 AGENTS.md)
const SUB_CATEGORIES_CONFIG = {
  action_aventure: {
    label: 'Action & Aventure',
    subs: ['Action', 'Aventure'],
    color: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.35)'
  },
  thriller_policier: {
    label: 'Thriller & Policier',
    subs: ['Policier', 'Thriller'],
    color: '#e11d48',
    glow: 'rgba(225, 29, 72, 0.35)'
  },
  scifi_fantastique: {
    label: 'Science-fiction & Fantastique',
    subs: ['SF', 'Fantastique'],
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.35)'
  },
  horreur_epouvante: {
    label: 'Horreur & Épouvante',
    subs: ['Angoisse', 'Surnaturel', 'Slasher', 'Monstres'],
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.35)'
  },
  comedie: {
    label: 'Comédie',
    subs: ['Humour', 'Dramatique', 'Romantique', 'Musical'],
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.35)'
  },
  drame_emotion: {
    label: 'Drame & Émotion',
    subs: ['Social', 'Romance', 'Histoire'],
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.35)'
  },
  animation_famille: {
    label: 'Animation & Famille',
    subs: ['Animation', 'Famille'],
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)'
  }
};

// Liste exhaustive ordonnée des 19 sous-catégories indépendantes (Exclusivité Desktop PC - Règle 8 AGENTS.md)
// Calée rigoureusement sur l'ordre visuel des catégories mères : Action -> Thriller -> SF -> Horreur -> Comédie -> Drame -> Animation
const ALL_SUB_CATEGORIES = [
  // 1. Action & Aventure
  { name: 'Action', parent: 'action_aventure', icon: '🏹', color: '#ea580c', glow: 'rgba(234, 88, 12, 0.35)' },
  { name: 'Aventure', parent: 'action_aventure', icon: '🧭', color: '#ea580c', glow: 'rgba(234, 88, 12, 0.35)' },
  // 2. Thriller & Policier
  { name: 'Policier', parent: 'thriller_policier', icon: '🔍', color: '#e11d48', glow: 'rgba(225, 29, 72, 0.35)' },
  { name: 'Thriller', parent: 'thriller_policier', icon: '⚡', color: '#e11d48', glow: 'rgba(225, 29, 72, 0.35)' },
  // 3. Sci-Fi & Fantastique
  { name: 'SF', parent: 'scifi_fantastique', icon: '🚀', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)' },
  { name: 'Fantastique', parent: 'scifi_fantastique', icon: '🔮', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)' },
  // 4. Horreur & Épouvante (Positionné rigoureusement avant Comédie pour respecter la barre principale)
  { name: 'Slasher', parent: 'horreur_epouvante', icon: '🔪', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)' },
  { name: 'Surnaturel', parent: 'horreur_epouvante', icon: '👻', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)' },
  { name: 'Monstres', parent: 'horreur_epouvante', icon: '🧟', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)' },
  { name: 'Angoisse', parent: 'horreur_epouvante', icon: '😱', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)' },
  // 5. Comédie
  { name: 'Humour', parent: 'comedie', icon: '😂', color: '#eab308', glow: 'rgba(234, 179, 8, 0.35)' },
  { name: 'Dramatique', parent: 'comedie', icon: '🎭', color: '#eab308', glow: 'rgba(234, 179, 8, 0.35)' },
  { name: 'Romantique', parent: 'comedie', icon: '💕', color: '#eab308', glow: 'rgba(234, 179, 8, 0.35)' },
  { name: 'Musical', parent: 'comedie', icon: '🎵', color: '#eab308', glow: 'rgba(234, 179, 8, 0.35)' },
  // 6. Drame & Émotion
  { name: 'Social', parent: 'drame_emotion', icon: '🤝', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)' },
  { name: 'Histoire', parent: 'drame_emotion', icon: '📜', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)' },
  { name: 'Romance', parent: 'drame_emotion', icon: '❤️', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)' },
  // 7. Animation & Famille
  { name: 'Animation', parent: 'animation_famille', icon: '🎨', color: '#10b981', glow: 'rgba(16, 185, 129, 0.35)' },
  { name: 'Famille', parent: 'animation_famille', icon: '🧸', color: '#10b981', glow: 'rgba(16, 185, 129, 0.35)' }
];

// État global de l'application
const AppState = {
  activeType: 'film',          // 'film' ou 'serie'
  activeCategory: 'all',       // 'all' ou l'une des 7 catégories
  activeSubCategory: 'all',    // 'all' ou sous-catégorie déterministe (PC uniquement)
  activeProfile: null,         // null, 'moi', 'ami', 'amie', 'duo' (Curation profils PC uniquement)
  profileDisplayMode: '1',     // '1' = 7 propositions semaine, '2' = toutes les œuvres éligibles en colonnes par catégorie (PC)
  activeStars: 'all',          // 'all', '4', '5'
  activeBouquet: 'all',        // 'all', 'aoc', 'aca', 'auc', 'snr', 'sdz', 'ima', 'prv'
  isAmazonMode: false,         // true pour activer le catalogue Amazon Prime Video (exclusif PC)
  includeAmazon: false,        // true pour inclure Amazon Prime Video avec les autres bouquets sans les supprimer (exclusif PC)
  previousBouquetBeforeAmazon: 'all', // bouquet mémorisé avant d'activer le mode Amazon
  isExclusiveOnly: false,      // true pour exclure Prime Video
  isOnlyNew: false,            // true pour afficher uniquement les nouveautés récentes (PC uniquement)
  includeSpecialized: false,   // true pour inclure Sooner, Shadowz, Insomnia (false par défaut = exclu)
  isExcludeNoS1: false,        // true pour exclure les séries sans saison 1 disponible
  isAutoStars: true,           // true tant que l'utilisateur n'a pas forcé manuellement un choix
  searchQuery: '',             // Requête de recherche par titre (PC uniquement)
  starsSortOrder: 'none',      // 'none', 'desc' (meilleures étoiles -> moins bonnes), 'asc' (moins bonnes -> meilleures) (PC uniquement)
  dateSortOrder: 'none',       // 'none', 'desc' (récent -> ancien), 'asc' (ancien -> récent) (PC uniquement)
  avisSortOrder: 'none',       // 'none', 'desc' (meilleur avis -> moins bon), 'asc' (moins bon -> meilleur) (PC uniquement)
  enableThemeColumns: (function() {
    try {
      return localStorage.getItem('cinescope_theme_columns') !== 'false';
    } catch (e) {
      return true;
    }
  })(),                         // true pour afficher les 6 colonnes thématiques sur Tous les titres (PC), false pour grande grille classique
  isSyncing: false,
  catalog: []
};

// Vérifier si une œuvre provient d'un bouquet SVOD de base (Ciné+ OCS, Action Max, Universal+)
function isItemBasePaid(item) {
  if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.isItemBasePaid === 'function') {
    return JustWatchEngine.isItemBasePaid(item);
  }
  if (!item || !item.package_slugs) return false;
  return item.package_slugs.some(s => ['aoc', 'aca', 'auc'].includes(s));
}

// Vérifier si une œuvre provient d'une chaîne spécialisée (Sooner, Shadowz, Insomnia)
function isItemSpecialized(item) {
  if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.isItemSpecialized === 'function') {
    return JustWatchEngine.isItemSpecialized(item);
  }
  if (!item || !item.package_slugs) return false;
  return item.package_slugs.some(s => ['snr', 'sdz', 'ima'].includes(s));
}

// Vérifier si une œuvre provient de la TNT ou du catalogue gratuit Molotov
function isItemTntFree(item) {
  if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.isItemTntFree === 'function') {
    return JustWatchEngine.isItemTntFree(item);
  }
  if (!item) return false;
  if (item.on_tnt === true) return true;
  if (!item.package_slugs) return false;
  return item.package_slugs.some(s => ['mlt', 'tf1', 'sxp', 'fra'].includes(s));
}

// Vérifier si une œuvre est disponible sur Amazon Prime Video
function isItemOnPrimeVideo(item) {
  if (!item) return false;
  if (item.on_prime === true) return true;
  if (item.package_slugs && item.package_slugs.includes('prv')) return true;
  if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.isItemOnPrime === 'function') {
    return JustWatchEngine.isItemOnPrime(item);
  }
  return false;
}

// Vérifier si une œuvre est exclusive à Amazon Prime Video (ni bouquet de base, ni chaîne spécialisée)
function isItemOnlyOnPrime(item) {
  if (!item) return false;
  if (!isItemOnPrimeVideo(item)) return false;
  return !isItemBasePaid(item) && !isItemSpecialized(item);
}

// Propositions hebdomadaires de 7 films unitaires par profil (Règles 6, 7 & 8 AGENTS.md)
// Expiration > 10 jours garantie • Variété des sous-genres • Zéro TNT • Zéro Prime
const WEEKLY_PROPOSALS = {
  moi: {
    label: 'Moi',
    icon: '🧙‍♂️',
    desc: 'Curation hebdomadaire : Aventure Fantastique, Mystère Temporel, Paranormal Feutré & Épouvante 1er degré sans torture.',
    ids: [
      'jw-tm1433824', // Oddity (2024, Horreur surnaturelle & Manoir hanté)
      'jw-tm170839',  // Source Code (2011, SF, boucle temporelle & romance)
      'jw-tm148548',  // Hors du temps (2009, Mystère temporel & romance protectrice)
      'jw-tm469231',  // La Belle Époque (2019, Voyage d'époque & comédie sensible)
      'jw-tm1425480', // Mlle Bottine (2024, Comédie feel-good & tandem complice)
      'jw-tm1561453', // Le Secret de Khéops (2025, Quête archéologique & trésor)
      'jw-tm1372859'  // T.I.M. (2023, Anticipation feutrée & maison connectée)
    ]
  },
  ami: {
    label: 'Ami',
    icon: '👤',
    desc: 'Curation hebdomadaire : Action physique, Survie extrême, Monstres & Suspense au 1er degré sans temps mort (zéro animation).',
    ids: [
      'jw-tm1038333', // Black Phone (2022, Horreur claustrophobe & tueur masqué)
      'jw-tm453584',  // Mission : Impossible - The Final Reckoning (2025, Cascades & adrénaline)
      'jw-tm1076773', // Le Dernier Voyage du Demeter (2023, Traque de Dracula en pleine mer)
      'jw-tm244173',  // Jungle (2017, Survie extrême en forêt amazonienne)
      'jw-tm60292',   // Argo (2012, Infiltration sous haute tension à Téhéran)
      'jw-tm244634',  // Atomic Blonde (2017, Combats physiques brutaux & espionnage)
      'jw-tm170890'   // Super 8 (2011, Catastrophe spectaculaire & menace extraterrestre)
    ]
  },
  amie: {
    label: 'Amie',
    icon: '👩',
    desc: 'Curation hebdomadaire : Matière grise, Enquêtes judiciaires, Déduction, Romances tendres & Comédies douces (zéro vulgarité potache).',
    ids: [
      'jw-tm998431',  // Aurora Teagarden : Les secrets oubliés (2021, Cosy crime & déduction)
      'jw-tm1040743', // Là où chantent les écrevisses (2022, Drame romantique & procès)
      'jw-tm64395',   // Un bonheur n'arrive jamais seul (2012, Comédie romantique chaleureuse)
      'jw-tm1622508', // Deux procureurs (2025, Polar judiciaire & prétoire)
      'jw-tm1496573', // Jane Austen a gâché ma vie (2025, Comédie d'esprit & lettres)
      'jw-tm244229',  // Everybody Knows (2018, Secrets de famille & disparition)
      'jw-tm367470'   // Mia et le lion blanc (2018, Aventure & émotion en savane)
    ]
  },
  duo: {
    label: 'Duo',
    icon: '👫',
    desc: 'Consensus Ami + Amie : Polars rythmés, Techno-Thrillers & Grands récits d\'Aventure (KO Action pure, OK Aventure/Survie).',
    ids: [
      'jw-tm1040743', // Là où chantent les écrevisses (2022)
      'jw-tm244173',  // Jungle (2017)
      'jw-tm60292',   // Argo (2012)
      'jw-tm170890',  // Super 8 (2011)
      'jw-tm1570880', // Novocaïne (2025)
      'jw-tm305296',  // Sang Froid (2019)
      'jw-tm1393841'  // Noir comme neige : Morts au Sommet (2023)
    ]
  }
};

// Qualification déterministe et universelle d'éligibilité selon le profil sélectionné (Règles 6 & 7 AGENTS.md)
function isItemEligibleForProfile(item, profileKey) {
  if (!item || !profileKey) return false;
  // Exclusion stricte TNT et Prime standard (Règle 6)
  if (item.on_tnt || item.on_prime) return false;
  const cat = (item.categories && item.categories[0]) || '';
  const syn = (item.synopsis || '').toLowerCase();
  const raw = item.raw_genres || [];
  let sub = '';
  if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.computeSubCategory === 'function') {
    sub = JustWatchEngine.computeSubCategory(item);
  }

  if (profileKey === 'moi') {
    // 1. Zéro guerre réaliste avec fusillades lourdes (sauf SF/Fantastique)
    if (raw.includes('war') && !raw.includes('fnt') && !raw.includes('scf')) return false;
    // 2. Zéro torture porn / boucherie gore / slasher sanglant
    if (sub === 'Slasher' || /\b(gore|torture|tronconneuse|massacre au hachoir|boucherie)\b/i.test(syn)) return false;
    // 3. Animation adulte ou enfantine faible note (< 7) exclue
    if (cat === 'animation_famille' && sub === 'Animation' && (item.note_avis || 0) < 7) return false;
    // 4. Action armée lourde éliminée au profit de l'Aventure
    if (cat === 'action_aventure' && sub !== 'Aventure') {
      if (raw.includes('war') || (item.badge && ['16', '18'].includes(item.badge))) return false;
    }
    return true;
  }

  if (profileKey === 'ami') {
    // 1. Exclusion absolue de toute l'animation
    if (cat === 'animation_famille') return false;
    // 2. Exclusion des comédies romantiques ou dramatiques lentes
    if (cat === 'comedie' && (sub === 'Romantique' || sub === 'Dramatique' || sub === 'Musical')) return false;
    // 3. Exclusion des drames sentimentaux purs ou contemplatifs
    if (cat === 'drame_emotion' && (sub === 'Romance' || sub === 'Social')) return false;
    return true;
  }

  if (profileKey === 'amie') {
    // 1. Exclusion absolue de l'animation et de l'horreur
    if (cat === 'animation_famille' || cat === 'horreur_epouvante') return false;
    // 2. Exclusion formelle de l'Action pure (seule l'Aventure est éligible)
    if (cat === 'action_aventure' && sub !== 'Aventure') return false;
    // 3. Exclusion des films de guerre
    if (raw.includes('war')) return false;
    // 4. Comédies : 0 comédie conne / potache (bloque badge 16/18 ou humour gras)
    if (cat === 'comedie' && sub === 'Humour' && item.badge && ['16', '18'].includes(item.badge)) return false;
    return true;
  }

  if (profileKey === 'duo') {
    // Consensus strict Ami + Amie
    return isItemEligibleForProfile(item, 'ami') && isItemEligibleForProfile(item, 'amie');
  }

  return true;
}

// Détermine la liste des diffuseurs ACTIFS d'une œuvre selon les filtres courants de l'utilisateur
function getActiveItemPackages(item) {
  if (!item) return [];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Si le Mode Amazon est actif (Exclusivité PC - Règle 8)
  if (!isMobile && AppState.isAmazonMode) {
    if (isItemOnPrimeVideo(item)) {
      return ['prv'];
    }
    return [];
  }

  if (!item.package_slugs || item.package_slugs.length === 0) {
    return [];
  }

  // 1. Si l'utilisateur est sur un bouquet spécifique (ex: puce 'aoc', 'auc', 'tf1', 'snr', etc.)
  if (AppState.activeBouquet && AppState.activeBouquet !== 'all') {
    if (item.package_slugs.includes(AppState.activeBouquet)) {
      return [AppState.activeBouquet];
    }
    return [];
  }

  // 2. Si l'utilisateur est dans "Tous les bouquets" ('all') :
  // Sur mobile : STRICTEMENT les bouquets payants de base (aoc, aca, auc)
  if (isMobile) {
    return item.package_slugs.filter(p => ['aoc', 'aca', 'auc'].includes(p));
  }

  // Sur Desktop PC :
  return item.package_slugs.filter(pkg => {
    // Bouquets payants de référence (toujours actifs par défaut)
    if (['aoc', 'aca', 'auc'].includes(pkg)) {
      return true;
    }

    // Chaînes spécialisées SVOD (Sooner, Shadowz, Insomnia) :
    // Actives UNIQUEMENT si le toggle + Spécialisées est allumé
    if (['snr', 'sdz', 'ima'].includes(pkg)) {
      return AppState.includeSpecialized;
    }

    // Amazon Prime Video :
    // Actif si le toggle + Amazon est allumé ou si le mode Amazon est actif
    if (pkg === 'prv') {
      return AppState.includeAmazon || AppState.isAmazonMode;
    }

    return false;
  });
}

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

// Déterminer le palier d'étoiles par défaut (sélectionne toujours toutes les étoiles quel que soit le nombre d'œuvres)
function getAutoStarTier(categoryEligibleItems) {
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

function getItemReleaseYear(item) {
  if (!item) return 0;
  if (typeof item.annee_moyenne === 'number' && !isNaN(item.annee_moyenne)) {
    return item.annee_moyenne;
  }
  if (typeof item.annee === 'number' && !isNaN(item.annee)) {
    return item.annee;
  }
  return 0;
}

// TRI GLOBAL DU CATALOGUE :
// - Si tri par avis actif : tri par note critique Allociné/TMDb/IMDb (décroissant ou croissant).
// - Si tri par étoiles actif (PC uniquement) : tri par note d'étoiles (décroissant 5->1 ou croissant 1->5).
// - Si tri par date actif : tri chronologique strict par année (décroissant ou croissant).
// - Si tri par avis critique actif : tri sur la note critique spectateurs/presse.
// - Tri par défaut (PC & Mobile) : 1) Nouveautés ➔ 2) Date d'expiration (urgences en premier) ➔ 3) Note d'étoiles (5 ➔ 1).
function sortCatalogItems(items) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // 1. Tri par Note Avis critique (PC & Mobile)
  if (AppState.avisSortOrder && AppState.avisSortOrder !== 'none') {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const avisA = typeof a.note_avis === 'number' ? a.note_avis : 0;
      const avisB = typeof b.note_avis === 'number' ? b.note_avis : 0;
      const diffAvis = AppState.avisSortOrder === 'desc' ? (avisB - avisA) : (avisA - avisB);
      if (diffAvis !== 0) return diffAvis;

      // Départager par étoiles
      const starsA = typeof a.etoiles === 'number' ? a.etoiles : (typeof a.note_globale === 'number' ? Math.round(a.note_globale / 2) : 0);
      const starsB = typeof b.etoiles === 'number' ? b.etoiles : (typeof b.note_globale === 'number' ? Math.round(b.note_globale / 2) : 0);
      if (starsB !== starsA) return starsB - starsA;

      // En cas d'égalité sur l'avis, priorité aux urgences d'expiration
      const expA = getItemDaysLeft(a);
      const expB = getItemDaysLeft(b);
      if (expA !== null && expB !== null) {
        if (expA !== expB) return expA - expB;
      } else if (expA !== null) {
        return -1;
      } else if (expB !== null) {
        return 1;
      }

      // Puis départager par année de sortie la plus récente
      const yearA = getItemReleaseYear(a);
      const yearB = getItemReleaseYear(b);
      return yearB - yearA;
    });
    return sorted;
  }

  // 2. Tri par Date de sortie (PC & Mobile)
  if (AppState.dateSortOrder && AppState.dateSortOrder !== 'none') {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const yearA = getItemReleaseYear(a);
      const yearB = getItemReleaseYear(b);
      const diffYear = AppState.dateSortOrder === 'desc' ? (yearB - yearA) : (yearA - yearB);
      if (diffYear !== 0) return diffYear;

      // Départager par étoiles
      const starsA = typeof a.etoiles === 'number' ? a.etoiles : (typeof a.note_globale === 'number' ? Math.round(a.note_globale / 2) : 0);
      const starsB = typeof b.etoiles === 'number' ? b.etoiles : (typeof b.note_globale === 'number' ? Math.round(b.note_globale / 2) : 0);
      if (starsB !== starsA) return starsB - starsA;

      // En cas d'égalité sur l'année, priorité aux urgences d'expiration
      const expA = getItemDaysLeft(a);
      const expB = getItemDaysLeft(b);
      if (expA !== null && expB !== null) {
        if (expA !== expB) return expA - expB;
      } else if (expA !== null) {
        return -1;
      } else if (expB !== null) {
        return 1;
      }

      // Puis départager par note globale décroissante
      const noteA = typeof a.note_globale === 'number' ? a.note_globale : (a.note_avis || 0);
      const noteB = typeof b.note_globale === 'number' ? b.note_globale : (b.note_avis || 0);
      return noteB - noteA;
    });
    return sorted;
  }

  // 3. Tri par Étoiles (Exclusivité PC Desktop - Règle 8)
  if (!isMobile && AppState.starsSortOrder && AppState.starsSortOrder !== 'none') {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const starsA = typeof a.etoiles === 'number' ? a.etoiles : (typeof a.note_globale === 'number' ? Math.round(a.note_globale / 2) : 0);
      const starsB = typeof b.etoiles === 'number' ? b.etoiles : (typeof b.note_globale === 'number' ? Math.round(b.note_globale / 2) : 0);
      const diffStars = AppState.starsSortOrder === 'desc' ? (starsB - starsA) : (starsA - starsB);
      if (diffStars !== 0) return diffStars;

      // Départager par la note globale exacte sur 10
      const noteA = typeof a.note_globale === 'number' ? a.note_globale : (a.note_avis || 0);
      const noteB = typeof b.note_globale === 'number' ? b.note_globale : (b.note_avis || 0);
      const diffNote = noteB - noteA;
      if (diffNote !== 0) return diffNote;

      // En cas d'égalité, urgences d'expiration
      const expA = getItemDaysLeft(a);
      const expB = getItemDaysLeft(b);
      if (expA !== null && expB !== null) {
        if (expA !== expB) return expA - expB;
      } else if (expA !== null) {
        return -1;
      } else if (expB !== null) {
        return 1;
      }

      // Puis année de sortie la plus récente
      const yearA = getItemReleaseYear(a);
      const yearB = getItemReleaseYear(b);
      if (yearB !== yearA) return yearB - yearA;

      return getDailyScore(a) - getDailyScore(b);
    });
    return sorted;
  }

  // 4. TRI PAR DÉFAUT (PC & Mobile) : 1) Nouveautés ➔ 2) Date d'expiration ➔ 3) Note d'étoiles (5 ➔ 1)
  const sorted = [...items];
  sorted.sort((a, b) => {
    // 1) En 1 : Nouveautés (les nouveautés récentes en priorité)
    const isNewA = isItemNew(a) ? 1 : 0;
    const isNewB = isItemNew(b) ? 1 : 0;
    if (isNewB !== isNewA) return isNewB - isNewA;

    // 2) En 2 : Date d'expiration (titres quittant bientôt le catalogue en premier)
    const expA = getItemDaysLeft(a);
    const expB = getItemDaysLeft(b);
    const hasExpA = expA !== null && expA >= 0;
    const hasExpB = expB !== null && expB >= 0;
    if (hasExpA && hasExpB) {
      if (expA !== expB) return expA - expB;
    } else if (hasExpA) {
      return -1;
    } else if (hasExpB) {
      return 1;
    }

    // 3) En 3 : Note d'étoiles (5 ➔ 4 ➔ 3 ➔ 2 ➔ 1)
    const starsA = typeof a.etoiles === 'number' ? a.etoiles : (typeof a.note_globale === 'number' ? Math.round(a.note_globale / 2) : 0);
    const starsB = typeof b.etoiles === 'number' ? b.etoiles : (typeof b.note_globale === 'number' ? Math.round(b.note_globale / 2) : 0);
    const diffStars = starsB - starsA;
    if (diffStars !== 0) return diffStars;

    // Départager par la note globale exacte sur 10
    const noteA = typeof a.note_globale === 'number' ? a.note_globale : (a.note_avis || 0);
    const noteB = typeof b.note_globale === 'number' ? b.note_globale : (b.note_avis || 0);
    const diffNote = noteB - noteA;
    if (diffNote !== 0) return diffNote;

    // Puis année de sortie la plus récente
    const yearA = getItemReleaseYear(a);
    const yearB = getItemReleaseYear(b);
    if (yearB !== yearA) return yearB - yearA;

    return getDailyScore(a) - getDailyScore(b);
  });
  return sorted;
}

// Délégation d'événements centralisée pour l'ensemble des cartes de la grille (Élimine 3 000 closures en RAM)
function initGridDelegation() {
  const grid = document.getElementById('postersGrid');
  if (!grid) return;

  const triggerModalForTarget = (target) => {
    const card = target.closest('.poster-card');
    if (!card) return;
    const itemId = card.dataset.id;
    if (!itemId) return;
    const currentCatalog = getActiveCatalog();
    const item = currentCatalog.find(i => i.id === itemId);
    if (item) openModal(item);
  };

  grid.addEventListener('click', (e) => {
    triggerModalForTarget(e.target);
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.poster-card');
      if (card) {
        e.preventDefault();
        triggerModalForTarget(e.target);
      }
    }
  });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSearchBar();
  initBouquetsNavigation();
  initStarsNavigation();
  initDurationFilter();
  initSortControls();
  initProfileCurationButtons();
  initModal();
  initGridDelegation();
  initSyncControls();

  // Actualisation réactive lors du redimensionnement de la fenêtre (PC / Mobile)
  window.addEventListener('resize', () => {
    initCounts();
    initBouquetsCounts();
    renderCatalog();
  });

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
  updateFooterDate();
}

// Contrôles de synchronisation JustWatch (en tâche de fond)
function initSyncControls() {
  // Le bandeau d'en-tête a été épuré ; la synchro automatique tourne en arrière-plan
}

function updateSyncStatusDisplay() {
  // Conservé pour compatibilité interne
}

function updateSpecializedSyncDisplay() {
  const elDate = document.getElementById('syncSpecializedDate');
  if (!elDate) return;
  const d = (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.getLastSpecializedSyncDate === 'function')
    ? JustWatchEngine.getLastSpecializedSyncDate()
    : null;

  if (d && !isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    elDate.textContent = `${day}/${month}`;
    const btn = document.getElementById('btnSyncSpecialized');
    if (btn) btn.title = `Dernière synchro spécialisées : ${d.toLocaleDateString('fr-FR')} (Cliquer pour rafraîchir Sooner, Shadowz, Insomnia)`;
  } else {
    elDate.textContent = '--/--';
  }
}

async function syncSpecializedChannelsManually() {
  const btn = document.getElementById('btnSyncSpecialized');
  const countEl = document.getElementById('syncSpecializedDate');
  if (AppState.isSyncing) return;
  AppState.isSyncing = true;
  if (btn) btn.classList.add('is-refreshing');
  if (countEl) countEl.textContent = '...';

  try {
    console.log('[CinéScope] Synchronisation manuelle des chaînes spécialisées (Sooner, Shadowz, Insomnia)...');
    const freshData = await JustWatchEngine.fetchJustWatchData(false, ['snr', 'sdz', 'ima']);
    if (freshData && freshData.length > 0) {
      AppState.catalog = freshData;
      JustWatchEngine.saveSpecializedSyncDate();
      refreshApplicationUI();
    }
  } catch (err) {
    console.warn('[CinéScope] Erreur synchro spécialisée :', err.message);
  } finally {
    AppState.isSyncing = false;
    if (btn) btn.classList.remove('is-refreshing');
    updateSpecializedSyncDisplay();
  }
}

function updateAmazonSyncDisplay() {
  const elDate = document.getElementById('syncAmazonDate');
  if (!elDate) return;
  const d = (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.getLastAmazonSyncDate === 'function')
    ? JustWatchEngine.getLastAmazonSyncDate()
    : null;

  if (d && !isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    elDate.textContent = `${day}/${month}`;
    const btn = document.getElementById('btnSyncAmazon');
    if (btn) btn.title = `Dernière synchro Amazon Prime : ${d.toLocaleDateString('fr-FR')} (Cliquer pour rafraîchir le catalogue Prime Video)`;
  } else {
    elDate.textContent = '--/--';
  }
}

async function syncAmazonChannelsManually() {
  const btn = document.getElementById('btnSyncAmazon');
  const countEl = document.getElementById('syncAmazonDate');
  if (AppState.isSyncing) return;
  AppState.isSyncing = true;
  if (btn) btn.classList.add('is-refreshing');
  if (countEl) countEl.textContent = '...';

  try {
    console.log('[CinéScope] Synchronisation à la demande du catalogue Amazon Prime Video...');
    let reloaded = false;
    const urls = [
      `data/prime_catalog.js?t=${Date.now()}`,
      `https://raw.githubusercontent.com/v7rayzor/cinescope/main/data/prime_catalog.js?t=${Date.now()}`
    ];
    for (const u of urls) {
      try {
        const res = await fetch(u, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        const matchData = text.match(/const\s+PRIME_CATALOG_DATA\s*=\s*(\[[\s\S]*?\]);\s*(?:const|window)/)
          || text.match(/window\.PRIME_CATALOG_DATA\s*=\s*(\[[\s\S]*?\]);\s*(?:window|const|\n)/);
        if (matchData) {
          const parsed = JSON.parse(matchData[1]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.PRIME_CATALOG_DATA = parsed;
            reloaded = true;
            console.log(`[CinéScope] Catalogue Prime Video rechargé (${parsed.length} œuvres).`);
            break;
          }
        }
      } catch (err) {
        console.warn(`[CinéScope] Échec chargement Prime depuis ${u} :`, err.message);
      }
    }

    // Tenter également une synchro rapide JustWatch pour prv
    try {
      if (typeof JustWatchEngine !== 'undefined') {
        const freshData = await JustWatchEngine.fetchJustWatchData(false, ['prv']);
        if (freshData && freshData.length > 0) {
          AppState.catalog = freshData;
        }
      }
    } catch (e) { }

    if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.saveAmazonSyncDate === 'function') {
      JustWatchEngine.saveAmazonSyncDate();
    }
    initCounts();
    initBouquetsCounts();
    refreshApplicationUI();
  } catch (err) {
    console.warn('[CinéScope] Erreur synchro Amazon :', err.message);
  } finally {
    AppState.isSyncing = false;
    if (btn) btn.classList.remove('is-refreshing');
    updateAmazonSyncDisplay();
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

// Obtient le catalogue actif selon le mode (Catalogue standard Molotov vs Catalogue dédié Amazon Prime Video - Règle 8)
function getActiveCatalog() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const primeData = (typeof window !== 'undefined' && window.PRIME_CATALOG_DATA) || (typeof PRIME_CATALOG_DATA !== 'undefined' ? PRIME_CATALOG_DATA : null);
  if (!isMobile) {
    if ((AppState.isAmazonMode || AppState.activeBouquet === 'prv') && Array.isArray(primeData) && primeData.length > 0) {
      return primeData;
    }
    if (AppState.includeAmazon && Array.isArray(primeData) && primeData.length > 0) {
      const base = AppState.catalog || [];
      const PKG_ORDER = ['aoc', 'aca', 'auc', 'snr', 'sdz', 'ima', 'prv'];
      const primeMapById = new Map();
      const primeMapByKey = new Map();

      for (const p of primeData) {
        if (p.id) primeMapById.set(p.id, p);
        const norm = (p.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        primeMapByKey.set(`${norm}_${p.annee}_${p.type}`, p);
      }

      const seenIds = new Set();
      const seenKeys = new Set();
      const combined = [];

      for (const item of base) {
        if (item.id) seenIds.add(item.id);
        const norm = (item.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        const key = `${norm}_${item.annee}_${item.type}`;
        seenKeys.add(key);

        const p = primeMapById.get(item.id) || primeMapByKey.get(key);
        if (p) {
          if (p.id) seenIds.add(p.id);
          const pNorm = (p.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
          seenKeys.add(`${pNorm}_${p.annee}_${p.type}`);

          const mergedSlugs = Array.from(new Set([...(item.package_slugs || []), ...(p.package_slugs || []), 'prv']));
          mergedSlugs.sort((a, b) => {
            const idxA = PKG_ORDER.indexOf(a);
            const idxB = PKG_ORDER.indexOf(b);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
          });
          const mergedChaines = mergedSlugs.map(s => JustWatchEngine.PACKAGES_CONFIG[s]?.name).filter(Boolean);
          const mergedLogos = mergedSlugs.map(s => JustWatchEngine.PACKAGES_CONFIG[s]?.logo).filter(Boolean);

          combined.push({
            ...item,
            on_prime: true,
            package_slugs: mergedSlugs,
            chaines: mergedChaines.length > 0 ? mergedChaines : item.chaines,
            logos_chaine: mergedLogos.length > 0 ? mergedLogos : item.logos_chaine
          });
        } else {
          combined.push(item);
        }
      }

      for (const p of primeData) {
        const norm = (p.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        const key = `${norm}_${p.annee}_${p.type}`;
        if (!seenIds.has(p.id) && !seenKeys.has(key)) {
          combined.push(p);
          if (p.id) seenIds.add(p.id);
          seenKeys.add(key);
        }
      }
      return combined;
    }
  }
  return AppState.catalog || [];
}

// Calcul des compteurs totaux pour les types de médias
function initCounts() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const currentCatalog = getActiveCatalog();
  const eligibleFilms = currentCatalog.filter(item => {
    if (!item.is_eligible || (item.type !== 'film' && item.type !== 'telefilm')) return false;
    if (isMobile && !isItemBasePaid(item)) return false;
    return true;
  });
  const eligibleSeries = currentCatalog.filter(item => {
    if (!item.is_eligible || item.type !== 'serie') return false;
    if (isMobile && !isItemBasePaid(item)) return false;
    return true;
  });

  const filmsBadge = document.getElementById('filmsCount');
  const seriesBadge = document.getElementById('seriesCount');

  if (filmsBadge) filmsBadge.textContent = eligibleFilms.length;
  if (seriesBadge) seriesBadge.textContent = eligibleSeries.length;
}

// Calcul des compteurs de bouquets & toggles
function initBouquetsCounts() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const currentCatalog = getActiveCatalog();
  const eligibleTypeItems = currentCatalog.filter(item => {
    if (!item.is_eligible) return false;
    return AppState.activeType === 'film' 
      ? (item.type === 'film' || item.type === 'telefilm')
      : (item.type === 'serie');
  });

  const countAll = eligibleTypeItems.filter(i => {
    if (isMobile) return isItemBasePaid(i);
    if (isItemBasePaid(i)) return true;
    if (AppState.includeSpecialized && isItemSpecialized(i)) return true;
    if (AppState.includeAmazon && isItemOnPrimeVideo(i)) return true;
    return false;
  }).length;

  const countOcs = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('aoc')).length;
  const countAction = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('aca')).length;
  const countUniversal = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('auc')).length;

  // Chaînes Spécialisées (PC uniquement)
  const countSooner = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('snr')).length;
  const countShadowz = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('sdz')).length;
  const countInsomnia = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('ima')).length;
  
  // Amazon Prime Video (Exclusivité PC - Règle 8)
  const primeData = (typeof window !== 'undefined' && window.PRIME_CATALOG_DATA) || (typeof PRIME_CATALOG_DATA !== 'undefined' ? PRIME_CATALOG_DATA : null);
  const primeSource = (Array.isArray(primeData) && primeData.length > 0)
    ? primeData.filter(item => {
        if (!item.is_eligible) return false;
        return AppState.activeType === 'film' 
          ? (item.type === 'film' || item.type === 'telefilm')
          : (item.type === 'serie');
      })
    : eligibleTypeItems.filter(i => isItemOnPrimeVideo(i));
  const countAmazon = primeSource.length;

  // Compteur du toggle d'inclusion spécialisées
  const countSpecializedAvailable = eligibleTypeItems.filter(i => isItemSpecialized(i)).length;

  // Scope du filtre selon le bouquet actif
  const currentScope = (!isMobile && AppState.isAmazonMode)
    ? eligibleTypeItems.filter(i => isItemOnPrimeVideo(i))
    : ((AppState.activeBouquet && AppState.activeBouquet !== 'all')
        ? (AppState.activeBouquet === 'prv'
            ? eligibleTypeItems.filter(i => isItemOnPrimeVideo(i))
            : eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes(AppState.activeBouquet)))
        : eligibleTypeItems.filter(i => {
            if (isMobile) return isItemBasePaid(i);
            if (isItemBasePaid(i)) return true;
            if (AppState.includeSpecialized && isItemSpecialized(i)) return true;
            if (AppState.includeAmazon && isItemOnPrimeVideo(i)) return true;
            return false;
          }));

  const countExclusive = currentScope.filter(i => !isItemExcludedByPrimeOrTnt(i)).length;

  // Compteur nouveautés (Exclusivité PC)
  const countNew = currentScope.filter(i => isItemNew(i)).length;

  // Compteur séries sans S1
  const countNoS1 = AppState.activeType === 'serie' 
    ? currentScope.filter(i => !hasSeasonOne(i)).length 
    : 0;

  const elAll = document.getElementById('countPkgAll');
  const elOcs = document.getElementById('countPkgOcs');
  const elAction = document.getElementById('countPkgAction');
  const elUniv = document.getElementById('countPkgUniversal');
  const elSooner = document.getElementById('countPkgSooner');
  const elShadowz = document.getElementById('countPkgShadowz');
  const elInsomnia = document.getElementById('countPkgInsomnia');
  const elAmazon = document.getElementById('countPkgAmazon');
  const elExclusive = document.getElementById('countPkgExclusive');
  const elOnlyNew = document.getElementById('countOnlyNew');
  const elIncludeSpecialized = document.getElementById('countIncludeSpecialized');
  const elExcludeNoS1 = document.getElementById('countExcludeNoS1');
  const elToggleAmazon = document.getElementById('countToggleAmazon');
  const elIncludeAmazon = document.getElementById('countIncludeAmazon');

  if (elAll) elAll.textContent = countAll;
  if (elOcs) elOcs.textContent = countOcs;
  if (elAction) elAction.textContent = countAction;
  if (elUniv) elUniv.textContent = countUniversal;
  if (elSooner) elSooner.textContent = countSooner;
  if (elShadowz) elShadowz.textContent = countShadowz;
  if (elInsomnia) elInsomnia.textContent = countInsomnia;
  if (elAmazon) elAmazon.textContent = countAmazon;
  if (elExclusive) elExclusive.textContent = countExclusive;
  if (elOnlyNew) elOnlyNew.textContent = countNew;
  if (elIncludeSpecialized) elIncludeSpecialized.textContent = countSpecializedAvailable;
  if (elExcludeNoS1) elExcludeNoS1.textContent = countNoS1;
  if (elToggleAmazon) elToggleAmazon.textContent = countAmazon;
  if (elIncludeAmazon) elIncludeAmazon.textContent = countAmazon;

  updateSpecializedSyncDisplay();
  updateAmazonSyncDisplay();
}

// Navigation par bouquets, Filtre d'exclusion Prime/TNT, Toggles d'inclusion & Filtre sans S1
function initBouquetsNavigation() {
  const bouquetBtns = document.querySelectorAll('.bouquets-chips-group .bouquet-btn[data-package]');
  bouquetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bouquetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeBouquet = btn.dataset.package || 'all';
      if (AppState.activeBouquet !== 'prv' && AppState.isAmazonMode) {
        AppState.isAmazonMode = false;
        const toggleAmazonBtn = document.getElementById('toggleAmazonMode');
        if (toggleAmazonBtn) toggleAmazonBtn.classList.remove('active');
        document.body.classList.remove('amazon-mode-active');
      }
      initBouquetsCounts();
      updateCategoryAutoStar();
      renderCatalog();
    });
  });

  const btnSyncAmazon = document.getElementById('btnSyncAmazon');
  if (btnSyncAmazon) {
    btnSyncAmazon.addEventListener('click', async () => {
      await syncAmazonChannelsManually();
    });
  }

  const exclusiveBtn = document.getElementById('pkgExclusive');
  if (exclusiveBtn) {
    exclusiveBtn.addEventListener('click', () => {
      AppState.isExclusiveOnly = !AppState.isExclusiveOnly;
      exclusiveBtn.classList.toggle('active', AppState.isExclusiveOnly);
      updateCategoryAutoStar();
      renderCatalog();
    });
  }

  const btnSyncSpecialized = document.getElementById('btnSyncSpecialized');
  if (btnSyncSpecialized) {
    btnSyncSpecialized.addEventListener('click', async () => {
      await syncSpecializedChannelsManually();
    });
  }

  const toggleSpecializedBtn = document.getElementById('toggleIncludeSpecialized');
  if (toggleSpecializedBtn) {
    toggleSpecializedBtn.addEventListener('click', () => {
      AppState.includeSpecialized = !AppState.includeSpecialized;
      toggleSpecializedBtn.classList.toggle('active', AppState.includeSpecialized);
      initBouquetsCounts();
      updateCategoryAutoStar();
      renderCatalog();
    });
  }

  // Toggle Catalogue Amazon Prime Exclusif (Exclusivité PC - Règle 8)
  const toggleAmazonBtn = document.getElementById('toggleAmazonMode');
  const toggleIncludeAmazonBtn = document.getElementById('toggleIncludeAmazon');
  const pkgAmazonBtn = document.getElementById('pkgAmazon');

  if (toggleAmazonBtn) {
    toggleAmazonBtn.addEventListener('click', () => {
      AppState.isAmazonMode = !AppState.isAmazonMode;
      toggleAmazonBtn.classList.toggle('active', AppState.isAmazonMode);
      document.body.classList.toggle('amazon-mode-active', AppState.isAmazonMode);

      if (AppState.isAmazonMode) {
        if (AppState.includeAmazon) {
          AppState.includeAmazon = false;
          if (toggleIncludeAmazonBtn) toggleIncludeAmazonBtn.classList.remove('active');
        }
        AppState.previousBouquetBeforeAmazon = AppState.activeBouquet || 'all';
        AppState.activeBouquet = 'prv';
        if (pkgAmazonBtn) pkgAmazonBtn.classList.add('active');
        bouquetBtns.forEach(b => {
          if (b !== pkgAmazonBtn) b.classList.remove('active');
        });
      } else {
        AppState.activeBouquet = AppState.previousBouquetBeforeAmazon || 'all';
        if (pkgAmazonBtn) pkgAmazonBtn.classList.remove('active');
        const prevBtn = document.querySelector(`.bouquets-chips-group .bouquet-btn[data-package="${AppState.activeBouquet}"]`) || document.getElementById('pkgAll');
        if (prevBtn) prevBtn.classList.add('active');
      }

      initCounts();
      initBouquetsCounts();
      updateCategoryAutoStar();
      renderCatalog();
    });
  }

  // Toggle Inclusion Complémentaire Amazon Prime Video (Exclusivité PC - Règle 8)
  if (toggleIncludeAmazonBtn) {
    toggleIncludeAmazonBtn.addEventListener('click', () => {
      AppState.includeAmazon = !AppState.includeAmazon;
      toggleIncludeAmazonBtn.classList.toggle('active', AppState.includeAmazon);

      // Si le mode exclusif Amazon était actif, on le désactive pour revenir aux bouquets multiples
      if (AppState.includeAmazon && AppState.isAmazonMode) {
        AppState.isAmazonMode = false;
        if (toggleAmazonBtn) toggleAmazonBtn.classList.remove('active');
        document.body.classList.remove('amazon-mode-active');
        AppState.activeBouquet = 'all';
        bouquetBtns.forEach(b => b.classList.toggle('active', b.dataset.package === 'all'));
      }

      initCounts();
      initBouquetsCounts();
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
  const selectedBadge = document.getElementById('selectedGenreBadge');

  if (dropdownBtn && dropdownMenu) {
    const toggleDropdown = (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains('open');
      if (isOpen) {
        closeGenreDropdown();
      } else {
        openGenreDropdown();
      }
    };

    dropdownBtn.addEventListener('click', toggleDropdown);
    if (selectedBadge) {
      selectedBadge.addEventListener('click', toggleDropdown);
    }

    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target) && (!selectedBadge || !selectedBadge.contains(e.target))) {
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

    // Déploiement automatique du menu filtre à l'ouverture sur mobile (Idée utilisateur)
    if (window.innerWidth < 1024) {
      openGenreDropdown();
    }
  }

  // Clic sur les pilules des 6 colonnes thématiques PC (Règle 8 AGENTS.md)
  const themePills = document.querySelectorAll('.theme-col-pill');
  themePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetCat = pill.dataset.category;
      if (targetCat) {
        setCategory(targetCat);
      }
    });
  });

  // Sélecteur d'Affichage 1 / 2 sur PC (Exclusivité PC - Règle 8)
  const btnMode1 = document.getElementById('btnDisplayMode1');
  const btnMode2 = document.getElementById('btnDisplayMode2');

  if (btnMode1) {
    btnMode1.addEventListener('click', () => {
      if (AppState.activeProfile) {
        AppState.profileDisplayMode = '1';
      } else {
        AppState.enableThemeColumns = true;
        try {
          localStorage.setItem('cinescope_theme_columns', 'true');
        } catch (e) {}
      }
      renderCatalog();
    });
  }

  if (btnMode2) {
    btnMode2.addEventListener('click', () => {
      if (AppState.activeProfile) {
        AppState.profileDisplayMode = '2';
      } else {
        AppState.enableThemeColumns = false;
        try {
          localStorage.setItem('cinescope_theme_columns', 'false');
        } catch (e) {}
      }
      renderCatalog();
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
  AppState.activeCategory = targetCat;
  AppState.activeSubCategory = 'all'; // Réinitialise la sous-catégorie active
  AppState.activeProfile = null;      // Réinitialise le mode profil lors d'un choix de catégorie directe
  AppState.isAutoStars = true;

  const catButtons = document.querySelectorAll('.category-btn');
  catButtons.forEach(b => {
    const isAct = b.dataset.category === targetCat;
    b.classList.toggle('active', isAct);
    if (isAct && typeof b.scrollIntoView === 'function') {
      try {
        b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch (e) {
        // Fallback
      }
    }
  });

  const genreOptions = document.querySelectorAll('.genre-option');
  genreOptions.forEach(o => {
    const isSelected = o.dataset.category === targetCat;
    o.classList.toggle('active', isSelected);
    o.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });

  updateMobileGenreDisplay(targetCat);
  renderSubCategories();
  updateCategoryAutoStar();
  renderCatalog();
}

// Initialisation des boutons de Curation Profils Amis & Moi (Exclusivité Desktop PC - Règle 8 AGENTS.md)
function initProfileCurationButtons() {
  const profButtons = document.querySelectorAll('.profile-curation-btn');
  profButtons.forEach(b => {
    b.addEventListener('click', () => {
      const prof = b.dataset.profile;
      if (AppState.activeProfile === prof) {
        // Toggle désactivation : retour à la vue normale
        AppState.activeProfile = null;
        const catButtons = document.querySelectorAll('.category-btn');
        catButtons.forEach(cb => cb.classList.toggle('active', cb.dataset.category === AppState.activeCategory));
      } else {
        // Toggle activation du profil
        AppState.activeProfile = prof;
        AppState.activeSubCategory = 'all';
        // En mode profil, atténuer visuellement la sélection de catégorie pour clarifier la vue
        const catButtons = document.querySelectorAll('.category-btn');
        catButtons.forEach(cb => cb.classList.remove('active'));
      }
      renderSubCategories();
      renderCatalog();
    });
  });
}

// Affichage et gestion des sous-catégories indépendantes sur PC Desktop (Règles 7 & 8 AGENTS.md)
function renderSubCategories() {
  const subBarSection = document.getElementById('subcategoriesBarSection');
  const chipsGroup = document.getElementById('subcategoriesChipsGroup');
  const parentLabel = document.getElementById('subcatParentLabel');
  if (!subBarSection || !chipsGroup) return;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (isMobile) {
    subBarSection.style.display = 'none';
    return;
  }

  // Affichage permanent sur PC Desktop
  subBarSection.style.display = 'flex';
  if (parentLabel) {
    parentLabel.textContent = 'Sous-catégories :';
  }

  // Mise à jour visuelle des 4 boutons Profils Curation
  const profButtons = document.querySelectorAll('.profile-curation-btn');
  profButtons.forEach(b => {
    b.classList.toggle('active', AppState.activeProfile === b.dataset.profile);
  });

  // Calcul du nombre d'œuvres éligibles pour chaque sous-catégorie
  const itemsForCounts = getFilteredItemsBeforeStars({ ignoreSubCategory: true, ignoreCategory: true });
  const countsBySub = {};
  ALL_SUB_CATEGORIES.forEach(s => { countsBySub[s.name] = 0; });
  let totalAll = 0;

  itemsForCounts.forEach(it => {
    totalAll++;
    if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.computeSubCategory === 'function') {
      const s = JustWatchEngine.computeSubCategory(it);
      if (countsBySub[s] !== undefined) {
        countsBySub[s]++;
      }
    }
  });

  chipsGroup.innerHTML = '';

  // 1. Puce globale "✨ Tous"
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  const isAllActive = !AppState.activeProfile && AppState.activeSubCategory === 'all';
  allBtn.className = `subcat-btn ${isAllActive ? 'active' : ''}`;
  allBtn.innerHTML = `<span>✨ Tous</span><span class="subcat-count">${totalAll}</span>`;
  allBtn.addEventListener('click', () => {
    AppState.activeSubCategory = 'all';
    AppState.activeProfile = null; // Désactive le profil si actif
    const catButtons = document.querySelectorAll('.category-btn');
    catButtons.forEach(cb => cb.classList.toggle('active', cb.dataset.category === AppState.activeCategory));
    renderSubCategories();
    renderCatalog();
  });
  chipsGroup.appendChild(allBtn);

  // 2. Puces pour chacune des 19 sous-catégories (indépendantes et permanentes)
  ALL_SUB_CATEGORIES.forEach(sub => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isAct = !AppState.activeProfile && AppState.activeSubCategory === sub.name;
    const isSameParent = !AppState.activeProfile && AppState.activeCategory !== 'all' && AppState.activeCategory === sub.parent;
    btn.className = `subcat-btn ${isAct ? 'active' : ''} ${isSameParent ? 'subcat-parent-match' : ''}`;
    btn.style.setProperty('--subcat-accent', sub.color);
    btn.style.setProperty('--subcat-glow', sub.glow);
    btn.innerHTML = `<span>${sub.name}</span><span class="subcat-count">${countsBySub[sub.name] || 0}</span>`;
    btn.title = `Filtrer sur ${sub.name}`;

    btn.addEventListener('click', () => {
      AppState.activeProfile = null; // Priorité au filtre de sous-catégorie
      if (AppState.activeSubCategory === sub.name) {
        AppState.activeSubCategory = 'all';
      } else {
        AppState.activeSubCategory = sub.name;
        // Synchronisation visuelle bienveillante avec la catégorie mère
        if (sub.parent) {
          AppState.activeCategory = sub.parent;
          const catButtons = document.querySelectorAll('.category-btn');
          catButtons.forEach(b => b.classList.toggle('active', b.dataset.category === sub.parent));
        }
      }
      renderSubCategories();
      renderCatalog();
    });
    chipsGroup.appendChild(btn);
  });
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

// Tri par Étoiles, Date et Avis critique (Exclusivité PC Desktop - Règle 8 AGENTS.md)
function initSortControls() {
  const starsSortBtn = document.getElementById('starsSortBtn');
  const starsSortArrow = document.getElementById('starsSortArrow');
  const dateSortBtn = document.getElementById('dateSortBtn');
  const dateSortArrow = document.getElementById('dateSortArrow');
  const avisSortBtn = document.getElementById('avisSortBtn');
  const avisSortArrow = document.getElementById('avisSortArrow');

  const updateStarsUI = () => {
    if (!starsSortBtn) return;
    if (AppState.starsSortOrder === 'desc') {
      starsSortBtn.classList.add('active');
      if (starsSortArrow) starsSortArrow.textContent = '↓';
      starsSortBtn.title = 'Tri par étoiles : De la meilleure note à la moins bonne (Cliquer pour trier de la moins bonne à la meilleure)';
    } else if (AppState.starsSortOrder === 'asc') {
      starsSortBtn.classList.add('active');
      if (starsSortArrow) starsSortArrow.textContent = '↑';
      starsSortBtn.title = 'Tri par étoiles : De la moins bonne note à la meilleure (Cliquer pour réinitialiser le tri par défaut)';
    } else {
      starsSortBtn.classList.remove('active');
      if (starsSortArrow) starsSortArrow.textContent = '';
      starsSortBtn.title = 'Trier par nombre d\'étoiles (Cliquer pour alterner : Meilleures étoiles ➔ Moins bonnes ➔ Par défaut)';
    }
  };

  const updateDateUI = () => {
    if (!dateSortBtn) return;
    if (AppState.dateSortOrder === 'desc') {
      dateSortBtn.classList.add('active');
      if (dateSortArrow) dateSortArrow.textContent = '↓';
      dateSortBtn.title = 'Tri par date : Du plus récent au plus ancien (Cliquer pour trier du plus ancien au plus récent)';
    } else if (AppState.dateSortOrder === 'asc') {
      dateSortBtn.classList.add('active');
      if (dateSortArrow) dateSortArrow.textContent = '↑';
      dateSortBtn.title = 'Tri par date : Du plus ancien au plus récent (Cliquer pour réinitialiser le tri par défaut)';
    } else {
      dateSortBtn.classList.remove('active');
      if (dateSortArrow) dateSortArrow.textContent = '';
      dateSortBtn.title = 'Trier par année de sortie (Cliquer pour alterner : Récent ➔ Ancien ➔ Par défaut)';
    }
  };

  const updateAvisUI = () => {
    if (!avisSortBtn) return;
    if (AppState.avisSortOrder === 'desc') {
      avisSortBtn.classList.add('active');
      if (avisSortArrow) avisSortArrow.textContent = '↓';
      avisSortBtn.title = 'Tri par avis : De la meilleure note à la moins bonne (Cliquer pour trier de la moins bonne à la meilleure)';
    } else if (AppState.avisSortOrder === 'asc') {
      avisSortBtn.classList.add('active');
      if (avisSortArrow) avisSortArrow.textContent = '↑';
      avisSortBtn.title = 'Tri par avis : De la moins bonne note à la meilleure (Cliquer pour réinitialiser le tri par défaut)';
    } else {
      avisSortBtn.classList.remove('active');
      if (avisSortArrow) avisSortArrow.textContent = '';
      avisSortBtn.title = 'Trier par note critique Avis (Cliquer pour alterner : Meilleure note ➔ Moins bonne note ➔ Par défaut)';
    }
  };

  if (starsSortBtn) {
    starsSortBtn.addEventListener('click', () => {
      // Désactiver le tri par date et par avis pour éviter tout conflit
      AppState.dateSortOrder = 'none';
      AppState.avisSortOrder = 'none';
      updateDateUI();
      updateAvisUI();

      if (AppState.starsSortOrder === 'none') {
        AppState.starsSortOrder = 'desc';
      } else if (AppState.starsSortOrder === 'desc') {
        AppState.starsSortOrder = 'asc';
      } else {
        AppState.starsSortOrder = 'none';
      }
      updateStarsUI();
      renderCatalog();
    });
  }

  if (dateSortBtn) {
    dateSortBtn.addEventListener('click', () => {
      // Désactiver le tri par étoiles et par avis pour éviter tout conflit
      AppState.starsSortOrder = 'none';
      AppState.avisSortOrder = 'none';
      updateStarsUI();
      updateAvisUI();

      if (AppState.dateSortOrder === 'none') {
        AppState.dateSortOrder = 'desc';
      } else if (AppState.dateSortOrder === 'desc') {
        AppState.dateSortOrder = 'asc';
      } else {
        AppState.dateSortOrder = 'none';
      }
      updateDateUI();
      renderCatalog();
    });
  }

  if (avisSortBtn) {
    avisSortBtn.addEventListener('click', () => {
      // Désactiver le tri par étoiles et par date pour éviter tout conflit
      AppState.starsSortOrder = 'none';
      AppState.dateSortOrder = 'none';
      updateStarsUI();
      updateDateUI();

      if (AppState.avisSortOrder === 'none') {
        AppState.avisSortOrder = 'desc';
      } else if (AppState.avisSortOrder === 'desc') {
        AppState.avisSortOrder = 'asc';
      } else {
        AppState.avisSortOrder = 'none';
      }
      updateAvisUI();
      renderCatalog();
    });
  }

  updateStarsUI();
  updateDateUI();
  updateAvisUI();
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
function getFilteredItemsBeforeStars(options = {}) {
  let items = getCategoryEligibleItems(options);
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

function getCategoryEligibleItems(options = {}) {
  const currentCatalog = getActiveCatalog();
  return currentCatalog.filter(item => {
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

    // RÈGLE D'EXCLUSIVITÉ PC (Règle 8 AGENTS.md) :
    // Sur mobile (largeur < 1024px), STRICTEMENT les œuvres SVOD de base (aoc, aca, auc).
    // Zéro TNT, zéro chaînes spécialisées.
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      if (!isItemBasePaid(item)) return false;
    }

    // Mode Exclusif Amazon Prime (PC uniquement - Règle 8)
    if (!isMobile && AppState.isAmazonMode) {
      if (!isItemOnPrimeVideo(item)) {
        return false;
      }
    } else {
      // Filtre Bouquet
      if (AppState.activeBouquet && AppState.activeBouquet !== 'all') {
        if (AppState.activeBouquet === 'prv') {
          if (!isItemOnPrimeVideo(item)) {
            return false;
          }
        } else if (!item.package_slugs || !item.package_slugs.includes(AppState.activeBouquet)) {
          return false;
        }
      } else {
        // Nous sommes dans "Tous les bouquets" ('all') sur PC Desktop :
        if (!isMobile) {
          // Par défaut, les chaînes spécialisées ne sont PAS incluses sauf si le bouton toggleIncludeSpecialized est activé
          if (isItemSpecialized(item) && !AppState.includeSpecialized) {
            return false;
          }
          // Par défaut, les œuvres exclusives à Amazon Prime Video ne sont PAS incluses sauf si le bouton toggleIncludeAmazon est activé
          if (isItemOnlyOnPrime(item) && !AppState.includeAmazon) {
            return false;
          }
        }
      }

      // Filtre d'Exclusion Stricte (Hors Prime Video & Hors TNT)
      if (AppState.isExclusiveOnly) {
        if (isItemExcludedByPrimeOrTnt(item)) {
          return false;
        }
      }
    }

    // Filtre Nouveautés (Exclusivité PC - Règle 8)
    if (!isMobile && AppState.isOnlyNew) {
      if (!isItemNew(item)) {
        return false;
      }
    }

    // Filtre d'Exclusion des Séries sans Saison 1
    if (AppState.isExcludeNoS1) {
      if (item.type === 'serie' && !hasSeasonOne(item)) {
        return false;
      }
    }

    // Filtre Sous-Catégorie Indépendant (Exclusivité PC - Règle 8 AGENTS.md)
    if (!options.ignoreSubCategory && !isMobile && AppState.activeSubCategory && AppState.activeSubCategory !== 'all') {
      const itemSub = (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.computeSubCategory === 'function')
        ? JustWatchEngine.computeSubCategory(item)
        : '';
      if (itemSub !== AppState.activeSubCategory) return false;
    } else if (!options.ignoreCategory && AppState.activeCategory !== 'all') {
      // Filtre Catégorie Principale (actif si aucune sous-catégorie spécifique n'est sélectionnée)
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

  // Mettre à jour l'affichage des sous-catégories et de leurs compteurs
  renderSubCategories();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Mode Curation Profil (Moi, Ami, Amie, Duo - Exclusivité Desktop PC - Règles 6, 7 & 8)
  const isProfileMode = !isMobile && !!AppState.activeProfile;
  if (isProfileMode) {
    const profConf = WEEKLY_PROPOSALS[AppState.activeProfile] || WEEKLY_PROPOSALS.moi;
    const isMode1 = AppState.profileDisplayMode === '1';

    if (titleEl) {
      titleEl.innerHTML = `<span>${profConf.icon} Curation : ${profConf.label}</span>`;
    }
    if (descEl) {
      descEl.textContent = isMode1
        ? `${profConf.desc} (Affichage 1 : 7 propositions de la semaine)`
        : `${profConf.desc} (Affichage 2 : Toutes les œuvres éligibles en colonnes par catégorie)`;
      descEl.style.display = 'block';
    }

    // Afficher et synchroniser le sélecteur Affichage : [ 1 ] [ 2 ]
    const modeSelector = document.getElementById('displayModeSelector');
    const btnMode1 = document.getElementById('btnDisplayMode1');
    const btnMode2 = document.getElementById('btnDisplayMode2');
    if (modeSelector) {
      modeSelector.style.display = 'inline-flex';
      if (btnMode1) {
        btnMode1.classList.toggle('active', isMode1);
        btnMode1.title = 'Affichage 1 : Propositions de la semaine (7 films)';
      }
      if (btnMode2) {
        btnMode2.classList.toggle('active', !isMode1);
        btnMode2.title = 'Affichage 2 : Toutes les œuvres éligibles par catégorie (Colonnes)';
      }
    }

    const themeHeaderEl = document.getElementById('themeColumnsHeader');
    if (themeHeaderEl) themeHeaderEl.classList.remove('active');
    const subHeaderEl = document.getElementById('subColumnsHeader');
    if (subHeaderEl) {
      subHeaderEl.classList.remove('active');
      subHeaderEl.innerHTML = '';
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (grid) grid.innerHTML = '';

    if (isMode1) {
      // AFFICHAGE 1 : Les 7 propositions de la semaine dans la grille normale
      grid.classList.remove('theme-columns-active', 'sub-columns-active', 'profile-columns-active');
      const weekItems = profConf.ids.map(id => AppState.catalog.find(it => it.id === id)).filter(Boolean);
      if (countEl) countEl.textContent = weekItems.length;

      weekItems.forEach(item => {
        grid.appendChild(createPosterCard(item));
      });
      return;
    }

    // AFFICHAGE 2 : Toutes les œuvres éligibles au format colonnes par catégorie
    grid.classList.add('profile-columns-active');
    grid.classList.remove('theme-columns-active', 'sub-columns-active');

    let profileAll = AppState.catalog.filter(it => isItemEligibleForProfile(it, AppState.activeProfile));
    if (AppState.activeType && AppState.activeType !== 'all') {
      profileAll = profileAll.filter(it => it.type === AppState.activeType);
    }
    if (!AppState.includeSpecialized) {
      profileAll = profileAll.filter(it => !isItemSpecialized(it));
    }
    if (AppState.activeBouquet !== 'all') {
      profileAll = profileAll.filter(it => (it.package_slugs || []).includes(AppState.activeBouquet));
    }
    if (AppState.activeStars !== 'all') {
      profileAll = profileAll.filter(it => matchesStars(it, AppState.activeStars));
    }
    if (AppState.isOnlyNew) {
      profileAll = profileAll.filter(it => it.annee >= 2024);
    }

    if (countEl) countEl.textContent = profileAll.length;

    const themeBuckets = {
      action_aventure: [],
      thriller_policier: [],
      scifi_fantastique: [],
      horreur_epouvante: [],
      comedie: [],
      drame_emotion: [],
      animation_famille: []
    };

    profileAll.forEach(item => {
      const cat = (item.categories && item.categories[0]) || 'drame_emotion';
      if (themeBuckets[cat]) themeBuckets[cat].push(item);
    });

    for (const k of Object.keys(themeBuckets)) {
      themeBuckets[k] = sortCatalogItems(themeBuckets[k]);
    }

    const profColDefs = [
      { cat: 'action_aventure', name: 'Action & Aventure', icon: '🏹', items: themeBuckets.action_aventure },
      { cat: 'thriller_policier', name: 'Thriller & Policier', icon: '🔍', items: themeBuckets.thriller_policier },
      { cat: 'scifi_fantastique', name: 'SF & Fantastique', icon: '🚀', items: themeBuckets.scifi_fantastique },
      { cat: 'horreur_epouvante', name: 'Horreur & Épouvante', icon: '👻', items: themeBuckets.horreur_epouvante },
      { cat: 'comedie', name: 'Comédie', icon: '🎭', items: themeBuckets.comedie },
      { cat: 'drame_emotion', name: 'Drame & Émotion', icon: '❤️', items: themeBuckets.drame_emotion },
      { cat: 'animation_famille', name: 'Animation & Famille', icon: '🧸', items: themeBuckets.animation_famille }
    ];

    profColDefs.forEach(col => {
      const colDiv = document.createElement('div');
      colDiv.className = 'theme-column profile-col';
      colDiv.innerHTML = `
        <div class="profile-col-header">
          <span class="prof-col-title">${col.icon} ${col.name}</span>
          <span class="prof-col-count">${col.items.length}</span>
        </div>
        <div class="profile-col-items"></div>
      `;
      const itemsCont = colDiv.querySelector('.profile-col-items');
      if (col.items.length === 0) {
        itemsCont.innerHTML = `<div class="profile-col-empty">Exclu pour ce profil</div>`;
      } else {
        col.items.forEach(it => {
          itemsCont.appendChild(createPosterCard(it));
        });
      }
      grid.appendChild(colDiv);
    });
    return;
  }

  const catInfo = CATEGORIES_INFO[AppState.activeCategory] || CATEGORIES_INFO.all;
  if (titleEl) {
    const mediaLabel = AppState.activeType === 'film' ? 'Films' : 'Séries';
    if (!isMobile && AppState.activeSubCategory && AppState.activeSubCategory !== 'all') {
      titleEl.textContent = `${AppState.activeSubCategory} (${mediaLabel})`;
    } else {
      titleEl.textContent = AppState.activeCategory === 'all' 
        ? `Tous les ${mediaLabel.toLowerCase()}` 
        : `${catInfo.title} (${mediaLabel})`;
    }
  }
  if (descEl) {
    descEl.textContent = catInfo.desc || '';
    descEl.style.display = catInfo.desc ? 'block' : 'none';
  }

  let items = getFilteredItemsBeforeStars();
  updateStarButtonsCounts(items);
  items = items.filter(item => matchesStars(item, AppState.activeStars));

  const isThemeColumnsMode = !isMobile && AppState.enableThemeColumns && AppState.activeCategory === 'all' && !AppState.searchQuery;
  const isSubColumnsMode = !isMobile && AppState.enableThemeColumns && AppState.activeCategory !== 'all' && AppState.activeSubCategory === 'all' && !AppState.searchQuery;

  const modeSelector = document.getElementById('displayModeSelector');
  const btnMode1 = document.getElementById('btnDisplayMode1');
  const btnMode2 = document.getElementById('btnDisplayMode2');

  if (modeSelector) {
    const canShowModeSelector = !isMobile && !AppState.searchQuery;
    modeSelector.style.display = canShowModeSelector ? 'inline-flex' : 'none';
    if (btnMode1) btnMode1.classList.toggle('active', AppState.enableThemeColumns);
    if (btnMode2) btnMode2.classList.toggle('active', !AppState.enableThemeColumns);
  }

  const themeHeaderEl = document.getElementById('themeColumnsHeader');
  const subHeaderEl = document.getElementById('subColumnsHeader');

  if (grid) {
    grid.classList.toggle('theme-columns-active', isThemeColumnsMode);
    grid.classList.toggle('sub-columns-active', isSubColumnsMode);
  }
  if (themeHeaderEl) {
    themeHeaderEl.classList.toggle('active', isThemeColumnsMode);
  }
  if (subHeaderEl) {
    subHeaderEl.classList.toggle('active', isSubColumnsMode);
    if (!isSubColumnsMode) {
      subHeaderEl.innerHTML = '';
    }
  }

  if (countEl) countEl.textContent = items.length;

  if (items.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    const emptyDesc = emptyState.querySelector('.empty-desc');
    if (emptyDesc) {
      if (AppState.searchQuery) {
        emptyDesc.textContent = `Aucun titre ne correspond à « ${AppState.searchQuery} » pour cette sélection.`;
      } else if (AppState.isOnlyNew) {
        emptyDesc.textContent = 'Aucune nouveauté récente dans cette sélection actuellement.';
      } else {
        emptyDesc.textContent = 'Aucun contenu ne correspond aux critères stricts pour cette sélection actuellement.';
      }
    }
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = '';

  if (isThemeColumnsMode) {
    // 6 colonnes thématiques indépendantes (Règle 8 AGENTS.md) :
    // - Col 1 : Action (68) puis Horreur (201)
    // - Col 2 : Thriller (202)
    // - Col 3 : Sci-Fi (159)
    // - Col 4 : Comédie (278)
    // - Col 5 : Drame (396)
    // - Col 6 : Famille (110)
    // Règle stricte : si une colonne est vide/épuisée, elle s'arrête et n'est PAS remplie par d'autres thèmes.
    const themeBuckets = {
      action_aventure: [],
      thriller_policier: [],
      scifi_fantastique: [],
      comedie: [],
      drame_emotion: [],
      animation_famille: [],
      horreur_epouvante: []
    };

    items.forEach(item => {
      const cat = (item.categories && item.categories[0]) || 'drame_emotion';
      if (themeBuckets[cat]) {
        themeBuckets[cat].push(item);
      } else {
        themeBuckets.drame_emotion.push(item);
      }
    });

    // Tri indépendant dans chaque colonne respectant fidèlement le tri CinéScope :
    // Expiration en tête par ordre d'urgence, puis tirage quotidien (ou tri chronologique si 📅 Date actif)
    for (const key of Object.keys(themeBuckets)) {
      themeBuckets[key] = sortCatalogItems(themeBuckets[key]);
    }

    // Mise à jour des compteurs sur les pilules d'en-tête :
    // Col 1 : Action + Horreur combinés !
    const col1Count = themeBuckets.action_aventure.length + themeBuckets.horreur_epouvante.length;
    const updateColCount = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };
    updateColCount('countColAction', col1Count);
    updateColCount('countColThriller', themeBuckets.thriller_policier.length);
    updateColCount('countColScifi', themeBuckets.scifi_fantastique.length);
    updateColCount('countColComedie', themeBuckets.comedie.length);
    updateColCount('countColDrame', themeBuckets.drame_emotion.length);
    updateColCount('countColFamille', themeBuckets.animation_famille.length);

    // Définition des 6 colonnes indépendantes
    const colDefs = [
      {
        id: 'col-action',
        items: themeBuckets.action_aventure,
        hasHorrorFollowup: themeBuckets.horreur_epouvante.length > 0,
        horrorItems: themeBuckets.horreur_epouvante
      },
      {
        id: 'col-thriller',
        items: themeBuckets.thriller_policier
      },
      {
        id: 'col-scifi',
        items: themeBuckets.scifi_fantastique
      },
      {
        id: 'col-comedie',
        items: themeBuckets.comedie
      },
      {
        id: 'col-drame',
        items: themeBuckets.drame_emotion
      },
      {
        id: 'col-famille',
        items: themeBuckets.animation_famille
      }
    ];

    colDefs.forEach(def => {
      const colEl = document.createElement('div');
      colEl.className = 'theme-column';
      colEl.id = def.id;

      // 1. Ajouter les œuvres principales du thème
      def.items.forEach(item => {
        colEl.appendChild(createPosterCard(item));
      });

      // 2. Si colonne 1 avec suite Horreur :
      if (def.hasHorrorFollowup && def.horrorItems.length > 0) {
        const sep = document.createElement('div');
        sep.className = 'theme-column-subdivider';
        sep.innerHTML = `<span>👻 Horreur & Épouvante (${def.horrorItems.length})</span>`;
        colEl.appendChild(sep);

        def.horrorItems.forEach(item => {
          colEl.appendChild(createPosterCard(item));
        });
      }

      grid.appendChild(colEl);
    });
  } else if (isSubColumnsMode) {
    // Mode colonnes par sous-genre sur un genre spécifique (Exclusivité PC - Règle 8 AGENTS.md)
    const catConfig = SUB_CATEGORIES_CONFIG[AppState.activeCategory];
    const subNames = (catConfig && catConfig.subs) || [];

    if (grid) {
      grid.style.setProperty('--sub-col-count', subNames.length);
    }
    if (subHeaderEl) {
      subHeaderEl.style.setProperty('--sub-col-count', subNames.length);
      subHeaderEl.innerHTML = '';
    }

    // Répartition déterministe des œuvres par sous-catégorie
    const subBuckets = {};
    subNames.forEach(name => { subBuckets[name] = []; });

    items.forEach(item => {
      let sub = '';
      if (typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.computeSubCategory === 'function') {
        sub = JustWatchEngine.computeSubCategory(item);
      }
      if (subBuckets[sub]) {
        subBuckets[sub].push(item);
      } else if (subNames.length > 0) {
        subBuckets[subNames[0]].push(item);
      }
    });

    // Tri indépendant dans chaque colonne (expirations en tête, tirage quotidien / date / avis)
    for (const name of subNames) {
      subBuckets[name] = sortCatalogItems(subBuckets[name]);
    }

    // Construction des en-têtes et des colonnes de sous-catégories
    subNames.forEach(subName => {
      const subItems = subBuckets[subName] || [];
      const subMeta = ALL_SUB_CATEGORIES.find(s => s.name === subName) || {};

      // 1. Pilule d'en-tête cliquable
      if (subHeaderEl) {
        const pill = document.createElement('div');
        pill.className = 'sub-col-pill';
        pill.setAttribute('role', 'button');
        pill.setAttribute('tabindex', '0');
        pill.setAttribute('title', `Filtrer uniquement sur ${subName}`);
        pill.style.setProperty('--subcat-accent', subMeta.color || '#e50914');
        pill.style.setProperty('--subcat-glow', subMeta.glow || 'rgba(229, 9, 20, 0.25)');
        pill.innerHTML = `
          <span class="sub-col-icon">${subMeta.icon || '🎬'}</span>
          <span class="sub-col-name">${subName}</span>
          <span class="sub-col-count">${subItems.length}</span>
        `;
        pill.addEventListener('click', () => {
          AppState.activeSubCategory = subName;
          renderSubCategories();
          renderCatalog();
        });
        subHeaderEl.appendChild(pill);
      }

      // 2. Colonne d'œuvres indépendante
      const colEl = document.createElement('div');
      colEl.className = 'theme-column sub-column';
      colEl.id = `col-sub-${subName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      subItems.forEach(item => {
        colEl.appendChild(createPosterCard(item));
      });

      grid.appendChild(colEl);
    });
  } else {
    // Mode standard : catégorie unique filtrée, recherche textuelle ou grande grille classique (Affichage 2)
    const sortedItems = sortCatalogItems(items);
    sortedItems.forEach(item => {
      grid.appendChild(createPosterCard(item));
    });
  }
}

// Fonction de création unitaire d'une carte d'affiche (Poster Card)
function createPosterCard(item) {
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

  // Logos des chaînes DYNAMIQUES selon les filtres actifs
  const activePkgSlugs = getActiveItemPackages(item);
  const activeLogos = activePkgSlugs
    .map(slug => JustWatchEngine.PACKAGES_CONFIG[slug]?.logo)
    .filter(Boolean);
  const activeNames = activePkgSlugs
    .map(slug => JustWatchEngine.PACKAGES_CONFIG[slug]?.name)
    .filter(Boolean);

  const finalLogos = activeLogos.length > 0 
    ? activeLogos 
    : (item.logos_chaine && item.logos_chaine.length ? [item.logos_chaine[0]] : [item.logo_chaine || JustWatchEngine.PACKAGES_CONFIG.aoc.logo]);
  const finalNames = activeNames.length > 0 
    ? activeNames 
    : (item.chaines && item.chaines.length ? [item.chaines[0]] : [item.chaine || JustWatchEngine.PACKAGES_CONFIG.aoc.name]);

  let channelLogoHtml = '';
  channelLogoHtml = finalLogos.map((logoUrl, i) => {
    const chName = finalNames[i] || '';
    return `<img class="card-channel-logo ${finalLogos.length > 1 ? 'is-multi-channel' : ''}" src="${logoUrl}" alt="${chName}">`;
  }).join('');

  card.innerHTML = `
    <div class="poster-img-container">
      <img class="poster-img" src="${item.poster}" alt="Affiche ${item.titre}" loading="lazy" decoding="async">
      ${expiryHtml}
      ${badgeHtml}
      ${seasonBadgeHtml}
      <div class="channel-logo-container ${finalLogos.length > 1 ? 'has-multiple-logos' : ''}">
        ${channelLogoHtml}
      </div>
    </div>
  `;

  card.dataset.id = item.id;
  return card;
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

  // Éléments Desktop pour épisodes et sous-notes
  const episodesBadge = document.getElementById('modalEpisodesBadge');
  const subRatings = document.getElementById('modalSubRatings');
  const ratingAvisVal = document.getElementById('modalRatingAvisVal');
  const ratingRecenceVal = document.getElementById('modalRatingRecenceVal');

  // Menu déroulant des saisons disponibles pour les séries + Comptage d'épisodes (Règle 8 PC)
  const seasonWrapper = document.getElementById('modalSeasonSelectorWrapper');
  const seasonSelect = document.getElementById('modalSeasonSelect');

  if (item.type === 'serie') {
    const seasons = (item.saisons_disponibles && item.saisons_disponibles.length > 0)
      ? item.saisons_disponibles
      : [{ saison: 1, annee: item.annee, note: item.note_avis, episodes: null }];

    const totalEpisodes = seasons.reduce((acc, s) => acc + (Number(s.episodes) || 0), 0);

    const updateEpisodesBadge = (epCount, tooltipText = '') => {
      if (!episodesBadge) return;
      if (epCount && epCount > 0) {
        episodesBadge.textContent = `${epCount} épisodes`;
        if (tooltipText) episodesBadge.title = tooltipText;
        episodesBadge.style.display = 'inline-flex';
      } else {
        episodesBadge.style.display = 'none';
      }
    };

    if (seasonWrapper && seasonSelect) {
      seasonSelect.innerHTML = '';
      seasons.forEach((s, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Saison ${s.saison}`;
        seasonSelect.appendChild(opt);
      });
      seasonWrapper.style.display = 'inline-flex';

      // Par défaut : nombre d'épisodes pour toute la série dispo (uniquement saisons disponibles)
      if (totalEpisodes > 0) {
        updateEpisodesBadge(totalEpisodes, `Total : ${totalEpisodes} épisodes disponibles pour l'ensemble des saisons`);
      } else {
        const s0 = seasons[0];
        updateEpisodesBadge(s0.episodes, `Saison ${s0.saison} : ${s0.episodes} épisodes`);
      }

      // Quand on clique sur le menu déroulant pour prendre une saison : n'affiche que les épisodes de la saison
      seasonSelect.onchange = (e) => {
        const selected = seasons[parseInt(e.target.value, 10)];
        if (selected) {
          if (selected.annee) {
            year.textContent = selected.annee;
          }
          if (selected.episodes) {
            updateEpisodesBadge(selected.episodes, `Saison ${selected.saison} : ${selected.episodes} épisodes disponibles`);
          } else {
            if (episodesBadge) episodesBadge.style.display = 'none';
          }
          if (ratingAvisVal && selected.note) {
            ratingAvisVal.textContent = Number(selected.note).toFixed(1);
          }
        }
      };
    }
  } else {
    if (seasonWrapper) seasonWrapper.style.display = 'none';
    if (episodesBadge) episodesBadge.style.display = 'none';
  }

  if (item.badge) {
    csaBadge.innerHTML = `<img class="modal-csa-badge-img" src="assets/logos/pegi_${item.badge}.png" alt="-${item.badge}">`;
    csaBadge.style.display = 'inline-flex';
  } else {
    csaBadge.innerHTML = '';
    csaBadge.style.display = 'none';
  }

  const activePkgSlugs = getActiveItemPackages(item);
  const activeNames = activePkgSlugs
    .map(slug => JustWatchEngine.PACKAGES_CONFIG[slug]?.name)
    .filter(Boolean);
  const chainesDisplay = activeNames.length > 0 
    ? activeNames.join(' • ') 
    : (item.chaines && item.chaines.length ? item.chaines.join(' • ') : (item.chaine || '-'));
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

  // Catégorie unique (+ sous-catégorie déterministe sur PC)
  categories.innerHTML = '';
  if (item.categories && item.categories.length) {
    const isMobileModal = typeof window !== 'undefined' && window.innerWidth < 1024;
    item.categories.forEach(catKey => {
      const cat = CATEGORIES_INFO[catKey];
      if (cat) {
        const chip = document.createElement('span');
        chip.className = 'modal-cat-chip';
        chip.textContent = `${cat.icon} ${cat.title}`;
        categories.appendChild(chip);

        // Sous-catégorie déterministe PC (Règle 8 AGENTS.md)
        if (!isMobileModal && typeof JustWatchEngine !== 'undefined' && typeof JustWatchEngine.computeSubCategory === 'function') {
          const subCat = JustWatchEngine.computeSubCategory(item);
          if (subCat) {
            const subTag = document.createElement('span');
            subTag.className = 'modal-subcat-tag';
            subTag.textContent = subCat;
            categories.appendChild(subTag);
          }
        }
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

  // Sous-notes distinctes Avis & Récence (Règle 8 PC)
  if (subRatings) {
    const noteAvis = (item.note_avis !== null && item.note_avis !== undefined) ? Number(item.note_avis).toFixed(1) : null;
    const noteRecence = (item.note_recence !== null && item.note_recence !== undefined) ? Number(item.note_recence).toFixed(1) : null;

    if (noteAvis !== null && noteRecence !== null) {
      if (ratingAvisVal) ratingAvisVal.textContent = noteAvis;
      if (ratingRecenceVal) ratingRecenceVal.textContent = noteRecence;
      subRatings.style.display = 'inline-flex';
    } else {
      subRatings.style.display = 'none';
    }
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
