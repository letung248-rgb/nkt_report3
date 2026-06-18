import sys
import re
import codecs

# 1. Update worker.js
with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/worker.js', 'r', 'utf-8') as f:
    worker_js = f.read()

new_parse_pipes = """function parsePipesArray(input) {
    if (!input) return ["1"];
    let text = input.toString().trim();
    const parts = text.split(/[,;]/);
    let result = [];
    for (let p of parts) {
        let pt = p.trim();
        if (!pt) continue;
        if (pt.includes('-')) {
            const range = pt.split('-');
            if (range.length === 2) {
                const startStr = range[0].trim();
                const endStr = range[1].trim();
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                if (!isNaN(start) && !isNaN(end) && start <= end && startStr.match(/^\d+$/) && endStr.match(/^\d+$/)) {
                    for(let i = start; i <= end; i++) {
                        result.push(i.toString());
                    }
                } else {
                    result.push(pt);
                }
            } else result.push(pt);
        } else {
            result.push(pt);
        }
    }
    return result.length > 0 ? result : ["1"];
}"""

old_parse_pipes_regex = r'function parsePipesCount\(input\).*?return count \|\| 1;\n\}'
worker_js = re.sub(old_parse_pipes_regex, lambda m: new_parse_pipes, worker_js, flags=re.DOTALL)

old_submit = r'const soOngText = document\.getElementById\(\'w-so-ong\'\)\.value;.*?const reportData = \{.*?timestamp: new Date\(\)\.toISOString\(\)\n\s*\}\n\s*\};'

new_submit = """const soOngText = document.getElementById('w-so-ong').value;
        const pipesArray = parsePipesArray(soOngText);

        let tinhTrangValue = document.getElementById('w-tinh-trang').value;
        let maBoValue = document.getElementById('w-ma-bo') ? document.getElementById('w-ma-bo').value : '';

        if (currentWorkerOp === 'dong-goi') {
            tinhTrangValue = document.querySelector('input[name="w-dong-goi-tinh-trang"]:checked').value;
        }

        const timestamp = Date.now();
        const ngay = document.getElementById('w-ngay').value;
        const ca = document.getElementById('w-ca').value;
        const nguyenCong = opTitles[currentWorkerOp];
        const loaiXl = document.getElementById('w-loai-xl').value;
        const soLanRua = document.getElementById('w-so-lan-rua').value;
        const dongHoNuoc = document.getElementById('w-dong-ho').value;
        const loaiOng = document.getElementById('w-loai-ong').value;
        const khoang = document.getElementById('w-khoang').value;
        const apSuat = document.getElementById('w-ap-suat').value;
        const nguoi1 = document.getElementById('w-nguoi-1').value;
        const nguoi2 = document.getElementById('w-nguoi-2').value;
        const ghiChu = document.getElementById('w-ghi-chu').value;
        const timeIso = new Date().toISOString();

        const reports = pipesArray.map((pipeName, index) => {
            return {
                id: timestamp + index,
                ngay: ngay,
                ca: ca,
                nguyenCong: nguyenCong,
                soOngText: pipeName,
                soOngCount: 1,
                loaiXl: loaiXl,
                soLanRua: soLanRua,
                dongHoNuoc: dongHoNuoc,
                loaiOng: loaiOng,
                maBo: maBoValue,
                khoang: khoang,
                apSuat: apSuat,
                nguoi1: nguoi1,
                nguoi2: nguoi2,
                tinhTrang: tinhTrangValue,
                ghiChu: pipesArray.length > 1 ? (ghiChu ? ghiChu + ` (Lô gốc: ${soOngText})` : `Lô gốc: ${soOngText}`) : ghiChu,
                timestamp: timeIso
            };
        });

        const reportData = {
            action: 'add_reports',
            reports: reports
        };"""

worker_js = re.sub(old_submit, lambda m: new_submit, worker_js, flags=re.DOTALL)

