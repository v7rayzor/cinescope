/**
 * Application CinéScope - Logique de navigation, filtrage strict et tirage aléatoire
 */

// Définition des 7 catégories et leurs descriptions exactes
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

// État de l'application
// État de l'application
const AppState = {
  activeType: 'film',       // 'film' ou 'serie'
  activeCategory: 'all',    // 'all' ou l'une des 7 catégories
  activeStars: 'all',       // 'all', '3', '4', '5'
  isAutoStars: true,        // true tant que l'utilisateur n'a pas forcé manuellement un choix
  catalog: typeof CATALOG_DATA !== 'undefined' ? CATALOG_DATA : []
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
  // Pour "Tous les films" (catalogue global), afficher par défaut toutes les étoiles sans restriction
  if (AppState.activeCategory === 'all') {
    return 'all';
  }

  const total = categoryEligibleItems.length;
  // Si le total est déjà ≤ 50, afficher tous les films de la catégorie
  if (total <= 50) {
    return 'all';
  }

  // Calcul des effectifs par palier
  const count4 = categoryEligibleItems.filter(item => matchesStars(item, '4')).length;
  const count5 = categoryEligibleItems.filter(item => matchesStars(item, '5')).length;

  // Si le palier 4+ dépasse largement 50 films (ex: Drame avec 149 films),
  // on augmente l'exigence au palier 5 pour s'approcher au plus près de la cible (30-50 films)
  if (count4 > 80 && count5 >= 20) {
    return '5';
  }

  if (count5 >= 30 && count5 <= 80) {
    return '5';
  }

  // Sinon, le palier 4+ permet d'approcher la cible (ex: Thriller avec 39 films, Comédie avec 72 films)
  if (count4 >= 15) {
    return '4';
  }

  return 'all';
}

// Générateur de clé de jour (ex: "2026-09-19")
function getDailySeed() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fonction de hachage 32-bit pour calculer un score pseudo-aléatoire déterministe par item et par jour
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

// Cache des scores du jour pour garantir des performances optimales
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

// Mélange quotidien : 1 tirage aléatoire unique et stable par jour ("1 jour 1 aléatoire")
// L'ordre reste parfaitement identique sur toute la journée lors des rafraîchissements ou filtrages,
// et se renouvelle automatiquement chaque jour à minuit.
function shuffleArray(array) {
  return [...array].sort((a, b) => getDailyScore(a) - getDailyScore(b));
}

