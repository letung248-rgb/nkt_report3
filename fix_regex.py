import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    code = f.read()

bad1 = '''(r.ghiChu || '').replace(/
/g, ' ')'''
good1 = r"(r.ghiChu || '').replace(/\n/g, ' ')"

if bad1 in code:
    print('Found bad1')
    code = code.replace(bad1, good1)
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(code)
else:
    print("Not found")
