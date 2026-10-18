const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/audit_deepseek_results.json'), 'utf8'));
const aiCategories = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ai_categories.json'), 'utf8'));
const catalogContent = fs.readFileSync(path.join(__dirname, '../js/catalog.js'), 'utf8');
const catalogMatch = catalogContent.match(/const CATALOG_DATA = (\[[\s\S]*?\]);/);
const catalog = eval(catalogMatch[1]);

const CAT_LABELS = {
  drame_emotion: "Drame & Émotion",
  comedie: "Comédie",
  thriller_policier: "Thriller & Policier",
  action_aventure: "Action & Aventure",
  scifi_fantastique: "Science-fiction & Fantastique",
  horreur_epouvante: "Horreur & Épouvante",
  animation_famille: "Animation & Famille"
};

function formatRepClean(rep) {
  if (!rep) return "Non renseigné";
  const sorted = Object.entries(rep)
    .filter(([k, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return sorted
    .map(([k, v], idx) => {
      const label = CAT_LABELS[k] || k;
      return idx === 0 ? `**${label} : ${v}%**` : `${label} : ${v}%`;
    })
    .join('  |  ');
}

// Extraction des 114 matches serrés
const tight = [];

for (const [id, d] of Object.entries(results)) {
  if (!d.is_divergent) continue;
  const rep = d.repartition || {};
  const sorted = Object.entries(rep).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0] || ['none', 0];
  const top2 = sorted[1] || ['none', 0];
  const gap = top1[1] - top2[1];

  if (top1[1] <= 50 || gap <= 15) {
    const catItem = catalog.find(x => x.id === id);
    const orig = aiCategories[id] || {};
    tight.push({
      id,
      titre: d.titre,
      annee: d.annee,
      synopsis: catItem ? catItem.synopsis : '',
      actuelle: d.categorie_actuelle,
      origRep: orig.repartition || {},
      origJustif: orig.justification || '',
      deepseek: d.categorie_dominante,
      deepseekRep: rep,
      deepseekJustif: d.justification || ''
    });
  }
}

// Grouper par duel
const groups = {};
tight.forEach(t => {
  const k = `${CAT_LABELS[t.actuelle] || t.actuelle} ➔ ${CAT_LABELS[t.deepseek] || t.deepseek}`;
  if (!groups[k]) groups[k] = [];
  groups[k].push(t);
});

let md = `# Arbitrage des 114 Matches Serrés\n\n`;
md += `> **Principe :** Pour chaque film, une lecture directe en 3 lignes : le synopsis, la ligne de pourcentages DeepSeek (100%), la ligne de mes pourcentages originaux CinéScope (100%), et le conseil d'arbitrage.\n\n`;
md += `---\n\n`;

md += `## Sommaire des 114 Duels\n\n`;
Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length).forEach((k, i) => {
  md += `${i + 1}. **${k}** (${groups[k].length} œuvres)\n`;
});
md += `\n---\n\n`;

let indexCounter = 1;

for (const [groupName, items] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
  md += `## 🥊 Duel : ${groupName} (${items.length} œuvres)\n\n`;

  for (const item of items) {
    const dsLine = formatRepClean(item.deepseekRep);
    const origLine = formatRepClean(item.origRep);
    const cur = item.actuelle;
    const ds = item.deepseek;

    let conseil = "";
    if (item.titre.toLowerCase().includes('source code')) {
      conseil = `Conserver \`${cur}\` (la technologie quantique de boucle temporelle dans l'esprit d'un mort est de la pure SF, l'enquête policière n'est qu'un prétexte).`;
    } else if (item.titre.toLowerCase().includes('the things you kill')) {
      conseil = `Basculer vers \`${ds}\` (la quête vengeresse et les soupçons de meurtre imposent une tension de thriller dominant le drame familial).`;
    } else if (item.titre.toLowerCase().includes('s.o.s. fantômes')) {
      conseil = `Basculer vers \`${ds}\` (comédie fantastique dont tout l'attrait repose sur le paranormal et les fantômes).`;
    } else if (item.titre.toLowerCase().includes('insaisissables')) {
      conseil = `Basculer vers \`${ds}\` (pur film de braquage et de grand spectacle).`;
    } else if (item.titre.toLowerCase().includes('sonic')) {
      conseil = `Conserver \`${cur}\` (franchise pensée et vécue d'abord pour les enfants et la famille).`;
    } else {
      const dsScore = item.deepseekRep[ds] || 0;
      const curScore = item.deepseekRep[cur] || 0;
      if (dsScore >= curScore + 15) {
        conseil = `Basculer vers \`${ds}\` (DeepSeek lui donne une nette avance : ${dsScore}% vs ${curScore}%).`;
      } else {
        conseil = `Match très serré (${dsScore}% pour \`${ds}\` vs ${curScore}% pour \`${cur}\`) : à choisir selon ta sensibilité.`;
      }
    }

    md += `### ${indexCounter}. ${item.titre} (${item.annee})\n\n`;
    if (item.synopsis) {
      md += `> *${item.synopsis}*\n\n`;
    }
    md += `* 🤖 **Pourcentages DeepSeek** : ${dsLine}\n`;
    md += `* 🧠 **Mes pourcentages (CinéScope)** : ${origLine}\n`;
    md += `* ⚖️ **Conseil d'arbitrage** : ${conseil}\n\n`;
    md += `---\n\n`;

    indexCounter++;
  }
}

fs.writeFileSync(path.join(__dirname, '../matches_serres_arbitrage.md'), md, 'utf8');
console.log(`✅ Fichier matches_serres_arbitrage.md généré en format ultra-lisible (lignes séparées) !`);
