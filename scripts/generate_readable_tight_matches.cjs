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

function formatRep(rep) {
  if (!rep) return "Non renseigné";
  return Object.entries(rep)
    .filter(([k, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `**${CAT_LABELS[k] || k}** : ${v}%`)
    .join(' · ');
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

console.log(`[Reformatage] ${tight.length} matches serrés identifiés.`);

// Grouper par duel
const groups = {};
tight.forEach(t => {
  const k = `${CAT_LABELS[t.actuelle] || t.actuelle} ➔ ${CAT_LABELS[t.deepseek] || t.deepseek}`;
  if (!groups[k]) groups[k] = [];
  groups[k].push(t);
});

let md = `# Audit d'Arbitrage — Les 114 Matches Serrés\n\n`;
md += `> **Contexte :** Ce document met face à face, pour chacune des 114 œuvres hybrides, **la qualification actuelle dans CinéScope** (avec ses pourcentages originaux qui totalisent 100%) face à **la proposition de DeepSeek** (avec ses pourcentages qui totalisent 100%).\n`;
md += `> L'objectif est de te permettre d'arbitrer en voyant clairement où se situe le désaccord entre les deux approches.\n\n`;
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
    const origFormatted = formatRep(item.origRep);
    const dsFormatted = formatRep(item.deepseekRep);

    // Analyse d'arbitrage
    let arbitrageConseil = "";
    const cur = item.actuelle;
    const ds = item.deepseek;

    if (item.titre.toLowerCase().includes('source code')) {
      arbitrageConseil = `Conserver **\`${cur}\`** : Même si le film a une trame d'enquête policière, son cœur narratif absolu est la technologie quantique de boucle temporelle dans l'esprit d'un mort (pure SF).`;
    } else if (item.titre.toLowerCase().includes('the things you kill')) {
      arbitrageConseil = `Basculer vers **\`${ds}\`** : La quête de vengeance et le mystère criminel autour du père créent une tension de thriller dominant le drame familial.`;
    } else if (item.titre.toLowerCase().includes('s.o.s. fantômes')) {
      arbitrageConseil = `Basculer vers **\`${ds}\`** : C'est une comédie dont 100% de l'attrait et de l'univers reposent sur le surnaturel, les spectres et les gadgets de science-fantastique.`;
    } else if (item.titre.toLowerCase().includes('insaisissables')) {
      arbitrageConseil = `Basculer vers **\`${ds}\`** : L'humour n'est qu'un ton de surface ; c'est un pur film de braquage et de spectacle d'aventure.`;
    } else if (item.titre.toLowerCase().includes('sonic')) {
      arbitrageConseil = `Conserver **\`${cur}\`** : Malgré l'action et les pouvoirs, Sonic est pensé et consommé avant tout comme une franchise familiale/jeunesse.`;
    } else {
      // Déduction logique du duel
      const dsScore = item.deepseekRep[ds] || 0;
      const curInDs = item.deepseekRep[cur] || 0;
      if (dsScore >= curInDs + 15) {
        arbitrageConseil = `Basculer vers **\`${ds}\`** : DeepSeek identifie une dominante plus marquée (${dsScore}% vs ${curInDs}% pour \`${cur}\`).`;
      } else {
        arbitrageConseil = `Match très équilibré (${dsScore}% pour \`${ds}\` vs ${curInDs}% pour \`${cur}\`) : À arbitrer selon ta préférence de navigation dans CinéScope.`;
      }
    }

    md += `### ${indexCounter}. **${item.titre}** (${item.annee})\n\n`;
    if (item.synopsis) {
      md += `> 📖 **Synopsis :** *${item.synopsis}*\n\n`;
    }

    md += `| Indicateur | 📌 Catégorie Actuelle (CinéScope) | 🤖 Proposition Détectée (DeepSeek) |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| **Catégorie** | **\`${item.actuelle}\`** | **\`${item.deepseek}\`** |\n`;
    md += `| **Répartition 100 %** | ${origFormatted} | ${dsFormatted} |\n`;
    md += `| **Motivation** | ${item.origJustif || 'Qualification historique'} | ${item.deepseekJustif || 'Analyse sémantique DeepSeek'} |\n\n`;

    md += `⚖️ **Conseil d'arbitrage :** ${arbitrageConseil}\n\n`;
    md += `---\n\n`;

    indexCounter++;
  }
}

fs.writeFileSync(path.join(__dirname, '../matches_serres_arbitrage.md'), md, 'utf8');
console.log(`✅ Fichier matches_serres_arbitrage.md régénéré avec succès avec les vrais pourcentages CinéScope vs DeepSeek !`);
