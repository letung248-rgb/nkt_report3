/**
 * KỊCH BẢN ĐỒNG BỘ DỮ LIỆU NKT REPORT
 * Hướng dẫn:
 * 1. Mở một file Google Sheets mới (hoặc file hiện tại, NẾU LÀ FILE HIỆN TẠI HÃY ĐỔI TÊN SHEET "Data" THÀNH "Data_Old" ĐỂ TẠO BẢNG MỚI).
 * 2. Chọn Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa hết code cũ, DÁN toàn bộ đoạn code này vào.
 * 4. Nhấn nút Lưu (biểu tượng đĩa mềm).
 * 5. Chọn Triển khai (Deploy) > Quản lý bản triển khai (Manage deployments) > Chỉnh sửa bản hiện tại (Edit) > Phiên bản mới (New version) > Triển khai.
 */

const SHEET_NAME = "Data";

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    
    // Tạo Tên bảng
    sheet.getRange("A1").setValue("BẢNG DỮ LIỆU BÁO CÁO NKT")
         .setFontSize(16)
         .setFontWeight("bold")
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle")
         .setFontColor("#1e3a8a"); // Màu xanh đậm
         
    // Gộp ô cho tên bảng
    sheet.getRange(1, 1, 1, 20).merge();
    sheet.setRowHeight(1, 40);

    // Header chuẩn theo đúng TPL report rev2
    const headers = [
      "ID", "Ngày", "Ca", "Nguyên công", "Số lượng ống", "Số ống chi tiết", 
      "Loại xử lý", "Số lần rửa", "Đồng hồ nước", "Loại ống", "Mã bó", 
      "Khoang", "Từ giếng", "Từ giàn", "Hồ sơ giếng", "Người TH 1", "Người TH 2", "Tình trạng", "Thời gian nhận", "Ghi chú"
    ];
    
    sheet.appendRow(headers);
    sheet.getRange(2, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#e2e8f0")
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle")
         .setWrap(true);
         
    sheet.setFrozenRows(2);
    
    // Auto resize để giãn cột
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

// Xử lý khi công nhân gửi báo cáo lên (POST request)
function doPost(e) {
  try {
    const sheet = setupSheet();
    let data;
    
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput("Lỗi: Không nhận được dữ liệu hợp lệ.");
    }

    if (data.action === "add_report" && data.report) {
      const r = data.report;
      
      let dateObj = r.ngay ? new Date(r.ngay) : new Date();
      let tsObj = r.timestamp ? new Date(r.timestamp) : new Date();
      let formattedTime = Utilities.formatDate(tsObj, "GMT+7", "HH:mm:ss");

      const rowData = [
        r.id || Math.random().toString(36).substring(2, 8).toUpperCase(),
        dateObj,
        r.ca || "",
        r.nguyenCong || "",
        r.soOngCount || 1,
        r.soOngText || "",
        r.loaiXl || "",
        r.soLanRua || "",
        r.dongHoNuoc || "",
        r.loaiOng || "",
        r.maBo || "",
        r.khoang || "",
        "", // Từ giếng
        "", // Từ giàn
        "", // Hồ sơ giếng
        r.nguoi1 || "",
        r.nguoi2 || "",
        r.tinhTrang || "",
        formattedTime,
        r.ghiChu || ""
      ];
      
      sheet.appendRow(rowData);
      const lastRow = sheet.getLastRow();
      
      sheet.getRange(lastRow, 1, 1, rowData.length)
           .setHorizontalAlignment("center")
           .setVerticalAlignment("middle");
           
      // Ngày (Cột 2)
      sheet.getRange(lastRow, 2).setNumberFormat("dd-MMM-yyyy");
      // Thời gian nhận (Cột 19)
      sheet.getRange(lastRow, 19).setNumberFormat("@"); 

      sheet.autoResizeRows(lastRow, 1);
      sheet.autoResizeColumns(1, rowData.length);
      
      return ContentService.createTextOutput("Thành công").setMimeType(ContentService.MimeType.TEXT);
    }
    
    if (data.action === "add_reports" && data.reports) {
      const rowDatas = data.reports.map(r => {
        let dateObj = r.ngay ? new Date(r.ngay) : new Date();
        let tsObj = r.timestamp ? new Date(r.timestamp) : new Date();
        let formattedTime = Utilities.formatDate(tsObj, "GMT+7", "HH:mm:ss");

        return [
          r.id || Math.random().toString(36).substring(2, 8).toUpperCase(),
          dateObj,
          r.ca || "",
          r.nguyenCong || "",
          r.soOngCount || 1,
          r.soOngText || "",
          r.loaiXl || "",
          r.soLanRua || "",
          r.dongHoNuoc || "",
          r.loaiOng || "",
          r.maBo || "",
          r.khoang || "",
          "", // Từ giếng
          "", // Từ giàn
          "", // Hồ sơ giếng
          r.nguoi1 || "",
          r.nguoi2 || "",
          r.tinhTrang || "",
          formattedTime,
          r.ghiChu || ""
        ];
      });
      
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowDatas.length, rowDatas[0].length)
           .setValues(rowDatas)
           .setHorizontalAlignment("center")
           .setVerticalAlignment("middle");
           
      sheet.getRange(startRow, 2, rowDatas.length, 1).setNumberFormat("dd-MMM-yyyy");
      sheet.getRange(startRow, 19, rowDatas.length, 1).setNumberFormat("@");

      sheet.autoResizeRows(startRow, rowDatas.length);
      sheet.autoResizeColumns(1, rowDatas[0].length);
      
      return ContentService.createTextOutput("Thành công").setMimeType(ContentService.MimeType.TEXT);
    }
    
    if (data.action === "edit_report" && data.report) {
      const r = data.report;
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0].toString() === r.id.toString()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex > -1) {
        let dateObj = r.ngay ? new Date(r.ngay) : new Date();
        let tsObj = r.timestamp ? new Date(r.timestamp) : new Date();
        let formattedTime = Utilities.formatDate(tsObj, "GMT+7", "HH:mm:ss");

        const rowData = [
          [
            r.id, dateObj, r.ca, r.nguyenCong, r.soOngCount, r.soOngText, r.loaiXl, r.soLanRua,
            r.dongHoNuoc, r.loaiOng, r.maBo, r.khoang, "", "", "", r.nguoi1, r.nguoi2, r.tinhTrang,
            formattedTime, r.ghiChu || ""
          ]
        ];
        sheet.getRange(rowIndex, 1, 1, rowData[0].length)
             .setValues(rowData)
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
             
        sheet.getRange(rowIndex, 2).setNumberFormat("dd-MMM-yyyy");
        sheet.getRange(rowIndex, 19).setNumberFormat("@");
             
        sheet.autoResizeRows(rowIndex, 1);
        sheet.autoResizeColumns(1, rowData[0].length);
        
        return ContentService.createTextOutput("Cập nhật thành công").setMimeType(ContentService.MimeType.TEXT);
      } else {
        return ContentService.createTextOutput("Không tìm thấy ID để cập nhật.");
      }
    }

    if (data.action === "delete_report" && data.id) {
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let rowIndex = -1;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0].toString() === data.id.toString()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex > -1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput("Xóa thành công").setMimeType(ContentService.MimeType.TEXT);
      } else {
        return ContentService.createTextOutput("Không tìm thấy ID để xóa.");
      }
    }
    
    return ContentService.createTextOutput("Thất bại: Action không hợp lệ.");
    
  } catch (error) {
    return ContentService.createTextOutput("Lỗi máy chủ: " + error.toString());
  }
}

