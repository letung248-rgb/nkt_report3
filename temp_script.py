with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()[800:860]
with open('temp_out.txt', 'w', encoding='utf-8') as f:
    f.write(''.join(lines))
