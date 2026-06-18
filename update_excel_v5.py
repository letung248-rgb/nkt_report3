import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match the existing block
pattern = re.compile(
    r'if\s*\(typeof EXCEL_TEMPLATE_B64 !== \'undefined\'\).*?let rowIndex = 2;', 
    re.DOTALL
)

replacement = """let wsData;
        if (typeof EXCEL_TEMPLATE_B64 !== 'undefined') {
            const res = await fetch("data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + EXCEL_TEMPLATE_B64);
            const ab = await res.arrayBuffer();
            await wb.xlsx.load(ab);
            wsData = wb.getWorksheet("Data") || wb.getWorksheet(1);
            if (wsData) {
                wsData.spliceRows(2, wsData.rowCount);
            } else {
                wsData = wb.addWorksheet("Data");
            }
        } else {
            wb.addWorksheet("Tổng quan");
            wb.addWorksheet("BC tháng");
            wb.addWorksheet("BC ngày");
            wsData = wb.addWorksheet("Dữ liệu NKT");
        }

        const headers = ["ID", "Ngày", "Ca", "Nguyên công", "Số lượng ống", "Số ống chi tiết", "Loại xử lý", "Số lần rửa", "Đồng hồ nước", "Loại ống", "Mã bó", "Khoang", "Từ giếng", "Từ giàn", "Hồ sơ giếng", "Người TH 1", "Người TH 2", "Tình trạng", "Thời gian nhận", "Ghi chú"];
        wsData.getRow(1).values = headers;
        
        const headerRow = wsData.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        let rowIndex = 2;"""

new_content = pattern.sub(replacement, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated addWorksheet and header logic")
