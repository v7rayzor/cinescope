const fs = require('fs');
const path = require('path');
const JustWatchEngine = require('../js/justwatch_engine.js');
const catalogPath = path.join(__dirname, '..', 'js', 'catalog.js');
const raw = fs.readFileSync(catalogPath, 'utf-8');
const match = raw.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*\])\s*;?/);
if (!match) {
  console.error('Impossible de charger CATALOG_DATA');
  process.exit(1);
}

const catalog = JSON.parse(match[1]);
console.log(`=== AUDIT CONFORMITÉ DU CATALOGUE (${catalog.length} œuvres) ===`);

let multipleCats = 0;
let emptyCats = 0;
let invalidCategory = 0;
const VALID_CATEGORIES = new Set([
  'drame_emotion',
  'comedie',
  'thriller_policier',
  'action_aventure',
  'scifi_fantastique',
  'horreur_epouvante',
  'animation_famille'
]);

const catCount = {};

for (const item of catalog) {
  if (!item.categories || !Array.isArray(item.categories)) {
    emptyCats++;
    continue;
  }
  if (item.categories.length !== 1) {
    multipleCats++;
  }
  const cat = item.categories[0];
  if (!VALID_CATEGORIES.has(cat)) {
    invalidCategory++;
  }
  catCount[cat] = (catCount[cat] || 0) + 1;
}

console.log(`- Strictement 1 catégorie : ${catalog.length - multipleCats - emptyCats} / ${catalog.length} (Anomalies: ${multipleCats + emptyCats})`);
console.log(`- Catégories valides : ${catalog.length - invalidCategory} / ${catalog.length} (Invalides: ${invalidCategory})`);
console.log('\nDistribution des catégories :');
for (const [k, v] of Object.entries(catCount)) {
  console.log(`  * ${k}: ${v}`);
}

const expired = catalog.filter(i => i.expiration && i.expiration.status === 'expired');
console.log(`\n- Titres expirés restants dans le catalogue : ${expired.length} (attendu: 0)`);

const films = catalog.filter(i => (i.type === 'film' || i.type === 'telefilm') && i.is_eligible);
const series = catalog.filter(i => i.type === 'serie' && i.is_eligible);
console.log(`- Films éligibles : ${films.length}`);
console.log(`- Séries éligibles : ${series.length}`);

console.log('\n✅ Audit terminé avec succès !');
