import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

headers_pattern = re.compile(r'const headers = \[.*?\];', re.DOTALL)
# Put "Số lần rửa" at J (index 9) so that "Khoang chứa ống" is at K (index 10)
new_headers = 'const headers = ["ID", "Ngày", "Ca", "Nguyên công", "Số lượng ống", "Số ống chi tiết", "Loại xử lý", "Loại ống", "Mã bộ", "Số lần rửa", "Khoang chứa ống", "Từ giếng", "Từ giàn", "Số BBGN", "Hồ sơ giếng", "Áp suất", "Người TH 1", "Người TH 2", "Tình trạng", "Ghi chú"];'
content = headers_pattern.sub(new_headers, content)

block_pattern = re.compile(r'const nguyenCongFull = r\.nguyenCong \+.*?rowIndex\+\+;\s*\}\s*\}\s*\n', re.DOTALL)

new_block = r'''const nguyenCongFull = r.nguyenCong + (r.dongHoNuoc ? ' [ĐH: ' + r.dongHoNuoc + ']' : '');
            
            let isRua = r.nguyenCong && r.nguyenCong.toLowerCase().includes('rửa');
            let soLanRuaStr = isRua ? (r.soLanRua || 0) : "-";
            let idStr = "VSP" + String(rowIndex - 1).padStart(5, '0');

            if (pipes.length === 0) {
                const resolvedMaBo = getMaBoForRecord(r);
                let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGieng : '';
                let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGian : '';
                let soBBGN = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].soBBGN : '';
                let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].hoSoGieng : '';

                wsData.addRow([
                    idStr, formatDate(r.ngay), r.ca, nguyenCongFull, r.soOngCount, r.soOngText,
                    r.loaiXl, r.loaiOng, resolvedMaBo, soLanRuaStr, r.khoang, tuGieng, tuGian, soBBGN, hoSoGieng,
                    r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\n/g, ' ')
                ]);
                rowIndex++;
            } else {
                for (let pipe of pipes) {
                    const displayMaBo = r.maBo || findMaBoForPipe(pipe);
                    let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGieng : '';
                    let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGian : '';
                    let soBBGN = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].soBBGN : '';
                    let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].hoSoGieng : '';

                    wsData.addRow([
                        idStr, formatDate(r.ngay), r.ca, nguyenCongFull, 1, pipe,
                        r.loaiXl, r.loaiOng, displayMaBo, soLanRuaStr, r.khoang, tuGieng, tuGian, soBBGN, hoSoGieng,
                        r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\n/g, ' ')
                    ]);
                    rowIndex++;
                }
            }
'''

content = block_pattern.sub(new_block, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
