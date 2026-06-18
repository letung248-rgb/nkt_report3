import glob
import re

html_files = glob.glob('*.html')

button_code = '''
<!-- Reset URL Button injected by Antigravity -->
<div style="position: fixed; bottom: 10px; right: 10px; z-index: 9999;">
    <button onclick="localStorage.removeItem('nkt_sync_url_v2'); localStorage.removeItem('nkt_sync_url_v3'); localStorage.removeItem('nkt_sync_url_v4'); localStorage.removeItem('nkt_sync_url'); alert('Đã xóa link đồng bộ cũ. Vui lòng tải lại trang và nhập link mới!'); location.reload();" 
            style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-family: sans-serif; font-size: 12px; font-weight: bold;">
        🔄 Đổi Link Đồng Bộ
    </button>
</div>
'''

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "Đổi Link Đồng Bộ" in content:
        continue
        
    # Append the button code right before </body>
    if '</body>' in content:
        content = content.replace('</body>', button_code + '\n</body>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
