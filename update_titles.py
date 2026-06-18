import os
import re

files_to_update = {
    'Báo cáo_Rửa ống_XCO.html': 'Báo cáo_Rửa ống_XCO',
    'Báo cáo_Đầu vào_XCO.html': 'Báo cáo_Đầu vào_XCO'
}

for filename, title in files_to_update.items():
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the title tag
        content = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', content)
        
        # Also replace the main header inside the app if it exists (e.g. <h1> or .header-title)
        # But maybe they just meant the file name on the OS.
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

print("Updated HTML titles")
