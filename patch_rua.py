with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

# 1. Update selectOperation
new_select_op = """function selectOperation(op) {
    document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.op-btn[onclick="selectOperation('${op}')"]`);
    if(btn) btn.classList.add('active');
    
    const titleEl = document.getElementById('operation-title');
    if(titleEl && opTitles[op]) {
        titleEl.textContent = opTitles[op];
        currentOperation = opTitles[op];
    }
    
    const fgRua = document.getElementById('fg-so-lan-rua');
    if(fgRua) {
        if(op === 'rua-ong') fgRua.style.display = 'block';
        else fgRua.style.display = 'none';
    }
}"""
app = app.replace("function selectOperation(op) {", "function selectOperation_OLD(op) {")
app = app.replace("function selectOperation_OLD(op) {\n    document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active'));\n    const btn = document.querySelector(`.op-btn[onclick=\"selectOperation('${op}')\"]`);\n    if(btn) btn.classList.add('active');\n    \n    const titleEl = document.getElementById('operation-title');\n    if(titleEl && opTitles[op]) {\n        titleEl.textContent = opTitles[op];\n        currentOperation = opTitles[op];\n    }\n}", new_select_op)

# 2. Update submitReport
app = app.replace("loaiXl: document.getElementById('f-loai-xl').value,", 
                  "loaiXl: document.getElementById('f-loai-xl').value,\n            soLanRua: (currentOperation.includes('Rửa ống') && document.getElementById('f-so-lan-rua')) ? document.getElementById('f-so-lan-rua').value : '',")

# 3. Update renderHistory
app = app.replace("<td>${r.nguyenCong}</td>", 
                  "<td>${r.nguyenCong}${r.soLanRua ? `<br><small style=\"color:gray;font-style:italic\">Lần rửa: ${r.soLanRua}</small>` : ''}</td>")

# 4. Update editReport
app = app.replace("document.getElementById('f-loai-xl').value = report.loaiXl;", 
                  "document.getElementById('f-loai-xl').value = report.loaiXl;\n    if(document.getElementById('f-so-lan-rua') && report.soLanRua) document.getElementById('f-so-lan-rua').value = report.soLanRua;")

# 5. Update exportExcel
app = app.replace("`\"${r.nguyenCong}\"`,", 
                  "`\"${r.nguyenCong}${r.soLanRua ? ' (Rửa lần ' + r.soLanRua + ')' : ''}\"`,")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)