// Préchargement proactif de toutes les affiches et logos pour affichage instantané sans délai
function preloadAllCatalogImages() {
  if (!AppState.catalog || !AppState.catalog.length) return;

  // 1. Badges officiels CSA / PEGI
  ['10', '12', '16', '18'].forEach(b => {
    const img = new Image();
    img.src = `assets/logos/pegi_${b}.png`;
  });

  // 2. Extraire toutes les URLs uniques (affiches et logos)
  const priorityUrls = new Set();
  const secondaryUrls = new Set();

  const addLogos = (item, targetSet) => {
    if (item.logos_chaine && item.logos_chaine.length) {
      item.logos_chaine.forEach(l => { if (l) targetSet.add(l); });
    } else if (item.logo_chaine) {
      targetSet.add(item.logo_chaine);
    }
  };

  // Priorité 1 : éléments éligibles de la sélection courante
  const eligible = getCategoryEligibleItems();
  eligible.forEach(item => {
    if (item.poster) priorityUrls.add(item.poster);
    addLogos(item, priorityUrls);
  });

  // Priorité 2 : reste de l'ensemble du catalogue
  AppState.catalog.forEach(item => {
    if (item.poster && !priorityUrls.has(item.poster)) secondaryUrls.add(item.poster);
    addLogos(item, secondaryUrls);
  });

  const fullQueue = [...Array.from(priorityUrls), ...Array.from(secondaryUrls)];
  const total = fullQueue.length;
  let cursor = 0;
  const maxConcurrency = 16; // 16 chargements parallèles en arrière-plan
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
document.addEventListener('DOMContentLoaded', () => {
  initCounts();
  initNavigation();
  initStarsNavigation();
  initDurationFilter();
  initModal();
  updateMobileGenreDisplay(AppState.activeCategory);
  updateCategoryAutoStar();
  renderCatalog();
  preloadAllCatalogImages();
});

// Calcul des compteurs totaux pour les badges
function initCounts() {
  const eligibleFilms = AppState.catalog.filter(item => (item.type === 'film' || item.type === 'telefilm') && item.is_eligible);
  const eligibleSeries = AppState.catalog.filter(item => item.type === 'serie' && item.is_eligible);

  const filmsBadge = document.getElementById('filmsCount');
  const seriesBadge = document.getElementById('seriesCount');

  if (filmsBadge) filmsBadge.textContent = eligibleFilms.length;
  if (seriesBadge) seriesBadge.textContent = eligibleSeries.length;
}

// Gestion des onglets et catégories
function initNavigation() {
  // Navigation Type (Films / Séries)
  const mediaTabs = document.querySelectorAll('.nav-tab');
  mediaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      mediaTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      AppState.activeType = tab.dataset.type;
      updateMobileGenreDisplay(AppState.activeCategory);
      updateCategoryAutoStar();
      renderCatalog();
    });
  });

  // Navigation 7 Catégories (Desktop / Tablette)
  const catButtons = document.querySelectorAll('.category-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeCategory = btn.dataset.category;
      
      // Synchroniser le menu déroulant et badge mobile
      updateMobileGenreDisplay(btn.dataset.category);

      // Lors du changement de catégorie, on recalcule le palier par défaut (30-50 films)
      AppState.isAutoStars = true;
      updateCategoryAutoStar();
      renderCatalog();
    });
  });

  // Navigation Menu Déroulant Genre Personnalisé (Mobile)
  const dropdownBtn = document.getElementById('genreDropdownBtn');
  const dropdownMenu = document.getElementById('genreDropdownMenu');
  const genreOptions = document.querySelectorAll('.genre-option');

  if (dropdownBtn && dropdownMenu) {
    // Ouvrir / Fermer au clic
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.toggle('open');
      dropdownBtn.classList.toggle('open', isOpen);
      dropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Sélectionner une option
    genreOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedCategory = opt.dataset.category;
        AppState.activeCategory = selectedCategory;

        // Synchroniser les boutons du carousel desktop
        catButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.category === selectedCategory);
        });

        // Synchroniser le menu déroulant personnalisé et le badge
        updateMobileGenreDisplay(selectedCategory);

        // Fermer le menu
        dropdownMenu.classList.remove('open');
        dropdownBtn.classList.remove('open');
        dropdownBtn.setAttribute('aria-expanded', 'false');

        // Recalculer le palier automatique et rafraîchir
        AppState.isAutoStars = true;
        updateCategoryAutoStar();
        renderCatalog();
      });
    });

    // Fermer si clic en dehors
    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('open');
        dropdownBtn.classList.remove('open');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Fermer si touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdownMenu.classList.remove('open');
        dropdownBtn.classList.remove('open');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// Synchronisation de l'affichage du genre sélectionné sur mobile
function updateMobileGenreDisplay(categoryKey) {
  const badgeIcon = document.getElementById('selectedGenreIcon');
  const badgeText = document.getElementById('selectedGenreText');
  const genreOptions = document.querySelectorAll('.genre-option');

  genreOptions.forEach(opt => {
    const isSelected = opt.dataset.category === categoryKey;
    opt.classList.toggle('active', isSelected);
    opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });

  const catInfo = CATEGORIES_INFO[categoryKey] || CATEGORIES_INFO.all;
  if (badgeIcon) badgeIcon.textContent = catInfo.icon || '✨';
  if (badgeText) badgeText.textContent = catInfo.title || 'Tous les titres';
}

// Initialisation de la navigation par étoiles
function initStarsNavigation() {
  const starButtons = document.querySelectorAll('.star-btn');
  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      starButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeStars = btn.dataset.stars;
      AppState.isAutoStars = false; // choix manuel de l'utilisateur
      renderCatalog();
    });
  });
}

// Parser une durée ("1h 45min", "2h 00min", "45min", "1h", etc.) en nombre total de minutes
function parseDurationMinutes(dureeStr) {
  if (!dureeStr || typeof dureeStr !== 'string') return null;
  const str = dureeStr.trim().toLowerCase();

  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*min/);

  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;

  if (!hMatch && !mMatch) {
    const numMatch = str.match(/^\d+$/);
    if (numMatch) return parseInt(numMatch[0], 10);
    return null;
  }

  return (hours * 60) + minutes;
}

