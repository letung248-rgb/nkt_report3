
import codecs
with codecs.open('app.js', 'r', 'utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '            }\n' == line and len(new_lines)>0 and '    }\n' == new_lines[-1]:
        skip = True
    if 'function applyHistoryFilters()' in line:
        skip = False
    
    if not skip:
        new_lines.append(line)

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.writelines(new_lines)

