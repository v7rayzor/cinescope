const fs = require('fs');
const path = require('path');

function loadJustWatchEngine() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'justwatch_engine.js'), 'utf8');
  const context = { console, localStorage: {}, window: {} };
  const fn = new Function('window', 'module', 'exports', code + '\nreturn window.JustWatchEngine || (module && module.exports);');
  const mod = { exports: {} };
  return fn(context.window, mod, mod.exports);
}

const Engine = loadJustWatchEngine();
const catalogPath = path.join(__dirname, '..', 'js', 'catalog.js');
const rawText = fs.readFileSync(catalogPath, 'utf8');
const catalog = JSON.parse(rawText.replace('const CATALOG_DATA = ', '').replace(/;\s*$/, ''));

let countUpdated = 0;
for (const item of catalog) {
  const newCat = Engine.computeCategory(
    item.raw_genres,
    item.type === 'serie',
    item.titre,
    item.synopsis,
    item.badge,
    item.annee,
    item.package_slugs
  );
  if (item.categories[0] !== newCat) {
    console.log(`🔄 [${item.titre}] (${item.badge || 'TP'}) : ${item.categories[0]} -> ${newCat}`);
    item.categories = [newCat];
    countUpdated++;
  }
}

console.log(`\n✨ Total œuvres reclassées : ${countUpdated}`);

// Vérification Kuroko
const kuroko = catalog.find(x => x.titre.includes("Kuroko"));
console.log('🏀 Vérification Kuroko :', kuroko ? { titre: kuroko.titre, badge: kuroko.badge, categories: kuroko.categories } : 'Non trouvé');

fs.writeFileSync(catalogPath, `const CATALOG_DATA = ${JSON.stringify(catalog, null, 2)};\n`, 'utf8');
console.log(`💾 Fichier ${catalogPath} sauvegardé avec succès !`);
