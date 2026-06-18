import pandas as pd
import json

def extract_bundle_mapping():
    try:
        # We can read 'NKT Update 1506.xlsx', if locked read 'temp_NKT.xlsx'
        df = pd.read_excel('temp_NKT.xlsx', sheet_name='SL nhận từ KH')
    except Exception as e:
        print("Error reading temp_NKT.xlsx:", e)
        return

    mapping = {}
    
    # Rows where the data actually starts might be index 1 and onwards.
    # We look for "Mã bó" which is in Unnamed: 19.
    for index, row in df.iterrows():
        ma_bo = str(row.get('Unnamed: 18', '')).strip()
        
        # Skip header rows or empty ma_bo
        if not ma_bo or ma_bo.lower() == 'mã bó' or ma_bo == 'nan':
            continue
            
        tu_gieng = str(row.get('Unnamed: 19', '')).strip()
        tu_gian = str(row.get('Unnamed: 20', '')).strip()
        so_bbgn = str(row.get('Unnamed: 21', '')).strip()
        
        if tu_gieng == 'nan': tu_gieng = ''
        if tu_gian == 'nan': tu_gian = ''
        if so_bbgn == 'nan': so_bbgn = ''
        
        mapping[ma_bo] = {
            'tuGieng': tu_gieng,
            'tuGian': tu_gian,
            'soBBGN': so_bbgn
        }
        
    # Write to a js file
    js_content = "const BUNDLE_MAPPING = " + json.dumps(mapping, ensure_ascii=False, indent=4) + ";"
    with open('bundle_mapping.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Extracted mapping for {len(mapping)} bundles.")

if __name__ == "__main__":
    extract_bundle_mapping()
