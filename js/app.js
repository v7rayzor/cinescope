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
  isAutoStars: true,           // true tant que l'utilisateur n'a pas forcé manuellement un choix
  isSyncing: false,
  catalog: []
};

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

// Tri intelligent CinéScope :
// 1. Priorité aux films avec date d'expiration (le plus proche de quitter le catalogue en premier)
// 2. Films sans date d'expiration ordonnés par tirage aléatoire quotidien stable.
function sortCatalogItems(items) {
  const withExpiry = [];
  const withoutExpiry = [];

  for (const it of items) {
    if (it.expiration && it.expiration.daysLeft !== null && it.expiration.daysLeft >= 0) {
      withExpiry.push(it);
    } else {
      withoutExpiry.push(it);
    }
  }

  // 1. Tri par ordre croissant de jours restants (ex: 0j > 1j > 2j > 5j > 15j)
  withExpiry.sort((a, b) => {
    const diff = a.expiration.daysLeft - b.expiration.daysLeft;
    if (diff !== 0) return diff;
    return getDailyScore(a) - getDailyScore(b);
  });

  // 2. Tri aléatoire quotidien pour les films sans date
  withoutExpiry.sort((a, b) => getDailyScore(a) - getDailyScore(b));

  return [...withExpiry, ...withoutExpiry];
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
    // Si aucune date n'est enregistrée mais que le catalogue officiel est présent, initialiser la date de base
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

// Calcul des compteurs de bouquets
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

  const elAll = document.getElementById('countPkgAll');
  const elOcs = document.getElementById('countPkgOcs');
  const elAction = document.getElementById('countPkgAction');
  const elUniv = document.getElementById('countPkgUniversal');

  if (elAll) elAll.textContent = countAll;
  if (elOcs) elOcs.textContent = countOcs;
  if (elAction) elAction.textContent = countAction;
  if (elUniv) elUniv.textContent = countUniversal;
}

// Navigation par bouquets
function initBouquetsNavigation() {
  const bouquetBtns = document.querySelectorAll('.bouquet-btn');
  bouquetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bouquetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeBouquet = btn.dataset.package;
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
    
    // Filtre Type
    if (AppState.activeType === 'film') {
      if (item.type !== 'film' && item.type !== 'telefilm') return false;
    } else {
      if (item.type !== AppState.activeType) return false;
    }

    // Filtre Bouquet
    if (AppState.activeBouquet !== 'all') {
      if (!item.package_slugs || !item.package_slugs.includes(AppState.activeBouquet)) {
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

  // Tri intelligent : Fins de droits en tête par ordre d'urgence, puis aléatoire quotidien
  const sortedItems = sortCatalogItems(items);
  if (countEl) countEl.textContent = sortedItems.length;

  if (sortedItems.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
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

    // Badge de compte à rebours d'expiration : UNIQUEMENT si une date d'expiration existe
    let expiryHtml = '';
    if (item.expiration && item.expiration.label && item.expiration.status !== 'none' && item.expiration.status !== 'available') {
      expiryHtml = `<div class="card-expiry-badge expiry-${item.expiration.status}">${item.expiration.label}</div>`;
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
  year.textContent = item.annee || '-';

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
  if (expiryRow && expiry) {
    if (item.expiration && item.expiration.label && item.expiration.status !== 'none' && item.expiration.status !== 'available') {
      expiryRow.style.display = 'flex';
      expiry.textContent = item.expiration.label;
      expiry.className = `info-value modal-expiry-val expiry-${item.expiration.status}`;
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
