import re, json

with open(r'Site\OCS\pdf_text.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

items = []
current_part = 1
for line in lines:
    line = line.strip()
    if 'PARTIE 1' in line:
        current_part = 1
        continue
    if 'PARTIE 2' in line:
        current_part = 2
        continue
    if not line or line.startswith('===') or line.startswith('#') or line.startswith('Catalogue') or line.startswith('Films') or line.startswith('Crit') or line.startswith('Bar') or line.startswith('('):
        continue
    
    m = re.match(r'^(\d+)\s+(.+?)\s+(\d{4})\s+([\d\.]+)\s*/\s*10\s+([\d\.]+)\s*/\s*10\s+([\d\.]+)\s*/\s*10(?:\s+(.*))?$', line)
    if m:
        num, title, year, note_avis, note_recence, note_globale, exclusion = m.groups()
        title = re.sub(r'\s+', ' ', title).strip()
        title = title.replace("L '", "L'").replace("d '", "d'").replace("J '", "J'")
        items.append({
            'rank': int(num),
            'titre': title,
            'annee': int(year),
            'note_avis': float(note_avis),
            'note_recence': float(note_recence),
            'note_globale': float(note_globale),
            'is_eligible': (current_part == 1),
            'exclusion': exclusion if current_part == 2 else None,
            'part': current_part
        })
    else:
        print('UNMATCHED LINE:', repr(line.encode('ascii', 'replace').decode('ascii')))

print(f'Total parsed items: {len(items)}')
eligible_count = sum(1 for x in items if x['is_eligible'])
non_eligible_count = sum(1 for x in items if not x['is_eligible'])
print(f'Eligible: {eligible_count}, Non-eligible: {non_eligible_count}')

with open(r'Site\OCS\parsed_ocs.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)
