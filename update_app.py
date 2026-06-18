import sys

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Restore mistakenly deleted lines in editReport
if "document.getElementById('btn-submit').textContent = '💾 Cập nhật báo cáo';" in content and "fTinhTrang.value = report.tinhTrang;" not in content:
    restore_str = """                opt.value = report.tinhTrang;
                opt.textContent = report.tinhTrang;
                fTinhTrang.appendChild(opt);
            }
            fTinhTrang.value = report.tinhTrang;
        }
    }
    
    if(document.getElementById('f-khoang')) document.getElementById('f-khoang').value = report.khoang;
    if(document.getElementById('f-ap-suat')) document.getElementById('f-ap-suat').value = report.apSuat || '';
    if(document.getElementById('f-dong-ho-nuoc')) document.getElementById('f-dong-ho-nuoc').value = report.dongHoNuoc || '';
    document.getElementById('f-nguoi-1').value = report.nguoi1;
    document.getElementById('f-nguoi-2').value = report.nguoi2;
    
    if(document.getElementById('f-ghi-chu')) document.getElementById('f-ghi-chu').value = report.ghiChu;
    
    document.getElementById('btn-submit').textContent = '💾 Cập nhật báo cáo';"""
    
    content = content.replace("    document.getElementById('btn-submit').textContent = '💾 Cập nhật báo cáo';", restore_str)

# 2. Rewrite deleteReport
delete_report_old = """function deleteReport(id) {
    if (confirm('Bạn có chắc muốn xóa báo cáo này?')) {
        historyData = historyData.filter(r => r.id !== id);
        localStorage.setItem('nkt_history', JSON.stringify(historyData));
        renderHistory();
        updateDashboard();
        const badge = document.getElementById('report-badge');
        if (badge) {
            badge.textContent = historyData.length;
            if(historyData.length === 0) badge.style.display = 'none';
        }
    }
}"""

delete_report_new = """async function deleteReport(id) {
    if (confirm('Bạn có chắc muốn xóa báo cáo này?')) {
        const syncUrl = localStorage.getItem('nkt_sync_url');
        if (syncUrl) {
            try {
                await fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete_report', id: id })
                });
            } catch (e) {
                console.error("Lỗi xóa trên Cloud:", e);
            }
        }
        
        historyData = historyData.filter(r => r.id !== id);
        localStorage.setItem('nkt_history', JSON.stringify(historyData));
        renderHistory();
        updateDashboard();
        const badge = document.getElementById('report-badge');
        if (badge) {
            badge.textContent = historyData.length;
            if(historyData.length === 0) badge.style.display = 'none';
        }
    }
}"""

if delete_report_old in content:
    content = content.replace(delete_report_old, delete_report_new)

# 3. Rewrite submitReport logic to push update to cloud
submit_insert_old = """        if (editingId) {
            const index = historyData.findIndex(r => r.id === editingId);
            if (index !== -1) historyData[index] = report;
        } else {
            historyData.unshift(report);
        }
        
        localStorage.setItem('nkt_history', JSON.stringify(historyData));"""

submit_insert_new = """        if (editingId) {
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
        }
        
        localStorage.setItem('nkt_history', JSON.stringify(historyData));"""

if submit_insert_old in content:
    content = content.replace(submit_insert_old, submit_insert_new)

with open('c:/Users/Baudi/OneDrive/TUNGLV/NKT Report/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
