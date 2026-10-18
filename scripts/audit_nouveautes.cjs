#!/usr/bin/env node
/**
 * scripts/audit_nouveautes.cjs
 * Outil de suivi et d'arbitrage de la catégorisation sémantique CinéScope.
 * 
 * Permet de distinguer :
 * 1. La liste "Validé par le binôme" (valide_binome) : 100% certifiée humaine + IA.
 * 2. La liste "Validé uniquement par DeepSeek" (auto_deepseek) : ajouts automatiques quotidiens.
 * 
 * Commandes :
 *   node scripts/audit_nouveautes.cjs                  -> Affiche le bilan et les nouveautés DeepSeek
 *   node scripts/audit_nouveautes.cjs --validate-all    -> Valide toutes les nouveautés comme "valide_binome"
 *   node scripts/audit_nouveautes.cjs --validate <id>   -> Valide une œuvre spécifique
 *   node scripts/audit_nouveautes.cjs --set <id> <cat>  -> Corrige et valide la catégorie d'une œuvre
 *   node scripts/audit_nouveautes.cjs --export-md       -> Génère suivi_categorisation.md
 */

const fs = require('fs');
const path = require('path');

const AI_PATH = path.join(__dirname, '..', 'data', 'ai_categories.json');
const CATALOG_PATH = path.join(__dirname, '..', 'js', 'catalog.js');
const MD_PATH = path.join(__dirname, '..', 'suivi_categorisation.md');

const CATEGORIES_OFFICIELLES = [
  'drame_emotion',
  'comedie',
  'thriller_policier',
  'action_aventure',
  'scifi_fantastique',
  'horreur_epouvante',
  'animation_famille'
];

function loadData() {
  const aiData = JSON.parse(fs.readFileSync(AI_PATH, 'utf8'));
  return aiData;
}

