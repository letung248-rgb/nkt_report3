import pandas as pd
import datetime

xls = pd.ExcelFile('NKT_copy2.xlsx')
s_name = [x for x in xls.sheet_names if 'liệu' in x.lower()][0]
df = pd.read_excel('NKT_copy2.xlsx', sheet_name=s_name, header=None)

out = []
for idx in range(4, len(df)):
    row = df.iloc[idx]
    has_target = False
    for c in [16, 19, 22, 28, 32, 37, 42, 45, 48]:
        val = row[c]
        if isinstance(val, datetime.datetime):
            dstr = val.strftime('%Y-%m-%d')
            if dstr in ['2026-06-07', '2026-06-11', '2026-06-12', '2026-06-15']:
                has_target = True
    if has_target:
        out.append(f"Row {idx+1}: Đầu vào: {row[16]}, Ép TL: {row[37]}, Pipe: {row[3]}")

with open('inspect_dates.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
