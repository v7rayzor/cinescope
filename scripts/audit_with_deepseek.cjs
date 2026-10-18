const fs = require('fs');
const path = require('path');

// 1. Charger la clé API DeepSeek depuis .env
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('Erreur: Fichier .env introuvable.');
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DEEPSEEK_API_KEY=(.+)/);
const token = match ? match[1].trim() : null;

if (!token) {
  console.error('Erreur: DEEPSEEK_API_KEY manquante dans .env.');
  process.exit(1);
}

// 2. Charger CATALOG_DATA
const catalogPath = path.join(__dirname, '../js/catalog.js');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');
const catalogMatch = catalogContent.match(/const CATALOG_DATA = (\[[\s\S]*?\]);/);
if (!catalogMatch) {
  console.error('Erreur: Impossible d\'extraire CATALOG_DATA de js/catalog.js');
  process.exit(1);
}

const catalog = eval(catalogMatch[1]);
const eligibleItems = catalog.filter(it => it.is_eligible);
console.log(`[Audit DeepSeek] ${eligibleItems.length} œuvres éligibles à analyser.`);

// 3. Charger les résultats partiels pour reprise en cas de pause
const resultsPath = path.join(__dirname, '../data/audit_deepseek_results.json');
let results = {};
if (fs.existsSync(resultsPath)) {
  try {
    results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    console.log(`[Audit DeepSeek] Reprise active : ${Object.keys(results).length} œuvres déjà auditées en cache.`);
  } catch (e) {
    results = {};
  }
}

const systemPrompt = `Tu es le classificateur sémantique officiel de CinéScope, plateforme de cinéma et séries de référence.
Ta mission est d'attribuer STRICTEMENT UNE SEULE CATÉGORIE DOMINANTE à chaque œuvre parmi les 7 catégories officielles ci-dessous :
1. "drame_emotion" : Drames profonds, romances, biopics, drames sociaux, récits d'auteur.
2. "comedie" : Comédies pures, parodies, satires, comédies romantiques et populaires.
3. "thriller_policier" : Polars, enquêtes policières, espionnage, machinations, suspense, thrillers psychologiques/criminels.
4. "action_aventure" : Action grand spectacle, westerns d'action, arts martiaux, survie, guerre, aventures physiques.
5. "scifi_fantastique" : Science-fiction, space opéra, anticipation, mondes magiques, fantasy, super-héros.
6. "horreur_epouvante" : Slashers, épouvante, body horror, démons, possession, terreur surnaturelle, gore.
7. "animation_famille" : Films et séries d'animation, aventures jeunesse, contes familiaux.

RÈGLES STRICTES :
- La somme des pourcentages de répartition doit être exactement égale à 100%.
- "categorie_dominante" doit être STRICTEMENT l'une des 7 clés exactes listées ci-dessus.
- Format JSON strict :
{
  "repartition": {
    "drame_emotion": 0,
    "comedie": 0,
    "thriller_policier": 0,
    "action_aventure": 0,
    "scifi_fantastique": 0,
    "horreur_epouvante": 0,
    "animation_famille": 0
  },
  "categorie_dominante": "nom_exact",
  "justification": "Courte explication concise en 1 phrase"
}`;

async function classifyWithDeepSeek(item, retryCount = 0) {
  const userPrompt = `Analyse et qualifie cette œuvre pour CinéScope (base ton analyse exclusivement sur l'histoire réelle et le synopsis, sans aucune étiquette externe) :
Titre : ${item.titre}
Année : ${item.annee_moyenne || item.annee || 'Inconnue'}
Type : ${item.type}
Badge d'âge : ${item.badge || 'Tous publics'}
Synopsis : ${item.synopsis || 'Non renseigné'}`;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.0
      })
    });

    if (res.status === 429 && retryCount < 5) {
      const waitMs = (retryCount + 1) * 2000;
      await new Promise(r => setTimeout(r, waitMs));
      return classifyWithDeepSeek(item, retryCount + 1);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed;
  } catch (err) {
    if (retryCount < 3) {
      await new Promise(r => setTimeout(r, 1500));
      return classifyWithDeepSeek(item, retryCount + 1);
    }
    console.error(`Erreur sur "${item.titre}":`, err.message);
    return null;
  }
}

