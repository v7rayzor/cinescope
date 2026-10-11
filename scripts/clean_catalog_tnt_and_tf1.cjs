/**
 * CinéScope - Nettoyage chirurgical TNT et TF1+
 * 1. Élimination formelle de Novo 19 (nvn)
 * 2. Filtrage de TF1+ (conservé uniquement si validé par Molotov Extended mlt)
 * 3. Éradication des 353 faux TF1+ (locations VOD payantes & web-only)
 * 4. Sanctuarisation TNT : suppression du logo Molotov parasite sur les œuvres TNT
 */

const fs = require('fs');
const path = require('path');

const CATALOG_FILE_PATH = path.join(__dirname, '..', 'js', 'catalog.js');

const PACKAGES_CONFIG = {
  aoc: { name: 'Ciné+ OCS', logo: 'assets/logos/cine_ocs.svg', isPaid: true },
  aca: { name: 'Action Max', logo: 'assets/logos/action.png', isPaid: true },
  auc: { name: 'Universal+', logo: 'assets/logos/universal_plus.svg', isPaid: true },
  tf1: { name: 'TF1+', logo: 'assets/logos/tf1.png', isPaid: false },
  sxp: { name: 'M6+', logo: 'assets/logos/m6_plus.png', isPaid: false },
  fra: { name: 'France TV', logo: 'assets/logos/france_tv.png', isPaid: false },
  art: { name: 'Arte', logo: 'assets/logos/arte.png', isPaid: false },
  mlt: { name: 'Molotov Gratuit', logo: 'assets/logos/molotov.png', isPaid: false }
};

function main() {
  const content = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
  const match = content.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*\])\s*;?/);
  if (!match) throw new Error('Impossible de parser CATALOG_DATA');
  const catalog = JSON.parse(match[1]);

  console.log(`📂 Catalogue chargé : ${catalog.length} œuvres.`);

  let removedItems = 0;
  let cleanedTf1 = 0;
  let cleanedNovo = 0;
  let cleanedMltDoublon = 0;
  const cleanedCatalog = [];

  for (const item of catalog) {
    const originalPkgs = [...(item.package_slugs || [])];
    let pkgs = originalPkgs.filter(p => PACKAGES_CONFIG[p]);

    if (originalPkgs.includes('nvn')) cleanedNovo++;

    // 1. Règle chirurgicale TF1 :
    // Si tf1 est présent MAIS qu'il n'y avait pas mlt, c'est une location VOD payante ou web-only introuvable sur Molotov
    if (pkgs.includes('tf1') && !originalPkgs.includes('mlt')) {
      pkgs = pkgs.filter(p => p !== 'tf1');
      cleanedTf1++;
    }

    // 2. Sanctuarisation payante : si payant (aoc, aca, auc), Molotov et TNT sont bannis
    const hasPaid = pkgs.some(p => ['aoc', 'aca', 'auc'].includes(p));
    if (hasPaid) {
      pkgs = pkgs.filter(p => ['aoc', 'aca', 'auc'].includes(p));
    } else {
      // 3. Sanctuarisation TNT : si TNT (tf1, sxp, fra, art), le logo mlt parasite est STRICTEMENT éliminé !
      const hasTnt = pkgs.some(p => ['tf1', 'sxp', 'fra', 'art'].includes(p));
      if (hasTnt) {
        if (pkgs.includes('mlt')) cleanedMltDoublon++;
        pkgs = pkgs.filter(p => p !== 'mlt');
      }
    }

    // Si plus aucun diffuseur valide, œuvre éliminée
    if (pkgs.length === 0) {
      removedItems++;
      continue;
    }

    // Réassignation propre des noms et logos
    item.package_slugs = pkgs;
    item.chaines = pkgs.map(p => PACKAGES_CONFIG[p].name);
    item.logos_chaine = pkgs.map(p => PACKAGES_CONFIG[p].logo);
    item.chaine = PACKAGES_CONFIG[pkgs[0]].name;
    item.logo_chaine = PACKAGES_CONFIG[pkgs[0]].logo;

    // Mise à jour on_tnt
    const tntSlugs = ['tf1', 'sxp', 'fra', 'art'];
    item.on_tnt = pkgs.some(p => tntSlugs.includes(p));

    cleanedCatalog.push(item);
  }

  console.log(`\n🧹 Nettoyage terminé :`);
  console.log(`- Faux TF1+ (VOD payante / web) retirés : ${cleanedTf1}`);
  console.log(`- Novo 19 retiré sur : ${cleanedNovo} œuvres`);
  console.log(`- Doubles logos Molotov dépollués sur les œuvres TNT : ${cleanedMltDoublon}`);
  console.log(`- Œuvres non visibles éliminées : ${removedItems}`);
  console.log(`✨ Total catalogue final : ${cleanedCatalog.length} œuvres`);

  // Vérification de Blade Runner 2049
  const bladeRunner = cleanedCatalog.find(i => i.titre.includes('Blade Runner'));
  if (bladeRunner) {
    console.log(`\n🔍 Vérification Blade Runner 2049 :`, {
      chaines: bladeRunner.chaines,
      packages: bladeRunner.package_slugs,
      logos: bladeRunner.logos_chaine
    });
  }

  // Comptage par package
  const pkgCounts = {};
  cleanedCatalog.forEach(i => i.package_slugs.forEach(p => pkgCounts[p] = (pkgCounts[p] || 0) + 1));
  console.log('\n📦 Répartition finale par bouquet :', pkgCounts);

  // Sauvegarde
  const newContent = `const CATALOG_DATA = ${JSON.stringify(cleanedCatalog, null, 2)};\n`;
  fs.writeFileSync(CATALOG_FILE_PATH, newContent, 'utf8');
  console.log(`💾 Fichier ${CATALOG_FILE_PATH} sauvegardé avec succès !`);
}

main();
