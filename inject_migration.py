import json
import codecs

# Read json
with open('imported_june.json', 'r', encoding='utf-8') as f:
    data = f.read()

migration_script = f"""
// --- TEMPORARY JUNE MIGRATION ---
document.addEventListener('DOMContentLoaded', () => {{
    setTimeout(() => {{
        if (!localStorage.getItem('imported_june_done_v2')) {{
            try {{
                const importedData = {data};
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                // Remove overlapping old manual inputs from June 1 to June 12
                history = history.filter(r => {{
                    if (!r.ngay) return true;
                    if (r.ngay >= '2026-06-01' && r.ngay <= '2026-06-12') return false;
                    return true;
                }});
                
                history = [...importedData, ...history];
                
                // Sort by date descending
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v2', 'true');
                alert('Hệ thống đã tự động nhập 162 bản ghi từ ngày 01/06 đến 12/06 vào phần mềm thành công!');
                window.location.reload();
            }} catch(e) {{
                console.error('Lỗi khi import:', e);
            }}
        }}
    }}, 1000);
}});
"""

with codecs.open('app.js', 'a', 'utf-8') as f:
    f.write(migration_script)
