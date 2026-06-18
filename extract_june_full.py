import pandas as pd
import json
import math
import datetime

def parse_date(val):
    if pd.isna(val):
        return None
    if isinstance(val, datetime.datetime):
        return val.strftime('%Y-%m-%d')
    s = str(val).strip().split(' ')[0]
    if len(s) == 10 and s.startswith('202'):
        return s
    return None

def extract_pipe_num(val):
    s = str(val).strip()
    if '.' in s:
        s = s.split('.')[0]
    try:
        return int(s)
    except:
        return s

error_map = {
    'HCL': 'Hỏng coupling',
    'HR': 'Hỏng ren',
    'THK': 'Thiếu chiều dày (loại)',
    'KTN': 'Khuyết tật ngang (loại)',
    'KTD': 'Khuyết tật dọc (loại)',
    'XP': 'Xì pin',
    'XB': 'Xì box',
    'HR,HCL': 'Hỏng ren và coupling',
    'HCL,HR': 'Hỏng ren và coupling',
    'XP,XB': 'Xì cả 2 đầu',
    'XB,XP': 'Xì cả 2 đầu',
    'RT': 'Rỗ thân, ăn mòn (loại)',
    'PARAFFIN': 'Tắc paraffin (loại)',
    'OK': 'Đạt'
}

def map_error(err_str):
    if not err_str or str(err_str).strip() == '':
        return 'Đạt'
    
    e = str(err_str).strip().upper()
    if e in error_map:
        return error_map[e]
    
    if ',' in e:
        parts = [p.strip() for p in e.split(',')]
        if set(parts) == {'HR', 'HCL'}:
            return 'Hỏng ren và coupling'
        if set(parts) == {'XP', 'XB'}:
            return 'Xì cả 2 đầu'
            
    return e

print("Reading excel...")
xls = pd.ExcelFile('NKT Update 1506.xlsx')
s_name = [x for x in xls.sheet_names if 'liệu' in x.lower()][0]
df = pd.read_excel('NKT Update 1506.xlsx', sheet_name=s_name, header=None)
print("Finished reading.")

records = []

stages = [
    {'name': 'Đầu vào', 'ngay': 16, 'nguoi1': 14, 'nguoi2': 15, 'tinhTrang': 11, 'maBo': 12, 'khoang': 13},
    {'name': 'Rửa ống', 'ngay': 19, 'nguoi1': 18, 'tinhTrang': 17},
    {'name': 'Thông nòng', 'ngay': 22, 'nguoi1': 21, 'tinhTrang': 20},
    {'name': 'NDT', 'ngay': 28, 'nguoi1': 27, 'tinhTrang': 26},
    {'name': 'Làm sạch, calip ren', 'ngay': 32, 'nguoi1': 30, 'nguoi2': 31, 'tinhTrang': 29},
    {'name': 'Ép thủy lực', 'ngay': 37, 'nguoi1': 35, 'nguoi2': 36, 'tinhTrang': 34, 'apSuat': 33},
    {'name': 'Đóng gói', 'ngay': 42, 'nguoi1': 41, 'khoang': 40, 'maBoTP': 38, 'maBoHong': 39},
    {'name': 'Thay coupling', 'ngay': 45, 'nguoi1': 44, 'tinhTrang': 43},
    {'name': 'Tiện ren mới', 'ngay': 48, 'nguoi1': 47, 'tinhTrang': 46}
]

def clean_str(val):
    if pd.isna(val) or str(val).strip() in ['nan', 'None', '']:
        return ''
    return str(val).strip()

for idx in range(4, len(df)):
    row = df.iloc[idx]
    
    ca = clean_str(row[1])
    if not ca:
        continue
        
    loaiOng = clean_str(row[2])
    pipe_val = row[3]
    if pd.isna(pipe_val):
        continue
    pipe_num = extract_pipe_num(pipe_val)
    
    for st in stages:
        ngay = parse_date(row[st['ngay']])
        if not ngay:
            continue
            
        if ngay >= '2026-06-01' and ngay <= '2026-06-31':
            tinhTrangRaw = clean_str(row[st.get('tinhTrang', -1)]) if 'tinhTrang' in st else 'OK'
            tinhTrang = map_error(tinhTrangRaw)
                
            maBo = ''
            if st['name'] == 'Đầu vào':
                maBo = clean_str(row[st['maBo']])
            elif st['name'] == 'Đóng gói':
                maBoTP = clean_str(row[st['maBoTP']])
                maBoHong = clean_str(row[st['maBoHong']])
                if maBoHong and not maBoTP:
                    maBo = maBoHong
                    tinhTrang = 'Hỏng'
                elif maBoTP:
                    maBo = maBoTP
                    tinhTrang = 'Đạt'
                    
            khoang = clean_str(row[st['khoang']]) if 'khoang' in st else ''
            apSuat = clean_str(row[st['apSuat']]) if 'apSuat' in st else ''
            nguoi1 = clean_str(row[st['nguoi1']]) if 'nguoi1' in st else ''
            nguoi2 = clean_str(row[st['nguoi2']]) if 'nguoi2' in st else ''
            
            record = {
                'ngay': ngay,
                'ca': ca,
                'nguyenCong': st['name'],
                'loaiOng': loaiOng,
                'tinhTrang': tinhTrang,
                'maBo': maBo,
                'khoang': khoang,
                'apSuat': apSuat,
                'nguoi1': nguoi1,
                'nguoi2': nguoi2,
                'pipe_num': pipe_num
            }
            records.append(record)

groups = {}
for r in records:
    key = (r['ngay'], r['ca'], r['nguyenCong'], r['loaiOng'], r['tinhTrang'], r['maBo'], r['khoang'], r['apSuat'], r['nguoi1'], r['nguoi2'])
    if key not in groups:
        groups[key] = []
    groups[key].append(r['pipe_num'])

def format_pipes(pipes):
    try:
        nums = sorted([int(p) for p in pipes])
    except:
        return ", ".join([str(p) for p in pipes])
        
    ranges = []
    start = nums[0]
    prev = nums[0]
    
    for n in nums[1:]:
        if n == prev + 1:
            prev = n
        else:
            if start == prev:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{prev}")
            start = n
            prev = n
    if start == prev:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{prev}")
    return ", ".join(ranges)

final_data = []
import time
timestamp = int(time.time() * 1000)

for k, pipes in groups.items():
    timestamp += 1
    ngay, ca, nc, loai, tt, mb, kh, aps, n1, n2 = k
    final_data.append({
        'id': timestamp,
        'ngay': ngay,
        'ca': ca,
        'nguyenCong': nc,
        'soOngText': format_pipes(pipes),
        'soOngCount': len(pipes),
        'loaiXl': 'XNKT',
        'loaiOng': 'Ø' + loai if not str(loai).startswith('Ø') else loai,
        'maBo': mb,
        'khoang': kh,
        'apSuat': aps,
        'nguoi1': n1,
        'nguoi2': n2,
        'tinhTrang': tt,
        'ghiChu': 'Imported from Excel Update (Toàn bộ Tháng 6)'
    })

with open('imported_june_full.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(final_data)} grouped records from NEW NKT Update 1506.xlsx.")
