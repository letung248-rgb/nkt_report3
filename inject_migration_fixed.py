import json
import codecs

with open('imported_june_fixed.json', 'r', encoding='utf-8') as f:
    data = f.read()

migration_script = f"""
// --- TEMPORARY JUNE MIGRATION FIX P1 ---
document.addEventListener('DOMContentLoaded', () => {{
    setTimeout(() => {{
        if (!localStorage.getItem('imported_june_done_v4')) {{
            try {{
                const importedData = {data};
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                history = history.filter(r => {{
                    if (!r.ngay) return true;
                    if (r.ngay >= '2026-06-01' && r.ngay <= '2026-06-12' && r.ghiChu && r.ghiChu.includes('Imported')) return false;
                    return true;
                }});
                
                history = [...importedData, ...history];
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v4', 'true');
                alert('Đã cập nhật lại mã lỗi chuẩn cho các bản ghi từ 01/06 - 12/06!');
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
