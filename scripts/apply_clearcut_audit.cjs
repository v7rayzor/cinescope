const fs = require('fs');
const path = require('path');

// 1. Charger les résultats de l'audit DeepSeek
const auditResultsPath = path.join(__dirname, '../data/audit_deepseek_results.json');
const auditResults = JSON.parse(fs.readFileSync(auditResultsPath, 'utf8'));

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

// 4. Séparer victoires nettes (>50% et gap > 15%) et matches serrés (<=50% ou gap <= 15%)
const clearCut = [];
const tight = [];

for (const [id, d] of Object.entries(auditResults)) {
  if (!d.is_divergent) continue;

  const rep = d.repartition || {};
  const sorted = Object.entries(rep).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0] || ['none', 0];
  const top2 = sorted[1] || ['none', 0];
  const gap = top1[1] - top2[1];

  const itemData = {
    id,
    titre: d.titre,
    annee: d.annee,
    categorie_actuelle: d.categorie_actuelle,
    categorie_deepseek: d.categorie_dominante,
    score_dominant: top1[1],
    gap: gap,
    repartition: rep,
    sortedRep: sorted,
    justification: d.justification,
    analyzed_at: d.analyzed_at
  };

  if (top1[1] > 50 && gap > 15) {
    clearCut.push(itemData);
  } else {
    tight.push(itemData);
  }
}

console.log(`[Traitement] Victoires nettes à appliquer : ${clearCut.length}`);
console.log(`[Traitement] Matches serrés à remonter : ${tight.length}`);

// 5. Appliquer les 269 victoires nettes dans ai_categories.json et catalog.js
let updatedCatalogCount = 0;
let updatedAiCacheCount = 0;

clearCut.forEach(item => {
  // A. Mise à jour dans CATALOG_DATA
  const catItem = catalog.find(x => x.id === item.id);
  if (catItem) {
    catItem.categories = [item.categorie_deepseek];
    updatedCatalogCount++;
  }

  // B. Mise à jour dans data/ai_categories.json
  aiCategories[item.id] = {
    titre: item.titre,
    annee: item.annee,
    slug: item.id,
    categories: [item.categorie_deepseek],
    repartition: item.repartition,
    justification: item.justification,
    analyzed_at: item.analyzed_at,
    source: "deepseek-chat"
  };
  updatedAiCacheCount++;
});

// Écrire js/catalog.js
const newCatalogJs = `const CATALOG_DATA = ${JSON.stringify(catalog, null, 2)};\n`;
fs.writeFileSync(catalogPath, newCatalogJs, 'utf8');

// Écrire data/ai_categories.json
fs.writeFileSync(aiCategoriesPath, JSON.stringify(aiCategories, null, 2), 'utf8');

console.log(`✅ ${updatedCatalogCount} œuvres mises à jour dans js/catalog.js`);
console.log(`✅ ${updatedAiCacheCount} fiches mises à jour dans data/ai_categories.json`);

// 6. Générer le document complet des 114 matches serrés
const tightReportPath = path.join(__dirname, '../matches_serres_arbitrage.md');

let md = `# Audit d'Arbitrage — Les 114 Matches Serrés\n\n`;
md += `> **Contexte :** Sur les 383 divergences identifiées par DeepSeek, **269 victoires nettes (> 50% et écart > 15%)** ont été automatiquement enregistrées dans CinéScope et les registres.\n`;
md += `> **Ce document recense les 114 œuvres restantes où le match est serré** (dominance $\\le 50\\%$ ou écart $\\le 15\\%$ entre la 1ère et la 2ème catégorie).\n`;
md += `> Pour chacune, l'ensemble des pourcentages totalisant **100% du film** est détaillé pour permettre un arbitrage éclairé.\n\n`;
md += `---\n\n`;

// Grouper par type de duel
const groups = {};
tight.forEach(t => {
  const key = `${t.categorie_actuelle} ➔ ${t.categorie_deepseek}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(t);
});

md += `## Sommaire des Duels\n\n`;
Object.keys(groups).sort((a,b) => groups[b].length - groups[a].length).forEach(k => {
  md += `- **${k}** : ${groups[k].length} œuvres\n`;
});
md += `\n---\n\n`;

md += `## Tableau Détaillé des 114 Matches Serrés (100% des pourcentages)\n\n`;
md += `| # | Titre | Année | Catégorie Actuelle | Proposition DeepSeek | Répartition Complète (100%) | Justification DeepSeek |\n`;
md += `| :---: | :--- | :---: | :--- | :--- | :--- | :--- |\n`;

tight.forEach((t, idx) => {
  const repFormatted = t.sortedRep.map(([k, v]) => `**${k}** (${v}%)`).join(', ');
  const cleanJustif = (t.justification || '').replace(/\|/g, '-');
  md += `| ${idx + 1} | **${t.titre}** | ${t.annee} | \`${t.categorie_actuelle}\` | **\`${t.categorie_deepseek}\`** | ${repFormatted} | ${cleanJustif} |\n`;
});

md += `\n---\n\n`;
md += `*Document prêt pour arbitrage au cas par cas ou validation ciblée.*\n`;

fs.writeFileSync(tightReportPath, md, 'utf8');
console.log(`✅ Document des matches serrés généré dans matches_serres_arbitrage.md !`);
