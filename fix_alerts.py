import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    code = f.read()

# Fix literal newlines in single-quoted strings
bad_alert_1 = """                alert('Hệ thống đã tự động nhập 162 bản ghi từ ngày 01/06 đến 12/06 vào phần \nmềm thành công!');"""
good_alert_1 = """                alert('Hệ thống đã tự động nhập 162 bản ghi từ ngày 01/06 đến 12/06 vào phần mềm thành công!');"""

bad_alert_2 = """                alert('Hệ thống đã tự động bổ sung thêm 22 bản ghi báo cáo từ ngày 13/06 đến \ncuối tháng 6 theo bảng mã lỗi mới!');"""
good_alert_2 = """                alert('Hệ thống đã tự động bổ sung thêm 22 bản ghi báo cáo từ ngày 13/06 đến cuối tháng 6 theo bảng mã lỗi mới!');"""

if bad_alert_1 in code:
    code = code.replace(bad_alert_1, good_alert_1)
    print("Fixed alert 1")
    
if bad_alert_2 in code:
    code = code.replace(bad_alert_2, good_alert_2)
    print("Fixed alert 2")

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(code)

print("Done")
