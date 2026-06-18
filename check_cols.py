import pandas as pd
df = pd.read_excel('temp_NKT.xlsx', sheet_name='SL nhận từ KH')
with open('cols.txt', 'w', encoding='utf-8') as f:
    for i, col in enumerate(df.columns):
        f.write(f"{i}: {col} -> {df.iloc[0][col]}\n")
