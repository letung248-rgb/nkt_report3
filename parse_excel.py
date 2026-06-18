import pandas as pd
import json

xls = pd.ExcelFile('NKT_copy.xlsx')
s = [x for x in xls.sheet_names if 'liệu' in x.lower()][0]
df = pd.read_excel('NKT_copy.xlsx', sheet_name=s, header=3)

cols = [str(c) for c in df.columns]
with open('cols.json', 'w', encoding='utf-8') as f:
    json.dump(cols, f, ensure_ascii=False, indent=2)

df_head = df.head(10).astype(str)
with open('head.json', 'w', encoding='utf-8') as f:
    json.dump(df_head.to_dict('records'), f, ensure_ascii=False, indent=2)