async function runAudit() {
  const itemsToProcess = eligibleItems.filter(it => !results[it.id]);
  console.log(`[Audit DeepSeek] ${itemsToProcess.length} œuvres restantes à qualifier...`);

  const CONCURRENCY = 8;
  let processed = Object.keys(results).length;
  let divergencesCount = 0;

  // Calcul du nombre initial de divergences
  for (const id in results) {
    const it = eligibleItems.find(x => x.id === id);
    if (it && it.categories[0] !== results[id].categorie_dominante) {
      divergencesCount++;
    }
  }

  let queueIndex = 0;

  async function worker() {
    while (queueIndex < itemsToProcess.length) {
      const currentIdx = queueIndex++;
      const item = itemsToProcess[currentIdx];
      const res = await classifyWithDeepSeek(item);

      if (res && res.categorie_dominante) {
        results[item.id] = {
          titre: item.titre,
          annee: item.annee_moyenne || item.annee,
          categorie_actuelle: item.categories[0],
          categorie_dominante: res.categorie_dominante,
          repartition: res.repartition,
          justification: res.justification,
          is_divergent: item.categories[0] !== res.categorie_dominante,
          analyzed_at: new Date().toISOString()
        };

        if (item.categories[0] !== res.categorie_dominante) {
          divergencesCount++;
        }
      }

      processed++;
      if (processed % 25 === 0 || processed === eligibleItems.length) {
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
        const pct = ((processed / eligibleItems.length) * 100).toFixed(1);
        console.log(`[Audit DeepSeek] ${processed}/${eligibleItems.length} (${pct}%) — ${divergencesCount} divergence(s) détectée(s)`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // Sauvegarde finale des résultats bruts
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');

  // Génération du rapport Markdown exhaustif
  generateMarkdownReport();
}

function generateMarkdownReport() {
  const reportPath = path.join(__dirname, '../audit_divergences.md');
  const allResults = Object.values(results);
  const divergences = allResults.filter(r => r.is_divergent);
  const total = allResults.length;
  const identical = total - divergences.length;
  const accordPct = ((identical / total) * 100).toFixed(1);

  let md = `# Rapport d'Audit Croisé Exhaustif — DeepSeek vs Catalogue Actuel\n\n`;
  md += `> **Date de réalisation :** ${new Date().toLocaleString('fr-FR')}  \n`;
  md += `> **Moteur IA d'audit :** DeepSeek Chat (\`deepseek-chat\`, température 0.0)  \n`;
  md += `> **Périmètre :** ${total} œuvres éligibles analysées  \n`;
  md += `> **Taux de concordance :** **${accordPct} %** (${identical} conformes, ${divergences.length} divergences relevées)\n\n`;
  md += `---\n\n`;

  md += `## 1. Synthèse Globale\n\n`;
  md += `| Indicateur | Nombre d'œuvres | Pourcentage |\n`;
  md += `| :--- | :---: | :---: |\n`;
  md += `| **Catégorisation 100% Identique** | **${identical}** | **${accordPct} %** |\n`;
  md += `| **Divergences détectées à arbitrer** | **${divergences.length}** | **${(100 - accordPct).toFixed(1)} %** |\n`;
  md += `| **Total œuvres auditées** | **${total}** | **100 %** |\n\n`;

  md += `---\n\n`;
  md += `## 2. Liste Exhaustive des ${divergences.length} Divergences Détectées\n\n`;
  md += `Chaque divergence ci-dessous indique la catégorie actuelle dans CinéScope, le choix proposé par DeepSeek avec son pourcentage de dominance, et la justification sémantique de l'IA.\n\n`;

  md += `| # | Titre | Année | Catégorie Actuelle | Proposition DeepSeek | Score % | Justification DeepSeek |\n`;
  md += `| :---: | :--- | :---: | :--- | :--- | :---: | :--- |\n`;

  divergences.forEach((d, idx) => {
    const dominantPct = d.repartition ? d.repartition[d.categorie_dominante] : 0;
    const cleanJustif = (d.justification || '').replace(/\|/g, '-');
    md += `| ${idx + 1} | **${d.titre}** | ${d.annee} | \`${d.categorie_actuelle}\` | **\`${d.categorie_dominante}\`** | ${dominantPct}% | ${cleanJustif} |\n`;
  });

  md += `\n---\n\n`;
  md += `*Rapport généré automatiquement pour vérification en toute transparence.*\n`;

  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(`\n✅ Rapport complet généré avec succès dans audit_divergences.md !`);
  console.log(`📊 Total: ${total} | Conformes: ${identical} (${accordPct}%) | Divergences: ${divergences.length}`);
}

runAudit().catch(err => {
  console.error('Erreur critique pendant l\'audit:', err);
  process.exit(1);
});