// Obtenir la durée minimale en minutes selon les inputs "Plus de"
function getDurationMinMinutes() {
  const hInput = document.getElementById('durationMinH');
  const mInput = document.getElementById('durationMinM');
  if (!hInput || !mInput) return null;

  const hVal = hInput.value.trim();
  const mVal = mInput.value.trim();

  if (hVal === '' && mVal === '') return null;

  const h = hVal !== '' ? Math.max(0, parseInt(hVal, 10) || 0) : 0;
  const m = mVal !== '' ? Math.max(0, Math.min(59, parseInt(mVal, 10) || 0)) : 0;

  return (h * 60) + m;
}

// Obtenir la durée maximale en minutes selon les inputs "Moins de"
function getDurationMaxMinutes() {
  const hInput = document.getElementById('durationMaxH');
  const mInput = document.getElementById('durationMaxM');
  if (!hInput || !mInput) return null;

  const hVal = hInput.value.trim();
  const mVal = mInput.value.trim();

  if (hVal === '' && mVal === '') return null;

  const h = hVal !== '' ? Math.max(0, parseInt(hVal, 10) || 0) : 0;
  const m = mVal !== '' ? Math.max(0, Math.min(59, parseInt(mVal, 10) || 0)) : 0;

  return (h * 60) + m;
}

// Validation et auto-complétion du groupe d'heures et minutes (ex: 1h 5 -> 1h 05, 1h -> 1h 00, 45min -> 0h 45)
function validateAndFormatDurationGroup(hInput, mInput) {
  if (!hInput || !mInput) return;

  const hRaw = hInput.value.trim().replace(/\D/g, '');
  const mRaw = mInput.value.trim().replace(/\D/g, '');

  // Si les deux champs sont vides, laisser vide
  if (hRaw === '' && mRaw === '') {
    hInput.value = '';
    mInput.value = '';
    return;
  }

  // Si au moins un champ est renseigné, formater proprement les deux
  const hNum = hRaw !== '' ? Math.max(0, parseInt(hRaw, 10)) : 0;
  let mNum = mRaw !== '' ? Math.max(0, parseInt(mRaw, 10)) : 0;
  if (mNum > 59) mNum = 59;

  hInput.value = String(hNum);
  mInput.value = String(mNum).padStart(2, '0');
}

// Initialisation des écouteurs du filtre de durée
function initDurationFilter() {
  const minH = document.getElementById('durationMinH');
  const minM = document.getElementById('durationMinM');
  const maxH = document.getElementById('durationMaxH');
  const maxM = document.getElementById('durationMaxM');
  const resetBtn = document.getElementById('durationResetBtn');

  const updateResetBtnVisibility = () => {
    const hasValue = (minH && minH.value !== '') ||
                     (minM && minM.value !== '') ||
                     (maxH && maxH.value !== '') ||
                     (maxM && maxM.value !== '');
    if (resetBtn) {
      resetBtn.classList.toggle('visible', hasValue);
    }
  };

  const onDurationInput = () => {
    updateResetBtnVisibility();
    updateCategoryAutoStar();
    renderCatalog();
  };

  // Configuration des deux groupes (Min et Max)
  const setupGroup = (hInput, mInput) => {
    if (!hInput || !mInput) return;

    const handleBlur = () => {
      setTimeout(() => {
        const active = document.activeElement;
        // Si le focus est encore dans l'autre input du même groupe (ex: passage de h à min), attendre
        if (active === hInput || active === mInput) {
          return;
        }

        // Le focus a complètement quitté le groupe : validation et complétion automatique
        validateAndFormatDurationGroup(hInput, mInput);
        updateResetBtnVisibility();
        updateCategoryAutoStar();
        renderCatalog();
      }, 60);
    };

    // Configuration du champ Heures
    hInput.addEventListener('input', () => {
      const clean = hInput.value.replace(/\D/g, '');
      if (clean !== hInput.value) {
        hInput.value = clean;
      }
      onDurationInput();

      // Dès qu'un chiffre d'heure est saisi, basculer directement sur les minutes
      if (hInput.value.length >= 1) {
        mInput.focus();
        mInput.select();
      }
    });

    hInput.addEventListener('focus', () => {
      hInput.select();
    });

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

    // Configuration du champ Minutes
    mInput.addEventListener('input', () => {
      const clean = mInput.value.replace(/\D/g, '');
      if (clean !== mInput.value) {
        mInput.value = clean;
      }
      onDurationInput();
    });

    mInput.addEventListener('focus', () => {
      mInput.select();
    });

    mInput.addEventListener('blur', handleBlur);

    mInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        validateAndFormatDurationGroup(hInput, mInput);
        updateResetBtnVisibility();
        mInput.blur();
        updateCategoryAutoStar();
        renderCatalog();
      } else if (e.key === 'Backspace' && mInput.value === '') {
        // Revenir en arrière sur l'heure si les minutes sont déjà vides
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

// Obtenir tous les items éligibles selon le type, la catégorie et la plage de durée
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

// Mise à jour du palier d'étoiles automatique pour la catégorie courante
function updateCategoryAutoStar() {
  // Récupérer les items éligibles de la sélection (catégorie + filtre durée éventuel)
  const categoryEligible = getFilteredItemsBeforeStars();

  // Mise à jour des compteurs sur les boutons d'étoiles
  updateStarButtonsCounts(categoryEligible);

  // Si en mode automatique, sélectionner le palier ciblant 30 à 50 films
  if (AppState.isAutoStars) {
    const autoTier = getAutoStarTier(categoryEligible);
    AppState.activeStars = autoTier;
    
    // Mettre à jour l'UI des boutons
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.stars === autoTier);
    });
  }
}

