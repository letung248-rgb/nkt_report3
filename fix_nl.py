import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad = "(r.ghiChu || '').replace(/\n/g, ' ')"
good = "(r.ghiChu || '').replace(/\\n/g, ' ')"

content = content.replace(bad, good)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