function saveData(data) {
  fs.writeFileSync(AI_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function updateCatalogJs(id, newCategory) {
  if (!fs.existsSync(CATALOG_PATH)) return;
  let code = fs.readFileSync(CATALOG_PATH, 'utf8');
  
  // Remplacer dans le catalogue
  const regex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"categories":\\s*\\[\\s*")[^"]+("\\s*\\])`, 'm');
  if (regex.test(code)) {
    code = code.replace(regex, `$1${newCategory}$2`);
    fs.writeFileSync(CATALOG_PATH, code, 'utf8');
    return true;
  }
  return false;
}

function detectContresens(item) {
  const alerts = [];
  const cat = item.categories?.[0] || '';
  const text = ((item.titre || '') + ' ' + (item.justification || '')).toLowerCase();

  // Alerte Animation / Famille
  if (cat !== 'animation_famille' && (text.includes('animé') || text.includes('animation') || text.includes('dessin animé') || text.includes('jeunesse') || text.includes('enfant'))) {
    alerts.push('⚠️ ALERTE ANIMATION : Possible film d animation/famille classe en ' + cat);
  }

  // Alerte Comédie Parodique
  if (cat === 'horreur_epouvante' && (text.includes('parodie') || text.includes('comédie') || text.includes('humour') || text.includes('hilarant') || text.includes('déjanté'))) {
    alerts.push('⚠️ ALERTE COMÉDIE : Possible parodie horrifique à classer en comedie');
  }

  // Alerte SF / Concept
  if (cat === 'thriller_policier' && (text.includes('temporel') || text.includes('boucle') || text.includes('futur') || text.includes('science-fiction') || text.includes('simulation') || text.includes('vaisseau'))) {
    alerts.push('⚠️ ALERTE SF : Possible thriller conceptuel/SF à classer en scifi_fantastique');
  }

  // Alerte Drame / Survie réelle
  if (cat === 'action_aventure' && (text.includes('biopic') || text.includes('drame') || text.includes('histoire vraie') || text.includes('survie humaine') || text.includes('alpiniste'))) {
    alerts.push('⚠️ ALERTE DRAME : Possible exploit/survie réelle à classer en drame_emotion');
  }

  return alerts;
}

function generateMarkdownReport(valides, autoDeepseek) {
  let md = `# Suivi de la Catégorisation Sémantique CinéScope (Deux Listes)\n\n`;
  md += `> Ce document assure la traçabilité permanente entre les œuvres validées formellement par le **Binôme (Utilisateur + Antigravity)** et les nouvelles œuvres catégorisées automatiquement par **DeepSeek** lors des synchronisations quotidiennes.\n\n`;
  md += `**Date de dernière mise à jour :** ${new Date().toLocaleString('fr-FR')}\n\n`;
  md += `## 📊 Vue d'Ensemble\n\n`;
  md += `| Liste | Nombre d'œuvres | Statut | Règle de Gouvernance |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  md += `| 🟢 **Validé par le binôme** (\`valide_binome\`) | **${valides.length}** | 🔒 Certifié & Sanctuarisé | Aucune modification sans accord explicite. Contresens protégés. |\n`;
  md += `| 🟡 **Validé uniquement par DeepSeek** (\`auto_deepseek\`) | **${autoDeepseek.length}** | ⏳ En attente de revue | Nouveaux ajouts automatiques JustWatch à auditer par le binôme. |\n`;
  md += `| **TOTAL CATALOGUE** | **${valides.length + autoDeepseek.length}** | ✅ Conforme (1 œuvre = 1 cat) | Fenêtre glissante 20 ans (≥ 2006). |\n\n`;

  if (autoDeepseek.length === 0) {
    md += `## 🟡 Nouveautés DeepSeek en Attente de Revue (0)\n\n`;
    md += `*Toutes les œuvres du catalogue font actuellement partie de la liste certifiée par le binôme ! Aucune nouvelle œuvre en attente d'arbitrage.* 🎉\n\n`;
  } else {
    md += `## 🟡 Nouveautés DeepSeek en Attente de Revue (${autoDeepseek.length})\n\n`;
    md += `| ID | Titre | Année | Catégorie DeepSeek | Répartition % | Alertes Contresens | Justification |\n`;
    md += `| :--- | :--- | :---: | :---: | :--- | :--- | :--- |\n`;
    for (const it of autoDeepseek) {
      const rep = it.repartition ? Object.entries(it.repartition).filter(([k, v]) => v > 0).map(([k, v]) => `${k}: ${v}%`).join(', ') : 'N/A';
      const alerts = detectContresens(it);
      const alertStr = alerts.length > 0 ? alerts.join('<br>') : '✅ RAS';
      md += `| \`${it.id}\` | **${it.titre}** | ${it.annee || 'N/A'} | \`${it.categories?.[0]}\` | ${rep} | ${alertStr} | ${it.justification || 'N/A'} |\n`;
    }
    md += `\n`;
  }

  md += `## 🛠️ Commandes Utiles pour l'Arbitrage\n\n`;
  md += `\`\`\`bash\n`;
  md += `# 1. Consulter les nouveautés DeepSeek et les alertes de contresens :\n`;
  md += `node scripts/audit_nouveautes.cjs\n\n`;
  md += `# 2. Valider d'un coup toutes les nouveautés après examen du binôme :\n`;
  md += `node scripts/audit_nouveautes.cjs --validate-all\n\n`;
  md += `# 3. Corriger un contresens repéré sur une œuvre et la valider :\n`;
  md += `node scripts/audit_nouveautes.cjs --set <ID_OEUVRE> <NOUVELLE_CATEGORIE>\n`;
  md += `# Exemple : node scripts/audit_nouveautes.cjs --set jw-tm123456 comedie\n`;
  md += `\`\`\`\n`;

  fs.writeFileSync(MD_PATH, md, 'utf8');
  console.log(`📄 Rapport Markdown actualisé dans ${MD_PATH}`);
}

async function main() {
  const args = process.argv.slice(2);
  const data = loadData();

  const valides = [];
  const autoDeepseek = [];

  for (const id in data) {
    const item = { id, ...data[id] };
    if (item.statut_validation === 'auto_deepseek') {
      autoDeepseek.push(item);
    } else {
      valides.push(item);
    }
  }

  // Option 1 : --validate-all
  if (args.includes('--validate-all')) {
    if (autoDeepseek.length === 0) {
      console.log('ℹ️ Aucune œuvre en attente de validation.');
      return;
    }
    for (const it of autoDeepseek) {
      data[it.id].statut_validation = 'valide_binome';
    }
    saveData(data);
    console.log(`✅ ${autoDeepseek.length} œuvres ont été basculées dans la liste "valide_binome".`);
    generateMarkdownReport(valides.concat(autoDeepseek), []);
    return;
  }

  // Option 2 : --validate <id>
  const valIdx = args.indexOf('--validate');
  if (valIdx !== -1 && args[valIdx + 1]) {
    const targetId = args[valIdx + 1];
    if (data[targetId]) {
      data[targetId].statut_validation = 'valide_binome';
      saveData(data);
      console.log(`✅ Œuvre "${data[targetId].titre}" (${targetId}) validée par le binôme.`);
      return;
    } else {
      console.error(`❌ ID introuvable : ${targetId}`);
      return;
    }
  }

  // Option 3 : --set <id> <category>
  const setIdx = args.indexOf('--set');
  if (setIdx !== -1 && args[setIdx + 1] && args[setIdx + 2]) {
    const targetId = args[setIdx + 1];
    const newCat = args[setIdx + 2];
    if (!CATEGORIES_OFFICIELLES.includes(newCat)) {
      console.error(`❌ Catégorie invalide "${newCat}". Catégories officielles :`, CATEGORIES_OFFICIELLES.join(', '));
      return;
    }
    if (data[targetId]) {
      const oldCat = data[targetId].categories?.[0];
      data[targetId].categories = [newCat];
      data[targetId].statut_validation = 'valide_binome';
      data[targetId].justification = `Arbitrage binôme manuel : reclassement de [${oldCat}] vers [${newCat}]`;
      saveData(data);
      updateCatalogJs(targetId, newCat);
      console.log(`✅ Œuvre "${data[targetId].titre}" (${targetId}) corrigée : [${oldCat}] -> [${newCat}] et validée binôme.`);
      return;
    } else {
      console.error(`❌ ID introuvable : ${targetId}`);
      return;
    }
  }

  // Option 4 : --export-md
  if (args.includes('--export-md')) {
    generateMarkdownReport(valides, autoDeepseek);
    return;
  }

  // Par défaut : Affichage console
  console.log('======================================================================');
  console.log('       SUIVI DE LA CATÉGORISATION SÉMANTIQUE CINÉSCOPE');
  console.log('======================================================================');
  console.log(`🟢 Validé par le binôme (valide_binome)        : ${valides.length} œuvres (100% certifiées)`);
  console.log(`🟡 Validé uniquement DeepSeek (auto_deepseek) : ${autoDeepseek.length} œuvres (à auditer)`);
  console.log(`📦 Total Catalogue                             : ${valides.length + autoDeepseek.length} œuvres`);
  console.log('----------------------------------------------------------------------');

  if (autoDeepseek.length === 0) {
    console.log('✨ Aucune œuvre en attente d arbitrage DeepSeek. Tout est à jour !');
  } else {
    console.log(`⚠️ ${autoDeepseek.length} œuvres ont été catégorisées automatiquement par DeepSeek :\n`);
    for (const it of autoDeepseek) {
      console.log(`• [${it.id}] "${it.titre}" (${it.annee || 'N/A'})`);
      console.log(`  -> Catégorie DeepSeek : [${it.categories?.[0]}]`);
      if (it.repartition) {
        const rep = Object.entries(it.repartition).filter(([k, v]) => v > 0).map(([k, v]) => `${k}:${v}%`).join(', ');
        console.log(`  -> Répartition : ${rep}`);
      }
      console.log(`  -> Justification : ${it.justification || 'N/A'}`);
      const alerts = detectContresens(it);
      for (const a of alerts) {
        console.log(`  -> ${a}`);
      }
      console.log('');
    }
  }

  // Génération automatique du markdown
  generateMarkdownReport(valides, autoDeepseek);
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