# Tạm thời lưu localStorage last_ca bằng item đầu tiên
worker_js = worker_js.replace('reportData.report.ca', 'reportData.reports[0].ca')
worker_js = worker_js.replace('reportData.report.nguoi1', 'reportData.reports[0].nguoi1')

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/worker.js', 'w', 'utf-8') as f:
    f.write(worker_js)


# 2. Update app.js
with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# Make sure parsePipesArray is in app.js
if "function parsePipesArray" not in app_js:
    app_js = new_parse_pipes + "\n\n" + app_js

# In app.js submitReport
old_app_submit = """        const report = {
            id: editingId ? editingId : Date.now(),
            ngay: document.getElementById('f-ngay').value,
            ca: document.getElementById('f-ca').value,
            nguyenCong: currentOperation,
            soOngText: soOng,
            soOngCount: lastCalculatedCount || 1,
            loaiXl: document.getElementById('f-loai-xl').value,
            soLanRua: (currentOperation.includes('Rửa ống') && document.getElementById('f-so-lan-rua')) ? document.getElementById('f-so-lan-rua').value : '',
            dongHoNuoc: (currentOperation.includes('Rửa ống') && document.getElementById('f-dong-ho-nuoc')) ? document.getElementById('f-dong-ho-nuoc').value : '',
            loaiOng: document.getElementById('f-loai-ong').value,
            maBo: maBoValue,
            khoang: document.getElementById('f-khoang') ? document.getElementById('f-khoang').value : '',
            apSuat: document.getElementById('f-ap-suat') ? document.getElementById('f-ap-suat').value : '',
            nguoi1: nguoi1,
            nguoi2: document.getElementById('f-nguoi-2').value,
            tinhTrang: tinhTrangValue,
            ghiChu: document.getElementById('f-ghi-chu') ? document.getElementById('f-ghi-chu').value : ''
        };
        
        try {
            localStorage.setItem('nkt_last_ngay', document.getElementById('f-ngay').value);
            localStorage.setItem('nkt_last_loai_ong', document.getElementById('f-loai-ong').value);
        } catch(e) {}

        if (editingId) {
            const index = historyData.findIndex(r => r.id === editingId);
            if (index !== -1) historyData[index] = report;
            
            // Push update to Google Sheets
            const syncUrl = localStorage.getItem('nkt_sync_url');
            if (syncUrl) {
                fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'edit_report', report: report })
                }).catch(e => console.error("Lỗi cập nhật Cloud:", e));
            }
        } else {
            historyData.unshift(report);
            
            // Push new report to Google Sheets
            const syncUrl = localStorage.getItem('nkt_sync_url');
            if (syncUrl) {
                fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add_report', report: report })
                }).catch(e => console.error("Lỗi thêm mới lên Cloud:", e));
            }
        }"""

