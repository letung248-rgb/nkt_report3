import pandas as pd
import json

data = {}
try:
    data['rev1'] = pd.ExcelFile('TPL report rev1.xlsx').sheet_names
except Exception as e:
    data['rev1'] = str(e)

try:
    data['VSP'] = pd.ExcelFile('Template Report VSP.xlsx').sheet_names
except Exception as e:
    data['VSP'] = str(e)

try:
    data['rev2'] = pd.ExcelFile('TPL report rev2.xlsx').sheet_names
except Exception as e:
    data['rev2'] = str(e)

with open('sheets.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
