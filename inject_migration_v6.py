import json

with open('imported_june_full.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

json_str = json.dumps(data, indent=2, ensure_ascii=False)

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find("// --- FULL JUNE MIGRATION SCRIPT ---")

v6_script = f"""// --- FULL JUNE MIGRATION SCRIPT V6 ---
document.addEventListener('DOMContentLoaded', () => {{
    setTimeout(() => {{
        if (!localStorage.getItem('imported_june_done_v6')) {{
            try {{
                // Remove previous corrupted imports
                historyData = historyData.filter(r => !(r.ghiChu && r.ghiChu.includes('Imported from Excel')));
                
                const importedData = {json_str};
                
                // Keep non-imported records
                historyData = [...historyData, ...importedData];
                
                localStorage.setItem('nkt_history', JSON.stringify(historyData));
                localStorage.setItem('imported_june_done_v6', 'true');
                
                if (typeof renderHistory === 'function') renderHistory();
                if (typeof updateDashboard === 'function') updateDashboard();
                console.log("V6 Migration complete");
            }} catch (e) {{
                console.error("Migration error:", e);
            }}
        }}
    }}, 2000);
}});
"""

if idx != -1:
    new_content = content[:idx] + v6_script
else:
    new_content = content + "\n\n" + v6_script

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Injected v6 migration into app.js!")
