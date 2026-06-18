import pandas as pd
import json

df = pd.read_excel('TPL report rev2.xlsx', sheet_name=0)
with open('tpl_data.txt', 'w', encoding='utf-8') as f:
    f.write(str(df.head()))
