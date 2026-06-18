import base64
with open('Template Report VSP.xlsx', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
js_content = f'const EXCEL_TEMPLATE_B64 = \"{b64}\";\n'
with open('template.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
