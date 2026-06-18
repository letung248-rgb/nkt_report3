
async function downloadExcel() {
    if (historyData.length === 0) {
        alert('KhA
g cA3 d_ liu  xut Excel!');
        return;
    }
    
    const type = document.getElementById('export-type').value;
    let dataToExport = historyData;
    let filenameSuffix = 'All';
    
    if (type === 'month') {
        const m = document.getElementById('export-month').value;
        if(!m) return alert('Vui lA
g ch?n thA
g');
        dataToExport = historyData.filter(r => r.ngay && r.ngay.startsWith(m));
        filenameSuffix = m;
    } else if (type === 'date') {
        const d = document.getElementById('export-date').value;
        if(!d) return alert('Vui lA
g ch?n ngAy');
        dataToExport = historyData.filter(r => r.ngay === d);
        filenameSuffix = d;
    }
    
    if (dataToExport.length === 0) {
        alert('KhA
g cA3 d_ liu trong th?i gian A ch?n!');
        return;
    }
    
    try {
        const wb = new ExcelJS.Workbook();
        
        // Use Template if available
        if (typeof EXCEL_TEMPLATE_B64 !== 'undefined') {
            const res = await fetch('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + EXCEL_TEMPLATE_B64);
            const ab = await res.arrayBuffer();
            await wb.xlsx.load(ab);
        } else {
            wb.addWorksheet('Tng quan');
            wb.addWorksheet('BC thA
g');
            wb.addWorksheet('BC ngAy');
        }

        // Add Raw Data Sheet
        const wsData = wb.addWorksheet('D_ liu Chi tit');
        
        const headers = ['STT', 'NgAy', 'Ca', 'NguyA
 cA
g', 'S lng 
g', 'S 
g chi tit', 'Loi x- lA', 'Loi 
g', 'MA bA3', 'T ging', 'T giA
', 'S BBGN', 'Khoang', 'A?p sut', 'Ng?i TH 1', 'Ng?i TH 2', 'TA
h trng', 'Ghi chA'];
        wsData.addRow(headers);
        wsData.getRow(1).font = { bold: true };
        wsData.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        
        let rowIndex = 2;
        dataToExport.forEach((r) => {
            const text = r.soOngText ? r.soOngText.toString().trim() : '';
            let pipes = parsePipesText(text);
            const nguyenCongFull = r.nguyenCong + (r.soLanRua ? ' (S lt r-a: ' + r.soLanRua + ')' : '') + (r.dongHoNuoc ? ' [?
g h: ' + r.dongHoNuoc + ']' : '');
            
            if (pipes.length === 0) {
                const resolvedMaBo = getMaBoForRecord(r);
                wsData.addRow([
                    rowIndex - 1, formatDate(r.ngay), r.ca, nguyenCongFull, r.soOngCount, r.soOngText,
                    r.loaiXl, r.loaiOng, resolvedMaBo, '', '', '',
                    r.khoang, r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\n/g, ' ')
                ]);
                rowIndex++;
            } else {
                for (let pipe of pipes) {
                    const displayMaBo = r.maBo || findMaBoForPipe(pipe);
                    wsData.addRow([
                        rowIndex - 1, formatDate(r.ngay), r.ca, nguyenCongFull, 1, pipe,
                        r.loaiXl, r.loaiOng, displayMaBo, '', '', '',
                        r.khoang, r.apSuat || '', r.nguoi1, r.nguoi2, r.tinhTrang, (r.ghiChu || '').replace(/\n/g, ' ')
                    ]);
                    rowIndex++;
                }
            }
        });

        wsData.columns.forEach(column => { column.width = 15; });
        wsData.autoFilter = { from: 'A1', to: { row: 1, column: headers.length } };

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'NKT_Report_' + filenameSuffix + '.xlsx');
        closeModal('modal-export');
    } catch(e) {
        console.error(e);
        alert('L_i khi xut Excel: ' + e.message);
    }
}

