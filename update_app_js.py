import re

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# First add parsePipesArray
if "function parsePipesArray" not in app_js:
    with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/worker.js', 'r', encoding='utf-8') as f:
        worker_js = f.read()
    m = re.search(r'function parsePipesArray\(input\) \{.*?\n\}', worker_js, re.DOTALL)
    if m:
        app_js = m.group(0) + "\n\n" + app_js

# Replace submit block
pattern = r'const report = \{[\s\S]*?localStorage\.setItem\(\'nkt_history\', JSON\.stringify\(historyData\)\);'
replacement = """const pipesArray = parsePipesArray(soOng);
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
            const report = reports[0];
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
        }
        
        localStorage.setItem('nkt_history', JSON.stringify(historyData));"""

app_js = re.sub(pattern, lambda m: replacement, app_js)

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Done updating app.js")