new_app_submit = """        const pipesArray = parsePipesArray(soOng);
        const timestamp = Date.now();
        
        const ngay = document.getElementById('f-ngay').value;
        const ca = document.getElementById('f-ca').value;
        const nguyenCong = currentOperation;
        const loaiXl = document.getElementById('f-loai-xl').value;
        const soLanRua = (currentOperation.includes('Rửa ống') && document.getElementById('f-so-lan-rua')) ? document.getElementById('f-so-lan-rua').value : '';
        const dongHoNuoc = (currentOperation.includes('Rửa ống') && document.getElementById('f-dong-ho-nuoc')) ? document.getElementById('f-dong-ho-nuoc').value : '';
        const loaiOng = document.getElementById('f-loai-ong').value;
        const khoang = document.getElementById('f-khoang') ? document.getElementById('f-khoang').value : '';
        const apSuat = document.getElementById('f-ap-suat') ? document.getElementById('f-ap-suat').value : '';
        const nguoi2 = document.getElementById('f-nguoi-2').value;
        const ghiChu = document.getElementById('f-ghi-chu') ? document.getElementById('f-ghi-chu').value : '';
        
        const reports = pipesArray.map((pipeName, index) => {
            return {
                id: editingId ? editingId : timestamp + index,
                ngay: ngay,
                ca: ca,
                nguyenCong: nguyenCong,
                soOngText: pipeName,
                soOngCount: 1,
                loaiXl: loaiXl,
                soLanRua: soLanRua,
                dongHoNuoc: dongHoNuoc,
                loaiOng: loaiOng,
                maBo: maBoValue,
                khoang: khoang,
                apSuat: apSuat,
                nguoi1: nguoi1,
                nguoi2: nguoi2,
                tinhTrang: tinhTrangValue,
                ghiChu: (!editingId && pipesArray.length > 1) ? (ghiChu ? ghiChu + ` (Lô gốc: ${soOng})` : `Lô gốc: ${soOng}`) : ghiChu
            };
        });

        try {
            localStorage.setItem('nkt_last_ngay', document.getElementById('f-ngay').value);
            localStorage.setItem('nkt_last_loai_ong', document.getElementById('f-loai-ong').value);
        } catch(e) {}

        const syncUrl = localStorage.getItem('nkt_sync_url');

        if (editingId) {
            const report = reports[0]; // If editing, it's just 1 row
            const index = historyData.findIndex(r => r.id === editingId);
            if (index !== -1) historyData[index] = report;
            
            if (syncUrl) {
                fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'edit_report', report: report })
                }).catch(e => console.error("Lỗi cập nhật Cloud:", e));
            }
        } else {
            // New items: Unshift them all (reverse order to keep chronological)
            for (let i = reports.length - 1; i >= 0; i--) {
                historyData.unshift(reports[i]);
            }
            
            if (syncUrl) {
                fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add_reports', reports: reports })
                }).catch(e => console.error("Lỗi thêm mới lên Cloud:", e));
            }
        }"""

app_js = app_js.replace(old_app_submit, new_app_submit)

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/app.js', 'w', 'utf-8') as f:
    f.write(app_js)


# 3. Create standalone HTML
with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/styles.css', 'r', 'utf-8') as f:
    styles_css = f.read()

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/worker.html', 'r', 'utf-8') as f:
    worker_html = f.read()

# Replace links with inline code
worker_html = worker_html.replace('<link rel="stylesheet" href="styles.css">', f'<style>{styles_css}</style>')
worker_html = re.sub(r'<script src="worker\.js(\?v=\d+)?"></script>', lambda m: f'<script>\n{worker_js}\n</script>', worker_html)

dau_vao_html = worker_html.replace(
    '</style>',
    '  .op-selector-wrapper { display: none !important; }\n  </style>'
).replace(
    f'<script>{worker_js}</script>',
    f'<script>\n  window.DEFAULT_WORKER_OP = \'dau-vao\';\n</script>\n<script>{worker_js}</script>'
).replace(
    '<title>Nhập Báo Cáo Ống NKT</title>',
    '<title>Nhập Báo Cáo - Đầu Vào</title>'
).replace(
    '<h1>Nhập Báo Cáo Ngày</h1>',
    '<h1>Báo Cáo - Đầu Vào</h1>'
)

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_dau_vao.html', 'w', 'utf-8') as f:
    f.write(dau_vao_html)

rua_ong_html = worker_html.replace(
    '</style>',
    '  .op-selector-wrapper { display: none !important; }\n  </style>'
).replace(
    f'<script>{worker_js}</script>',
    f'<script>\n  window.DEFAULT_WORKER_OP = \'rua-ong\';\n</script>\n<script>{worker_js}</script>'
).replace(
    '<title>Nhập Báo Cáo Ống NKT</title>',
    '<title>Nhập Báo Cáo - Rửa Ống</title>'
).replace(
    '<h1>Nhập Báo Cáo Ngày</h1>',
    '<h1>Báo Cáo - Rửa Ống</h1>'
)

with codecs.open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/bc_rua_ong.html', 'w', 'utf-8') as f:
    f.write(rua_ong_html)

print("All bundled successfully!")
