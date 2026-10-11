/**
 * CinéScope - Script de Nettoyage et Sanctuarisation TNT & Arte
 * Élimine les faux Arte issus de la boutique payante ARTE VOD (atb)
 * et garantit la conformité stricte de tous les diffuseurs gratuits.
 */

const fs = require('fs');
const path = require('path');

const fetch = globalThis.fetch;
const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';
const CATALOG_FILE_PATH = path.join(__dirname, '..', 'js', 'catalog.js');

const query = `
  query GetAllArt($country: Country!, $first: Int!, $after: String) {
    popularTitles(country: $country, filter: { packages: ["art"] }, first: $first, after: $after) {
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
          }
        }
      }
    }
  }
`;

const PACKAGES_CONFIG = {
  aoc: { name: 'Ciné+ OCS', logo: 'assets/logos/cine_ocs.svg', isPaid: true },
  aca: { name: 'Action Max', logo: 'assets/logos/action.png', isPaid: true },
  auc: { name: 'Universal+', logo: 'assets/logos/universal_plus.svg', isPaid: true },
  tf1: { name: 'TF1+', logo: 'assets/logos/tf1.png', isPaid: false },
  sxp: { name: 'M6+', logo: 'assets/logos/m6_plus.png', isPaid: false },
  fra: { name: 'France TV', logo: 'assets/logos/france_tv.png', isPaid: false },
  art: { name: 'Arte', logo: 'assets/logos/arte.png', isPaid: false },
  nvn: { name: 'Novo 19', logo: 'assets/logos/novo19.svg', isPaid: false },
  mlt: { name: 'Molotov Gratuit', logo: 'assets/logos/molotov.png', isPaid: false }
};

async function main() {
  console.log('🚀 Démarrage du nettoyage des bouquets et sanctuarisation de la gratuité...');

  // 1. Récupération exhaustive de toutes les œuvres réelles Arte gratuit (package "art")
  let after = null;
  const artIds = new Set();
  const artNormTitles = new Set();
  let totalArtFetched = 0;

  for (let page = 1; page <= 12; page++) {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query, variables: { country: 'FR', first: 40, after } })
    });
    const d = await res.json();
    const edges = d.data?.popularTitles?.edges || [];
    if (edges.length === 0) break;
    totalArtFetched += edges.length;

    edges.forEach(e => {
      artIds.add(`jw-${e.node.id}`);
      artIds.add(`jw-${e.node.objectId}`);
      const norm = (e.node.content?.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (norm) artNormTitles.add(norm);
    });

    if (!d.data?.popularTitles?.pageInfo?.hasNextPage) break;
    after = d.data?.popularTitles?.pageInfo?.endCursor;
  }
  console.log(`📡 Titres réels Arte gratuit (art) identifiés : ${totalArtFetched} reçus (${artNormTitles.size} titres uniques).`);

  // 2. Lecture du catalogue existant
  const content = fs.readFileSync(CATALOG_FILE_PATH, 'utf8');
  const match = content.match(/const\s+CATALOG_DATA\s*=\s*(\[[\s\S]*\])\s*;?/);
  if (!match) throw new Error('Impossible de parser CATALOG_DATA');
  const catalog = JSON.parse(match[1]);

  let cleanedFalseArt = 0;
  let cleanedGulli = 0;
  const cleanedCatalog = [];

  for (const item of catalog) {
    let pkgs = (item.package_slugs || []).filter(p => PACKAGES_CONFIG[p]);

    // Élimination formelle de tout reliquat Gullimax (gum)
    if (pkgs.includes('gum')) {
      pkgs = pkgs.filter(p => p !== 'gum');
      cleanedGulli++;
    }

    // Élimination formelle de la fausse boutique payante ARTE VOD (atb)
    if (pkgs.includes('art')) {
      const norm = (item.titre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const isGenuineArt = artIds.has(item.id) || artNormTitles.has(norm);
      if (!isGenuineArt) {
        pkgs = pkgs.filter(p => p !== 'art');
        cleanedFalseArt++;
      }
    }

    // Sanctuarisation des bouquets payants : si présent sur payant, pas de Molotov ni TNT
    const hasPaid = pkgs.some(p => ['aoc', 'aca', 'auc'].includes(p));
    if (hasPaid) {
      pkgs = pkgs.filter(p => ['aoc', 'aca', 'auc'].includes(p));
    }

    // Si plus aucun package, fallback de sécurité sur mlt (Molotov Gratuit)
    if (pkgs.length === 0) {
      pkgs = ['mlt'];
    }

    // Réassignation propre des noms et logos
    item.package_slugs = pkgs;
    item.chaines = pkgs.map(p => PACKAGES_CONFIG[p].name);
    item.logos_chaine = pkgs.map(p => PACKAGES_CONFIG[p].logo);
    item.chaine = PACKAGES_CONFIG[pkgs[0]].name;
    item.logo_chaine = PACKAGES_CONFIG[pkgs[0]].logo;

    // Mise à jour du flag on_tnt
    const tntSlugs = ['tf1', 'sxp', 'fra', 'art', 'nvn'];
    item.on_tnt = pkgs.some(p => tntSlugs.includes(p));

    cleanedCatalog.push(item);
  }

  console.log(`🧹 Faux Arte VOD supprimés sur ${cleanedFalseArt} œuvres.`);
  if (cleanedGulli > 0) console.log(`🧹 Reliquats Gullimax supprimés sur ${cleanedGulli} œuvres.`);
  console.log(`📊 Total final d'œuvres dans le catalogue : ${cleanedCatalog.length}`);

  // Comptage par package
  const pkgCounts = {};
  cleanedCatalog.forEach(i => {
    i.package_slugs.forEach(p => pkgCounts[p] = (pkgCounts[p] || 0) + 1);
  });
  console.log('📦 Répartition finale par bouquet :', pkgCounts);

  // Sauvegarde
  const newContent = `const CATALOG_DATA = ${JSON.stringify(cleanedCatalog, null, 2)};\n`;
  fs.writeFileSync(CATALOG_FILE_PATH, newContent, 'utf8');
  console.log(`💾 Fichier ${CATALOG_FILE_PATH} mis à jour avec succès !`);
}

main().catch(err => {
  console.error('💥 Erreur :', err);
  process.exit(1);
});
