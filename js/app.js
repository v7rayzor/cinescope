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
  activeBouquet: 'all',        // 'all', 'aoc', 'aca', 'auc', 'snr', 'sdz', 'ima'
  isExclusiveOnly: false,      // true pour exclure Prime Video
  isOnlyNew: false,            // true pour afficher uniquement les nouveautés récentes (PC uniquement)
  includeSpecialized: false,   // true pour inclure Sooner, Shadowz, Insomnia (false par défaut = exclu)
  isExcludeNoS1: false,        // true pour exclure les séries sans saison 1 disponible
  isAutoStars: true,           // true tant que l'utilisateur n'a pas forcé manuellement un choix
  searchQuery: '',             // Requête de recherche par titre (PC uniquement)
  dateSortOrder: 'none',       // 'none', 'desc' (récent -> ancien), 'asc' (ancien -> récent) (PC uniquement)
  avisSortOrder: 'none',       // 'none', 'desc' (meilleur avis -> moins bon), 'asc' (moins bon -> meilleur) (PC uniquement)
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

// Détermine la liste des diffuseurs ACTIFS d'une œuvre selon les filtres courants de l'utilisateur
function getActiveItemPackages(item) {
  if (!item || !item.package_slugs || item.package_slugs.length === 0) {
    return [];
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

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
// - Si tri par date actif (PC uniquement) : tri chronologique strict par année (décroissant ou croissant), avec départage par expiration puis note.
// - Sinon (tri par défaut) : Les œuvres avec date d'expiration passent en priorité absolue (ordre d'urgence), puis tirage quotidien / profil.
function sortCatalogItems(items) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Tri par Date de sortie (Exclusivité PC Desktop - Règle 8 AGENTS.md)
  if (!isMobile && AppState.dateSortOrder && AppState.dateSortOrder !== 'none') {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const yearA = getItemReleaseYear(a);
      const yearB = getItemReleaseYear(b);
      const diffYear = AppState.dateSortOrder === 'desc' ? (yearB - yearA) : (yearA - yearB);
      if (diffYear !== 0) return diffYear;

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

  // Tri par Note Avis critique (Exclusivité PC Desktop - Règle 8 AGENTS.md)
  if (!isMobile && AppState.avisSortOrder && AppState.avisSortOrder !== 'none') {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const avisA = typeof a.note_avis === 'number' ? a.note_avis : 0;
      const avisB = typeof b.note_avis === 'number' ? b.note_avis : 0;
      const diffAvis = AppState.avisSortOrder === 'desc' ? (avisB - avisA) : (avisA - avisB);
      if (diffAvis !== 0) return diffAvis;

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
    return getDailyScore(a.item) - getDailyScore(b.item);
  });

  // 2. Tri des œuvres sans date d'expiration
  withoutExpiry.sort((a, b) => {
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
  const maxConcurrency = 4;
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

  // Différer le préchargement en arrière-plan pour laisser la priorité absolue aux affiches visibles à l'écran
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => processQueue(), { timeout: 2000 });
  } else {
    setTimeout(processQueue, 1500);
  }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSearchBar();
  initBouquetsNavigation();
  initStarsNavigation();
  initDurationFilter();
  initSortControls();
  initModal();
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
  preloadAllCatalogImages();
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const eligibleFilms = AppState.catalog.filter(item => {
    if (!item.is_eligible || (item.type !== 'film' && item.type !== 'telefilm')) return false;
    if (isMobile && !isItemBasePaid(item)) return false;
    return true;
  });
  const eligibleSeries = AppState.catalog.filter(item => {
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
  const eligibleTypeItems = AppState.catalog.filter(item => {
    if (!item.is_eligible) return false;
    return AppState.activeType === 'film' 
      ? (item.type === 'film' || item.type === 'telefilm')
      : (item.type === 'serie');
  });

  const countAll = eligibleTypeItems.filter(i => {
    if (isMobile) return isItemBasePaid(i);
    if (isItemBasePaid(i)) return true;
    if (AppState.includeSpecialized && isItemSpecialized(i)) return true;
    return false;
  }).length;

  const countOcs = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('aoc')).length;
  const countAction = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('aca')).length;
  const countUniversal = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('auc')).length;

  // Chaînes Spécialisées (PC uniquement)
  const countSooner = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('snr')).length;
  const countShadowz = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('sdz')).length;
  const countInsomnia = eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes('ima')).length;
  
  // Compteur du toggle d'inclusion spécialisées
  const countSpecializedAvailable = eligibleTypeItems.filter(i => isItemSpecialized(i)).length;

  // Scope du filtre selon le bouquet actif
  const currentScope = (AppState.activeBouquet && AppState.activeBouquet !== 'all')
    ? eligibleTypeItems.filter(i => i.package_slugs && i.package_slugs.includes(AppState.activeBouquet))
    : eligibleTypeItems.filter(i => {
        if (isMobile) return isItemBasePaid(i);
        if (isItemBasePaid(i)) return true;
        if (AppState.includeSpecialized && isItemSpecialized(i)) return true;
        return false;
      });

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
  const elExclusive = document.getElementById('countPkgExclusive');
  const elOnlyNew = document.getElementById('countOnlyNew');
  const elIncludeSpecialized = document.getElementById('countIncludeSpecialized');
  const elExcludeNoS1 = document.getElementById('countExcludeNoS1');

  if (elAll) elAll.textContent = countAll;
  if (elOcs) elOcs.textContent = countOcs;
  if (elAction) elAction.textContent = countAction;
  if (elUniv) elUniv.textContent = countUniversal;
  if (elSooner) elSooner.textContent = countSooner;
  if (elShadowz) elShadowz.textContent = countShadowz;
  if (elInsomnia) elInsomnia.textContent = countInsomnia;
  if (elExclusive) elExclusive.textContent = countExclusive;
  if (elOnlyNew) elOnlyNew.textContent = countNew;
  if (elIncludeSpecialized) elIncludeSpecialized.textContent = countSpecializedAvailable;
  if (elExcludeNoS1) elExcludeNoS1.textContent = countNoS1;

  updateSpecializedSyncDisplay();
}

