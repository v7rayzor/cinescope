/**
 * CinéScope - Synchronisation Automatique du Catalogue JustWatch
 * Exécuté par GitHub Actions (quotidien) ou manuellement via npm run sync
 */

const fs = require('fs');
const path = require('path');

const JustWatchEngine = require('../js/justwatch_engine.js');

const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';
const CATALOG_FILE_PATH = path.join(__dirname, '..', 'js', 'catalog.js');

const GRAPHQL_QUERY = `
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

async function fetchAllJustWatchPages() {
  console.log('🚀 [CinéScope Sync] Démarrage de la synchronisation JustWatch...');
  console.log('📦 Bouquets cibles :', JustWatchEngine.PACKAGE_SLUGS.join(', '));

  const pageSize = 100;
  const maxPages = 20; // Couvre jusqu'à 2 000 titres
  let currentCursor = null;
  const allFreshQualified = [];
  let totalReceived = 0;

  for (let page = 1; page <= maxPages; page++) {
    process.stdout.write(`  ⏳ Récupération page ${page}... `);

    const variables = {
      country: 'FR',
      first: pageSize,
      after: currentCursor,
      popularTitlesFilter: {
        packages: JustWatchEngine.PACKAGE_SLUGS,
        releaseYear: { min: 2000 }
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
          allFreshQualified.push(item);
          qualifiedInPage++;
        }
      }

      console.log(`OK (${edges.length} reçus, ${qualifiedInPage} qualifiés)`);

      const hasNext = data?.pageInfo?.hasNextPage;
      currentCursor = data?.pageInfo?.endCursor;

      if (!hasNext || !currentCursor || edges.length === 0) {
        console.log('  🏁 Fin du flux JustWatch atteinte.');
        break;
      }
    } catch (err) {
      console.error(`\n❌ Erreur page ${page} :`, err.message);
      break;
    }
  }

  console.log(`\n📊 Total reçus : ${totalReceived} | Total qualifiés bruts : ${allFreshQualified.length}`);
  return allFreshQualified;
}

function loadExistingCatalog() {
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const content = fs.readFileSync(CATALOG_FILE_PATH, 'utf-8');
      const match = content.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*\])\s*;?/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        console.log(`📂 Catalogue existant chargé : ${parsed.length} œuvres.`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('⚠️ Impossible de parser le catalogue existant :', err.message);
  }
  return [];
}

async function run() {
  try {
    const existing = loadExistingCatalog();
    const freshQualified = await fetchAllJustWatchPages();

    if (freshQualified.length === 0 && existing.length === 0) {
      throw new Error('Aucune donnée qualifiée reçue et aucun catalogue de secours.');
    }

    console.log('🔄 Fusion intelligente et élimination des doublons...');
    const merged = JustWatchEngine.mergeCatalog(existing, freshQualified);

    // Validation formelle Règle 1 : Strictement 1 catégorie par œuvre
    let categoryViolations = 0;
    for (const it of merged) {
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
    console.log(`✨ Catalogue qualifié final : ${merged.length} œuvres (${films} films, ${series} séries)`);

    // Écriture du fichier js/catalog.js
    const fileContent = `const CATALOG_DATA = ${JSON.stringify(merged, null, 2)};\n`;
    fs.writeFileSync(CATALOG_FILE_PATH, fileContent, 'utf-8');
    console.log(`💾 Fichier sauvegardé avec succès : ${CATALOG_FILE_PATH}`);

    console.log('✅ Synchronisation CinéScope terminée avec succès !');
  } catch (err) {
    console.error('💥 Erreur fatale de synchronisation :', err);
    process.exit(1);
  }
}

run();
