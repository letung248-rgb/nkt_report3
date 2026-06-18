import codecs
import re

with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

pattern = re.compile(r'function exportExcel\(\) \{.*?function applyHistoryFilters\(\) \{\}', re.DOTALL)

good_code = '''function exportExcel() {
    const modal = document.getElementById('modal-export');
    if(modal) {
        modal.style.display = 'flex';
        const todayStr = new Date().toISOString().slice(0, 10);
        document.getElementById('export-date').value = todayStr;
        document.getElementById('export-month').value = todayStr.slice(0, 7);
        toggleExportInput();
    }
}

function toggleExportInput() {
    const type = document.getElementById('export-type').value;
    document.getElementById('export-month-group').style.display = type === 'month' ? 'block' : 'none';
    document.getElementById('export-date-group').style.display = type === 'date' ? 'block' : 'none';
}

async function downloadExcel() {
    if (historyData.length === 0) {
        alert("Không có dữ liệu để xuất Excel!");
        return;
    }
    
    const type = document.getElementById('export-type').value;
    let dataToExport = historyData;
    let filenameSuffix = "All";
    
    if (type === 'month') {
        const m = document.getElementById('export-month').value;
        if(!m) return alert("Vui lòng chọn tháng");
        dataToExport = historyData.filter(r => r.ngay && r.ngay.startsWith(m));
        filenameSuffix = m;
    } else if (type === 'date') {
        const d = document.getElementById('export-date').value;
        if(!d) return alert("Vui lòng chọn ngày");
        dataToExport = historyData.filter(r => r.ngay === d);
        filenameSuffix = d;
    }
    
    if (dataToExport.length === 0) {
        alert("Không có dữ liệu trong thời gian đã chọn!");
        return;
    }
    
    try {
        const wb = new ExcelJS.Workbook();
        
        if (typeof EXCEL_TEMPLATE_B64 !== 'undefined') {
            const res = await fetch("data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + EXCEL_TEMPLATE_B64);
            const ab = await res.arrayBuffer();
            await wb.xlsx.load(ab);
        } else {
            wb.addWorksheet("Tổng quan");
            wb.addWorksheet("BC tháng");
            wb.addWorksheet("BC ngày");
        }

        const wsData = wb.addWorksheet("Dữ liệu NKT");
        const headers = ["STT", "Ngày", "Ca", "Nguyên công", "Số lượng ống", "Số ống chi tiết", "Loại xử lý", "Loại ống", "Mã bộ", "Từ giếng", "Từ giàn", "Số BBGN", "Khoang", "Áp suất", "Người TH 1", "Người TH 2", "Tình trạng", "Ghi chú"];
        wsData.addRow(headers);
        
        const headerRow = wsData.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        let rowIndex = 2;
        dataToExport.forEach((r) => {
            const text = r.soOngText ? r.soOngText.toString().trim() : '';
            let pipes = parsePipesText(text);
            const nguyenCongFull = r.nguyenCong + (r.soLanRua ? ' (Rửa: ' + r.soLanRua + ')' : '') + (r.dongHoNuoc ? ' [ĐH: ' + r.dongHoNuoc + ']' : '');
            
            if (pipes.length === 0) {
                const resolvedMaBo = getMaBoForRecord(r);
                wsData.addRow([
                    rowIndex - 1, formatDate(r.ngay), r.ca, nguyenCongFull, r.soOngCount, r.soOngText,
                    r.loaiXl, r.loaiOng, resolvedMaBo, '', '', '',
                    r.khoang, r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\\n/g, ' ')
                ]);
                rowIndex++;
            } else {
                for (let pipe of pipes) {
                    const displayMaBo = r.maBo || findMaBoForPipe(pipe);
                    wsData.addRow([
                        rowIndex - 1, formatDate(r.ngay), r.ca, nguyenCongFull, 1, pipe,
                        r.loaiXl, r.loaiOng, displayMaBo, '', '', '',
                        r.khoang, r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\\n/g, ' ')
                    ]);
                    rowIndex++;
                }
            }
        });

        wsData.columns.forEach(column => { column.width = 15; });
        wsData.autoFilter = { from: 'A1', to: { row: 1, column: headers.length } };

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `NKT_Report_${filenameSuffix}.xlsx`);
        closeModal('modal-export');
    } catch (e) {
        console.error(e);
        alert("Lỗi xuất Excel: " + e.message);
    }
}

function applyHistoryFilters() {}'''

new_content = pattern.sub(good_code, content)

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(new_content)
