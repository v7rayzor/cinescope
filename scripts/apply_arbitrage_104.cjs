const fs = require('fs');
const path = require('path');

// 1. Charger data/audit_deepseek_results.json
const resultsPath = path.join(__dirname, '../data/audit_deepseek_results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// 2. Charger data/ai_categories.json
const aiCategoriesPath = path.join(__dirname, '../data/ai_categories.json');
const aiCategories = JSON.parse(fs.readFileSync(aiCategoriesPath, 'utf8'));

// 3. Charger js/catalog.js
const catalogPath = path.join(__dirname, '../js/catalog.js');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');
const catalogMatch = catalogContent.match(/const CATALOG_DATA = (\[[\s\S]*?\]);/);
if (!catalogMatch) {
  console.error("Erreur: Impossible de lire CATALOG_DATA");
  process.exit(1);
}
const catalog = eval(catalogMatch[1]);

// 4. Identifier les 114 matches serrés
const tight = [];

for (const [id, d] of Object.entries(results)) {
  if (!d.is_divergent) continue;
  const rep = d.repartition || {};
  const sorted = Object.entries(rep).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0] || ['none', 0];
  const top2 = sorted[1] || ['none', 0];
  const gap = top1[1] - top2[1];

  if (top1[1] <= 50 || gap <= 15) {
    tight.push({ id, ...d });
  }
}

console.log(`[Arbitrage] ${tight.length} matches serrés à traiter.`);

// Liste blanche des 10 contresens à protéger impérativement
const CONTRESENS_PROTEGES = [
  'sonic',
  'super charlie',
  'zévadés',
  'cléopâtre',
  'une nuit au zoo',
  'kaamelott',
  'machine à démonter le temps',
  'zombieland',
  'source code',
  '127 heures'
];

function isContresens(titre) {
  const clean = (titre || '').toLowerCase();
  return CONTRESENS_PROTEGES.some(p => clean.includes(p));
}

let appliedCount = 0;
let protectedCount = 0;

tight.forEach(item => {
  const catItem = catalog.find(x => x.id === item.id);
  const isProtected = isContresens(item.titre);

  if (isProtected) {
    protectedCount++;
    console.log(`🛡️  Protégé en [${item.categorie_actuelle}] : ${item.titre}`);
    // Conserver la catégorie actuelle dans le registre et catalog
    if (catItem) {
      catItem.categories = [item.categorie_actuelle];
    }
  } else {
    appliedCount++;
    // Basculer vers la catégorie DeepSeek
    if (catItem) {
      catItem.categories = [item.categorie_dominante];
    }
    aiCategories[item.id] = {
      titre: item.titre,
      annee: item.annee,
      slug: item.id,
      categories: [item.categorie_dominante],
      repartition: item.repartition,
      justification: item.justification,
      analyzed_at: item.analyzed_at || new Date().toISOString(),
      source: "deepseek-chat"
    };
  }
});

// Écrire js/catalog.js
const newCatalogJs = `const CATALOG_DATA = ${JSON.stringify(catalog, null, 2)};\n`;
fs.writeFileSync(catalogPath, newCatalogJs, 'utf8');

// Écrire data/ai_categories.json
fs.writeFileSync(aiCategoriesPath, JSON.stringify(aiCategories, null, 2), 'utf8');

console.log(`\n✅ Terminé avec succès !`);
console.log(`- ${appliedCount} œuvres basculées sur DeepSeek`);
console.log(`- ${protectedCount} contresens sanctuarisés dans leur catégorie légitime`);