// Obtenir tous les items éligibles selon le type et la catégorie courante
function getCategoryEligibleItems() {
  return AppState.catalog.filter(item => {
    if (!item.is_eligible) return false;
    if (AppState.activeType === 'film') {
      if (item.type !== 'film' && item.type !== 'telefilm') return false;
    } else {
      if (item.type !== AppState.activeType) return false;
    }
    if (AppState.activeCategory !== 'all') {
      if (!item.categories || !item.categories.includes(AppState.activeCategory)) return false;
    }
    return true;
  });
}

// Mise à jour des compteurs individuels sur chaque bouton d'étoiles
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

// Rendu du catalogue aléatoire
function renderCatalog() {
  const grid = document.getElementById('postersGrid');
  const emptyState = document.getElementById('emptyState');
  const titleEl = document.getElementById('currentCategoryTitle');
  const descEl = document.getElementById('currentCategoryDesc');
  const countEl = document.getElementById('displayedCount');

  // Mise à jour de l'en-tête de catégorie (propre, sans suffixes d'exigence ou de note)
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

  // 1. Récupérer les items filtrés par catégorie et par durée
  let items = getFilteredItemsBeforeStars();

  // 2. Mettre à jour les compteurs des étoiles
  updateStarButtonsCounts(items);

  // 3. Filtrer selon le palier d'étoiles actif
  items = items.filter(item => matchesStars(item, AppState.activeStars));

  // 4. Mélanger aléatoirement (Fisher-Yates) à chaque rendu / refresh
  const shuffledItems = shuffleArray(items);

  if (countEl) countEl.textContent = shuffledItems.length;

  // Affichage
  if (shuffledItems.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = '';

  shuffledItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'poster-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Voir les détails de ${item.titre}`);
    card.title = item.titre;

    // Badge officiel CSA / PEGI (-10, -12, -16, -18)
    const badgeHtml = item.badge 
      ? `<div class="csa-badge-container"><img class="csa-badge-img" src="assets/logos/pegi_${item.badge}.png" alt="-${item.badge}"></div>` 
      : '';

    // Logos officiels des chaînes en bas à droite (côte à côte si multi-chaîne, ordre alphabétique)
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
        ${badgeHtml}
        <div class="channel-logo-container ${logosList.length > 1 ? 'has-multiple-logos' : ''}">
          ${channelLogoHtml}
        </div>
      </div>
    `;

    // Clic pour ouvrir la modale
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

// Modale de détails au clic
let savedScrollY = 0;

function initModal() {
  const modal = document.getElementById('movieModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    
    // Restaurer immédiatement la position exacte de défilement où se trouvait l'utilisateur
    window.scrollTo({
      top: savedScrollY,
      left: 0,
      behavior: 'instant'
    });
    // Sécurité supplémentaire pour les navigateurs asynchrones / mobiles
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollY);
    });
  };

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Empêcher le défilement de la page arrière-plan au toucher sur le fond
  modal.addEventListener('touchmove', (e) => {
    if (e.target === modal) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

function openModal(item) {
  // Enregistrer immédiatement la position exacte de scroll avant d'afficher la modale
  savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

  const modal = document.getElementById('movieModal');
  const poster = document.getElementById('modalPoster');
  const title = document.getElementById('modalTitle');
  const year = document.getElementById('modalYear');
  const typeBadge = document.getElementById('modalTypeBadge');
  const modalCsaBadge = document.getElementById('modalCsaBadge');
  const channel = document.getElementById('modalChannel');
  const categoriesContainer = document.getElementById('modalCategories');
  const ratingEl = document.getElementById('modalRating');

  const durationRow = document.getElementById('modalDurationRow');
  const durationLabel = document.getElementById('modalDurationLabel');
  const durationVal = document.getElementById('modalDuration');

  poster.src = item.poster;
  poster.alt = item.titre;
  title.textContent = item.titre;
  year.textContent = item.annee;
  
  // Le type reste 'Film' ou 'Série'
  typeBadge.textContent = item.type === 'film' ? 'Film' : 'Série';

  // Affichage de la durée au milieu uniquement (garantir le format Xh YYmin, même si 00)
  const formattedDuree = (item.duree || '').replace(/^(\d+)h$/i, '$1h 00min');
  if (formattedDuree) {
    if (durationRow) {
      durationRow.style.display = 'flex';
      if (durationLabel) {
        durationLabel.textContent = item.type === 'serie' ? '⏱️ Durée moyenne' : '⏱️ Durée';
      }
      if (durationVal) durationVal.textContent = formattedDuree;
    }
  } else {
    if (durationRow) durationRow.style.display = 'none';
  }
  
  // Badge CSA dans la modale
  if (modalCsaBadge) {
    if (item.badge) {
      modalCsaBadge.innerHTML = `<img class="csa-badge-img modal-csa-img" src="assets/logos/pegi_${item.badge}.png" alt="-${item.badge}">`;
      modalCsaBadge.style.display = 'inline-flex';
    } else {
      modalCsaBadge.innerHTML = '';
      modalCsaBadge.style.display = 'none';
    }
  }
  
  // Chaîne avec logo(s) (côte à côte si plusieurs chaînes)
  const logosList = item.logos_chaine && item.logos_chaine.length 
    ? item.logos_chaine 
    : (item.logo_chaine ? [item.logo_chaine] : []);
  const chainesList = item.chaines && item.chaines.length 
    ? item.chaines 
    : (item.chaine ? [item.chaine] : []);

  if (logosList.length > 0) {
    channel.innerHTML = `
      <div class="modal-channel-logos">
        ${logosList.map((logoUrl, i) => `<img class="modal-channel-logo" src="${logoUrl}" alt="${chainesList[i] || ''}" title="${chainesList[i] || ''}">`).join('')}
      </div>
    `;
  } else {
    channel.innerHTML = `<span class="channel-name-tag">${chainesList.join(' • ')}</span>`;
  }
  
  // Catégories chips (au milieu)
  categoriesContainer.innerHTML = '';
  if (item.categories && item.categories.length > 0) {
    item.categories.forEach(catKey => {
      const catObj = CATEGORIES_INFO[catKey];
      if (catObj) {
        const chip = document.createElement('span');
        chip.className = 'category-chip';
        chip.textContent = catObj.title;
        categoriesContainer.appendChild(chip);
      }
    });
  }

  // Note globale (en 3e) avec étoiles
  if (ratingEl) {
    const score = Number(item.note_globale || item.note_avis || 0);
    let starsSymbol = '★★★';
    if (score >= 8.0) starsSymbol = '★★★★★';
    else if (score >= 7.0) starsSymbol = '★★★★';
    
    const displayRating = (item.note_globale !== undefined && item.note_globale !== null)
      ? Number(item.note_globale).toFixed(1)
      : (item.note_avis !== undefined && item.note_avis !== null ? Number(item.note_avis).toFixed(1) : '-');
    ratingEl.innerHTML = `${displayRating} / 10 <span class="modal-stars-tag">${starsSymbol}</span>`;
  }

  document.body.classList.add('modal-open');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
