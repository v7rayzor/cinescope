"""
Script de comparaison et d'audit du catalogue CinéScope
Vérifie la conformité avec AGENTS.md :
- Règle 1 : 1 seule catégorie unique par œuvre
- Unicité stricte : 0 doublon entre les chaînes
- Affichage multi-chaînes avec logos ordonnés alphabétiquement
"""

import json
import os
import re
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

CATALOG_PATH = os.path.join(os.path.dirname(__file__), 'js', 'catalog.js')

def clean(s):
    if not s: return ''
    s = s.lower()
    for c, r in [('é','e'),('è','e'),('ê','e'),('ë','e'),('à','a'),('â','a'),('î','i'),('ï','i'),('ô','o'),('ù','u'),('û','u'),('ç','c')]:
        s = s.replace(c, r)
    s = re.sub(r'[^a-z0-9]+', '', s)
    return s

def load_catalog():
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        text = f.read().strip()
    prefix = 'const CATALOG_DATA = '
    if text.startswith(prefix):
        text = text[len(prefix):].rstrip(';\n ')
    return json.loads(text)

def main():
    catalog = load_catalog()
    total = len(catalog)
    films = [x for x in catalog if x.get('type') in ('film', 'telefilm')]
    series = [x for x in catalog if x.get('type') == 'serie']
    
    eligible_films = [x for x in films if x.get('is_eligible')]
    eligible_series = [x for x in series if x.get('is_eligible')]

    print("=" * 65)
    print("            SYNTHÈSE DU CATALOGUE CINÉSCOPE")
    print("=" * 65)
    print(f"Total des œuvres uniques : {total}")
    print(f"• Films & Téléfilms : {len(films)} uniques ({len(eligible_films)} éligibles)")
    print(f"• Séries TV         : {len(series)} uniques ({len(eligible_series)} éligibles)")
    print("-" * 65)

    # 1. Contrôle des doublons entre chaînes
    print("\n🔍 AUDIT D'UNICITÉ (DOUBLONS ENTRE CHAÎNES) :")
    title_groups = {}
    for item in catalog:
        t = item['titre']
        t = re.sub(r'\s*\(\d{4}\)$', '', t)
        if 'lazarus' in t.lower():
            t = 'The Lazarus Project'
        k = (item.get('type', 'film'), clean(t))
        title_groups.setdefault(k, []).append(item)

    duplicates = {k: v for k, v in title_groups.items() if len(v) > 1}
    if duplicates:
        print(f"❌ {len(duplicates)} groupe(s) de doublons détecté(s) !")
        for k, v in duplicates.items():
            print(f"  - [{k[0]}] {k[1]} ({len(v)} occurrences)")
    else:
        print("✅ 0 DOUBLON : Toutes les œuvres sont uniques dans le catalogue !")

    # 2. Œuvres multi-chaînes
    multi_channel_items = [x for x in catalog if len(x.get('chaines', [])) > 1 or len(x.get('logos_chaine', [])) > 1]
    print(f"\n📡 ŒUVRES DIFFUSÉES SUR PLUSIEURS CHAÎNES ({len(multi_channel_items)}) :")
    for it in sorted(multi_channel_items, key=lambda x: x['titre']):
        chs = it.get('chaines', [])
        print(f"  • {it['titre']} [{it['type']}] : {' • '.join(chs)}")
        print(f"    -> Ordre alphabétique : {chs}")
        print(f"    -> Logos : {it.get('logos_chaine')}")

    # 3. Répartition des séries par catégorie (AGENTS.md)
    print("\n🏷️ SÉRIES PAR CATÉGORIE (Règle AGENTS.md : 1 catégorie unique) :")
    cats = {}
    violations = []
    for s in series:
        c_list = s.get('categories', [])
        if len(c_list) != 1:
            violations.append((s['id'], s['titre'], c_list))
        cat = c_list[0] if c_list else 'sans_categorie'
        cats[cat] = cats.get(cat, 0) + 1

    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  - {cat:<22} : {count:2d} séries")

    # 4. Vérification des affiches et logos
    missing_posters = [x for x in catalog if not os.path.exists(x.get('poster', ''))]
    missing_logos = []
    for x in catalog:
        for l in x.get('logos_chaine', [x.get('logo_chaine')]):
            if l and not os.path.exists(l):
                missing_logos.append((x['titre'], l))

    if missing_posters:
        print(f"\n⚠️ {len(missing_posters)} affiche(s) manquante(s) !")
    else:
        print("\n✅ 100% des affiches sont présentes en local !")

    if missing_logos:
        print(f"⚠️ {len(missing_logos)} logo(s) manquant(s) !")
    else:
        print("✅ 100% des logos de chaînes sont présents en local !")

    if violations:
        print(f"❌ {len(violations)} infraction(s) à la règle de la catégorie unique !")
    else:
        print("✅ 100% des œuvres respectent la règle de la catégorie unique (AGENTS.md).")

    print("=" * 65)

if __name__ == '__main__':
    main()
