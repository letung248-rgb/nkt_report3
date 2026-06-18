import base64
import re

# 1. Update template.js with the new base64 of TPL report rev2.xlsx
with open('TPL report rev2.xlsx', 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')

with open('template.js', 'w', encoding='utf-8') as f:
    f.write(f'const EXCEL_TEMPLATE_B64 = "{b64_data}";\n')

# 2. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace headers
# It's better to find the block "const headers = [" and replace it up to "];"
headers_pattern = re.compile(r'const headers = \[.*?\];', re.DOTALL)
new_headers = 'const headers = ["ID", "Ngày", "Ca", "Nguyên công", "Số lượng ống", "Số ống chi tiết", "Loại xử lý", "Số lần rửa", "Đồng hồ nước", "Loại ống", "Mã bó", "Khoang", "Từ giếng", "Từ giàn", "Hồ sơ giếng", "Người TH 1", "Người TH 2", "Tình trạng", "Thời gian nhận", "Ghi chú"];'
content = headers_pattern.sub(new_headers, content)

# Replace the data mapping logic
block_pattern = re.compile(r'const nguyenCongFull = r\.nguyenCong.*?rowIndex\+\+;\s*\}\s*\}\s*\n', re.DOTALL)

new_block = '''const nguyenCongFull = r.nguyenCong;
            let isRua = r.nguyenCong && r.nguyenCong.toLowerCase().includes('rửa');
            let soLanRuaStr = isRua ? (r.soLanRua || 0) : "";
            let dongHoNuocStr = isRua ? (r.dongHoNuoc || '') : "";
            let idStr = "VSP" + String(rowIndex - 1).padStart(5, '0');

            if (pipes.length === 0) {
                const resolvedMaBo = getMaBoForRecord(r);
                let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGieng : '';
                let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGian : '';
                let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].soBBGN : '';

                wsData.addRow([
                    idStr, formatDate(r.ngay), r.ca, nguyenCongFull, r.soOngCount, r.soOngText,
                    r.loaiXl, soLanRuaStr, dongHoNuocStr, r.loaiOng, resolvedMaBo, r.khoang,
                    tuGieng, tuGian, hoSoGieng, r.nguoi1, r.nguoi2, r.tinhTrang, "", (r.ghiChu || '').replace(/\\n/g, ' ')
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
                        r.loaiXl, soLanRuaStr, dongHoNuocStr, r.loaiOng, displayMaBo, r.khoang,
                        tuGieng, tuGian, hoSoGieng, r.nguoi1, r.nguoi2, r.tinhTrang, "", (r.ghiChu || '').replace(/\\n/g, ' ')
                    ]);
                    rowIndex++;
                }
            }
'''
content = block_pattern.sub(new_block, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated app.js and template.js")
