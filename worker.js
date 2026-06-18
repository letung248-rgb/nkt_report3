let currentWorkerOp = 'rua-ong';
const GOOGLE_APP_SCRIPT_URL_KEY = 'nkt_sync_url_v2';

document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    if (document.getElementById('w-ngay')) {
        document.getElementById('w-ngay').value = dateStr;
    }
    
    // Auto restore last choices
    const savedCa = localStorage.getItem('w_last_ca');
    const savedNguoi1 = localStorage.getItem('w_last_nguoi1');
    if (savedCa && document.getElementById('w-ca')) document.getElementById('w-ca').value = savedCa;
    if (savedNguoi1 && document.getElementById('w-nguoi-1')) document.getElementById('w-nguoi-1').value = savedNguoi1;

    // Trigger initial UI setup (Dùng biến toàn cục nếu có, mặc định là rua-ong)
    const initialOp = window.DEFAULT_WORKER_OP || 'rua-ong';
    selectOperationWorker(initialOp);
});

const opTitles = {
    'dau-vao': 'Đầu vào',
    'rua-ong': 'Rửa ống',
    'thong-nong': 'Thông nòng',
    'ndt': 'NDT',
    'lam-sach-ren': 'Làm sạch ren',
    'ep-thuy-luc': 'Ép thủy lực',
    'tien-ren-moi': 'Tiện ren',
    'thay-coupling': 'Thay coupling',
    'dong-goi': 'Đóng gói'
};

