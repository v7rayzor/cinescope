/**
 * CinéScope - Script d'Arbitrage des Sous-Catégories par IA DeepSeek
 * Qualifie l'ensemble du catalogue CinéScope et Prime Video dans les sous-catégories officielles en 1 mot.
 */

const fs = require('fs');
const path = require('path');

global.window = global;

// Chargement des variables d'environnement depuis .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2 && parts[0].trim()) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.error('❌ ERREUR : DEEPSEEK_API_KEY introuvable dans l\'environnement ou dans le fichier .env');
  process.exit(1);
}

// Sous-catégories fermées autorisées par catégorie principale
const ALLOWED_SUBCATEGORIES = {
  action_aventure: ['Action', 'Aventure'],
  thriller_policier: ['Policier', 'Thriller'],
  scifi_fantastique: ['SF', 'Fantastique'],
  comedie: ['Humour', 'Dramatique', 'Romantique', 'Musical'],
  drame_emotion: ['Social', 'Romance', 'Histoire'],
  horreur_epouvante: ['Angoisse', 'Surnaturel', 'Slasher', 'Monstres'],
  animation_famille: ['Animation', 'Famille']
};

const CACHE_JSON_PATH = path.join(__dirname, '..', 'data', 'ai_subcategories_cache.json');
const CACHE_JS_PATH = path.join(__dirname, '..', 'data', 'ai_subcategories_cache.js');

function loadCache() {
  if (fs.existsSync(CACHE_JSON_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_JSON_PATH, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Erreur lecture cache JSON :', e.message);
    }
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_JSON_PATH, JSON.stringify(cache, null, 2), 'utf8');
  const jsContent = `/**\n * CinéScope - Registre persistant des sous-catégories IA DeepSeek (navigateur et offline)\n */\nwindow.AI_SUBCATEGORIES_CACHE = ${JSON.stringify(cache, null, 2)};\n`;
  fs.writeFileSync(CACHE_JS_PATH, jsContent, 'utf8');
}

// Chargement des catalogues
function loadCatalogs() {
  const itemsMap = new Map();

  // 1. Catalogue Principal
  const catalogJsPath = path.join(__dirname, '..', 'js', 'catalog.js');
  if (fs.existsSync(catalogJsPath)) {
    const rawCode = fs.readFileSync(catalogJsPath, 'utf8');
    const catalogData = eval(rawCode + '; CATALOG_DATA;');
    for (const it of catalogData) {
      if (it && it.id && it.is_eligible) {
        itemsMap.set(it.id, it);
      }
    }
  }

  // 2. Catalogue Prime Video
  const primeJsPath = path.join(__dirname, '..', 'data', 'prime_catalog.js');
  if (fs.existsSync(primeJsPath)) {
    const rawCode = fs.readFileSync(primeJsPath, 'utf8');
    const primeData = eval(rawCode + '; PRIME_CATALOG_DATA;');
    for (const it of primeData) {
      if (it && it.id && it.is_eligible && !itemsMap.has(it.id)) {
        itemsMap.set(it.id, it);
      }
    }
  }

  return Array.from(itemsMap.values());
}

