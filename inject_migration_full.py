import json
import codecs

with open('imported_june_full.json', 'r', encoding='utf-8') as f:
    data = f.read()

migration_script = f"""
// --- FULL JUNE MIGRATION SCRIPT ---
document.addEventListener('DOMContentLoaded', () => {{
    setTimeout(() => {{
        if (!localStorage.getItem('imported_june_done_v5')) {{
            try {{
                const importedData = {data};
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                // Remove ALL previously imported June data AND any manual June data to avoid duplicates
                history = history.filter(r => {{
                    if (!r.ngay) return true;
                    // If it's a June date, we REMOVE IT (it will be replaced by the full importedData)
                    if (r.ngay >= '2026-06-01' && r.ngay <= '2026-06-31') return false;
                    return true;
                }});
                
                // Add the new full importedData
                history = [...importedData, ...history];
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v5', 'true');
                alert('Đã cập nhật LẠI toàn bộ dữ liệu tháng 6 từ file NKT Update 1506 mới nhất!');
                window.location.reload();
            }} catch(e) {{
                console.error('Lỗi khi import:', e);
            }}
        }}
    }}, 2000);
}});
"""

with codecs.open('app.js', 'a', 'utf-8') as f:
    f.write(migration_script)