function selectOperationWorker(op) {
    currentWorkerOp = op;
    document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.op-btn[onclick="selectOperationWorker('${op}')"]`);
    if(btn) btn.classList.add('active');
    
    document.getElementById('op-title-display').textContent = opTitles[op];

    const wgSoLanRua = document.getElementById('wg-so-lan-rua');
    const wgDongHo = document.getElementById('wg-dong-ho');
    const wgMaBo = document.getElementById('wg-ma-bo');
    const wgKhoang = document.getElementById('wg-khoang');
    const wgApSuat = document.getElementById('wg-ap-suat');
    const wgTinhTrang = document.getElementById('wg-tinh-trang');
    const wgTinhTrangDongGoi = document.getElementById('wg-tinh-trang-dong-goi');

    // Default states
    wgSoLanRua.style.display = 'none';
    wgDongHo.style.display = 'none';
    wgMaBo.style.display = 'block';
    wgKhoang.style.display = 'block';
    wgApSuat.style.display = 'none';
    wgTinhTrang.style.display = 'block';
    wgTinhTrangDongGoi.style.display = 'none';

    if (op === 'rua-ong') {
        wgSoLanRua.style.display = 'block';
        wgDongHo.style.display = 'block';
        wgKhoang.style.display = 'none'; // Rửa ống ko cần khoang
        wgMaBo.style.display = 'none';   // Rửa ống ko cần mã bó
    } else if (op === 'thong-nong' || op === 'ep-thuy-luc' || op === 'ndt' || op === 'tien-ren-moi') {
        wgKhoang.style.display = 'none';
        wgMaBo.style.display = 'none';
    }

    if (op === 'ep-thuy-luc') {
        wgApSuat.style.display = 'block';
    }

    if (op === 'dong-goi') {
        wgMaBo.style.display = 'none'; // Đóng gói xài mã bó riêng
        wgTinhTrang.style.display = 'none';
        wgTinhTrangDongGoi.style.display = 'block';
    }

    // Update Tình trạng options
    const fTinhTrang = document.getElementById('w-tinh-trang');
    if(fTinhTrang) {
        fTinhTrang.innerHTML = '';
        if (op === 'ep-thuy-luc') {
            fTinhTrang.innerHTML = `<option>Đạt</option><option>Xì box</option><option>Xì pin</option><option>Xì cả 2 đầu</option>`;
        } else if (op === 'ndt') {
            fTinhTrang.innerHTML = `<option>Đạt</option><option>Thiếu chiều dày (loại)</option><option>Khuyết tật ngang (loại)</option><option>Khuyết tật dọc (loại)</option><option>Rỗ thân, ăn mòn (loại)</option>`;
        } else if (op === 'tien-ren-moi') {
            fTinhTrang.innerHTML = `<option>Ống từ xưởng HR -> tiện ren mới</option><option>Ống lấy từ các giá chờ sửa chữa -> tiện ren mới</option>`;
        } else if (op === 'lam-sach-ren') {
            fTinhTrang.innerHTML = `<option>Đạt</option><option>Hỏng ren</option>`;
        } else if (op === 'thay-coupling') {
            fTinhTrang.innerHTML = `<option>Đạt</option><option>Hỏng coupling</option>`;
        } else {
            fTinhTrang.innerHTML = `<option>Đạt</option><option>Rỗ thân, ăn mòn (loại)</option><option>Thiếu chiều dày (loại)</option><option>Tắc paraffin (loại)</option>`;
        }
    }
}

function parsePipesArray(input) {
    if (!input) return ["1"];
    let text = input.toString().trim();
    const parts = text.split(/[,;]/);
    let result = [];
    for (let p of parts) {
        let pt = p.trim();
        if (!pt) continue;
        if (pt.includes('-')) {
            const range = pt.split('-');
            if (range.length === 2) {
                const startStr = range[0].trim();
                const endStr = range[1].trim();
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                if (!isNaN(start) && !isNaN(end) && start <= end && startStr.match(/^\d+$/) && endStr.match(/^\d+$/)) {
                    for(let i = start; i <= end; i++) {
                        result.push(i.toString());
                    }
                } else {
                    result.push(pt);
                }
            } else result.push(pt);
        } else {
            result.push(pt);
        }
    }
    return result.length > 0 ? result : ["1"];
}

async function submitWorkerReport() {
    let syncUrl = localStorage.getItem(GOOGLE_APP_SCRIPT_URL_KEY);
    
    // Nếu chưa có URL đồng bộ, yêu cầu nhập
    if (!syncUrl || syncUrl.trim() === '') {
        syncUrl = prompt("Vui lòng dán đường link (URL) hệ thống đồng bộ Google Sheets vào đây để gửi dữ liệu:");
        if (!syncUrl) return;
        localStorage.setItem(GOOGLE_APP_SCRIPT_URL_KEY, syncUrl.trim());
    }

    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';

    try {
        const soOngText = document.getElementById('w-so-ong').value;
        const pipesArray = parsePipesArray(soOngText);

        let tinhTrangValue = document.getElementById('w-tinh-trang').value;
        let maBoValue = document.getElementById('w-ma-bo') ? document.getElementById('w-ma-bo').value : '';

        if (currentWorkerOp === 'dong-goi') {
            tinhTrangValue = document.querySelector('input[name="w-dong-goi-tinh-trang"]:checked').value;
        }

        const timestamp = Date.now();
        const ngay = document.getElementById('w-ngay').value;
        const ca = document.getElementById('w-ca').value;
        const nguyenCong = opTitles[currentWorkerOp];
        const loaiXl = document.getElementById('w-loai-xl').value;
        const soLanRua = document.getElementById('w-so-lan-rua').value;
        const dongHoNuoc = document.getElementById('w-dong-ho').value;
        const loaiOng = document.getElementById('w-loai-ong').value;
        const khoang = document.getElementById('w-khoang').value;
        const apSuat = document.getElementById('w-ap-suat').value;
        const nguoi1 = document.getElementById('w-nguoi-1').value;
        const nguoi2 = document.getElementById('w-nguoi-2').value;
        const ghiChu = document.getElementById('w-ghi-chu').value;
        const timeIso = new Date().toISOString();

        const reports = pipesArray.map((pipeName, index) => {
            return {
                id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                ngay: ngay,
                ca: ca,
                nguyenCong: nguyenCong,
                soOngText: pipeName,
                soOngCount: 1,
                loaiXl: loaiXl,
                soLanRua: soLanRua,
                dongHoNuoc: dongHoNuoc,
                loaiOng: loaiOng,
                maBo: maBoValue,
                khoang: khoang,
                apSuat: apSuat,
                nguoi1: nguoi1,
                nguoi2: nguoi2,
                tinhTrang: tinhTrangValue,
                ghiChu: pipesArray.length > 1 ? (ghiChu ? ghiChu + ` (Lô gốc: ${soOngText})` : `Lô gốc: ${soOngText}`) : ghiChu,
                timestamp: timeIso
            };
        });

        const reportData = {
            action: 'add_reports',
            reports: reports
        };

        // Lưu tạm settings
        localStorage.setItem('w_last_ca', reportData.reports[0].ca);
        localStorage.setItem('w_last_nguoi1', reportData.reports[0].nguoi1);

        console.log("Đang gửi đi:", reportData);

        const response = await fetch(syncUrl, {
            method: 'POST',
            mode: 'no-cors', // Sử dụng no-cors để tránh lỗi CORS khi gọi Google Apps Script từ client
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });

        // Với no-cors, response sẽ luôn trả về opaque, ta cứ coi như thành công nếu ko ném lỗi mạng
        overlay.style.display = 'none';
        alert('✅ Đã gửi báo cáo thành công!');
        
        // Reset vài trường
        document.getElementById('w-so-ong').value = '';
        if(document.getElementById('w-ma-bo')) document.getElementById('w-ma-bo').value = '';
        if(document.getElementById('w-ghi-chu')) document.getElementById('w-ghi-chu').value = '';
        
    } catch (error) {
        overlay.style.display = 'none';
        console.error(error);
        const resetUrl = confirm("❌ Gửi thất bại! Có thể đường link đồng bộ bị sai. Bạn có muốn đổi đường link khác không?");
        if (resetUrl) {
            localStorage.removeItem(GOOGLE_APP_SCRIPT_URL_KEY);
        }
    }
}
