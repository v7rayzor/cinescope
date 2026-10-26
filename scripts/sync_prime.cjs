/**
 * CinéScope - Synchronisation du Catalogue Amazon Prime Video (prv)
 * Télécharge et qualifie le catalogue SVOD Amazon Prime Video France
 * et le stocke dans data/prime_catalog.js pour le Mode Amazon PC.
 */

const fs = require('fs');
const path = require('path');

// Charger automatiquement .env si présent
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

function loadJustWatchEngine() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'justwatch_engine.js'), 'utf8');
  let duelCache = {};
  try {
    const duelJsonPath = path.join(__dirname, '..', 'data', 'ai_duel_cache.json');
    if (fs.existsSync(duelJsonPath)) {
      duelCache = JSON.parse(fs.readFileSync(duelJsonPath, 'utf8'));
    }
  } catch (e) { }
  const context = { console, localStorage: {}, window: { AI_DUEL_CACHE: duelCache }, require };
  const fn = new Function('window', 'module', 'exports', 'require', code + '\nreturn window.JustWatchEngine || (module && module.exports);');
  const mod = { exports: {} };
  return fn(context.window, mod, mod.exports, require);
}
const JustWatchEngine = loadJustWatchEngine();

const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';
const PRIME_CATALOG_FILE_PATH = path.join(__dirname, '..', 'data', 'prime_catalog.js');

const GRAPHQL_QUERY = `
  query GetStreamingTitles($country: Country!, $popularTitlesFilter: TitleFilter, $first: Int!, $after: String) {
    popularTitles(country: $country, filter: $popularTitlesFilter, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
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
          ... on Show {
            totalSeasonCount
            seasons {
              id
              objectId
              totalEpisodeCount
              content(country: $country, language: "fr") {
                seasonNumber
                originalReleaseYear
                scoring {
                  imdbScore
                  tmdbScore
                  tomatoScore
                }
              }
              offers(country: $country, platform: WEB) {
                package {
                  shortName
                }
                monetizationType
              }
            }
          }
          offers(country: $country, platform: WEB) {
            package {
              clearName
              shortName
            }
            monetizationType
            availableTo
            availableToTime
            availableFromTime
          }
        }
      }
    }
  }
`;

async function fetchPrimeCatalog(maxPages = 50) {
  console.log(`\n📦 Bouquet Amazon Prime Video (prv) : Démarrage du scan (max ${maxPages} pages)...`);

  const pageSize = 40;
  let currentCursor = null;
  let hasNext = true;
  let page = 1;
  let totalReceived = 0;
  const qualifiedItems = [];

  while (hasNext && page <= maxPages) {
    process.stdout.write(`  ⏳ Page ${page}/${maxPages}... `);

    const variables = {
      country: 'FR',
      first: pageSize,
      after: currentCursor,
      popularTitlesFilter: {
        packages: ['prv'],
        monetizationTypes: ['FLATRATE'],
        releaseYear: { min: 2006 }
      }
    };

    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Origin': 'https://www.justwatch.com',
          'Referer': 'https://www.justwatch.com/'
        },
        body: JSON.stringify({ query: GRAPHQL_QUERY, variables })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message || 'Erreur GraphQL');
      }

      const data = json?.data?.popularTitles;
      const edges = data?.edges || [];
      totalReceived += edges.length;

      let qualifiedInPage = 0;
      for (const edge of edges) {
        const item = JustWatchEngine.processTitleNode(edge.node);
        if (item) {
          // Marquer expressément pour Prime
          item.on_prime = true;
          if (!item.package_slugs.includes('prv')) {
            item.package_slugs.push('prv');
          }
          qualifiedItems.push(item);
          qualifiedInPage++;
        }
      }

      console.log(`OK (${edges.length} reçus, ${qualifiedInPage} qualifiés, total: ${qualifiedItems.length})`);

      hasNext = Boolean(data?.pageInfo?.hasNextPage);
      currentCursor = data?.pageInfo?.endCursor;

      if (!hasNext || !currentCursor || edges.length === 0) {
        console.log(`  🏁 Fin du catalogue atteinte.`);
        break;
      }
      page++;
    } catch (err) {
      console.error(`\n❌ Erreur page ${page} :`, err.message);
      break;
    }
  }

  return qualifiedItems;
}

async function run() {
  try {
    const isAllRequested = process.argv.includes('--all');
    // Par défaut, 60 pages = 2 400 œuvres les plus populaires (ou --all pour l'intégrale)
    const maxPages = isAllRequested ? 200 : 60;

    console.log('🚀 [Amazon Prime Sync] Démarrage de la synchronisation dédiée...');
    console.log(`🎯 Cible : ${isAllRequested ? 'Intégrale catalogue JustWatch (jusqu\'à 200 pages)' : 'Top 2 400 titres les plus populaires (60 pages)'}`);

    const freshQualified = await fetchPrimeCatalog(maxPages);

    if (freshQualified.length === 0) {
      throw new Error('Aucune œuvre qualifiée reçue.');
    }

    console.log('\n🔄 Déduplication et harmonisation...');
    const merged = JustWatchEngine.mergeCatalog([], freshQualified);

    // Validation formelle Règle 1 : Strictement 1 catégorie par œuvre
    let categoryViolations = 0;
    for (const it of merged) {
      it.on_prime = true;
      if (!it.package_slugs.includes('prv')) it.package_slugs.push('prv');
      if (!it.categories || it.categories.length !== 1) {
        categoryViolations++;
        it.categories = [it.categories?.[0] || 'drame_emotion'];
      }
    }
    if (categoryViolations > 0) {
      console.warn(`⚠️ ${categoryViolations} œuvres corrigées pour respecter la règle 1 catégorie unique.`);
    }

    // Statistiques
    const films = merged.filter(i => (i.type === 'film' || i.type === 'telefilm') && i.is_eligible).length;
    const series = merged.filter(i => i.type === 'serie' && i.is_eligible).length;
    console.log(`✨ Catalogue Amazon Prime qualifié : ${merged.length} œuvres (${films} films, ${series} séries)`);

    const metadata = {
      total: merged.length,
      films,
      series,
      lastSync: new Date().toISOString()
    };

    // Écriture du fichier data/prime_catalog.js
    const fileContent = `/**
 * CinéScope - Catalogue Amazon Prime Video (Exclusivité PC - Règle 8)
 * Généré automatiquement par scripts/sync_prime.cjs
 */
const PRIME_CATALOG_DATA = ${JSON.stringify(merged, null, 2)};
const PRIME_CATALOG_METADATA = ${JSON.stringify(metadata, null, 2)};

if (typeof window !== 'undefined') {
  window.PRIME_CATALOG_DATA = PRIME_CATALOG_DATA;
  window.PRIME_CATALOG_METADATA = PRIME_CATALOG_METADATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRIME_CATALOG_DATA, PRIME_CATALOG_METADATA };
}
`;
    fs.mkdirSync(path.dirname(PRIME_CATALOG_FILE_PATH), { recursive: true });
    fs.writeFileSync(PRIME_CATALOG_FILE_PATH, fileContent, 'utf-8');
    console.log(`💾 Fichier sauvegardé avec succès : ${PRIME_CATALOG_FILE_PATH}`);

    console.log('✅ Synchronisation Amazon Prime Video terminée avec succès !');
  } catch (err) {
    console.error('💥 Erreur fatale de synchronisation Prime :', err);
    process.exit(1);
  }
}

run();
