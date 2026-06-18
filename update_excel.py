import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the headers array regex
# The array starts with const headers = ["STT", ... and ends with "Ghi ch繳"];
headers_pattern = re.compile(r'const headers = \[.*?\];', re.DOTALL)
new_headers = 'const headers = ["ID", "Ngày", "Ca", "Nguyên công", "Số lượng ống", "Số ống chi tiết", "Loại xử lý", "Loại ống", "Mã bộ", "Số lần rửa", "Khoang chứa ống", "Từ giếng", "Từ giàn", "Hồ sơ giếng", "Áp suất", "Người TH 1", "Người TH 2", "Tình trạng", "Ghi chú"];'

# Replace headers
content = headers_pattern.sub(new_headers, content)

# 2. Extract and replace the mapping logic inside dataToExport.forEach
# We need to find the `nguyenCongFull` line and the two `wsData.addRow` sections.
# Current logic:
# const nguyenCongFull = r.nguyenCong + (r.soLanRua ? ' (R廙苔: ' + r.soLanRua + ')' : '') + (r.dongHoNuoc ? ' [H: ' + r.dongHoNuoc + ']' : '');
#             
# if (pipes.length === 0) { ... } else { ... }

# We will replace the entire block from `const nguyenCongFull` to the end of the `if/else` block.
block_pattern = re.compile(r'const nguyenCongFull = r\.nguyenCong \+.*?rowIndex\+\+;\s*\}\s*\}\s*\n', re.DOTALL)

new_block = '''const nguyenCongFull = r.nguyenCong + (r.dongHoNuoc ? ' [ĐH: ' + r.dongHoNuoc + ']' : '');
            
            let isRua = r.nguyenCong && r.nguyenCong.toLowerCase().includes('rửa');
            let soLanRuaStr = isRua ? (r.soLanRua || 0) : "-";
            let idStr = "VSP" + String(rowIndex - 1).padStart(5, '0');

            if (pipes.length === 0) {
                const resolvedMaBo = getMaBoForRecord(r);
                let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGieng : '';
                let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGian : '';
                let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].soBBGN : '';

                wsData.addRow([
                    idStr, formatDate(r.ngay), r.ca, nguyenCongFull, r.soOngCount, r.soOngText,
                    r.loaiXl, r.loaiOng, resolvedMaBo, soLanRuaStr, r.khoang, tuGieng, tuGian, hoSoGieng,
                    r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\\n/g, ' ')
                ]);
                rowIndex++;
            } else {
                for (let pipe of pipes) {
                    const displayMaBo = r.maBo || findMaBoForPipe(pipe);
                    let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGieng : '';
                    let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGian : '';
                    let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].soBBGN : '';

                    wsData.addRow([
                        idStr, formatDate(r.ngay), r.ca, nguyenCongFull, 1, pipe,
                        r.loaiXl, r.loaiOng, displayMaBo, soLanRuaStr, r.khoang, tuGieng, tuGian, hoSoGieng,
                        r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\\n/g, ' ')
                    ]);
                    rowIndex++;
                }
            }
'''

content = block_pattern.sub(new_block, content)

# 3. Modify column widths
# Original: wsData.columns.forEach(column => { column.width = 15; });
width_pattern = re.compile(r'wsData\.columns\.forEach\(column => \{ column\.width = 15; \}\);')
new_width = '''wsData.columns.forEach((column, idx) => { 
            if (idx === 0) column.width = 12;
            else column.width = 15; 
        });'''
content = width_pattern.sub(new_width, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