async function callDeepSeekBatch(items) {
  const payloadList = items.map(it => ({
    id: it.id,
    titre: it.titre,
    annee: it.annee,
    type: it.type,
    cat: (it.categories && it.categories[0]) || 'drame_emotion',
    synopsis: (it.synopsis || '').slice(0, 350)
  }));

  const systemPrompt = `Tu es l'expert cinéphile en chef de CinéScope.
Pour chaque film ou série, sa catégorie principale officielle est déjà fixée (ne la modifie jamais).
Ton rôle est d'attribuer STRICTEMENT UNE SEULE sous-catégorie parmi la liste officielle fermée autorisée pour sa catégorie :

- Pour "action_aventure" : "Action" OU "Aventure"
- Pour "thriller_policier" : "Policier" OU "Thriller"
- Pour "scifi_fantastique" : "SF" OU "Fantastique"
- Pour "comedie" : "Humour" OU "Dramatique" OU "Romantique" OU "Musical"
- Pour "drame_emotion" : "Social" OU "Romance" OU "Histoire"
- Pour "horreur_epouvante" : "Angoisse" OU "Surnaturel" OU "Slasher" OU "Monstres"
- Pour "animation_famille" : "Animation" OU "Famille"

RÈGLES IMPORTANTES :
- "Aventure" : pour les voyages, explorations, quêtes, jungles, trésors, survie épique, mondes hostiles.
- "Action" : pour les combats physiques, fusillades, cascades, arts martiaux, affrontements urbains.
- "Fantastique" : pour la magie, les sorciers, contes, créatures légendaires, fantômes, malédictions, dieux.
- "SF" : pour les technologies futures, robots, vaisseaux spatiaux, voyages temporels, cybernétique, anticipation.
- "Policier" : pour les séries procédurales (1 épisode = 1 enquête résolue), les enquêtes menées du côté des forces de l'ordre (commissaires, inspecteurs, détectives, brigades criminelles, police scientifique, FBI, médecine légale) ou grandes investigations criminelles réalistes.
- "Thriller" : pour les séries feuilletonnantes avec intrigue criminelle continue, les machinations et cavales vécues du côté des témoins, civils, coupables ou fugitifs pris au piège (comme Cheyenne et Lola), le suspense psychologique, paranoïa, faux-semblants et tension permanente sans enquête procédurale.
- "Romantique" (dans Comédie) : comédie romantique légère / rom-com.
- "Romance" (dans Drame) : grand amour dramatique, mélodrame passionnel déchirant.
- "Histoire" : drames historiques, guerres réelles, biopics, fresques d'époque véridiques.
- "Social" : drames humains intimes, familiaux, sociétaux, parcours de vie.
- "Slasher" : tueur en série masqué, massacre à l'arme blanche.
- "Monstres" : zombies, vampires, loups-garous, aliens, créatures biologiques.
- "Surnaturel" : démons, esprits, possessions, maisons hantées, occultisme.
- "Angoisse" : horreur psychologique, huis clos oppressant, folie, tension pure.

Réponds STRICTEMENT par un objet JSON valide sans texte ni markdown de la forme :
{
  "ID_DE_L_OEUVRE": "SOUS_CATEGORIE_CHOISIE"
}`;

  const userPrompt = `Attribu la sous-catégorie officielle pour ces œuvres :\n${JSON.stringify(payloadList, null, 2)}`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API DeepSeek error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(rawText);
}

async function run() {
  console.log('🚀 Lancement de l\'arbitrage des sous-catégories par IA DeepSeek...');
  const cache = loadCache();
  const allItems = loadCatalogs();
  const targetCategoryArg = process.argv.find(a => a.startsWith('--category='));
  const targetCategory = targetCategoryArg ? targetCategoryArg.split('=')[1] : null;
  const forceAll = process.argv.includes('--force');

  const toProcess = allItems.filter(it => {
    if (targetCategory) {
      const cat = (it.categories && it.categories[0]) || 'drame_emotion';
      return cat === targetCategory;
    }
    if (forceAll) return true;
    return !cache[it.id];
  });
  console.log(`🎯 À arbitrer : ${toProcess.length} œuvre(s)${targetCategory ? ` (filtre catégorie : ${targetCategory})` : ` (${Object.keys(cache).length} déjà en cache)`}.\n`);

  if (toProcess.length === 0) {
    console.log('✅ Toutes les œuvres sont déjà arbitrées !');
    saveCache(cache);
    return;
  }

  const BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    batches.push(toProcess.slice(i, i + BATCH_SIZE));
  }

  console.log(`⏳ Traitement en ${batches.length} lots de ${BATCH_SIZE} titres...`);

  let processedCount = 0;
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    try {
      const results = await callDeepSeekBatch(batch);
      for (const it of batch) {
        let chosenSub = results[it.id];
        const cat = (it.categories && it.categories[0]) || 'drame_emotion';
        const allowed = ALLOWED_SUBCATEGORIES[cat] || ['Social'];

        // Validation stricte : la sous-catégorie doit être autorisée pour cette catégorie
        if (!chosenSub || !allowed.includes(chosenSub)) {
          // Tentative de rattrapage
          const matched = allowed.find(a => chosenSub && a.toLowerCase() === chosenSub.toLowerCase());
          chosenSub = matched || allowed[0];
        }

        cache[it.id] = {
          titre: it.titre,
          subCategory: chosenSub
        };
        processedCount++;
      }

      console.log(`  [Lot ${b + 1}/${batches.length}] ${processedCount}/${toProcess.length} œuvres arbitrées (Dernier : "${batch[batch.length - 1].titre}" -> ${cache[batch[batch.length - 1].id].subCategory})`);
      saveCache(cache); // Sauvegarde incrémentale

      // Pause légère de courtoisie pour l'API
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.warn(`  ⚠️ Échec lot ${b + 1} (${err.message}), nouvel essai dans 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      b--; // Rejoue le lot
    }
  }

  saveCache(cache);
  console.log(`\n🎉 Arbitrage terminé avec succès ! ${Object.keys(cache).length} œuvres qualifiées dans ${CACHE_JS_PATH}`);
}

run().catch(err => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
