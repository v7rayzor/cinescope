/**
 * CinéScope - Synchronisation Automatique du Catalogue JustWatch
 * Exécuté quotidiennement par GitHub Actions (bouquets payants de référence)
 * ou manuellement à la demande avec --specialized (incluant Sooner, Shadowz, Insomnia).
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
  const context = { console, localStorage: {}, window: {} };
  const fn = new Function('window', 'module', 'exports', code + '\nreturn window.JustWatchEngine || (module && module.exports);');
  const mod = { exports: {} };
  return fn(context.window, mod, mod.exports);
}
const JustWatchEngine = loadJustWatchEngine();

const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';
const CATALOG_FILE_PATH = path.join(__dirname, '..', 'js', 'catalog.js');


// Bouquets SVOD payants de référence (quotidiens) et spécialisés (à la demande)
const BASE_PAID_PACKAGES = ['aoc', 'aca', 'auc'];
const SPECIALIZED_PACKAGES = ['snr', 'sdz', 'ima'];

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
          ... on Show {
            totalSeasonCount
            seasons {
              id
              objectId
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

async function fetchBouquetPages(pkgSlug) {
  const pkgName = JustWatchEngine.PACKAGES_CONFIG[pkgSlug]?.name || pkgSlug;
  console.log(`\n📦 Bouquet [${pkgName}] (${pkgSlug}) : Démarrage du scan complet dynamique...`);

  const pageSize = 40;
  let currentCursor = null;
  let hasNext = true;
  let page = 1;
  let totalInPkg = 0;
  const qualifiedItems = [];

  while (hasNext) {
    process.stdout.write(`  ⏳ Page ${page}... `);

    const variables = {
      country: 'FR',
      first: pageSize,
      after: currentCursor,
      popularTitlesFilter: {
        packages: [pkgSlug],
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
      totalInPkg += edges.length;

      let qualifiedInPage = 0;
      for (const edge of edges) {
        const item = JustWatchEngine.processTitleNode(edge.node);
        if (item) {
          qualifiedItems.push(item);
          qualifiedInPage++;
        }
      }

      console.log(`OK (${edges.length} reçus, ${qualifiedInPage} qualifiés)`);

      hasNext = Boolean(data?.pageInfo?.hasNextPage);
      currentCursor = data?.pageInfo?.endCursor;

      if (!hasNext || !currentCursor || edges.length === 0) {
        console.log(`  🏁 Fin du bouquet [${pkgName}] atteinte : ${totalInPkg} œuvres analysées, ${qualifiedItems.length} qualifiées.`);
        break;
      }
      page++;
    } catch (err) {
      console.error(`\n❌ Erreur bouquet ${pkgSlug} page ${page} :`, err.message);
      break;
    }
  }

  return qualifiedItems;
}

function loadExistingCatalog() {
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const content = fs.readFileSync(CATALOG_FILE_PATH, 'utf-8');
      const match = content.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*?\])\s*;/);
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

function loadExistingMetadata() {
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const content = fs.readFileSync(CATALOG_FILE_PATH, 'utf-8');
      const match = content.match(/const\s+CATALOG_METADATA\s*=\s*(\{[\s\S]*?\})\s*;/);
      if (match) {
        return JSON.parse(match[1]);
      }
    }
  } catch (err) { }
  return {
    lastDailySync: null,
    lastSpecializedSync: null
  };
}

const AI_CACHE_FILE = path.join(__dirname, '..', 'data', 'ai_duel_cache.json');

function loadAiCache() {
  try {
    if (fs.existsSync(AI_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(AI_CACHE_FILE, 'utf8'));
    }
  } catch (e) { }
  return {};
}

function saveAiCache(cache) {
  try {
    fs.mkdirSync(path.dirname(AI_CACHE_FILE), { recursive: true });
    fs.writeFileSync(AI_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.warn('⚠️ Impossible de sauvegarder ai_duel_cache.json :', e.message);
  }
}

async function resolveAmbiguousTitlesWithAI(items) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const cache = loadAiCache();
  const toResolve = [];

  for (const item of items) {
    if (cache[item.id]) continue;
    const raw = item.raw_genres || [];

    // Duel 1 : Purs duels 50/50 Action vs Thriller (hors comédie, horreur, sf, animation, doc)
    if (raw.includes('act') && raw.includes('trl') && !raw.some(g => ['cmy', 'hrr', 'scf', 'fnt', 'ani', 'doc'].includes(g))) {
      toResolve.push({ item, duelType: 'action_vs_thriller' });
    }
    // Duel 2 : Purs duels 50/50 Horreur vs Science-Fiction / Fantastique (hors comédie, animation, doc)
    else if (raw.includes('hrr') && (raw.includes('scf') || raw.includes('fnt')) && !raw.some(g => ['cmy', 'ani', 'doc'].includes(g))) {
      toResolve.push({ item, duelType: 'horror_vs_scifi' });
    }
  }

  if (toResolve.length === 0 || !apiKey) {
    JustWatchEngine.setAiDuelCache(cache);
    return;
  }

  console.log(`\n🤖 Arbitrage IA DeepSeek requis pour ${toResolve.length} nouvelle(s) œuvre(s) hybride(s)...`);

  for (const { item, duelType } of toResolve) {
    try {
      let prompt = '';
      if (duelType === 'action_vs_thriller') {
        prompt = `Tu es l'expert cinéphile en charge de la qualification de la filmothèque CinéScope.
Chaque œuvre doit être classée dans UNE SEULE catégorie dominante selon la règle stricte du catalogue :

- "action_aventure" : Si l'œuvre est dominée par l'action cinétique, les combats physiques (arts martiaux, corps à corps), les fusillades intenses, les poursuites nerveuses et le spectaculaire (ex: The Raid, John Wick, Die Hard, Taken).
- "thriller_policier" : Si l'œuvre est dominée par l'intrigue criminelle, l'enquête policière, le suspense cérébral, la machination, la manipulation psychologique, le polar d'ambiance ou les braquages sophistiqués (ex: The Batman, Drive, Usual Suspects, Seven).

RÈGLE D'OR : ÉVITER ABSOLUMENT LES CONTRESENS. S'il n'y a pas d'action physique réelle dominante, choisis "thriller_policier".

Œuvre à départager :
Titre : "${item.titre}" (${item.annee || ''}) [Type: ${item.type || 'film'}, Durée: ${item.duree || ''}]
Synopsis : "${item.synopsis || 'N/A'}"
Genres bruts : ${JSON.stringify(item.raw_genres || [])}

Réponds STRICTEMENT sous forme d'un objet JSON valide sans markdown :
{
  "choix": "action_aventure" OU "thriller_policier",
  "action_score": <nombre entre 0 et 100>,
  "thriller_score": <nombre entre 0 et 100>,
  "justification": "<Explication concise en 1 phrase>"
}`;
      } else {
        prompt = `Tu es l'expert cinéphile en charge de la qualification de la filmothèque CinéScope.
Chaque œuvre doit être classée dans UNE SEULE catégorie dominante selon la règle stricte du catalogue :

- "scifi_fantastique" : Si le cœur du récit repose sur la science-fiction, l'anticipation technologique, l'intelligence artificielle ou la robotique (ex: T.I.M., Ex Machina), le voyage dans le temps ou distorsion temporelle (ex: Curvature, Things Will Be Different), l'exploration spatiale, les super-héros, ou un mystère cosmique/scientifique prédominant.
- "horreur_epouvante" : Si le cœur du récit repose sur la terreur viscérale, la peur, le gore, le slasher, les créatures carnassières, la possession, les démons, les vampires/sorcellerie macabre, ou la survie face à des monstres/zombies (ex: The Walking Dead, Sans un bruit, Cloverfield).

RÈGLE D'OR : ÉVITER ABSOLUMENT LES CONTRESENS. Si l'œuvre est avant tout une intrigue d'anticipation, d'IA, d'univers fantastique ou de concept SF sans être un pur film d'épouvante, choisis "scifi_fantastique". Si l'œuvre cherche d'abord à effrayer et terroriser par l'horreur, choisis "horreur_epouvante".

Œuvre à départager :
Titre : "${item.titre}" (${item.annee || ''}) [Type: ${item.type || 'film'}, Durée: ${item.duree || ''}]
Synopsis : "${item.synopsis || 'N/A'}"
Genres bruts : ${JSON.stringify(item.raw_genres || [])}

Réponds STRICTEMENT sous forme d'un objet JSON valide sans markdown :
{
  "choix": "scifi_fantastique" OU "horreur_epouvante",
  "scifi_score": <nombre entre 0 et 100>,
  "horreur_score": <nombre entre 0 et 100>,
  "justification": "<Explication concise en 1 phrase>"
}`;
      }

      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) {
        console.warn(`  ⚠️ Échec appel API DeepSeek pour "${item.titre}": ${res.status}`);
        continue;
      }

      const json = await res.json();
      const rawText = json.choices?.[0]?.message?.content?.trim() || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const validChoices = duelType === 'action_vs_thriller'
        ? ['action_aventure', 'thriller_policier']
        : ['scifi_fantastique', 'horreur_epouvante'];

      if (validChoices.includes(parsed.choix)) {
        cache[item.id] = {
          titre: item.titre,
          category: parsed.choix,
          justification: parsed.justification
        };
        console.log(`  🎯 [DeepSeek ${duelType}] "${item.titre}" ➡️ ${parsed.choix} (${parsed.justification})`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Erreur analyse DeepSeek pour "${item.titre}":`, err.message);
    }
  }

  saveAiCache(cache);
  JustWatchEngine.setAiDuelCache(cache);
}

async function run() {
  try {
    const isSpecializedRequested = process.argv.includes('--specialized') || process.argv.includes('--all');
    const targetPackages = isSpecializedRequested
      ? [...BASE_PAID_PACKAGES, ...SPECIALIZED_PACKAGES]
      : BASE_PAID_PACKAGES;

    console.log('🚀 [CinéScope Sync] Démarrage de la synchronisation bouquet par bouquet...');
    console.log(`📦 Mode : ${isSpecializedRequested ? 'Complet avec chaînes spécialisées' : 'Quotidien SVOD de base (OCS, Action Max, Universal+)'}`);
    console.log(`🎯 Bouquets scannés : ${targetPackages.join(', ')}`);

    const existing = loadExistingCatalog();
    const metadata = loadExistingMetadata();

    const freshQualified = [];
    for (const pkg of targetPackages) {
      const items = await fetchBouquetPages(pkg);
      freshQualified.push(...items);
    }

    if (freshQualified.length === 0 && existing.length === 0) {
      throw new Error('Aucune donnée qualifiée reçue et aucun catalogue de secours.');
    }

    // Résolution IA ciblée (Action vs Thriller) pour toute nouveauté hybride
    await resolveAmbiguousTitlesWithAI(freshQualified);

    console.log('\n🔄 Fusion intelligente et élimination des doublons...');
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

    // Mise à jour des métadonnées de synchronisation
    const nowIso = new Date().toISOString();
    metadata.lastDailySync = nowIso;
    if (isSpecializedRequested) {
      metadata.lastSpecializedSync = nowIso;
    }

    // Écriture du fichier js/catalog.js
    const fileContent = `const CATALOG_DATA = ${JSON.stringify(merged, null, 2)};\nconst CATALOG_METADATA = ${JSON.stringify(metadata, null, 2)};\n`;
    fs.writeFileSync(CATALOG_FILE_PATH, fileContent, 'utf-8');
    console.log(`💾 Fichier sauvegardé avec succès : ${CATALOG_FILE_PATH}`);

    console.log('✅ Synchronisation CinéScope terminée avec succès !');
  } catch (err) {
    console.error('💥 Erreur fatale de synchronisation :', err);
    process.exit(1);
  }
}

run();
