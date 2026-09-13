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

// Algorithme de mélange aléatoire de Fisher-Yates (indépendant à chaque exécution/refresh)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

  // Navigation Menu Déroulant Genre (Mobile)
  const mobileCatSelect = document.getElementById('mobileCategorySelect');
  if (mobileCatSelect) {
    mobileCatSelect.addEventListener('change', (e) => {
      const selectedCategory = e.target.value;
      AppState.activeCategory = selectedCategory;

      // Synchroniser les boutons du carousel desktop
      catButtons.forEach(b => {
        b.classList.toggle('active', b.dataset.category === selectedCategory);
      });

      updateMobileGenreDisplay(selectedCategory);

      // Recalculer le palier automatique
      AppState.isAutoStars = true;
      updateCategoryAutoStar();
      renderCatalog();
    });
  }
}

// Synchronisation de l'affichage du genre sélectionné sur mobile
function updateMobileGenreDisplay(categoryKey) {
  const mobileCatSelect = document.getElementById('mobileCategorySelect');
  const badgeIcon = document.getElementById('selectedGenreIcon');
  const badgeText = document.getElementById('selectedGenreText');

  if (mobileCatSelect && mobileCatSelect.value !== categoryKey) {
    mobileCatSelect.value = categoryKey;
  }

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

// Mise à jour du palier d'étoiles automatique pour la catégorie courante
function updateCategoryAutoStar() {
  // Récupérer tous les items éligibles de la catégorie courante
  const categoryEligible = getCategoryEligibleItems();

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

  // 1. Récupérer les items de la catégorie
  let items = getCategoryEligibleItems();

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
function initModal() {
  const modal = document.getElementById('movieModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
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
  const modal = document.getElementById('movieModal');
  const poster = document.getElementById('modalPoster');
  const title = document.getElementById('modalTitle');
  const year = document.getElementById('modalYear');
  const typeBadge = document.getElementById('modalTypeBadge');
  const modalCsaBadge = document.getElementById('modalCsaBadge');
  const channel = document.getElementById('modalChannel');
  const categoriesContainer = document.getElementById('modalCategories');
  const ratingEl = document.getElementById('modalRating');

  poster.src = item.poster;
  poster.alt = item.titre;
  title.textContent = item.titre;
  year.textContent = item.annee;
  
  // Le type reste 'Film' ou 'Série'
  typeBadge.textContent = item.type === 'film' ? 'Film' : 'Série';
  
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
  document.documentElement.classList.add('modal-open');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
