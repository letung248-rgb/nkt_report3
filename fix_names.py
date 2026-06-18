import os
import glob

# Find all html files
html_files = glob.glob('*.html')
for f in html_files:
    if 'B' in f and 'XCO' in f:
        if 'a' not in f and 'o' not in f and 'XCO' in f:
            # We can't easily rely on the exact mangled name string matching due to decoding.
            pass

# Let's just find the mangled names using python's listdir
for f in os.listdir('.'):
    if f.endswith('.html'):
        if f.startswith('B') and 'R' in f and 'XCO' in f:
            os.rename(f, 'Báo cáo_Rửa ống_XCO.html')
        elif f.startswith('B') and 'D' in f and 'XCO' in f:
            os.rename(f, 'Báo cáo_Đầu vào_XCO.html')

print("Renamed files successfully")
