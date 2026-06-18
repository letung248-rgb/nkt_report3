with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()[840:870]
with open('temp_out_2.txt', 'w', encoding='utf-8') as f:
    f.write(''.join(lines))
