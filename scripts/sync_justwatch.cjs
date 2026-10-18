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
const AI_CATEGORIES_FILE_PATH = path.join(__dirname, '..', 'data', 'ai_categories.json');

const VALID_CATEGORIES = [
  'drame_emotion',
  'comedie',
  'thriller_policier',
  'action_aventure',
  'scifi_fantastique',
  'horreur_epouvante',
  'animation_famille'
];

function loadAiCategories() {
  try {
    if (fs.existsSync(AI_CATEGORIES_FILE_PATH)) {
      const content = fs.readFileSync(AI_CATEGORIES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      console.log(`🧠 Registre IA chargé : ${Object.keys(parsed).length} œuvres mémorisées.`);
      return parsed;
    }
  } catch (err) {
    console.warn('⚠️ Impossible de charger ai_categories.json :', err.message);
  }
  return {};
}

function saveAiCategories(cache) {
  try {
    const dir = path.dirname(AI_CATEGORIES_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AI_CATEGORIES_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`💾 Registre IA sauvegardé (${Object.keys(cache).length} œuvres au total) : ${AI_CATEGORIES_FILE_PATH}`);
  } catch (err) {
    console.error('❌ Erreur lors de la sauvegarde de ai_categories.json :', err.message);
  }
}

function normalizeSlug(title, year) {
  if (!title) return '';
  const clean = String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return year ? `${clean}_${year}` : clean;
}

async function callAiClassifier(item) {
  const token = process.env.GH_MODELS_TOKEN || process.env.DEEPSEEK_API_KEY;
  if (!token) return null;

  const isDeepSeek = token.startsWith('sk-') && !token.startsWith('ghp_');
  const endpoint = isDeepSeek
    ? 'https://api.deepseek.com/chat/completions'
    : 'https://models.inference.ai.azure.com/chat/completions';
  const modelName = isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini';

  const systemPrompt = `Tu es le classificateur sémantique officiel de CinéScope, plateforme de cinéma et séries de référence.
Ta mission est d'attribuer STRICTEMENT UNE SEULE CATÉGORIE DOMINANTE à chaque œuvre parmi les 7 catégories officielles ci-dessous :
1. "drame_emotion" : Drames profonds, romances, biopics, drames sociaux, récits d'auteur.
2. "comedie" : Comédies pures, parodies, satires, comédies romantiques et populaires.
3. "thriller_policier" : Polars, enquêtes policières, espionnage, machinations, suspense, thrillers psychologiques/criminels.
4. "action_aventure" : Action grand spectacle, westerns d'action, arts martiaux, survie, guerre, aventures physiques.
5. "scifi_fantastique" : Science-fiction, space opéra, anticipation, mondes magiques, fantasy, super-héros.
6. "horreur_epouvante" : Slashers, épouvante, body horror, démons, possession, terreur surnaturelle, gore.
7. "animation_famille" : Films et séries d'animation, aventures jeunesse, contes familiaux.

RÈGLES STRICTES :
- La somme des pourcentages de répartition doit être exactement égale à 100%.
- "categorie_dominante" doit être STRICTEMENT l'une des 7 clés exactes listées ci-dessus.
- Format JSON strict :
{
  "repartition": {
    "drame_emotion": 0,
    "comedie": 0,
    "thriller_policier": 0,
    "action_aventure": 0,
    "scifi_fantastique": 0,
    "horreur_epouvante": 0,
    "animation_famille": 0
  },
  "categorie_dominante": "nom_exact",
  "justification": "Courte explication concise en 1 phrase"
}`;

  const userPrompt = `Analyse et qualifie cette œuvre pour CinéScope (base ton analyse exclusivement sur l'histoire réelle et le synopsis, sans aucune étiquette externe) :
Titre : ${item.titre}
Année : ${item.annee || item.annee_moyenne || 'Inconnue'}
Type : ${item.type}
Badge d'âge : ${item.badge || 'Tous publics'}
Synopsis : ${item.synopsis || 'Non renseigné'}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      console.warn(`⚠️ [AI Classifier] Échec appel (${res.status} ${res.statusText}) pour "${item.titre}"`);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (parsed.categorie_dominante && VALID_CATEGORIES.includes(parsed.categorie_dominante)) {
      return {
        categorie: parsed.categorie_dominante,
        repartition: parsed.repartition || {},
        justification: parsed.justification || '',
        source: modelName
      };
    }
  } catch (err) {
    console.warn(`⚠️ [AI Classifier] Exception pour "${item.titre}" :`, err.message);
  }
  return null;
}

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

    console.log('\n🔄 Fusion intelligente et élimination des doublons...');
    const merged = JustWatchEngine.mergeCatalog(existing, freshQualified);

    // Phase de qualification sémantique IA & Application du registre persistant
    console.log('\n🧠 [CinéScope AI] Vérification du registre persistant des catégories...');
    const aiCache = loadAiCategories();
    let aiHits = 0;
    let aiClassified = 0;
    const hasAiToken = Boolean(process.env.GH_MODELS_TOKEN || process.env.DEEPSEEK_API_KEY);

    for (const it of merged) {
      const slugKey = normalizeSlug(it.titre, it.annee);
      const cacheHit = aiCache[it.id] || (slugKey && aiCache[slugKey]);

      if (cacheHit && cacheHit.categories && cacheHit.categories[0]) {
        it.categories = [cacheHit.categories[0]];
        aiHits++;
      } else if (hasAiToken) {
        process.stdout.write(`  🤖 Analyse IA pour "${it.titre}" (${it.annee || 'N/A'})... `);
        const result = await callAiClassifier(it);
        if (result && result.categorie) {
          it.categories = [result.categorie];
          aiCache[it.id] = {
            titre: it.titre,
            annee: it.annee,
            slug: slugKey,
            categories: [result.categorie],
            repartition: result.repartition,
            justification: result.justification,
            analyzed_at: new Date().toISOString(),
            source: result.source
          };
          aiClassified++;
          console.log(`OK -> [${result.categorie}] (${result.justification})`);
          await new Promise(r => setTimeout(r, 600));
        } else {
          console.log(`Fallback algorithmique.`);
        }
      }
    }

    if (aiClassified > 0) {
      saveAiCategories(aiCache);
    }
    console.log(`✨ Bilan Sémantique IA : ${aiHits} œuvres certifiées par le registre, ${aiClassified} nouvelles œuvres analysées.`);

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
