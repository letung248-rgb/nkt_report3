import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the data mapping logic where tuGieng, tuGian, hoSoGieng are calculated and used
pattern = re.compile(
    r'let tuGieng = .*?wsData\.addRow\(\[\s*idStr, formatDate\(r\.ngay\), r\.ca, nguyenCongFull, r\.soOngCount, r\.soOngText,\s*r\.loaiXl, soLanRuaStr, dongHoNuocStr, r\.loaiOng, resolvedMaBo, r\.khoang,\s*tuGieng, tuGian, hoSoGieng, r\.nguoi1, r\.nguoi2, r\.tinhTrang, "", \(r\.ghiChu \|\| \'\'\)\.replace\(/\\\\n/g, \' \'\'\)\s*\]\);',
    re.DOTALL
)

# Actually, let's just do a simpler search and replace
# We want to replace tuGieng, tuGian, hoSoGieng in the addRow with "", "", ""
content = re.sub(
    r'(wsData\.addRow\(\[\s*idStr, formatDate\(r\.ngay\), r\.ca, nguyenCongFull, r\.soOngCount, r\.soOngText,\s*r\.loaiXl, soLanRuaStr, dongHoNuocStr, r\.loaiOng, resolvedMaBo, r\.khoang,\s*)tuGieng, tuGian, hoSoGieng',
    r'\g<1>"", "", ""',
    content
)

content = re.sub(
    r'(wsData\.addRow\(\[\s*idStr, formatDate\(r\.ngay\), r\.ca, nguyenCongFull, 1, pipe,\s*r\.loaiXl, soLanRuaStr, dongHoNuocStr, r\.loaiOng, displayMaBo, r\.khoang,\s*)tuGieng, tuGian, hoSoGieng',
    r'\g<1>"", "", ""',
    content
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated app.js to use empty columns for Gieng, Gian, HoSoGieng")
