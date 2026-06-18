import pandas as pd
import json

df = pd.read_excel('TPL report rev2.xlsx', sheet_name=0)
with open('get_cols.json', 'w', encoding='utf-8') as f:
    json.dump(df.columns.tolist(), f, ensure_ascii=False)
