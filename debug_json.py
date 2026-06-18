import json
with open('imported_june.json', 'r', encoding='utf-8') as f:
    data1 = json.load(f)
with open('imported_june2.json', 'r', encoding='utf-8') as f:
    data2 = json.load(f)

out = []
for r in data1 + data2:
    if r['ngay'] in ['2026-06-07', '2026-06-11', '2026-06-12', '2026-06-15']:
        out.append(f"{r['ngay']} - {r['nguyenCong']} - Count: {r['soOngCount']} - Tình trạng: {r['tinhTrang']}")

with open('debug_output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
