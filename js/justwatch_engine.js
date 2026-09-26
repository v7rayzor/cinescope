/**
 * CinéScope - Moteur de Streaming Temps Réel JustWatch V2
 * Qualification stricte, logos officiels, tri par fin de droits, gestion incrémentale 50 + mensuelle.
 */

const JustWatchEngine = (function () {
  const STORAGE_KEY_CATALOG = 'cinescope_streaming_catalog_v13';
  const STORAGE_KEY_SYNC = 'cinescope_streaming_last_sync_v13';
  const STORAGE_KEY_FULL_SYNC = 'cinescope_streaming_last_full_sync_v13';
  const STORAGE_KEY_AUTOSYNC = 'cinescope_streaming_autosync_v13';

  // Purge proactive des anciennes versions de cache pour éviter le dépassement de quota
  function cleanLegacyLocalStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const keysToKeep = [
        STORAGE_KEY_CATALOG,
        STORAGE_KEY_SYNC,
        STORAGE_KEY_FULL_SYNC,
        STORAGE_KEY_AUTOSYNC
      ];
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.startsWith('cinescope_streaming_') && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('[JustWatchEngine] Nettoyage ancien stockage :', e);
    }
  }

  cleanLegacyLocalStorage();

  // Configuration des bouquets et packages JustWatch France avec logos officiels
  const PACKAGES_CONFIG = {
    aoc: {
      name: 'Ciné+ OCS',
      logo: 'assets/logos/cine_ocs.svg',
      badgeClass: 'badge-ocs'
    },
    aca: {
      name: 'Action Max',
      logo: 'assets/logos/action.png',
      badgeClass: 'badge-action'
    },
    auc: {
      name: 'Universal+',
      logo: 'assets/logos/universal_plus.svg',
      badgeClass: 'badge-universal'
    }
  };

  const PACKAGE_SLUGS = ['aoc', 'aca', 'auc'];

  // Barème de récence : 2000 = 4.0, 2026 = 10.0
  function computeNoteRecence(year) {
    if (!year || year < 2000) return 0;
    const currentMaxYear = 2026;
    const note = 4.0 + ((Math.min(year, currentMaxYear) - 2000) / (currentMaxYear - 2000)) * 6.0;
    return Math.round(note * 10) / 10;
  }

  // Dictionnaire de normalisation bilingue des tags de genre JustWatch
  const GENRE_CODE_MAP = {
    'hrr': 'hrr', 'horreur': 'hrr', 'horror': 'hrr', 'epouvante': 'hrr',
    'ani': 'ani', 'animation': 'ani', 'anime': 'ani',
    'act': 'act', 'action': 'act', 'action & aventure': 'act', 'action & adventure': 'act', 'aventure': 'act', 'adventure': 'act',
    'scf': 'scf', 'science-fiction': 'scf', 'science fiction': 'scf', 'sci-fi': 'scf',
    'fnt': 'fnt', 'fantastique': 'fnt', 'fantasy': 'fnt',
    'cmy': 'cmy', 'comedie': 'cmy', 'comédie': 'cmy', 'comedy': 'cmy',
    'drm': 'drm', 'drame': 'drm', 'drama': 'drm',
    'crm': 'crm', 'crime': 'crm', 'policier': 'crm',
    'trl': 'trl', 'thriller': 'trl', 'mystère & thriller': 'trl', 'mystere & thriller': 'trl', 'mystere': 'trl', 'mystère': 'trl',
    'fml': 'fml', 'famille': 'fml', 'family': 'fml',
    'wsn': 'wsn', 'western': 'wsn',
    'rma': 'rma', 'romance': 'rma', 'romantique': 'rma',
    'war': 'war', 'guerre': 'war',
    'hst': 'hst', 'histoire': 'hst', 'historique': 'hst', 'history': 'hst',
    'doc': 'doc', 'documentaire': 'doc', 'documentary': 'doc',
    'rly': 'rly', 'telerealite': 'rly', 'téléréalité': 'rly', 'reality tv': 'rly',
    'eur': 'eur', 'europeen': 'eur'
  };

  function normalizeTag(tag) {
    if (!tag) return '';
    const clean = (typeof tag === 'string' ? tag : (tag.shortName || tag.translation || tag.name || ''))
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return GENRE_CODE_MAP[clean] || clean;
  }

  // Motifs contextuels déterminants (Titre & Synopsis)
  const POLICE_CRIME_PATTERNS = /\b(tueur a gages|tueurs a gages|tueuse a gages|tueur en serie|tueurs en serie|meurtre|meurtres|assassinat|assassinats|mafia|gangster|gangsters|cercle de jeu|detective|commissaire|police|policiere|braquage|braqueurs|cambrioleurs|cadavre|cadavres|enquete criminelle|suspect|suspects|cartel|trafic de drogue|section criminelle|dettes de jeu|creanciers|usurpe l identite|pendu|fugitif|homicide|homicides)\b/i;
  const ADVENTURE_PATTERNS = /\b(cite perdue|archeologue|archeologues|archeologie|expedition|jungle|amazonie|chasse au tresor|pyramide|pharaon|kheops|western|cowboy|sherif|arts martiaux|kung fu|baston|videur|catastrophe|comete|apocalypse|fin du monde|gladiateur|gladiateurs|peplum)\b/i;
  const STRICT_HORROR_PATTERNS = /\b(satan|satanique|possession demoniaque|exorcisme|pacte avec satan|pacte avec le diable|slasher|gore|body horror|zombie|zombies|mort-vivant|morts-vivants|maison hantee|lieu sacre profane|monstre sanguinaire|lovecraft|terreur nocturne|contagion mortelle|magie noire|boite de pandore|pandore)\b/i;
  const SCIFI_PATTERNS = /\b(vaisseau|vaisseaux|extraterrestre|extraterrestres|alien|aliens|astronaute|astronautes|planete deserte|voyage dans le temps|multivers|reincarnation|changement climatique|androide|ia|robot|dystopie|futuriste|mutant|mutants|quatre terres|arborlon|elfe|elfes|druide|druides)\b/i;
  const DRAMA_INTIME_PATTERNS = /\b(traumatisme|traumatise|monde imaginaire|deuil|orphelin|orpheline|harcele|harcelement|skate|skateur|suisse|euthanasie|aide soignant|actrice|showbiz|homosexualite|homosexuel|desir|compagnie miniere|ressources humaines|obsession|biopic|chanteur|chanteuse|robbie williams|sorrentino|naples|parthenope)\b/i;
  const PARODY_PATTERNS = /\b(oss 117|agent special|parodie|espion malhabile|gaffeur)\b/i;
  const ANIMATION_PATTERNS = /\b(serie d animation|serie televisee d animation|film d animation|dessin anime|dessins animes|court metrage d animation)\b/i;

  // Harnais de Cohérence : Détermine les catégories formellement autorisées pour un ensemble de tags et de contexte
  function getAllowedCategories(tags, cleanText = '', isHybridWithAge = false, isMatureFamily = false) {
    const allowed = new Set();
    
    // 1. Catégories autorisées par les tags de genre
    // Famille / Animation autorisée seulement si pas de signalétique mature (-12, -16, -18)
    if (!isMatureFamily && (tags.includes('ani') || (tags.includes('fml') && (tags.includes('fnt') || tags.includes('scf') || !tags.includes('cmy'))))) {
      allowed.add('animation_famille');
    }
    if (tags.includes('hrr')) allowed.add('horreur_epouvante');
    if (tags.includes('scf') || tags.includes('fnt')) allowed.add('scifi_fantastique');
    if (tags.includes('crm') || tags.includes('trl')) allowed.add('thriller_policier');
    if (tags.includes('act') || tags.includes('wsn') || tags.includes('war')) allowed.add('action_aventure');
    
    // Télé-réalité (rly) ou comédie sans limite d'âge hybride
    if (tags.includes('rly') || ((tags.includes('cmy') || tags.includes('rly')) && !isHybridWithAge)) {
      allowed.add('comedie');
    }
    
    // Drame autorisé si tag drame/docu/romance/histoire/guerre/sport (hors télé-réalité pure) OU si pas d'autre catégorie
    if (!tags.includes('rly') && (tags.includes('drm') || tags.includes('rma') || tags.includes('doc') || (tags.includes('hst') && !tags.includes('cmy')) || (tags.includes('war') && !tags.includes('cmy')) || (tags.includes('spt') && !tags.includes('cmy')) || allowed.size === 0)) {
      allowed.add('drame_emotion');
    }

    // 2. Déverrouillage contextuel ciblé et protégé
    if (cleanText) {
      if (POLICE_CRIME_PATTERNS.test(cleanText) && (!tags.includes('cmy') || tags.includes('crm') || tags.includes('trl') || isHybridWithAge)) {
        allowed.add('thriller_policier');
      }
      if (ADVENTURE_PATTERNS.test(cleanText) && (!tags.includes('cmy') || isHybridWithAge)) {
        allowed.add('action_aventure');
      }
      if (STRICT_HORROR_PATTERNS.test(cleanText)) {
        allowed.add('horreur_epouvante');
      }
      if (SCIFI_PATTERNS.test(cleanText)) {
        allowed.add('scifi_fantastique');
      }
      if (!isMatureFamily && ANIMATION_PATTERNS.test(cleanText)) {
        allowed.add('animation_famille');
      }
    }

    return allowed;
  }

  // Attribution de la catégorie unique dominante via Système Déterministe Hiérarchique avec Harnais de Cohérence
  function computeCategory(genres, isSerie = false, title = '', synopsis = '', ageCertification = '', year = null, packages = []) {
    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return 'drame_emotion';
    }

    const rawTags = genres.map(normalizeTag).filter(Boolean);
    if (!rawTags.length) return 'drame_emotion';

    const cleanText = ((title || '') + ' ' + (synopsis || ''))
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ');

    // Règle d'or : Vérification de la restriction d'âge (-10, -12, -16, -18)
    const hasAnyAgeLimit = ageCertification && ['10', '12', '16', '18'].some(l => ageCertification.toString().includes(l));
    const isMatureAge = ageCertification && ['12', '16', '18'].some(l => ageCertification.toString().includes(l));

    // Règle Comédie Hybride avec pastille d'âge (-10, -12, -16, -18) -> exclusion de comedie
    const otherMeaningfulGenres = rawTags.filter(t => t !== 'cmy' && t !== 'eur' && t !== 'fml' && t !== 'rly');
    const isHybridWithAge = rawTags.includes('cmy') && otherMeaningfulGenres.length > 0 && hasAnyAgeLimit;

    // Règle Famille / Animation Mature : exclue d'animation_famille si pastille -12, -16, -18 ou série live avec restriction
    const isMatureFamily = isMatureAge || (isSerie && !rawTags.includes('ani') && hasAnyAgeLimit);

    const allowed = getAllowedCategories(rawTags, cleanText, isHybridWithAge, isMatureFamily);

    // 0. Règle Télé-réalité (rly) : Toujours en Comédie / Divertissement
    if (rawTags.includes('rly')) {
      if (allowed.has('comedie')) return 'comedie';
    }

    // 1. Règle souveraine Animation / Dessin animé (si autorisée) : 'ani' ou motif explicite d'animation
    if (!isMatureFamily && (rawTags.includes('ani') || ANIMATION_PATTERNS.test(cleanText))) {
      if (allowed.has('animation_famille')) return 'animation_famille';
    }

    // 2. Règle Famille / Jeunesse avec créatures / jeu vidéo / fantasy (ex: Sonic 3, Bigfoot Junior)
    if (!isMatureFamily && rawTags.includes('fml') && (rawTags.includes('fnt') || rawTags.includes('scf')) && !rawTags.includes('hrr')) {
      if (allowed.has('animation_famille')) return 'animation_famille';
    }

    // 3. Règle Horreur :
    // - Tout film d'horreur ou motif strict horrifique (ex: La Chose derrière la porte, Heretic, It Comes at Night, Walking Dead)
    // - Comédies d'horreur avec pastille d'âge -10/-12/-16/-18 (ex: Black Friday !, The Ugly Stepsister, Accident domestique)
    if (rawTags.includes('hrr') || STRICT_HORROR_PATTERNS.test(cleanText)) {
      const isPureParodyWithoutAge = rawTags.includes('cmy') && !hasAnyAgeLimit && !STRICT_HORROR_PATTERNS.test(cleanText); // ex: Vade Retro
      const isCyberCrime = rawTags.includes('crm') && rawTags.includes('act') && !STRICT_HORROR_PATTERNS.test(cleanText); // ex: Cloud
      const isDavidLynch = cleanText.includes('inland empire');
      const isShannaraFantasy = (rawTags.includes('fnt') || rawTags.includes('scf')) && (cleanText.includes('quatre terres') || cleanText.includes('shannara') || cleanText.includes('arborlon') || cleanText.includes('elfe'));

      if (!isPureParodyWithoutAge && !isCyberCrime && !isDavidLynch && !isShannaraFantasy) {
        if (allowed.has('horreur_epouvante')) return 'horreur_epouvante';
      }
    }

    // 4. Règle Western pur (exclut les polars contemporains et intrigues criminelles)
    if (rawTags.includes('wsn') && !rawTags.includes('crm') && !POLICE_CRIME_PATTERNS.test(cleanText) && allowed.has('action_aventure')) {
      return 'action_aventure';
    }

    // 5. Règle Documentaire pur (portrait, cinéma, nature, histoire)
    if (rawTags.includes('doc') && !rawTags.includes('cmy') && !rawTags.includes('hrr') && !rawTags.includes('crm') && !rawTags.includes('trl') && !rawTags.includes('rly')) {
      if (allowed.has('drame_emotion')) return 'drame_emotion';
    }

    // 6. Système de scores équilibré
    // [0: animation_famille, 1: horreur_epouvante, 2: scifi_fantastique, 3: thriller_policier, 4: action_aventure, 5: comedie, 6: drame_emotion]
    const scores = [0, 0, 0, 0, 0, 0, 0];

    // Animation / Famille
    if (!isMatureFamily) {
      if (rawTags.includes('ani')) scores[0] += 100;
      if (rawTags.includes('fml') && !rawTags.includes('cmy')) scores[0] += 40;
    }

    // Horreur
    if (rawTags.includes('hrr')) scores[1] += 60;

    // Sci-Fi / Fantastique
    if (rawTags.includes('scf')) scores[2] += 50;
    if (rawTags.includes('fnt')) scores[2] += 40;

    // Thriller & Policier
    if (rawTags.includes('crm')) scores[3] += 55;
    if (rawTags.includes('trl')) scores[3] += 35;

    // Action & Aventure
    if (rawTags.includes('act')) scores[4] += 50;
    if (rawTags.includes('war')) scores[4] += 30;

    // Comédie (exclue si hybride avec limite d'âge)
    if (rawTags.includes('cmy') && !isHybridWithAge) scores[5] += 55;
    if (rawTags.includes('rly')) scores[5] += 70;

    // Drame & Romance
    if (rawTags.includes('drm')) scores[6] += 35;
    if (rawTags.includes('rma')) scores[6] += 40;
    if (rawTags.includes('hst')) scores[6] += 25;

    // Contextuel
    if (POLICE_CRIME_PATTERNS.test(cleanText) && (!rawTags.includes('cmy') || rawTags.includes('crm') || rawTags.includes('trl') || isHybridWithAge)) scores[3] += 35;
    if (ADVENTURE_PATTERNS.test(cleanText) && (!rawTags.includes('cmy') || isHybridWithAge)) scores[4] += 25;
    if (SCIFI_PATTERNS.test(cleanText)) scores[2] += 40;
    if (DRAMA_INTIME_PATTERNS.test(cleanText)) scores[6] += 35;
    if (PARODY_PATTERNS.test(cleanText) && rawTags.includes('cmy') && !hasAnyAgeLimit) scores[5] += 45;

    // Arbitrages fins de combinaisons :
    // a) Romance d'auteur / intime / drame réaliste / deuil / passion avec tag fnt accessoire / Biopic musical
    if (rawTags.includes('drm') && !rawTags.includes('scf') && !SCIFI_PATTERNS.test(cleanText)) {
      if (rawTags.includes('rma') || DRAMA_INTIME_PATTERNS.test(cleanText) || (!rawTags.includes('cmy') && !rawTags.includes('fnt')) || (rawTags.includes('drm') && rawTags.includes('fnt') && !cleanText.includes('geant') && !cleanText.includes('monstre') && !cleanText.includes('magie') && !cleanText.includes('sorcier') && !cleanText.includes('arthur') && !cleanText.includes('kaamelott') && !cleanText.includes('vampire') && !cleanText.includes('demon') && !cleanText.includes('diable') && !cleanText.includes('shannara') && !cleanText.includes('quatre terres'))) {
        scores[6] += 30;
      }
    }
    // b) Fantastique / Conte / Légende arthurienne / Fantasy (ex: Kaamelott, Chasseuse de géants, Shannara) -> Sci-Fi / Fantastique
    if (rawTags.includes('fnt') && (cleanText.includes('geant') || cleanText.includes('monstre') || cleanText.includes('magie') || cleanText.includes('sorcier') || cleanText.includes('arthur') || cleanText.includes('kaamelott') || cleanText.includes('creature') || cleanText.includes('vampire') || cleanText.includes('malediction') || cleanText.includes('royaume') || cleanText.includes('feerique') || cleanText.includes('conte') || cleanText.includes('shannara') || cleanText.includes('quatre terres'))) {
      scores[2] += 45;
    }
    // c) Pure Science-Fiction / Mutants / Aliens / Vaisseaux / Dystopie / Catastrophe -> Sci-Fi
    if (rawTags.includes('scf') && (SCIFI_PATTERNS.test(cleanText) || rawTags.includes('act') || rawTags.includes('fnt') || rawTags.includes('drm'))) {
      scores[2] += 40;
    }
    // d) Polar sérieux / Braquage / Cyber-polar / Mafia / Dette de jeu / Homicide -> Thriller (hors parodie pure)
    if (rawTags.includes('crm') || (rawTags.includes('trl') && POLICE_CRIME_PATTERNS.test(cleanText))) {
      if ((!rawTags.includes('cmy') || isHybridWithAge || POLICE_CRIME_PATTERNS.test(cleanText) || isSerie) && !PARODY_PATTERNS.test(cleanText)) {
        scores[3] += 40;
      }
    }
    // e) Action Blockbuster / Novocaïne / Spartacus / Tonnerre sous les tropiques -> Action
    if (rawTags.includes('act') && (rawTags.includes('war') || rawTags.includes('rma') || isHybridWithAge || cleanText.includes('gladiateur') || cleanText.includes('combattant') || cleanText.includes('braquage') || (rawTags.includes('trl') && !rawTags.includes('crm') && !rawTags.includes('scf') && !POLICE_CRIME_PATTERNS.test(cleanText)))) {
      scores[4] += 40;
    }
    // f) Comédie dramatique d'auteur (Ollie, Vera, On ira)
    if (rawTags.includes('cmy') && rawTags.includes('drm') && !rawTags.includes('act') && (DRAMA_INTIME_PATTERNS.test(cleanText) || (rawTags.includes('rma') && !cleanText.includes('deuxieme acte')))) {
      scores[6] += 25;
    }

    const catNames = [
      'animation_famille',
      'horreur_epouvante',
      'scifi_fantastique',
      'thriller_policier',
      'action_aventure',
      'comedie',
      'drame_emotion'
    ];

    let bestIdx = 6;
    let maxScore = -Infinity;
    for (let i = 0; i < 7; i++) {
      const catName = catNames[i];
      if (!allowed.has(catName)) continue;
      if (catName === 'comedie' && isHybridWithAge) continue;
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        bestIdx = i;
      }
    }

    return catNames[bestIdx];
  }

  // Formatage de la durée en minutes -> "Xh XXmin"
  function formatDuration(runtimeMinutes, isSerie) {
    if (!runtimeMinutes || runtimeMinutes <= 0) {
      return isSerie ? '45 min/ép.' : '1h 30min';
    }
    if (isSerie) {
      return `${runtimeMinutes} min/ép.`;
    }
    const h = Math.floor(runtimeMinutes / 60);
    const m = runtimeMinutes % 60;
    return h > 0 ? `${h}h ${m < 10 ? '0' + m : m}min` : `${m}min`;
  }

  // Calcul du compte à rebours d'expiration
  // RÈGLE MULTI-BOUQUETS : Retenir la date la plus LOINTAINE parmi les bouquets qui diffusent le film
  function computeExpirationInfo(offers) {
    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return { status: 'none', label: null, daysLeft: null, expirationDate: null, packageExpirations: {} };
    }

    const relevantOffers = offers.filter(o => o.package && PACKAGE_SLUGS.includes(o.package.shortName));
    if (relevantOffers.length === 0) {
      return { status: 'none', label: null, daysLeft: null, expirationDate: null, packageExpirations: {} };
    }

    const packageExpirations = {};
    let latestDate = null;
    let latestIsoStr = null;

    for (const offer of relevantOffers) {
      const pkg = offer.package.shortName;
      const dateStr = offer.availableTo || offer.availableToTime;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          if (!packageExpirations[pkg] || new Date(packageExpirations[pkg]) < d) {
            packageExpirations[pkg] = dateStr;
          }
          if (!latestDate || d > latestDate) {
            latestDate = d;
            latestIsoStr = dateStr;
          }
        }
      }
    }

    if (!latestDate) {
      return { status: 'none', label: null, daysLeft: null, expirationDate: null, packageExpirations };
    }

    const now = new Date();
    const diffTime = latestDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', label: 'Expiré', daysLeft, expirationDate: latestIsoStr, packageExpirations };
    }
    if (daysLeft === 0) {
      return { status: 'urgent', label: '⏳ Expire aujourd\'hui', daysLeft: 0, expirationDate: latestIsoStr, packageExpirations };
    }
    if (daysLeft === 1) {
      return { status: 'urgent', label: '⏳ Expire demain', daysLeft: 1, expirationDate: latestIsoStr, packageExpirations };
    }
    if (daysLeft <= 3) {
      return { status: 'urgent', label: `⏳ Expire dans ${daysLeft} j`, daysLeft, expirationDate: latestIsoStr, packageExpirations };
    }
    if (daysLeft <= 14) {
      return { status: 'warning', label: `⏳ Expire dans ${daysLeft} j`, daysLeft, expirationDate: latestIsoStr, packageExpirations };
    }

    const day = latestDate.getDate().toString().padStart(2, '0');
    const month = (latestDate.getMonth() + 1).toString().padStart(2, '0');
    return { status: 'info', label: `📅 Jusqu'au ${day}/${month}`, daysLeft, expirationDate: latestIsoStr, packageExpirations };
  }

  // Recalculer le compte à rebours d'un item déjà en cache à la date du jour et purger les bouquets expirés
  function refreshItemExpiration(item) {
    if (!item.expiration) {
      item.expiration = { status: 'none', label: null, daysLeft: null, expirationDate: null, packageExpirations: {} };
      return item;
    }

    const pkgExps = item.expiration.packageExpirations || {};
    let activePkgs = (item.package_slugs || []).filter(k => PACKAGES_CONFIG[k]);
    if (activePkgs.length === 0) {
      const chaineLower = ((item.chaine || '') + ' ' + (item.chaines || []).join(' ')).toLowerCase();
      if (chaineLower.includes('action')) activePkgs.push('aca');
      else if (chaineLower.includes('universal') || chaineLower.includes('syfy') || chaineLower.includes('13eme')) activePkgs.push('auc');
      else activePkgs.push('aoc');
    }
    const now = new Date();

    // 1. Filtrer et retirer les bouquets dont la date individuelle est dépassée
    const remainingPkgs = [];
    for (const pkg of activePkgs) {
      const expStr = pkgExps[pkg];
      if (expStr) {
        const d = new Date(expStr);
        if (!isNaN(d.getTime()) && d < now) {
          // Ce bouquet particulier a expiré : on ne le retient plus
          continue;
        }
      }
      remainingPkgs.push(pkg);
    }

    // Si tous les bouquets ont expiré -> le film est totalement retiré
    if (activePkgs.length > 0 && remainingPkgs.length === 0) {
      item.expiration = { status: 'expired', label: 'Expiré', daysLeft: -1, expirationDate: item.expiration.expirationDate, packageExpirations: pkgExps };
      return item;
    }

    // Mettre à jour les chaînes et logos restants strictement selon PACKAGES_CONFIG
    if (remainingPkgs.length > 0) {
      item.package_slugs = remainingPkgs;
      item.chaines = remainingPkgs.map(k => PACKAGES_CONFIG[k].name);
      item.logos_chaine = remainingPkgs.map(k => PACKAGES_CONFIG[k].logo);
      item.chaine = PACKAGES_CONFIG[remainingPkgs[0]]?.name || PACKAGES_CONFIG.aoc.name;
      item.logo_chaine = PACKAGES_CONFIG[remainingPkgs[0]]?.logo || PACKAGES_CONFIG.aoc.logo;
    }

    // 2. Calculer la date la plus lointaine parmi les bouquets encore actifs
    let latestDate = null;
    let latestIsoStr = null;

    for (const pkg of remainingPkgs) {
      const expStr = pkgExps[pkg];
      if (expStr) {
        const d = new Date(expStr);
        if (!isNaN(d.getTime()) && (!latestDate || d > latestDate)) {
          latestDate = d;
          latestIsoStr = expStr;
        }
      }
    }

    if (!latestDate && item.expiration.expirationDate) {
      const d = new Date(item.expiration.expirationDate);
      if (!isNaN(d.getTime())) {
        latestDate = d;
        latestIsoStr = item.expiration.expirationDate;
      }
    }

    if (!latestDate) {
      item.expiration = { status: 'none', label: null, daysLeft: null, expirationDate: null, packageExpirations: pkgExps };
      return item;
    }

    const diffTime = latestDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      item.expiration = { status: 'expired', label: 'Expiré', daysLeft, expirationDate: latestIsoStr, packageExpirations: pkgExps };
    } else if (daysLeft === 0) {
      item.expiration = { status: 'urgent', label: '⏳ Expire aujourd\'hui', daysLeft: 0, expirationDate: latestIsoStr, packageExpirations: pkgExps };
    } else if (daysLeft === 1) {
      item.expiration = { status: 'urgent', label: '⏳ Expire demain', daysLeft: 1, expirationDate: latestIsoStr, packageExpirations: pkgExps };
    } else if (daysLeft <= 3) {
      item.expiration = { status: 'urgent', label: `⏳ Expire dans ${daysLeft} j`, daysLeft, expirationDate: latestIsoStr, packageExpirations: pkgExps };
    } else if (daysLeft <= 14) {
      item.expiration = { status: 'warning', label: `⏳ Expire dans ${daysLeft} j`, daysLeft, expirationDate: latestIsoStr, packageExpirations: pkgExps };
    } else {
      const day = latestDate.getDate().toString().padStart(2, '0');
      const month = (latestDate.getMonth() + 1).toString().padStart(2, '0');
      item.expiration = { status: 'info', label: `📅 Jusqu'au ${day}/${month}`, daysLeft, expirationDate: latestIsoStr, packageExpirations: pkgExps };
    }

    return item;
  }

  // Traitement d'un nœud JustWatch brut pour qualification selon les 3 critères
  function processTitleNode(node) {
    if (!node || !node.content) return null;
    const c = node.content;
    const year = c.originalReleaseYear;

    // Condition 0 : Au moins un genre valide renseigné (sinon exclu)
    if (!c.genres || !Array.isArray(c.genres) || c.genres.length === 0) return null;

    // Condition 2 : Note Récence >= 4.0 / 10 (KO automatique < 2000)
    const noteRecence = computeNoteRecence(year);
    if (noteRecence < 4.0) return null;

    // Condition 1 : Note Avis >= 4.0 / 10
    const imdb = c.scoring?.imdbScore || null;
    const rt = c.scoring?.tomatoScore ? c.scoring.tomatoScore / 10 : null;
    const tmdb = c.scoring?.tmdbScore || null;

    let noteAvis = null;
    if (imdb !== null && rt !== null) {
      noteAvis = (imdb + rt) / 2;
    } else if (imdb !== null) {
      noteAvis = imdb;
    } else if (rt !== null) {
      noteAvis = rt;
    } else if (tmdb !== null) {
      noteAvis = tmdb;
    }

    if (noteAvis === null || isNaN(noteAvis)) return null;
    noteAvis = Math.round(noteAvis * 10) / 10;
    if (noteAvis < 4.0) return null;

    // Condition 3 : Note Globale >= 6.0 / 10
    const noteGlobale = Math.round(((noteAvis + noteRecence) / 2) * 10) / 10;
    if (noteGlobale < 6.0) return null;

    // Paliers d'étoiles CinéScope
    let etoiles = 3;
    if (noteGlobale >= 8.0) etoiles = 5;
    else if (noteGlobale >= 7.0) etoiles = 4;

    const offers = node.offers || [];
    const matchedPackages = [];
    offers.forEach(o => {
      const sName = o.package?.shortName;
      if (PACKAGES_CONFIG[sName] && !matchedPackages.includes(sName)) {
        matchedPackages.push(sName);
      }
    });

    const primaryPkgKey = matchedPackages[0] || 'aoc';
    const primaryPkg = PACKAGES_CONFIG[primaryPkgKey] || PACKAGES_CONFIG.aoc;

    const chainesList = matchedPackages.map(k => PACKAGES_CONFIG[k].name);
    const logosList = matchedPackages.map(k => PACKAGES_CONFIG[k].logo);

    const isSerie = node.id && (node.id.startsWith('ts') || node.nodeType === 'SHOW');
    const typeStr = isSerie ? 'serie' : 'film';

    let posterUrl = 'assets/favicon.png';
    if (c.posterUrl) {
      posterUrl = `https://images.justwatch.com${c.posterUrl.replace('{profile}', 's592').replace('{format}', 'jpg')}`;
    }

    let badge = null;
    if (c.ageCertification) {
      const cert = c.ageCertification.toString();
      if (cert.includes('18')) badge = '18';
      else if (cert.includes('16')) badge = '16';
      else if (cert.includes('12')) badge = '12';
      else if (cert.includes('10')) badge = '10';
    }

    const expiration = computeExpirationInfo(offers);

    return {
      id: `jw-${node.id || node.objectId}`,
      titre: c.title || 'Titre inconnu',
      type: typeStr,
      chaine: primaryPkg.name,
      chaines: chainesList.length > 0 ? chainesList : [primaryPkg.name],
      logo_chaine: primaryPkg.logo,
      logos_chaine: logosList.length > 0 ? logosList : [primaryPkg.logo],
      package_slugs: matchedPackages,
      annee: year,
      duree: formatDuration(c.runtime, isSerie),
      runtime_minutes: c.runtime || 0,
      note_avis: noteAvis,
      note_recence: noteRecence,
      note_globale: noteGlobale,
      etoiles: etoiles,
      categories: [computeCategory(c.genres, isSerie, c.title, c.shortDescription, c.ageCertification, year, matchedPackages)],
      raw_genres: (c.genres || []).map(normalizeTag).filter(Boolean),
      badge: badge,
      is_eligible: true,
      poster: posterUrl,
      synopsis: c.shortDescription || '',
      expiration: expiration
    };
  }

  // Clé de déduplication stricte (Titre normalisé sans accents ni ponctuation + Année + Type)
  function getDeduplicationKey(item) {
    if (!item || !item.titre) return '';
    const normTitle = (item.titre || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const yr = item.annee || '';
    const tp = item.type || 'film';
    return `${normTitle}_${yr}_${tp}`;
  }

  // Fusionner deux fiches du même film (ex: présent à la fois sur Ciné+ OCS et Universal+)
  function mergeTwoItems(base, incoming) {
    const getPkgs = (it) => {
      let pkgs = (it.package_slugs || []).filter(k => PACKAGES_CONFIG[k]);
      if (pkgs.length === 0) {
        const chaineLower = ((it.chaine || '') + ' ' + (it.chaines || []).join(' ')).toLowerCase();
        if (chaineLower.includes('action')) pkgs.push('aca');
        else if (chaineLower.includes('universal') || chaineLower.includes('syfy') || chaineLower.includes('13eme')) pkgs.push('auc');
        else pkgs.push('aoc');
      }
      return pkgs;
    };

    const allPkgs = Array.from(new Set([...getPkgs(base), ...getPkgs(incoming)]));
    const allChaines = allPkgs.map(k => PACKAGES_CONFIG[k].name);
    const allLogos = allPkgs.map(k => PACKAGES_CONFIG[k].logo);
    const primaryPkg = PACKAGES_CONFIG[allPkgs[0]] || PACKAGES_CONFIG.aoc;

    // Fusionner les dates d'expiration par bouquet
    const mergedPackageExpirations = {
      ...(base.expiration?.packageExpirations || {}),
      ...(incoming.expiration?.packageExpirations || {})
    };

    // Recalculer l'expiration globale sur la date la plus lointaine parmi les bouquets actifs
    let hasUnlimited = false;
    let latestDate = null;
    let latestIsoStr = null;

    for (const pkg of allPkgs) {
      const dateStr = mergedPackageExpirations[pkg];
      if (!dateStr) {
        hasUnlimited = true;
        break;
      }
      const d = new Date(dateStr);
      if (!latestDate || d > latestDate) {
        latestDate = d;
        latestIsoStr = dateStr;
      }
    }

    let mergedExpiration = { status: 'none', label: null, daysLeft: null, expirationDate: null, packageExpirations: mergedPackageExpirations };

    if (!hasUnlimited && latestDate) {
      const now = new Date();
      const diffTime = latestDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        mergedExpiration = { status: 'expired', label: 'Expiré', daysLeft, expirationDate: latestIsoStr, packageExpirations: mergedPackageExpirations };
      } else if (daysLeft === 0) {
        mergedExpiration = { status: 'urgent', label: '⏳ Expire aujourd\'hui', daysLeft: 0, expirationDate: latestIsoStr, packageExpirations: mergedPackageExpirations };
      } else if (daysLeft === 1) {
        mergedExpiration = { status: 'urgent', label: '⏳ Expire demain', daysLeft: 1, expirationDate: latestIsoStr, packageExpirations: mergedPackageExpirations };
      } else if (daysLeft <= 3) {
        mergedExpiration = { status: 'urgent', label: `⏳ Expire dans ${daysLeft} j`, daysLeft, expirationDate: latestIsoStr, packageExpirations: mergedPackageExpirations };
      } else if (daysLeft <= 14) {
        mergedExpiration = { status: 'warning', label: `⏳ Expire dans ${daysLeft} j`, daysLeft, expirationDate: latestIsoStr, packageExpirations: mergedPackageExpirations };
      } else {
        const day = latestDate.getDate().toString().padStart(2, '0');
        const month = (latestDate.getMonth() + 1).toString().padStart(2, '0');
        mergedExpiration = { status: 'info', label: `📅 Jusqu'au ${day}/${month}`, daysLeft, expirationDate: latestIsoStr, packageExpirations: mergedPackageExpirations };
      }
    }

    return {
      ...base,
      ...incoming,
      chaine: primaryPkg.name,
      chaines: allChaines,
      logo_chaine: primaryPkg.logo,
      logos_chaine: allLogos,
      package_slugs: allPkgs,
      expiration: mergedExpiration,
      poster: incoming.poster || base.poster
    };
  }

  // Fusion intelligente (Merge) : conserve les anciens films et élimine STRICTEMENT les doublons
  function mergeCatalog(existingCatalog = [], freshItems = []) {
    const map = new Map();

    // 1. Charger l'existant en recalculant les jours restants, les catégories et éliminant les doublons
    for (const it of existingCatalog) {
      const refreshed = refreshItemExpiration({ ...it });
      if (refreshed.expiration && refreshed.expiration.status === 'expired') {
        continue;
      }
      if (refreshed.raw_genres && refreshed.raw_genres.length > 0) {
        refreshed.categories = [computeCategory(refreshed.raw_genres, refreshed.type === 'serie', refreshed.titre, refreshed.synopsis, refreshed.badge, refreshed.annee, refreshed.package_slugs)];
      }
      const key = getDeduplicationKey(refreshed) || refreshed.id;
      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, mergeTwoItems(existing, refreshed));
      } else {
        map.set(key, refreshed);
      }
    }

    // 2. Fusionner les nouveautés fraîches sans aucun doublon
    for (const fresh of freshItems) {
      const key = getDeduplicationKey(fresh) || fresh.id;
      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, mergeTwoItems(existing, fresh));
      } else {
        map.set(key, fresh);
      }
    }

    return Array.from(map.values());
  }

  // Requête GraphQL JustWatch (isFullSync: false -> 1 requête de 50; isFullSync: true -> 2 pages de 100)
  async function fetchJustWatchData(isFullSync = false) {
    const query = `
      query GetStreamingTitles($country: Country!, $popularTitlesFilter: TitleFilter, $first: Int!, $after: String) {
        popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              objectId
              content(country: $country, language: "fr") {
                title
                originalReleaseYear
                runtime
                shortDescription
                ageCertification
                scoring {
                  imdbScore
                  tmdbScore
                  tomatoScore
                }
                genres {
                  shortName
                  translation(language: "fr")
                }
                posterUrl
              }
              offers(country: $country, platform: WEB) {
                package {
                  clearName
                  shortName
                }
                monetizationType
                availableTo
                availableToTime
              }
            }
          }
        }
      }
    `;

    const isBrowser = typeof window !== 'undefined';
    const endpoints = isBrowser
      ? ['/api/justwatch/graphql', 'https://apis.justwatch.com/graphql']
      : ['https://apis.justwatch.com/graphql'];

    const reqHeaders = { 'Content-Type': 'application/json' };
    if (!isBrowser) {
      reqHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    }

    const pageSize = isFullSync ? 100 : 50;
    const maxPages = isFullSync ? 15 : 1;

    const freshQualified = [];
    let currentCursor = null;

    for (let page = 0; page < maxPages; page++) {
      let pageEdges = null;

      for (const url of endpoints) {
        try {
          const variables = {
            country: 'FR',
            first: pageSize,
            after: currentCursor,
            popularTitlesFilter: {
              packages: PACKAGE_SLUGS,
              releaseYear: { min: 2000 }
            }
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: reqHeaders,
            body: JSON.stringify({ query, variables })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} sur ${url}`);
          }

          const json = await response.json();
          if (json.errors && json.errors.length > 0) {
            throw new Error(json.errors[0].message || 'Erreur GraphQL JustWatch');
          }

          const data = json?.data?.popularTitles;
          pageEdges = data?.edges || [];
          currentCursor = data?.pageInfo?.endCursor || null;
          break;
        } catch (err) {
          console.warn(`[JustWatchEngine] Tentative ${url} échouée :`, err.message);
        }
      }

      if (!pageEdges || pageEdges.length === 0) break;

      for (const edge of pageEdges) {
        const item = processTitleNode(edge.node);
        if (item) {
          freshQualified.push(item);
        }
      }

      if (!currentCursor) break;
    }

    if (freshQualified.length === 0) {
      console.log('[JustWatchEngine] Bascule sur la synchronisation du catalogue publié...');
      return await fetchLatestPublishedCatalog();
    }

    // Récupérer le catalogue existant et fusionner
    const currentCached = getCachedCatalog() || [];
    const merged = mergeCatalog(currentCached, freshQualified);

    saveCatalogToCache(merged);
    if (isFullSync) {
      saveFullSyncDate();
    }

    return merged;
  }

  // Récupération de secours du catalogue publié (utilisé sur GitHub Pages / hébergement statique sans serveur proxy)
  async function fetchLatestPublishedCatalog() {
    const urls = [
      `js/catalog.js?t=${Date.now()}`,
      `https://raw.githubusercontent.com/v7rayzor/cinescope/main/js/catalog.js?t=${Date.now()}`
    ];

    for (const u of urls) {
      try {
        const res = await fetch(u, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        const match = text.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*\])\s*;?/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          if (parsed && parsed.length > 0) {
            console.log(`[JustWatchEngine] Catalogue publié rechargé avec succès depuis ${u} (${parsed.length} œuvres).`);
            const currentCached = getCachedCatalog() || [];
            const merged = mergeCatalog(currentCached, parsed);
            saveCatalogToCache(merged);
            saveFullSyncDate();
            return merged;
          }
        }
      } catch (err) {
        console.warn(`[JustWatchEngine] Échec chargement secours depuis ${u} :`, err.message);
      }
    }

    // Si le réseau est indisponible mais qu'on a déjà CATALOG_DATA en mémoire ou dans le cache
    const cached = getCachedCatalog();
    if (cached && cached.length > 0) {
      saveCatalogToCache(cached);
      return cached;
    }
    if (typeof CATALOG_DATA !== 'undefined' && CATALOG_DATA.length > 0) {
      const merged = mergeCatalog([], CATALOG_DATA);
      saveCatalogToCache(merged);
      return merged;
    }

    throw new Error('Impossible de synchroniser le catalogue');
  }

  // Gestion du cache local
  function getCachedCatalog() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_CATALOG);
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed
            .map(it => {
              const refreshed = refreshItemExpiration(it);
              if (refreshed.raw_genres && refreshed.raw_genres.length > 0) {
                refreshed.categories = [computeCategory(refreshed.raw_genres, refreshed.type === 'serie', refreshed.titre, refreshed.synopsis, refreshed.badge, refreshed.annee)];
              }
              return refreshed;
            })
            .filter(it => !it.expiration || it.expiration.status !== 'expired');
        }
      }
    } catch (e) {
      console.error('[JustWatchEngine] Erreur lecture cache local :', e);
    }
    return null;
  }

  function saveCatalogToCache(items) {
    // 1. Toujours enregistrer la date de synchro en premier (quelques octets, infaillible)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SYNC, new Date().toISOString());
      }
    } catch (e) { }

    // 2. Tenter d'enregistrer le catalogue dans le localStorage (protégé contre QuotaExceededError)
    try {
      if (typeof localStorage !== 'undefined' && Array.isArray(items) && items.length > 0) {
        localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(items));
      }
    } catch (e) {
      console.warn('[JustWatchEngine] Quota localStorage dépassé (catalogue maintenu en mémoire vive) :', e.message);
    }
  }

  function saveFullSyncDate() {
    try {
      if (typeof localStorage !== 'undefined') {
        const nowIso = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_FULL_SYNC, nowIso);
        localStorage.setItem(STORAGE_KEY_SYNC, nowIso);
      }
    } catch (e) { }
  }

  function getLastSyncDate() {
    try {
      if (typeof localStorage !== 'undefined') {
        const iso = localStorage.getItem(STORAGE_KEY_SYNC);
        if (iso) return new Date(iso);
      }
    } catch (e) { }
    return null;
  }

  function getLastFullSyncDate() {
    try {
      if (typeof localStorage !== 'undefined') {
        const iso = localStorage.getItem(STORAGE_KEY_FULL_SYNC);
        if (iso) return new Date(iso);
      }
    } catch (e) { }
    return null;
  }

  function isAutoSyncEnabled() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_AUTOSYNC) !== 'false';
    }
    return true;
  }

  function setAutoSyncEnabled(enabled) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTOSYNC, enabled ? 'true' : 'false');
    }
  }

  // Vérifie si une synchro journalière s'impose (> 24h ou nouveau jour)
  function shouldAutoRefresh() {
    if (!isAutoSyncEnabled()) return false;
    const last = getLastSyncDate();
    if (!last) return false;
    const now = new Date();
    const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24 || now.toDateString() !== last.toDateString();
  }

  // Vérifie si une synchro mensuelle complète s'impose (> 30 jours)
  function shouldAutoFullSync() {
    const lastFull = getLastFullSyncDate();
    if (!lastFull) return false;
    const now = new Date();
    const diffDays = (now.getTime() - lastFull.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  }

  return {
    PACKAGES_CONFIG,
    PACKAGE_SLUGS,
    computeNoteRecence,
    computeCategory,
    processTitleNode,
    formatDuration,
    computeExpirationInfo,
    refreshItemExpiration,
    fetchJustWatchData,
    fetchLatestPublishedCatalog,
    mergeCatalog,
    getCachedCatalog,
    saveCatalogToCache,
    saveFullSyncDate,
    getLastSyncDate,
    getLastFullSyncDate,
    isAutoSyncEnabled,
    setAutoSyncEnabled,
    getAllowedCategories,
    shouldAutoRefresh,
    shouldAutoFullSync,
    cleanLegacyLocalStorage
  };
})();

if (typeof window !== 'undefined') {
  window.JustWatchEngine = JustWatchEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JustWatchEngine;
}
