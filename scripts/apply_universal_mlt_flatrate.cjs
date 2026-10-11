/**
 * CinéScope - Règle Universelle Molotov ABO (Ligne ABO / FLATRATE)
 * 1. Tout contenu non payant DOIT posséder une offre dans la ligne ABO de Molotov (FLATRATE)
 * 2. Suppression définitive d'Arte (art) et Novo 19 (nvn)
 * 3. Règle anti-doublon TNT : les œuvres TNT n'affichent que le logo de leur chaîne (M6+, TF1+, France TV)
 * 4. Préservation intégrale et sanctuarisation des 878 œuvres payantes SVOD (Ciné+ OCS, Universal+, Action Max)
 */

const fs = require('fs');
const path = require('path');

const fetch = globalThis.fetch;
const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';
const CATALOG_FILE_PATH = path.join(__dirname, '..', 'js', 'catalog.js');

const PACKAGES_CONFIG = {
  aoc: { name: 'Ciné+ OCS', logo: 'assets/logos/cine_ocs.svg', isPaid: true },
  aca: { name: 'Action Max', logo: 'assets/logos/action.png', isPaid: true },
  auc: { name: 'Universal+', logo: 'assets/logos/universal_plus.svg', isPaid: true },
  tf1: { name: 'TF1+', logo: 'assets/logos/tf1.png', isPaid: false },
  sxp: { name: 'M6+', logo: 'assets/logos/m6_plus.png', isPaid: false },
  fra: { name: 'France TV', logo: 'assets/logos/france_tv.png', isPaid: false },
  mlt: { name: 'Molotov Gratuit', logo: 'assets/logos/molotov.png', isPaid: false }
};

const q = `
  query GetMltFlatrate($country: Country!, $first: Int!, $after: String) {
    popularTitles(
      country: $country,
      filter: { packages: ["mlt"], monetizationTypes: [FLATRATE] },
      first: $first,
      after: $after
    ) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          objectId
          content(country: $country, language: "fr") { title }
        }
      }
    }
  }
`;

async function main() {
  console.log('🚀 Récupération exhaustive du catalogue Molotov ABO (FLATRATE)...');
  let after = null;
  const mltFlatIds = new Set();
  const mltFlatTitles = new Set();
  let totalFetched = 0;

  for (let p = 1; p <= 85; p++) {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query: q, variables: { country: 'FR', first: 50, after } })
    });
    const d = await res.json();
    const edges = d.data?.popularTitles?.edges || [];
    if (edges.length === 0) break;
    totalFetched += edges.length;

    edges.forEach(e => {
      mltFlatIds.add(`jw-${e.node.id}`);
      mltFlatIds.add(`jw-${e.node.objectId}`);
      const norm = (e.node.content?.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (norm) mltFlatTitles.add(norm);
    });

    if (!d.data?.popularTitles?.pageInfo?.hasNextPage) break;
    after = d.data?.popularTitles?.pageInfo?.endCursor;
  }

  console.log(`📡 Titres Molotov ABO identifiés : ${mltFlatTitles.size} titres uniques.`);

  const content = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
  const match = content.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*\])\s*;?/);
  if (!match) throw new Error('Impossible de parser CATALOG_DATA');
  const catalog = JSON.parse(match[1]);

  console.log(`📂 Catalogue actuel chargé : ${catalog.length} œuvres.`);

  let keptPaid = 0;
  let keptNonPaid = 0;
  let rejectedNonPaid = 0;
  const cleanedCatalog = [];

  for (const item of catalog) {
    const originalPkgs = [...(item.package_slugs || [])];
    
    // 1. Sanctuarisation payante : si l'œuvre possède un bouquet payant (aoc, aca, auc)
    const hasPaid = originalPkgs.some(p => ['aoc', 'aca', 'auc'].includes(p));
    if (hasPaid) {
      const paidPkgs = originalPkgs.filter(p => ['aoc', 'aca', 'auc'].includes(p));
      item.package_slugs = paidPkgs;
      item.chaines = paidPkgs.map(p => PACKAGES_CONFIG[p].name);
      item.logos_chaine = paidPkgs.map(p => PACKAGES_CONFIG[p].logo);
      item.chaine = PACKAGES_CONFIG[paidPkgs[0]].name;
      item.logo_chaine = PACKAGES_CONFIG[paidPkgs[0]].logo;
      item.on_tnt = false;
      cleanedCatalog.push(item);
      keptPaid++;
      continue;
    }

    // 2. Œuvre non payante : RÈGLE STRICTE MOLOTOV ABO (FLATRATE)
    const norm = (item.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const isMltFlatrate = mltFlatIds.has(item.id) || mltFlatTitles.has(norm);

    if (!isMltFlatrate) {
      // Rejet immédiat : non présent dans la ligne ABO de Molotov
      rejectedNonPaid++;
      continue;
    }

    // 3. Attribution propre du bouquet :
    // Retrait formel d'Arte (art) et Novo 19 (nvn)
    let validPkgs = originalPkgs.filter(p => ['tf1', 'sxp', 'fra'].includes(p));

    if (validPkgs.length > 0) {
      // Règle anti-doublon : la chaîne TNT officielle prime, Molotov (mlt) est banni !
      item.package_slugs = validPkgs;
      item.on_tnt = true;
    } else {
      // Pure Molotov Gratuit
      item.package_slugs = ['mlt'];
      item.on_tnt = false;
    }

    item.chaines = item.package_slugs.map(p => PACKAGES_CONFIG[p].name);
    item.logos_chaine = item.package_slugs.map(p => PACKAGES_CONFIG[p].logo);
    item.chaine = PACKAGES_CONFIG[item.package_slugs[0]].name;
    item.logo_chaine = PACKAGES_CONFIG[item.package_slugs[0]].logo;

    cleanedCatalog.push(item);
    keptNonPaid++;
  }

  console.log(`\n🧹 Bilan du grand nettoyage :`);
  console.log(`- Œuvres SVOD payantes sanctuarisées (PC & Mobile) : ${keptPaid}`);
  console.log(`- Œuvres non payantes confirmées Molotov ABO : ${keptNonPaid}`);
  console.log(`- Œuvres non présentes dans Molotov ABO rejetées : ${rejectedNonPaid}`);
  console.log(`✨ Total catalogue final : ${cleanedCatalog.length} œuvres`);

  // Comptage par package
  const pkgCounts = {};
  cleanedCatalog.forEach(i => i.package_slugs.forEach(p => pkgCounts[p] = (pkgCounts[p] || 0) + 1));
  console.log('\n📦 Répartition finale par bouquet :', pkgCounts);

  // Vérification de Blade Runner 2049
  const bladeRunner = cleanedCatalog.find(i => i.titre.includes('Blade Runner'));
  if (bladeRunner) {
    console.log(`\n🔍 Vérification Blade Runner 2049 :`, {
      chaines: bladeRunner.chaines,
      packages: bladeRunner.package_slugs,
      logos: bladeRunner.logos_chaine
    });
  }

  // Sauvegarde
  const newContent = `const CATALOG_DATA = ${JSON.stringify(cleanedCatalog, null, 2)};\n`;
  fs.writeFileSync(CATALOG_FILE_PATH, newContent, 'utf8');
  console.log(`💾 Fichier ${CATALOG_FILE_PATH} sauvegardé avec succès !`);
}

main().catch(err => {
  console.error('💥 Erreur :', err);
  process.exit(1);
});
