import sys

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/worker.html', 'r', encoding='utf-8') as f:
    worker_html = f.read()

# For BC Đầu vào
dau_vao_html = worker_html.replace(
    '</style>',
    '  .op-selector-wrapper { display: none !important; }\n  </style>'
).replace(
    '<script src="worker.js?v=2"></script>',
    '<script>\n  window.DEFAULT_WORKER_OP = \'dau-vao\';\n</script>\n<script src="worker.js?v=3"></script>'
).replace(
    '<title>Nhập Báo Cáo Ống NKT</title>',
    '<title>Nhập Báo Cáo - Đầu Vào</title>'
).replace(
    '<h1>Nhập Báo Cáo Ngày</h1>',
    '<h1>Báo Cáo - Đầu Vào</h1>'
)

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_dau_vao.html', 'w', encoding='utf-8') as f:
    f.write(dau_vao_html)

# For BC Rửa ống
rua_ong_html = worker_html.replace(
    '</style>',
    '  .op-selector-wrapper { display: none !important; }\n  </style>'
).replace(
    '<script src="worker.js?v=2"></script>',
    '<script>\n  window.DEFAULT_WORKER_OP = \'rua-ong\';\n</script>\n<script src="worker.js?v=3"></script>'
).replace(
    '<title>Nhập Báo Cáo Ống NKT</title>',
    '<title>Nhập Báo Cáo - Rửa Ống</title>'
).replace(
    '<h1>Nhập Báo Cáo Ngày</h1>',
    '<h1>Báo Cáo - Rửa Ống</h1>'
)

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_rua_ong.html', 'w', encoding='utf-8') as f:
    f.write(rua_ong_html)

print('Done')
