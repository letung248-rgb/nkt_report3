import json
import codecs

# Read json
with open('imported_june2.json', 'r', encoding='utf-8') as f:
    data = f.read()

migration_script = f"""
// --- TEMPORARY JUNE MIGRATION PART 2 ---
document.addEventListener('DOMContentLoaded', () => {{
    setTimeout(() => {{
        if (!localStorage.getItem('imported_june_done_v3')) {{
            try {{
                const importedData = {data};
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                // Remove overlapping old manual inputs from June 13 to June 31
                history = history.filter(r => {{
                    if (!r.ngay) return true;
                    if (r.ngay >= '2026-06-13' && r.ngay <= '2026-06-31') return false;
                    return true;
                }});
                
                history = [...importedData, ...history];
                
                // Sort by date descending
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v3', 'true');
                alert('Hệ thống đã tự động bổ sung thêm 22 bản ghi báo cáo từ ngày 13/06 đến cuối tháng 6 theo bảng mã lỗi mới!');
                window.location.reload();
            }} catch(e) {{
                console.error('Lỗi khi import:', e);
            }}
        }}
    }}, 1500);
}});
"""

with codecs.open('app.js', 'a', 'utf-8') as f:
    f.write(migration_script)