function doGet(e) {
  try {
    const sheet = setupSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, values.length); i++) {
      if (values[i].indexOf("ID") !== -1 && (values[i].indexOf("Ca") !== -1 || values[i].indexOf("Ngày") !== -1)) {
        headerRowIdx = i;
        break;
      }
    }
    
    if (headerRowIdx === -1 || values.length <= headerRowIdx + 1) {
      return createJsonResponse([]);
    }
    
    const headers = values[headerRowIdx];
    const results = [];
    
    const colMap = {};
    headers.forEach((h, idx) => {
      if (h) colMap[h.trim()] = idx;
    });
    
    for (let i = headerRowIdx + 1; i < values.length; i++) {
      const row = values[i];
      if (!row[colMap["ID"]]) continue;
      
      let rawNgay = colMap["Ngày"] !== undefined ? row[colMap["Ngày"]] : null;
      let strNgay = "";
      if (rawNgay instanceof Date) {
        strNgay = Utilities.formatDate(rawNgay, "GMT+7", "yyyy-MM-dd");
      } else {
        strNgay = rawNgay ? rawNgay.toString() : "";
      }

      const report = {
        id: row[colMap["ID"]],
        ca: colMap["Ca"] !== undefined ? row[colMap["Ca"]] : "",
        nguyenCong: colMap["Nguyên công"] !== undefined ? row[colMap["Nguyên công"]] : "",
        soOngCount: colMap["Số lượng ống"] !== undefined ? row[colMap["Số lượng ống"]] : 1,
        soOngText: colMap["Số ống chi tiết"] !== undefined ? row[colMap["Số ống chi tiết"]] : "",
        loaiXl: colMap["Loại xử lý"] !== undefined ? row[colMap["Loại xử lý"]] : "",
        soLanRua: colMap["Số lần rửa"] !== undefined ? row[colMap["Số lần rửa"]] : "",
        dongHoNuoc: colMap["Đồng hồ nước"] !== undefined ? row[colMap["Đồng hồ nước"]] : "",
        loaiOng: colMap["Loại ống"] !== undefined ? row[colMap["Loại ống"]] : "",
        maBo: colMap["Mã bó"] !== undefined ? row[colMap["Mã bó"]] : "",
        khoang: colMap["Khoang"] !== undefined ? row[colMap["Khoang"]] : "",
        nguoi1: colMap["Người TH 1"] !== undefined ? row[colMap["Người TH 1"]] : "",
        nguoi2: colMap["Người TH 2"] !== undefined ? row[colMap["Người TH 2"]] : "",
        tinhTrang: colMap["Tình trạng"] !== undefined ? row[colMap["Tình trạng"]] : "",
        ngay: strNgay,
        ghiChu: colMap["Ghi chú"] !== undefined ? row[colMap["Ghi chú"]] : ""
      };
      results.push(report);
    }
    
    return createJsonResponse(results);

  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
