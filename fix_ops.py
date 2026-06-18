import codecs

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_dau_vao.html', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("const initialOp = window.DEFAULT_WORKER_OP || 'rua-ong';", "const initialOp = 'dau-vao';")

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_dau_vao.html', 'w', 'utf-8') as f:
    f.write(content)

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_rua_ong.html', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("const initialOp = window.DEFAULT_WORKER_OP || 'rua-ong';", "const initialOp = 'rua-ong';")

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_rua_ong.html', 'w', 'utf-8') as f:
    f.write(content)

print('Fixed operations')