// Navigation par bouquets, Filtre d'exclusion Prime/TNT, Toggles d'inclusion & Filtre sans S1
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

  const toggleNewBtn = document.getElementById('toggleOnlyNew');
  if (toggleNewBtn) {
    toggleNewBtn.addEventListener('click', () => {
      AppState.isOnlyNew = !AppState.isOnlyNew;
      toggleNewBtn.classList.toggle('active', AppState.isOnlyNew);
      updateCategoryAutoStar();
      renderCatalog();
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

// Tri par Date et Tri par Avis critique (Exclusivité PC Desktop - Règle 8 AGENTS.md)
function initSortControls() {
  const dateSortBtn = document.getElementById('dateSortBtn');
  const dateSortArrow = document.getElementById('dateSortArrow');
  const avisSortBtn = document.getElementById('avisSortBtn');
  const avisSortArrow = document.getElementById('avisSortArrow');

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

  if (dateSortBtn) {
    dateSortBtn.addEventListener('click', () => {
      // Désactiver le tri par avis pour éviter tout conflit
      AppState.avisSortOrder = 'none';
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
      // Désactiver le tri par date pour éviter tout conflit
      AppState.dateSortOrder = 'none';
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

    // RÈGLE D'EXCLUSIVITÉ PC (Règle 8 AGENTS.md) :
    // Sur mobile (largeur < 1024px), STRICTEMENT les œuvres SVOD de base (aoc, aca, auc).
    // Zéro TNT, zéro chaînes spécialisées.
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      if (!isItemBasePaid(item)) return false;
    }

    // Filtre Bouquet
    if (AppState.activeBouquet && AppState.activeBouquet !== 'all') {
      if (!item.package_slugs || !item.package_slugs.includes(AppState.activeBouquet)) {
        return false;
      }
    } else {
      // Nous sommes dans "Tous les bouquets" ('all') sur PC Desktop :
      if (!isMobile) {
        // Par défaut, les chaînes spécialisées ne sont PAS incluses sauf si le bouton toggleIncludeSpecialized est activé
        if (isItemSpecialized(item) && !AppState.includeSpecialized) {
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
    titleEl.textContent = AppState.activeCategory === 'all' 
      ? `Tous les ${mediaLabel.toLowerCase()}` 
      : `${catInfo.title} (${mediaLabel})`;
  }
  if (descEl) {
    descEl.textContent = catInfo.desc || '';
    descEl.style.display = catInfo.desc ? 'block' : 'none';
  }

  let items = getFilteredItemsBeforeStars();
  updateStarButtonsCounts(items);
  items = items.filter(item => matchesStars(item, AppState.activeStars));

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const isThemeColumnsMode = !isMobile && AppState.activeCategory === 'all' && !AppState.searchQuery;

  const themeHeaderEl = document.getElementById('themeColumnsHeader');
  if (grid) {
    grid.classList.toggle('theme-columns-active', isThemeColumnsMode);
  }
  if (themeHeaderEl) {
    themeHeaderEl.classList.toggle('active', isThemeColumnsMode);
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
  } else {
    // Mode standard : catégorie unique sélectionnée, recherche textuelle ou mobile
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

  card.addEventListener('click', () => openModal(item));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(item);
    }
  });

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
