with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

# 1. Date format helper
helper = """
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function updateDashboard() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonth = todayStr.slice(0, 7); // YYYY-MM
    
    let monthCount = 0;
    let todayCount = 0;
    let okCount = 0;
    let failCount = 0;
    let repairCount = 0;
    
    const opStats = {};
    const recent = historyData.slice(0, 5); // top 5
    
    historyData.forEach(r => {
        if (r.ngay && r.ngay.startsWith(currentMonth)) monthCount++;
        if (r.ngay === todayStr) todayCount++;
        
        if (r.tinhTrang === 'Đạt') okCount++;
        else if (r.tinhTrang.includes('loại')) failCount++;
        else repairCount++;
        
        if (!opStats[r.nguyenCong]) opStats[r.nguyenCong] = 0;
        opStats[r.nguyenCong] += (r.soOngCount || 1);
    });
    
    const elMonth = document.getElementById('stat-month'); if(elMonth) elMonth.textContent = monthCount;
    const elToday = document.getElementById('stat-today'); if(elToday) elToday.textContent = todayCount;
    const elTotal = document.getElementById('stat-total'); if(elTotal) elTotal.textContent = historyData.length;
    const elOk = document.getElementById('stat-ok'); if(elOk) elOk.textContent = okCount;
    const elFail = document.getElementById('stat-fail'); if(elFail) elFail.textContent = failCount;
    const elRepair = document.getElementById('stat-repair'); if(elRepair) elRepair.textContent = repairCount;
    
    // Update op summary
    const opSumEl = document.getElementById('op-summary');
    if (opSumEl) {
        opSumEl.innerHTML = '';
        Object.keys(opStats).forEach(op => {
            const div = document.createElement('div');
            div.className = 'summary-card';
            div.innerHTML = `<div class="title">${op}</div><div class="val">${opStats[op]} <small>ống</small></div>`;
            opSumEl.appendChild(div);
        });
    }
    
    // Update recent
    const recentEl = document.getElementById('recent-reports');
    if (recentEl) {
        recentEl.innerHTML = '';
        recent.forEach(r => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.innerHTML = `
                <div class="recent-icon">📝</div>
                <div class="recent-details">
                    <div class="recent-title">${r.nguyenCong} - ${r.loaiOng}</div>
                    <div class="recent-meta">${formatDate(r.ngay)} • ${r.nguoi1}</div>
                </div>
                <div class="recent-status status-${r.tinhTrang==='Đạt'?'ok':'fail'}">${r.tinhTrang}</div>
            `;
            recentEl.appendChild(item);
        });
    }
}
"""
if "function updateDashboard()" not in app:
    app += helper

# 2. Add updateDashboard to hooks
app = app.replace("renderHistory();\n        \n        const badge = document.getElementById('report-badge');",
                  "renderHistory();\n        updateDashboard();\n        const badge = document.getElementById('report-badge');")

# Also in DOMContentLoaded
app = app.replace("renderHistory();\n        }\n    } catch (e) {",
                  "renderHistory();\n            updateDashboard();\n        }\n    } catch (e) {")

# 3. Use formatDate in renderHistory
app = app.replace("<td>${r.ngay}</td>", "<td>${formatDate(r.ngay)}</td>")

# 4. Use formatDate in exportExcel
app = app.replace("r.ngay,", "formatDate(r.ngay),")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)
