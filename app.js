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

let historyData = [];
let currentOperation = '�廕吟 v�o';
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    let savedNgay = null;
    let savedLoaiOng = null;
    try {
        savedNgay = localStorage.getItem('nkt_last_ngay');
        savedLoaiOng = localStorage.getItem('nkt_last_loai_ong');
    } catch(e) {}

    const defaultNgay = savedNgay ? savedNgay : "today";
    
    if (document.getElementById('f-ngay')) {
        window.fNgayPicker = flatpickr("#f-ngay", {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d-M-Y",
            defaultDate: defaultNgay
        });
    }

    if (savedLoaiOng && document.getElementById('f-loai-ong')) {
        document.getElementById('f-loai-ong').value = savedLoaiOng;
    }

    window.goToReport = function() {
        if(typeof resetForm === 'function') resetForm();
        if(typeof navigateTo === 'function') navigateTo('report');
    };

    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            navigateTo(pageId);
        });
    });
    
    // Load history
    try {
        const saved = localStorage.getItem('nkt_history');
        if (saved) {
            historyData = JSON.parse(saved);
            
            // Migrate old data to remove prefixes/suffixes like "1. " and " �� B⑹廙𢲷 1"
            let migrated = false;
            historyData = historyData.map(r => {
                let opKey = r.nguyenCong || r.operation;
                if (opKey && (opKey.match(/^\d+\.\s*/) || opKey.match(/\s*[-�瑺\s*B[u⑹]廙𢲷\s*\d+/i))) {
                    opKey = opKey.replace(/^\d+\.\s*/, '').replace(/\s*[-�瑺\s*B[u⑹⑸]廙𢲷\s*\d+/i, '');
                    migrated = true;
                }
                if (r.nguyenCong) r.nguyenCong = opKey;
                if (r.operation) r.operation = opKey;
                return r;
            });
            
            if (migrated) {
                localStorage.setItem('nkt_history', JSON.stringify(historyData));
            }
            
            const savedPlan = localStorage.getItem('nkt_plan');
            if (savedPlan) {
                planData = JSON.parse(savedPlan);
            }
            
            renderHistory();
            updateDashboard();
            renderPlanTable();
        }
    } catch (e) {
        console.error("L廙𡟙 khi t廕ξ l廙醶h s廙�:", e);
    }
});

function navigateTo(pageId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if(navItem) navItem.classList.add('active');

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const page = document.getElementById(`page-${pageId}`);
    if(page) page.classList.add('active');
    
    const titleText = document.getElementById('page-title-text');
    if(titleText) {
        if(pageId === 'dashboard') titleText.textContent = '�� T廙葓g quan';
        if(pageId === 'plan') titleText.textContent = '�� K廕� ho廕︷h';
        if(pageId === 'report') titleText.textContent = '�� Nh廕計 b獺o c獺o';
        if(pageId === 'history') titleText.textContent = '�� L廙醶h s廙�';
    }
}

const opTitles = {
    'dau-vao': '�廕吟 v�o',
    'rua-ong': 'R廙苔 廙𤉋g',
    'thong-nong': 'Th繫ng n簷ng',
    'ndt': 'NDT',
    'lam-sach-ren': 'L�m s廕︷h, calip ren',
    'ep-thuy-luc': '�p th廙囤 l廙帷',
    'tien-ren-moi': 'Ti廙𡵞 ren m廙𢹂',
    'thay-coupling': 'Thay coupling',
    'dong-goi': '�籀ng g籀i'
};

const opOrder = [
    '�廕吟 v�o',
    'R廙苔 廙𤉋g',
    'Th繫ng n簷ng',
    'NDT',
    'L�m s廕︷h, calip ren',
    '�p th廙囤 l廙帷',
    'Ti廙𡵞 ren m廙𢹂',
    'Thay coupling',
    '�籀ng g籀i'
];

function sortOps(a, b) {
    let ia = opOrder.indexOf(a);
    let ib = opOrder.indexOf(b);
    if (ia === -1) ia = 99;
    if (ib === -1) ib = 99;
    return ia - ib;
}

function selectOperation(op) {
    document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.op-btn[onclick="selectOperation('${op}')"]`);
    if(btn) btn.classList.add('active');
    
    const titleEl = document.getElementById('operation-title');
    if(titleEl && opTitles[op]) {
        titleEl.textContent = opTitles[op];
        currentOperation = opTitles[op];
    }
    
    const fgRua = document.getElementById('fg-so-lan-rua');
    if(fgRua) {
        if(op === 'rua-ong') fgRua.style.display = 'block';
        else fgRua.style.display = 'none';
    }
    
    window.toggleDongGoiMaBo = function() {
        const checked = document.querySelector('input[name="dong-goi-tinh-trang"]:checked');
        const isDat = checked ? checked.value === '�廕﹀' : true;
        const fgMaBoThanhPham = document.getElementById('fg-ma-bo-thanh-pham');
        const fgMaBoHong = document.getElementById('fg-ma-bo-hong');
        if (fgMaBoThanhPham) fgMaBoThanhPham.style.display = isDat ? 'block' : 'none';
        if (fgMaBoHong) fgMaBoHong.style.display = isDat ? 'none' : 'block';
    }

    const fgMaBo = document.getElementById('fg-ma-bo');
    const fgMaBoThanhPham = document.getElementById('fg-ma-bo-thanh-pham');
    const fgMaBoHong = document.getElementById('fg-ma-bo-hong');
    const fgTinhTrangDongGoi = document.getElementById('fg-tinh-trang-dong-goi');
    const fgTinhTrang = document.getElementById('fg-tinh-trang');
    
    if (fgMaBoThanhPham) fgMaBoThanhPham.style.display = 'none';
    if (fgMaBoHong) fgMaBoHong.style.display = 'none';
    if (fgTinhTrangDongGoi) fgTinhTrangDongGoi.style.display = 'none';
    if (fgTinhTrang) fgTinhTrang.style.display = 'block';

    if (fgMaBo) {
        if (op === 'thong-nong' || op === 'ep-thuy-luc' || op === 'ndt' || op === 'tien-ren-moi' || op === 'rua-ong' || op === 'dong-goi') {
            fgMaBo.style.display = 'none';
        } else {
            fgMaBo.style.display = 'block';
        }
    }

    if (op === 'dong-goi') {
        if (fgTinhTrang) fgTinhTrang.style.display = 'none';
        if (fgTinhTrangDongGoi) fgTinhTrangDongGoi.style.display = 'block';
        window.toggleDongGoiMaBo();
    }

    const fgKhoang = document.getElementById('fg-khoang');
    if (fgKhoang) {
        const lbl = fgKhoang.querySelector('label');
        if (lbl) lbl.textContent = op === 'dong-goi' ? 'Chuy廙� v�o khoang' : 'L廕句 t廙� khoang';
        
        if (op === 'thong-nong' || op === 'ep-thuy-luc' || op === 'ndt' || op === 'rua-ong') {
            fgKhoang.style.display = 'none';
        } else {
            fgKhoang.style.display = 'block';
        }
    }

    const fgApSuat = document.getElementById('fg-ap-suat');
    if(fgApSuat) {
        if(op === 'ep-thuy-luc') fgApSuat.style.display = 'block';
        else fgApSuat.style.display = 'none';
    }

    const fgDongHo = document.getElementById('fg-dong-ho-nuoc');
    if(fgDongHo) {
        if(op === 'rua-ong') fgDongHo.style.display = 'block';
        else fgDongHo.style.display = 'none';
    }

    if (fgTinhTrang) {
        if (op === 'tien-ren-moi') {
            fgTinhTrang.style.gridColumn = 'span 2';
        } else {
            fgTinhTrang.style.gridColumn = 'span 1';
        }
    }

    const fTinhTrang = document.getElementById('f-tinh-trang');
    if(fTinhTrang) {
        fTinhTrang.innerHTML = '';
        if (op === 'ep-thuy-luc') {
            fTinhTrang.innerHTML = `
                <option>�廕﹀</option>
                <option>X穫 box</option>
                <option>X穫 pin</option>
                <option>X穫 c廕� 2 �廕吟</option>
            `;
        } else if (op === 'ndt') {
            fTinhTrang.innerHTML = `
                <option>�廕﹀</option>
                <option>Thi廕簑 chi廙� d�y (lo廕【)</option>
                <option>Khuy廕篙 t廕負 ngang (lo廕【)</option>
                <option>Khuy廕篙 t廕負 d廙㷼 (lo廕【)</option>
                <option>R廙� th璽n, �n m簷n (lo廕【)</option>
            `;
        } else if (op === 'tien-ren-moi') {
            fTinhTrang.innerHTML = `
                <option>廙酧g t廙� x⑹廙俲g HR -> ti廙𡵞 ren m廙𢹂</option>
                <option>廙酧g l廕句 t廙� c獺c gi獺 ch廙� s廙苔 ch廙畝 -> ti廙𡵞 ren m廙𢹂</option>
            `;
        } else if (op === 'lam-sach-ren') {
            fTinhTrang.innerHTML = `
                <option>�廕﹀</option>
                <option>H廙萏g ren</option>
            `;
        } else if (op === 'thay-coupling') {
            fTinhTrang.innerHTML = `
                <option>�廕﹀</option>
                <option>H廙萏g coupling</option>
            `;
        } else {
            fTinhTrang.innerHTML = `
                <option>�廕﹀</option>
                <option>R廙� th璽n, �n m簷n (lo廕【)</option>
                <option>Thi廕簑 chi廙� d�y (lo廕【)</option>
                <option>T廕畚 paraffin (lo廕【)</option>
            `;
        }
    }
}

function parsePipesText(input) {
    if (!input) return [];
    let text = input.toString().trim();
    if (!text) return [];
    const parts = text.split(/[,;]/);
    const result = [];
    for (let p of parts) {
        let pt = p.trim();
        if (!pt) continue;
        if (pt.includes('-')) {
            const range = pt.split('-');
            if (range.length === 2) {
                const start = parseInt(range[0].trim());
                const end = parseInt(range[1].trim());
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) {
                        result.push(i.toString());
                    }
                } else {
                    result.push(pt);
                }
            } else {
                result.push(pt);
            }
        } else {
            result.push(pt);
        }
    }
    return result;
}

let lastCalculatedCount = 0;
function calculatePipes() {
    const input = document.getElementById('so-ong-input').value.trim();
    const hint = document.getElementById('so-ong-hint');
    lastCalculatedCount = 0;
    
    if (!input) {
        hint.textContent = '';
        return;
    }
    
    const pipes = parsePipesText(input);
    const total = pipes.length;
    
    if (total > 0) {
        lastCalculatedCount = total;
        hint.textContent = `Th廙帷 t廕�: ${lastCalculatedCount} 廙𤉋g`;
    } else {
        hint.textContent = '';
    }
}

function resetForm() {
    editingId = null;
    document.getElementById('btn-submit').textContent = '�𠒣 L⑹u b獺o c獺o';
    
    document.getElementById('so-ong-input').value = '';
    const mb = document.getElementById('f-ma-bo'); if(mb) { mb.value = ''; updateBundleInfo(); }
    const mbThanhPham = document.getElementById('f-ma-bo-thanh-pham'); if(mbThanhPham) mbThanhPham.value = '';
    const mbHong = document.getElementById('f-ma-bo-hong'); if(mbHong) mbHong.value = '';
    const dgDat = document.querySelector('input[name="dong-goi-tinh-trang"][value="�廕﹀"]'); if (dgDat) dgDat.checked = true;
    const kh = document.getElementById('f-khoang'); if(kh) kh.value = '';
    const as = document.getElementById('f-ap-suat'); if(as) as.value = '';
    const gc = document.getElementById('f-ghi-chu'); if(gc) gc.value = '';
    const dh = document.getElementById('f-dong-ho-nuoc'); if(dh) dh.value = '';
    document.getElementById('so-ong-hint').textContent = '';
    lastCalculatedCount = 0;
}

function submitReport() {
    try {
        const soOng = document.getElementById('so-ong-input').value;
        const nguoi1 = document.getElementById('f-nguoi-1').value;
        
        if (!soOng || !nguoi1) {
            alert("Vui l簷ng nh廕計 S廙� 廙𤉋g v� Ng⑹廙𩥉 th廙帷 hi廙𡵞 1!");
            return;
        }
        
        let maBoValue = document.getElementById('f-ma-bo') ? document.getElementById('f-ma-bo').value : '';
        let tinhTrangValue = document.getElementById('f-tinh-trang').value;
        
        if (currentOperation === '�籀ng g籀i') {
            const dongGoiStatus = document.querySelector('input[name="dong-goi-tinh-trang"]:checked').value;
            tinhTrangValue = dongGoiStatus;
            if (dongGoiStatus === '�廕﹀') {
                maBoValue = document.getElementById('f-ma-bo-thanh-pham').value;
            } else {
                maBoValue = document.getElementById('f-ma-bo-hong').value;
            }
        }
        
        const pipesArray = parsePipesArray(soOng);
        const timestamp = Date.now();
        
        const ngay = document.getElementById('f-ngay').value;
        const ca = document.getElementById('f-ca').value;
        const nguyenCong = currentOperation;
        const loaiXl = document.getElementById('f-loai-xl').value;
        const soLanRua = (currentOperation.includes('Rửa ống') && document.getElementById('f-so-lan-rua')) ? document.getElementById('f-so-lan-rua').value : '';
        const dongHoNuoc = (currentOperation.includes('Rửa ống') && document.getElementById('f-dong-ho-nuoc')) ? document.getElementById('f-dong-ho-nuoc').value : '';
        const loaiOng = document.getElementById('f-loai-ong').value;
        const khoang = document.getElementById('f-khoang') ? document.getElementById('f-khoang').value : '';
        const apSuat = document.getElementById('f-ap-suat') ? document.getElementById('f-ap-suat').value : '';
        const nguoi2 = document.getElementById('f-nguoi-2').value;
        const ghiChu = document.getElementById('f-ghi-chu') ? document.getElementById('f-ghi-chu').value : '';
        
        const reports = pipesArray.map((pipeName, index) => {
            return {
                id: editingId ? editingId : Math.random().toString(36).substring(2, 8).toUpperCase(),
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
                ghiChu: (!editingId && pipesArray.length > 1) ? (ghiChu ? ghiChu + ` (Lô gốc: ${soOng})` : `Lô gốc: ${soOng}`) : ghiChu
            };
        });

        try {
            localStorage.setItem('nkt_last_ngay', document.getElementById('f-ngay').value);
            localStorage.setItem('nkt_last_loai_ong', document.getElementById('f-loai-ong').value);
        } catch(e) {}

        const syncUrl = localStorage.getItem('nkt_sync_url_v3');

        if (editingId) {
            const report = reports[0];
            const index = historyData.findIndex(r => r.id === editingId);
            if (index !== -1) historyData[index] = report;
            
            if (syncUrl) {
                fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'edit_report', report: report })
                }).catch(e => console.error("Lỗi cập nhật Cloud:", e));
            }
        } else {
            for (let i = reports.length - 1; i >= 0; i--) {
                historyData.unshift(reports[i]);
            }
            
            if (syncUrl) {
                fetch(syncUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add_reports', reports: reports })
                }).catch(e => console.error("Lỗi thêm mới lên Cloud:", e));
            }
        }
        
        localStorage.setItem('nkt_history', JSON.stringify(historyData));
        renderHistory();
        updateDashboard();
        const badge = document.getElementById('report-badge');
        if (badge) {
            badge.style.display = 'inline-block';
            badge.textContent = historyData.length;
        }
        
        alert(editingId ? "C廕計 nh廕負 b獺o c獺o th�nh c繫ng!" : "L⑹u b獺o c獺o th�nh c繫ng!");
        resetForm();
    } catch (e) {
        alert("L廙𦎾 KHI L⑸U: " + e.message);
    }
}

function findMaBoForPipe(pipe) {
    if (!pipe) return '';
    for (let i = historyData.length - 1; i >= 0; i--) {
        const r = historyData[i];
        if (r.maBo && r.soOngText) {
            const pipesInRecord = parsePipesText(r.soOngText.toString());
            if (pipesInRecord.includes(pipe.toString())) {
                return r.maBo;
            }
        }
    }
    return '';
}

function getMaBoForRecord(r) {
    if (r.maBo) return r.maBo;
    const text = r.soOngText ? r.soOngText.toString().trim() : '';
    if (!text) return '';
    const pipes = parsePipesText(text);
    if (pipes.length > 0) {
        return findMaBoForPipe(pipes[0]);
    }
    return '';
}

function renderHistory() {
    try {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        historyData.forEach((r, i) => {
            const displayMaBo = getMaBoForRecord(r);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="color: var(--text-muted); font-weight: 600;">#${i + 1}</span></td>
                <td><div style="font-weight: 600; color: var(--text-primary);">${formatDate(r.ngay)}</div></td>
                <td><span class="badge badge-secondary">${r.ca}</span></td>
                <td>
                    <div style="font-weight: 600; color: var(--accent-blue);">${r.nguyenCong}</div>
                    ${r.soLanRua ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">S廙� l⑹廙ㄅ r廙苔: <b>${r.soLanRua}</b></div>` : ''}
                    ${r.dongHoNuoc ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">�廙忛g h廙�: <b>${r.dongHoNuoc}</b></div>` : ''}
                    ${r.apSuat ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">�p su廕另: <b>${r.apSuat}</b></div>` : ''}
                </td>
                <td>
                    <span class="badge badge-purple">${r.loaiOng || ''}</span>
                </td>
                <td>
                    ${displayMaBo ? `<span class="badge badge-info">${displayMaBo}</span>` : ''}
                </td>
                <td>${(typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGieng : ''}</td>
                <td>${(typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGian : ''}</td>
                <td>${(typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].soBBGN : ''}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                        <span style="font-size: 1.1rem;">�𪈠</span>
                        <span style="font-weight: 500;">${r.nguoi1}</span>
                    </div>
                </td>
                <td style="text-align: left;">
                    <span class="badge ${r.tinhTrang === '�廕﹀' ? 'badge-success' : (r.tinhTrang.toLowerCase().includes('lo廕【') || r.tinhTrang.toLowerCase().includes('h廙萏g') ? 'badge-danger' : 'badge-warning')}">
                        ${r.tinhTrang === '�廕﹀' ? '��' : '�𩤃�'} ${r.tinhTrang}
                    </span>
                </td>
                <td style="max-width: 150px;">
                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-blue);">${r.soOngCount}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.soOngText}">${r.soOngText}</div>
                </td>
                <td style="min-width: 90px; text-align: center;">
                    <button class="btn btn-sm btn-outline" style="padding: 4px 8px; margin-right: 4px;" onclick="editReport(${r.id})" title="S廙苔">�𧶏�</button>
                    <button class="btn btn-sm btn-outline" style="padding: 4px 8px; color: #ef4444; border-color: #fca5a5;" onclick="deleteReport(${r.id})" title="X籀a">��儭�</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        const countEl = document.getElementById('history-count');
        if (countEl) countEl.textContent = `${historyData.length} k廕篙 qu廕ε;
    } catch (e) {
        console.error("L廙𡟙 khi hi廙� th廙� l廙醶h s廙�:", e);
    }
}

function editReport(id) {
    const report = historyData.find(r => r.id === id);
    if (!report) return;
    
    editingId = id;
    
    // Switch to report tab
    navigateTo('report');
    
    // Setup form
    const fNgayEl = document.getElementById('f-ngay');
    if (fNgayEl) {
        if (window.fNgayPicker) {
            window.fNgayPicker.setDate(report.ngay);
        } else {
            fNgayEl.value = report.ngay;
        }
    }
    document.getElementById('f-ca').value = report.ca;
    
    // Find operation key by value
    let opKey = 'dau-vao';
    for (const [key, val] of Object.entries(opTitles)) {
        if (val === report.nguyenCong) {
            opKey = key;
            break;
        }
    }
    selectOperation(opKey);
    
    document.getElementById('so-ong-input').value = report.soOngText;
    calculatePipes();
    
    document.getElementById('f-loai-xl').value = report.loaiXl;
    if(document.getElementById('f-so-lan-rua') && report.soLanRua) document.getElementById('f-so-lan-rua').value = report.soLanRua;
    document.getElementById('f-loai-ong').value = report.loaiOng;
    if (report.nguyenCong === '�籀ng g籀i') {
        const dongGoiTinhTrang = document.querySelector(`input[name="dong-goi-tinh-trang"][value="${report.tinhTrang}"]`);
        if (dongGoiTinhTrang) dongGoiTinhTrang.checked = true;
        window.toggleDongGoiMaBo();
        if (report.tinhTrang === '�廕﹀') {
            const el = document.getElementById('f-ma-bo-thanh-pham');
            if (el) el.value = report.maBo;
        } else {
            const el = document.getElementById('f-ma-bo-hong');
            if (el) el.value = report.maBo;
        }
    } else {
        if(document.getElementById('f-ma-bo')) {
            document.getElementById('f-ma-bo').value = report.maBo;
            updateBundleInfo();
        }
        const fTinhTrang = document.getElementById('f-tinh-trang');
        if (fTinhTrang) {
            let exists = false;
            for (let i = 0; i < fTinhTrang.options.length; i++) {
                if (fTinhTrang.options[i].value === report.tinhTrang) {
                    exists = true;
                    break;
                }
            }
            if (!exists && report.tinhTrang) {
                const opt = document.createElement('option');
    
    document.getElementById('btn-submit').textContent = '�𠒣 C廕計 nh廕負 b獺o c獺o';
}

function deleteReport(id) {
    if (confirm('B廕》 c籀 ch廕畚 mu廙𤉋 x籀a b獺o c獺o n�y?')) {
        historyData = historyData.filter(r => r.id !== id);
        localStorage.setItem('nkt_history', JSON.stringify(historyData));
        renderHistory();
        updateDashboard();
        const badge = document.getElementById('report-badge');
        if (badge) {
            badge.textContent = historyData.length;
            if(historyData.length === 0) badge.style.display = 'none';
        }
    }
}

function showInventory() {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[onclick="showInventory()"]`);
    if(navItem) navItem.classList.add('active');
    
    switchInventoryTab('�廕﹀');
    const modal = document.getElementById('modal-inventory');
    if (modal) modal.style.display = 'block';
}

function switchInventoryTab(type) {
    const btnThanhPham = document.getElementById('btn-tab-thanh-pham');
    const btnHong = document.getElementById('btn-tab-hong');
    
    if (type === '�廕﹀') {
        if(btnThanhPham) { btnThanhPham.classList.remove('btn-outline'); btnThanhPham.classList.add('btn-primary'); }
        if(btnHong) { btnHong.classList.remove('btn-primary'); btnHong.classList.add('btn-outline'); }
    } else {
        if(btnHong) { btnHong.classList.remove('btn-outline'); btnHong.classList.add('btn-primary'); }
        if(btnThanhPham) { btnThanhPham.classList.remove('btn-primary'); btnThanhPham.classList.add('btn-outline'); }
    }
    
    renderInventory(type);
}

function compressPipes(pipes) {
    if (!pipes || pipes.length === 0) return '';
    const nums = [];
    const nonNums = [];
    for (const p of pipes) {
        const n = parseInt(p, 10);
        if (!isNaN(n) && n.toString() === p.toString().trim()) {
            nums.push(n);
        } else {
            nonNums.push(p);
        }
    }
    nums.sort((a, b) => a - b);
    
    const ranges = [];
    if (nums.length > 0) {
        let start = nums[0];
        let prev = nums[0];
        for (let i = 1; i < nums.length; i++) {
            if (nums[i] === prev + 1) {
                prev = nums[i];
            } else if (nums[i] !== prev) {
                if (start === prev) ranges.push(start.toString());
                else ranges.push(`${start}-${prev}`);
                start = nums[i];
                prev = nums[i];
            }
        }
        if (start === prev) ranges.push(start.toString());
        else ranges.push(`${start}-${prev}`);
    }
    
    return ranges.concat(nonNums).join(', ');
}

function renderInventory(type) {
    const container = document.getElementById('inventory-content');
    if (!container) return;
    
    // type is '�廕﹀' (Th�nh ph廕姓) or 'H廙萏g'
    const inventoryData = historyData.filter(r => r.nguyenCong === '�籀ng g籀i' && r.tinhTrang === type && r.maBo);
    
    if (inventoryData.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">Kh繫ng c籀 b籀 廙𤉋g n�o trong kho ${type === '�廕﹀' ? 'th�nh ph廕姓' : 'h廙萏g'}.</div>`;
        return;
    }
    
    let html = '';
    inventoryData.forEach(r => {
        const pipes = parsePipesText(r.soOngText || '');
        const sourceGroups = {};
        
        for (let pipe of pipes) {
            const inputMaBo = findMaBoForPipe(pipe);
            let key = "Kh繫ng r繭 ngu廙忛 g廙倴";
            
            if (inputMaBo && typeof BUNDLE_MAPPING !== 'undefined' && BUNDLE_MAPPING[inputMaBo]) {
                const gieng = BUNDLE_MAPPING[inputMaBo].tuGieng || '---';
                const gian = BUNDLE_MAPPING[inputMaBo].tuGian || '---';
                key = `Gi廕積g: ${gieng} | Gi�n: ${gian}`;
            }
            
            if (!sourceGroups[key]) sourceGroups[key] = [];
            sourceGroups[key].push(pipe);
        }
        
        let sourceHtml = '';
        for (const [key, groupPipes] of Object.entries(sourceGroups)) {
            let compressedPipes = compressPipes(groupPipes);
            sourceHtml += `
                <div style="margin-top: 8px; padding-left: 10px; border-left: 2px solid #ccc;">
                    <div style="font-size: 0.85rem; color: #555; font-weight: 600;">${key}</div>
                    <div style="font-size: 0.9rem; color: #222; word-break: break-all;">
                        <span style="font-weight: 600; color: #1e40af;">${groupPipes.length} 廙𤉋g:</span> ${compressedPipes}
                    </div>
                </div>
            `;
        }
        
        html += `
        <div class="card" style="margin-bottom: 12px; padding: 12px; border-left: 4px solid ${type === '�廕﹀' ? '#10b981' : '#ef4444'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-dark);">
                        M瓊 b籀: <span style="color: var(--accent-blue);">${r.maBo}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                        Ng�y �籀ng g籀i: <b>${formatDate(r.ngay)}</b> | Size 廙𤉋g: <b>${r.loaiOng || '-'}</b> | Khoang: <b>${r.khoang || '-'}</b>
                    </div>
                    <div style="margin-top: 10px;">
                        ${sourceHtml}
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

function exportExcel() {
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
        alert("Kh繫ng c籀 d廙� li廙杮 �廙� xu廕另 Excel!");
        return;
    }
    
    const type = document.getElementById('export-type').value;
    let dataToExport = historyData;
    let filenameSuffix = "All";
    
    if (type === 'month') {
        const m = document.getElementById('export-month').value;
        if(!m) return alert("Vui l簷ng ch廙㤔 th獺ng");
        dataToExport = historyData.filter(r => r.ngay && r.ngay.startsWith(m));
        filenameSuffix = m;
    } else if (type === 'date') {
        const d = document.getElementById('export-date').value;
        if(!d) return alert("Vui l簷ng ch廙㤔 ng�y");
        dataToExport = historyData.filter(r => r.ngay === d);
        filenameSuffix = d;
    }
    
    if (dataToExport.length === 0) {
        alert("Kh繫ng c籀 d廙� li廙杮 trong th廙𩥉 gian �瓊 ch廙㤔!");
        return;
    }
    
    try {
        const wb = new ExcelJS.Workbook();
        
        let wsData;
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
        
        let rowIndex = 2;
        dataToExport.forEach((r) => {
            const text = r.soOngText ? r.soOngText.toString().trim() : '';
            let pipes = parsePipesText(text);
            const nguyenCongFull = r.nguyenCong;
            let isRua = r.nguyenCong && r.nguyenCong.toLowerCase().includes('rửa');
            let soLanRuaStr = isRua ? (r.soLanRua || 0) : "";
            let dongHoNuocStr = isRua ? (r.dongHoNuoc || '') : "";
            let idStr = "VSP" + String(rowIndex - 1).padStart(5, '0');

            if (pipes.length === 0) {
                const resolvedMaBo = getMaBoForRecord(r);
                let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGieng : '';
                let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].tuGian : '';
                let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && resolvedMaBo && BUNDLE_MAPPING[resolvedMaBo]) ? BUNDLE_MAPPING[resolvedMaBo].soBBGN : '';

                wsData.addRow([
                    idStr, formatDate(r.ngay), r.ca, nguyenCongFull, r.soOngCount, r.soOngText,
                    r.loaiXl, soLanRuaStr, dongHoNuocStr, r.loaiOng, resolvedMaBo, r.khoang,
                    "", "", "", r.nguoi1, r.nguoi2, r.tinhTrang, "", (r.ghiChu || '').replace(/
/g, ' ')
                ]);
                rowIndex++;
            } else {
                for (let pipe of pipes) {
                    const displayMaBo = r.maBo || findMaBoForPipe(pipe);
                    let tuGieng = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGieng : '';
                    let tuGian = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].tuGian : '';
                    let hoSoGieng = (typeof BUNDLE_MAPPING !== 'undefined' && displayMaBo && BUNDLE_MAPPING[displayMaBo]) ? BUNDLE_MAPPING[displayMaBo].soBBGN : '';

                    wsData.addRow([
                        idStr, formatDate(r.ngay), r.ca, nguyenCongFull, 1, pipe,
                        r.loaiXl, soLanRuaStr, dongHoNuocStr, r.loaiOng, displayMaBo, r.khoang,
                        "", "", "", r.nguoi1, r.nguoi2, r.tinhTrang, "", (r.ghiChu || '').replace(/
/g, ' ')
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
        alert("L廙𡟙 xu廕另 Excel: " + e.message);
    }
}

function applyHistoryFilters() {}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

let statusChart = null;
let operationsChart = null;

function updateDashboard() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonth = todayStr.slice(0, 7); // YYYY-MM
    
    let monthCount = 0;
    let todayCount = 0;
    let totalCount = 0;
    let monthReports = 0;
    let todayReports = 0;
    let okCount = 0;
    let failCount = 0;
    let repairCount = 0;
    
    const opStats = {};
    const sizeStats = {};
    const dateStats = {};
    const errorStats = {};
    
    const recent = historyData.slice(0, 5); // top 5
    
    historyData.forEach(r => {
        const count = r.soOngCount || 1;
        totalCount += count;
        
        if (r.ngay && r.ngay.startsWith(currentMonth)) { monthCount += count; monthReports++; }
        if (r.ngay === todayStr) { todayCount += count; todayReports++; }
        
        let statusCategory = '�廕﹀';
        const isLoi = r.tinhTrang.includes('lo廕【') || r.tinhTrang.toLowerCase().includes('x廕�');
        if (r.tinhTrang === '�廕﹀') {
            okCount += count;
        } else if (isLoi) {
            failCount += count;
            statusCategory = 'Lo廕【';
            if (!errorStats[r.tinhTrang]) errorStats[r.tinhTrang] = 0;
            errorStats[r.tinhTrang] += count;
        } else {
            repairCount += count;
            statusCategory = 'S廙苔 ch廙畝';
        }
        
        if (!opStats[r.nguyenCong]) opStats[r.nguyenCong] = { count: 0, days: new Set() };
        opStats[r.nguyenCong].count += count;
        opStats[r.nguyenCong].days.add(r.ngay);
        
        if (!sizeStats[r.loaiOng]) sizeStats[r.loaiOng] = { ok: 0, fail: 0, repair: 0 };
        if (!dateStats[r.ngay]) dateStats[r.ngay] = { ok: 0, fail: 0, repair: 0 };
        
        let isTP = false, isFail = false, isRepair = false;
        
        if (r.tinhTrang === '�廕﹀' && r.nguyenCong && r.nguyenCong.toLowerCase() === '矇p th廙囤 l廙帷') {
            isTP = true;
        } else if (r.tinhTrang && r.tinhTrang.toLowerCase().includes('lo廕【')) {
            isFail = true;
        } else if (r.tinhTrang && ['H廙萏g ren', 'H廙萏g coupling', 'X穫 pin', 'X穫 box', 'X穫 c廕� 2 �廕吟', 'X穫 2 �廕吟'].includes(r.tinhTrang)) {
            isRepair = true;
        }
        
        if (isTP) {
            sizeStats[r.loaiOng].ok += count;
            dateStats[r.ngay].ok += count;
        }
        if (isFail) {
            sizeStats[r.loaiOng].fail += count;
            dateStats[r.ngay].fail += count;
        }
        if (isRepair) {
            sizeStats[r.loaiOng].repair += count;
            dateStats[r.ngay].repair += count;
        }
    });
    
    Object.keys(sizeStats).forEach(s => sizeStats[s].total = sizeStats[s].ok + sizeStats[s].fail + sizeStats[s].repair);
    Object.keys(dateStats).forEach(d => dateStats[d].total = dateStats[d].ok + dateStats[d].fail + dateStats[d].repair);

    // Top counters
    const elMonth = document.getElementById('stat-month'); if(elMonth) elMonth.textContent = monthCount;
    const elMonthSub = document.getElementById('stat-month-sub'); if(elMonthSub) elMonthSub.textContent = `${monthReports} b獺o c獺o`;
    
    const elToday = document.getElementById('stat-today'); if(elToday) elToday.textContent = todayCount;
    const elTodaySub = document.getElementById('stat-today-sub'); if(elTodaySub) elTodaySub.textContent = `${todayReports} b獺o c獺o h繫m nay`;
    
    const elTotal = document.getElementById('stat-total'); if(elTotal) elTotal.textContent = totalCount;
    const elTotalSub = document.getElementById('stat-total-sub'); if(elTotalSub) elTotalSub.textContent = `${historyData.length} b獺o c獺o`;
    
    const elOk = document.getElementById('stat-ok'); if(elOk) elOk.textContent = okCount;
    const elFail = document.getElementById('stat-fail'); if(elFail) elFail.textContent = failCount;
    const elRepair = document.getElementById('stat-repair'); if(elRepair) elRepair.textContent = repairCount;
    
    // Update op summary
    const opSumEl = document.getElementById('op-summary');
    if (opSumEl) {
        opSumEl.innerHTML = '';
        Object.keys(opStats).sort(sortOps).forEach(op => {
            const div = document.createElement('div');
            div.className = 'summary-card';
            div.innerHTML = `<div class="title">${op}</div><div class="val">${opStats[op].count} <small>廙𤉋g</small></div>`;
            opSumEl.appendChild(div);
        });
    }
    
    // Update recent
    const recentEl = document.getElementById('recent-reports');
    if (recentEl) {
        recentEl.innerHTML = '';
        recent.forEach(r => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.innerHTML = `
                <div class="recent-icon">��</div>
                <div class="recent-details">
                    <div class="recent-title">${r.nguyenCong} - ${r.loaiOng}</div>
                    <div class="recent-meta">${formatDate(r.ngay)} �� ${r.nguoi1}</div>
                </div>
                <div class="recent-status status-${r.tinhTrang==='�廕﹀'?'ok':'fail'}">${r.tinhTrang}</div>
            `;
            recentEl.appendChild(item);
        });
    }
    
    // --- TABLES ---
    
    // 1. table-avg-body (Trung b穫nh s廙� 廙𤉋g/ng�y)
    const tAvg = document.getElementById('table-avg-body');
    if (tAvg) {
        tAvg.innerHTML = '';
        Object.keys(opStats).sort(sortOps).forEach((op, i) => {
            const data = opStats[op];
            const avg = data.days.size > 0 ? (data.count / data.days.size).toFixed(1) : 0;
            tAvg.innerHTML += `<tr><td>${i+1}</td><td>${op}</td><td>${data.count}</td><td>${avg}</td></tr>`;
        });
    }
    
    // 2. table-size-body (Theo Size 廙𤉋g)
    const tSize = document.getElementById('table-size-body');
    if (tSize) {
        tSize.innerHTML = '';
        const monthlyPlan = {};
        if (typeof planData !== 'undefined') {
            Object.keys(planData).forEach(day => {
                if(day.startsWith(currentMonth)) {
                    Object.entries(planData[day]).forEach(([s, val]) => {
                        monthlyPlan[s] = (monthlyPlan[s] || 0) + val;
                    });
                }
            });
        }
        
        const fc = (n) => n === 0 ? '-' : n;
        Object.entries(sizeStats).sort((a,b) => b[1].total - a[1].total).forEach(([size, data]) => {
            const kh = monthlyPlan[size] || 0;
            let pVal = kh > 0 ? Math.round((data.ok / kh) * 100) : (data.ok > 0 ? 100 : 0);
            const percentStr = pVal === 0 ? '-' : pVal + '%';
            tSize.innerHTML += `<tr>
                <td style="font-weight: 600;">${size}</td>
                <td style="font-weight: bold; color: var(--primary-color);">${fc(kh)}</td>
                <td style="font-weight: 600;">${fc(data.total)}</td>
                <td style="font-weight: 600; color:green">${fc(data.ok)}</td>
                <td style="font-weight: 600; color:orange">${fc(data.repair)}</td>
                <td style="font-weight: 600; color:red">${fc(data.fail)}</td>
                <td style="font-weight: bold;">${percentStr}</td>
            </tr>`;
        });
    }
    
    // 3. table-date-body (Theo ng�y)
    const tDate = document.getElementById('table-date-body');
    if (tDate) {
        tDate.innerHTML = '';
        const fc = (n) => n === 0 ? '-' : n;
        Object.entries(dateStats).sort((a,b) => new Date(b[0]) - new Date(a[0])).slice(0, 10).forEach(([date, data]) => {
            const dayPlan = (typeof planData !== 'undefined' && planData[date]) ? planData[date] : {};
            let khTotal = 0;
            Object.values(dayPlan).forEach(v => khTotal += v);
            let pVal = khTotal > 0 ? Math.round((data.ok / khTotal) * 100) : (data.ok > 0 ? 100 : 0);
            const percentStr = pVal === 0 ? '-' : pVal + '%';
            tDate.innerHTML += `<tr><td style="font-weight: 600;">${formatDate(date)}</td><td style="font-weight: bold; color: var(--primary-color);">${fc(khTotal)}</td><td style="font-weight: 600;">${fc(data.total)}</td><td style="font-weight: 600; color:green">${fc(data.ok)}</td><td style="font-weight: 600; color:orange">${fc(data.repair)}</td><td style="font-weight: 600; color:red">${fc(data.fail)}</td><td style="font-weight: bold;">${percentStr}</td></tr>`;
        });
    }
    
    // 4. table-errors-body (Th廙𤉋g k礙 m瓊 l廙𡟙)
    const tErr = document.getElementById('table-errors-body');
    if (tErr) {
        tErr.innerHTML = '';
        Object.entries(errorStats).sort((a,b) => b[1] - a[1]).forEach(([err, count], i) => {
            const pct = failCount > 0 ? Math.round((count / failCount) * 100) + '%' : '0%';
            tErr.innerHTML += `<tr><td>${i+1}</td><td style="text-align: left;"><span style="color:red">${err}</span></td><td>${count}</td><td>${pct}</td></tr>`;
        });
    }
    
    // --- CHARTS ---
    if (typeof Chart !== 'undefined') {
        const ctxStatus = document.getElementById('chart-status');
        if (ctxStatus) {
            const statusData = [okCount, failCount, repairCount];
            if (statusChart) {
                statusChart.data.datasets[0].data = statusData;
                statusChart.update();
            } else {
                statusChart = new Chart(ctxStatus, {
                    type: 'doughnut',
                    data: {
                        labels: ['�廕﹀', 'H廙萏g (Lo廕【)', 'C廕吵 s廙苔 ch廙畝'],
                        datasets: [{
                            data: statusData,
                            backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
                        }]
                    },
                    plugins: [ChartDataLabels],
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                            datalabels: {
                                formatter: (value, ctx) => {
                                    let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    if (sum === 0 || value === 0) return '';
                                    return Math.round(value * 100 / sum) + '%';
                                },
                                color: '#fff',
                                font: {
                                    weight: 'bold',
                                    size: 13
                                }
                            }
                        }
                    }
                });
            }
        }
        
        const ctxOp = document.getElementById('chart-operations');
        if (ctxOp) {
            const opLabels = Object.keys(opStats).sort(sortOps);
            const opData = opLabels.map(op => opStats[op].count);
            if (operationsChart) {
                operationsChart.data.labels = opLabels;
                operationsChart.data.datasets[0].data = opData;
                operationsChart.update();
            } else {
                operationsChart = new Chart(ctxOp, {
                    type: 'bar',
                    data: {
                        labels: opLabels,
                        datasets: [{
                            label: 'S廙� l⑹廙τg 廙𤉋g',
                            data: opData,
                            backgroundColor: '#3b82f6',
                            borderRadius: 4,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true } },
                        plugins: {
                            datalabels: {
                                display: false
                            }
                        }
                    }
                });
            }
        }
    }
}


// --- PLAN SETTINGS LOGIC ---
let planData = {};
const commonSizes = ['�60', '�73', '�73 NVTL', '�89', '�89 NVTL', '�114', '�114 NVTL'];

function openPlanModal() {
    const modal = document.getElementById('modal-plan');
    if(modal) {
        modal.style.display = 'flex';
        const todayStr = new Date().toISOString().slice(0, 10);
        const dateInput = document.getElementById('plan-date-input');
        if(dateInput) {
            dateInput.value = todayStr;
            loadPlanForDate();
        }
    }
}

function loadPlanForDate() {
    const month = document.getElementById('plan-date-input').value;
    if (!month) return;
    
    const container = document.getElementById('plan-form');
    container.innerHTML = '';
    
    const monthPlan = planData[month] || {};
    
    let sizes = new Set(commonSizes);
    historyData.forEach(r => {
        if(r.loaiOng) sizes.add(r.loaiOng);
    });
    Object.keys(monthPlan).forEach(s => sizes.add(s));
    
    const sortedSizes = Array.from(sizes).sort();
    
    sortedSizes.forEach(size => {
        const val = monthPlan[size] || 0;
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="width: 120px;">${size}</label>
                <input type="number" class="form-control plan-input-size" data-size="${size}" value="${val}" style="flex: 1;" min="0">
            </div>
        `;
    });
}

function savePlan() {
    const dateVal = document.getElementById('plan-date-input').value;
    if (!dateVal) return alert('Vui l簷ng ch廙㤔 ng�y!');
    
    const inputs = document.querySelectorAll('.plan-input-size');
    const dayPlan = {};
    inputs.forEach(input => {
        const val = parseInt(input.value) || 0;
        if(val > 0) {
            dayPlan[input.getAttribute('data-size')] = val;
        }
    });
    
    planData[dateVal] = dayPlan;
    localStorage.setItem('nkt_plan', JSON.stringify(planData));
    alert('�瓊 l⑹u k廕� ho廕︷h ng�y ' + dateVal);
    closeModal('modal-plan');
    updateDashboard();
    renderPlanTable();
}

function renderPlanTable() {
    const tPlan = document.getElementById('table-plan-body');
    const monthInput = document.getElementById('plan-display-month');
    if (!tPlan || !monthInput) return;
    
    let month = monthInput.value;
    if (!month) {
        month = new Date().toISOString().slice(0, 7);
        monthInput.value = month;
    }
    
    const daysData = {};
    
    Object.keys(planData).forEach(day => {
        if(day.startsWith(month)) {
            if(!daysData[day]) daysData[day] = {};
            Object.entries(planData[day]).forEach(([s, val]) => {
                if(!daysData[day][s]) daysData[day][s] = { kh: 0, st: { total: 0, ok: 0, fail: 0, repair: 0 } };
                daysData[day][s].kh = val;
            });
        }
    });
    
    historyData.forEach(r => {
        if (r.ngay && r.ngay.startsWith(month) && r.loaiOng) {
            const day = r.ngay;
            const size = r.loaiOng;
            if(!daysData[day]) daysData[day] = {};
            if(!daysData[day][size]) daysData[day][size] = { kh: 0, st: { total: 0, ok: 0, fail: 0, repair: 0 } };
            
            const count = parseInt(r.soOngCount) || 1;
            
            let isTP = false, isFail = false, isRepair = false;
            
            if (r.tinhTrang === '�廕﹀' && r.nguyenCong && r.nguyenCong.toLowerCase() === '矇p th廙囤 l廙帷') {
                isTP = true;
            } else if (r.tinhTrang && r.tinhTrang.toLowerCase().includes('lo廕【')) {
                isFail = true;
            } else if (r.tinhTrang && ['H廙萏g ren', 'H廙萏g coupling', 'X穫 pin', 'X穫 box', 'X穫 c廕� 2 �廕吟', 'X穫 2 �廕吟'].includes(r.tinhTrang)) {
                isRepair = true;
            }
            
            if (isTP) daysData[day][size].st.ok += count;
            if (isFail) daysData[day][size].st.fail += count;
            if (isRepair) daysData[day][size].st.repair += count;
            
            daysData[day][size].st.total = daysData[day][size].st.ok + daysData[day][size].st.fail + daysData[day][size].st.repair;
        }
    });
    
    let html = '';
    
    const fc = (n) => n === 0 ? '-' : n;
    Object.keys(daysData).sort((a,b) => new Date(b) - new Date(a)).forEach(day => {
        Object.keys(daysData[day]).sort().forEach(size => {
            const { kh, st } = daysData[day][size];
            let pVal = kh > 0 ? Math.round((st.ok / kh) * 100) : (st.ok > 0 ? 100 : 0);
            const percentStr = pVal === 0 ? '-' : pVal + '%';
            html += `<tr>
                <td style="font-weight: 600;">${formatDate(day)}</td>
                <td style="font-weight: 600;">${size}</td>
                <td style="font-weight: bold; color: var(--primary-color);">${fc(kh)}</td>
                <td style="font-weight: 600;">${fc(st.total)}</td>
                <td style="font-weight: 600; color: green;">${fc(st.ok)}</td>
                <td style="font-weight: 600; color: orange;">${fc(st.repair)}</td>
                <td style="font-weight: 600; color: red;">${fc(st.fail)}</td>
                <td style="font-weight: bold;">${percentStr}</td>
                <td>
                    <button class="btn btn-sm btn-outline" style="padding: 2px 6px; font-size: 12px; margin-right: 4px;" onclick="editPlan('${day}')">S廙苔</button>
                    <button class="btn btn-sm btn-danger" style="padding: 2px 6px; font-size: 12px;" onclick="deletePlan('${day}', '${size}')">X籀a</button>
                </td>
            </tr>`;
        });
    });
    
    if (html === '') {
        html = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">Ch⑹a c籀 k廕� ho廕︷h ho廕搾 d廙� li廙杮 cho th獺ng n�y</td></tr>`;
    }
    
    tPlan.innerHTML = html;
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
}

function editPlan(date) {
    const modal = document.getElementById('modal-plan');
    if(modal) {
        modal.style.display = 'flex';
        const dateInput = document.getElementById('plan-date-input');
        if(dateInput) {
            dateInput.value = date;
            loadPlanForDate();
        }
    }
}

function deletePlan(date, size) {
    if(!planData[date] || !planData[date][size]) return;
    if(confirm(`B廕》 c籀 ch廕畚 ch廕疸 mu廙𤉋 x籀a k廕� ho廕︷h c廙吧 size ${size} trong ng�y ${formatDate(date)}?`)) {
        delete planData[date][size];
        if(Object.keys(planData[date]).length === 0) {
            delete planData[date];
        }
        localStorage.setItem('nkt_plan', JSON.stringify(planData));
        updateDashboard();
        renderPlanTable();
    }
}

// --- TEMPORARY JUNE MIGRATION ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!localStorage.getItem('imported_june_done_v2')) {
            try {
                const importedData = [
  {
    "id": 1781531230219,
    "ngay": "2026-06-07",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4279, 4282, 4284, 4287, 4349-4350, 4360-4362, 4368, 4374",
    "soOngCount": 11,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230220,
    "ngay": "2026-06-10",
    "ca": "1",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4283",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230221,
    "ngay": "2026-06-12",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4283, 4291",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230222,
    "ngay": "2026-06-05",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4285",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230223,
    "ngay": "2026-06-09",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4294, 4339, 4354, 4363, 4366",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230224,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4241",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230225,
    "ngay": "2026-06-07",
    "ca": "2",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4326",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230226,
    "ngay": "2026-06-03",
    "ca": "1",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4339, 4366",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230227,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4375, 4384, 4708, 4716, 4725, 4728, 4774-4775, 4810, 4996, 5051-5054, 5056-5058, 5060-5062, 5065, 5067, 5360-5361, 5531, 5552",
    "soOngCount": 26,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230228,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4375, 4384, 4708, 4716, 4725, 4728, 4774-4775, 4810, 4996, 5051-5054, 5056-5058, 5060-5062, 5065, 5067, 5236, 5360-5361, 5512, 5531, 5552",
    "soOngCount": 28,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230229,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4380-4383, 4886, 5059, 5340, 5344-5350, 5352-5354, 5357, 5362-5363, 5367, 5371-5373, 5375-5377, 5379-5388, 5390-5398, 5402",
    "soOngCount": 47,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230230,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4383, 4820, TR1_0306, TR2_0306, TR3_0306",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230231,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4536, 5235",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230232,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4603, 4712-4713, 4723, 5190-5192",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "161TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230233,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4603, 4636, 4691, 4698, 4707, 4712-4713, 4715, 4717-4719, 4723, 5190-5192, 5194-5197, 5199-5201",
    "soOngCount": 22,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230234,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4603, 4691, 4698, 4715",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230235,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4691, 4698, 4707, 4715, 4717, 5194-5197, 5199-5201",
    "soOngCount": 12,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "161TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230236,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4712-4713, 4717-4719",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230237,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4716, 4725, 4775, 5057, 5335, 5358, 5360-5361, 5368, 5374, 5389, 5399, 5401, 5440",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230238,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4866-4880, 4882-4885, 4887-4897",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230239,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4869-4880, 4882-4885, 4887-4897",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "154TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230240,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4881",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230241,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4886",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230242,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4898-4903",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "158TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230243,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4898-4903, 4986-4988, 4990-4995, 4997-5000, 5049-5050, 5064, 5066, 5068-5070, 5072-5074, 5076",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230244,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4904-4929, 4931",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "155TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230245,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4904-4929, 4931, 4934-4966",
    "soOngCount": 60,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230246,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "4916-4929, 4931-4946",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230247,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4924-4929, 4931-4968",
    "soOngCount": 44,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230248,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4930",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "KTN",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230249,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "4931-4976",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230250,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4932-4933",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "HCL",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230251,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "4933-4982",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230252,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4934-4936",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "155TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230253,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4937-4966",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "156TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230254,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "4947-5000, 5049-5055, 5057, 5059, 5064, 5066",
    "soOngCount": 65,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230255,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4967-4983",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "157TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230256,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4967-4983",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230257,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4969-5000, 5049-5062, 5064-5066",
    "soOngCount": 49,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L礙 V�n T羅ng",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230258,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "4977-5000, 5049-5080",
    "soOngCount": 56,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230259,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "4983-5000, 5049-5067",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230260,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "4984-5000",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C5",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230261,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4984",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230262,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4985, 4989, 5088, 5098",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230263,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4986-4988, 4990-4995, 4997-5000, 5049-5050, 5064, 5066, 5068-5070, 5072-5074, 5076",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "158TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230264,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5001-5048",
    "soOngCount": 48,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C3",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "RT",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230265,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5001-5048",
    "soOngCount": 48,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "THK",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230266,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5049-5075",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C4",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230267,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5055, 5059, 5071, 5075, 5083, 5085-5086, 5091-5092",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230268,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5056, 5058, 5060-5062, 5065",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230269,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5063, 5103-5132",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L礙 V�n T羅ng",
    "nguoi2": "",
    "tinhTrang": "THK",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230270,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5067-5088, 5090-5095, 5097-5100, 5133-5162, 5164-5166",
    "soOngCount": 65,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230271,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5067, 5071, 5075, 5086, 5088, 5098",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230272,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5068-5102",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230273,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5068-5070, 5072-5074, 5076-5085, 5087, 5090-5095, 5097, 5099-5100, 5133-5162, 5164-5166",
    "soOngCount": 59,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230274,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5076-5102",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C1",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230275,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5077-5082, 5084, 5087, 5090, 5093-5095, 5097, 5099-5100, 5133-5139",
    "soOngCount": 22,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "159TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230276,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5077-5082, 5084, 5087, 5090-5091, 5093-5095, 5097, 5099-5100, 5133-5162, 5164-5165, 5169, 5171, 5176, 5179, 5181-5185, 5187-5189",
    "soOngCount": 60,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230277,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5089, 5096, 5101-5102, 5163",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "THK",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230278,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5103-5132",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C2",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "RT",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230279,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5133-5162",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C7",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230280,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5133-5163",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230281,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5133-5177",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230282,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5140-5146",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "159TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230283,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5147-5162, 5164-5165, 5169, 5171, 5176, 5179, 5181-5185, 5187-5189",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "160TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230284,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5163-5192",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C6",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230285,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5166-5168, 5170, 5172-5173, 5175, 5177-5178",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230286,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5167-5173, 5175-5179, 5181-5185, 5187-5205",
    "soOngCount": 36,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230287,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5174, 5180, 5186",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "THK",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230288,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5178-5226",
    "soOngCount": 49,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230289,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5180",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230290,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "TR1_0206, TR2_0206, TR1_0106",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230291,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5193-5222",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C8",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230292,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5193-5212",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230293,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5198, 5202, 5212, 5221-5225",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230294,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5203-5211, 5213-5220, 5227, 5229, 5233",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "163TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230295,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5203-5211, 5213-5220, 5227, 5229, 5233, 5257-5293, 5296, 5314-5331, 5333-5334, 5336-5337, 5341, 5343",
    "soOngCount": 82,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230296,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5206-5225, 5227-5229, 5231, 5233-5236, 5249, 5252, 5257-5278",
    "soOngCount": 52,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230297,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5206-5225, 5227-5229, 5231, 5233-5236, 5257-5258",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230298,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5213-5243",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230299,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5223-5256",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C9",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230300,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5226, 5230, 5232, 5237-5248, 5250-5251, 5253-5256",
    "soOngCount": 21,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "RT",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230301,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5227-5247, 5249, 5251-5252, 5256-5287",
    "soOngCount": 56,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230302,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5228, 5231, 5234",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230303,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5236",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "KH�C",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230304,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5244-5273",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230305,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5248, 5250, 5253-5255",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "T廕哽",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230306,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5249, 5252",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230307,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5249, 5252, 5295, 5335",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230308,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5257-5289",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26F1",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230309,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5257-5266",
    "soOngCount": 10,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "163TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230310,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5267-5293, 5296, 5331, 5333-5334, 5336-5337, 5341, 5343",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "164TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230311,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5274-5307",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230312,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5279-5293, 5295-5296, 5314-5363",
    "soOngCount": 67,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230313,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5279-5293, 5295-5296, 5314-5357, 5359-5363",
    "soOngCount": 66,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230314,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5288-5372",
    "soOngCount": 85,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230315,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5290-5313",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C10",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230316,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5294, 5297-5313",
    "soOngCount": 18,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "RT",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230317,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5308-5354",
    "soOngCount": 47,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230318,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5314-5330",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26B27",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230319,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5331-5370",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "11/25A5",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230320,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5332, 5338-5340, 5342",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230321,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5344-5350",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "165TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230322,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5355-5389",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230323,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5358",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "HR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230324,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5364-5426",
    "soOngCount": 63,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230325,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5371-5402",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "11/25A7",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230326,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5373-5430",
    "soOngCount": 58,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230327,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5390-5412",
    "soOngCount": 23,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230328,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5403-5442",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G10",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230329,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5406-5426",
    "soOngCount": 21,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V⑹①ng �廙妾 Tr廙㤔g",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230330,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5406, 5410-5413, 5415-5426, 5428, 5430-5432, 5436, 5443-5444, 5446-5447, 5450-5452, 5454, 5466-5467, 5474, 5476",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230331,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5407, 5427, 5434, 5437, 5445, 5458, 5461, 5468, 5479",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "167TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230332,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5407, 5427, 5434, 5437, 5445, 5458, 5461, 5468, 5479",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230333,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5408-5409, 5429, 5435, 5438, 5440-5442, 5448, 5453, 5455-5457, 5460, 5462-5465, 5473, 5475, 5477-5478, 5480",
    "soOngCount": 23,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230334,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5413-5443",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230335,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5414, 5459, 5469",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "KH�C",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230336,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5427-5448, 5450-5484",
    "soOngCount": 57,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230337,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5427-5437, 5439, 5442-5443, 5445, 5448, 5451-5453, 5455-5457, 5468-5473, 5475, 5477-5480",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230338,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5431-5448, 5450-5484",
    "soOngCount": 53,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230339,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5433, 5439, 5470-5472",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "XP,XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230340,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5438, 5440-5441, 5444",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230341,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5443-5472",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G6",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230342,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5444-5476",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230343,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5446-5447",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR,HCL",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230344,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5449",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "THK",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230345,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5450, 5454, 5467, 5474, 5476",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HCL",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230346,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5464, 5475, 5478, 5480, 5481, 5482, 5483, 5484, 5486, 5487, 5488, 5495, TR1_1106",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230347,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5473-5512",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G8",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230348,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5477-5507",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230349,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5481, 5483, 5487-5490, 5492-5493, 5497-5499, 5501, 5504, 5506-5507, 5510, 5512-5544, 5546",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230350,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5481-5488, 5493, 5496-5498, 5501, 5507-5508",
    "soOngCount": 15,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230351,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5482, 5484-5486, 5496, 5508, 5545",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230352,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5485-5552",
    "soOngCount": 68,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230353,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5485-5546",
    "soOngCount": 62,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230354,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5489, 5494, 5502-5504, 5506, 5514-5517, 5522-5524, 5527",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XP,XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230355,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5490-5492, 5495, 5499-5500, 5505, 5509-5511, 5513, 5518-5521, 5525-5526, 5528-5529",
    "soOngCount": 19,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230356,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5491, 5494-5495, 5500, 5502, 5505, 5509, 5511",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HCL",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230357,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5503",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "HR,HCL",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230358,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5508-5538",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230359,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5512",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230360,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5513-5552",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G5",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230361,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5530, 5533-5534, 5536-5540, 5543-5544, 5549-5551, 5554",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XP,XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230362,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5532, 5535, 5541-5542, 5545-5548, 5553, 5555-5556",
    "soOngCount": 11,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230363,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5539-5552",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230364,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5553-5566, 5568-5573",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G9",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230365,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5553-5566, 5568-5598",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230366,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5553-5566, 5568-5598",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230367,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5557-5618",
    "soOngCount": 62,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230368,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5557",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XP",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230369,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5558, 5563-5564, 5566, 5570-5573, 5580, 5582, 5590-5591, 5593",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230370,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5559-5562, 5565, 5568-5569, 5574-5579, 5581, 5583-5586, 5589, 5592, 5594-5614",
    "soOngCount": 41,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "XP,XB",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230371,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5561-5592",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230372,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5567",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G9",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "LOAI",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230373,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5574-5613",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G1",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230374,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5593-5629",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230375,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5599-5644",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230376,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5614-5653",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G2",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230377,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5630-5653",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230378,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5654-5693",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G3",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230379,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5654-5683",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  },
  {
    "id": 1781531230380,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5694-5728",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B2",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel (Th獺ng 6)"
  }
];
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                // Remove overlapping old manual inputs from June 1 to June 12
                history = history.filter(r => {
                    if (!r.ngay) return true;
                    if (r.ngay >= '2026-06-01' && r.ngay <= '2026-06-12') return false;
                    return true;
                });
                
                history = [...importedData, ...history];
                
                // Sort by date descending
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v2', 'true');
                alert('H廙� th廙𤉋g �瓊 t廙� �廙㷌g nh廕計 162 b廕τ ghi t廙� ng�y 01/06 �廕積 12/06 v�o ph廕吵 m廙� th�nh c繫ng!');
                window.location.reload();
            } catch(e) {
                console.error('L廙𡟙 khi import:', e);
            }
        }
    }, 1000);
});

// --- TEMPORARY JUNE MIGRATION PART 2 ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!localStorage.getItem('imported_june_done_v3')) {
            try {
                const importedData = [
  {
    "id": 1781533901007,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5075, 5085, 5092, 5167, 5170-5171, 5173, 5212, 5221-5225, 5495",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901008,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5168, 5249, 5379, 5389, 5399, 5401, 5408-5409, 5429, 5435, 5441, 5448, 5453, 5455-5457, 5460, 5462, 5464-5465, 5481, 5483, 5485, 5487-5488, 5496, 5498, 5501, 5507-5508",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901009,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5235, 5295, 5300-5303, 5306-5313, 5449, 5733, 5738, 5773-5789",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "V23",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901010,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5389",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "169TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901011,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5440, 5655-5658, 5660-5661, 5663-5665, 5667, 5677-5678, 5681, 5684, 5686-5687, 5701, 5704-5707, 5710, 5712-5717, 5719-5722, 5724, 5726",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901012,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5654, 5659, 5662, 5666, 5668-5676, 5679-5680, 5682-5683, 5685, 5688-5693, 5695-5700, 5703, 5708-5709, 5711, 5718, 5723, 5725",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901013,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5668-5680, 5694-5700, 5702-5703, 5705, 5711, 5717-5718, 5720-5726",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901014,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5681-5693, 5701, 5704, 5706-5710, 5712-5716, 5719, 5727",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901015,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5682-5736",
    "soOngCount": 55,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901016,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5694, 5702",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901017,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5696-5724, 5726-5749, 5751-5756",
    "soOngCount": 59,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901018,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5720-5744",
    "soOngCount": 25,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901019,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5725",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "KHAC",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901020,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5729-5743",
    "soOngCount": 15,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B1",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901021,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5744-5749, 5751-5772",
    "soOngCount": 28,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B3",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901022,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5745-5749, 5751-5772, 5790-5794",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901023,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5750",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B3",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901024,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5773-5789",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B4",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901025,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5790-5807",
    "soOngCount": 18,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B4",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901026,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5795-5807",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901027,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5808-5821",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26A3",
    "khoang": "X2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  },
  {
    "id": 1781533901028,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5822-5856",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26A2",
    "khoang": "X2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update"
  }
];
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                // Remove overlapping old manual inputs from June 13 to June 31
                history = history.filter(r => {
                    if (!r.ngay) return true;
                    if (r.ngay >= '2026-06-13' && r.ngay <= '2026-06-31') return false;
                    return true;
                });
                
                history = [...importedData, ...history];
                
                // Sort by date descending
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v3', 'true');
                alert('H廙� th廙𤉋g �瓊 t廙� �廙㷌g b廙� sung th礙m 22 b廕τ ghi b獺o c獺o t廙� ng�y 13/06 �廕積 cu廙魀 th獺ng 6 theo b廕τg m瓊 l廙𡟙 m廙𢹂!');
                window.location.reload();
            } catch(e) {
                console.error('L廙𡟙 khi import:', e);
            }
        }
    }, 1500);
});

// --- TEMPORARY JUNE MIGRATION FIX P1 ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!localStorage.getItem('imported_june_done_v4')) {
            try {
                const importedData = [
  {
    "id": 1781534491735,
    "ngay": "2026-06-07",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4279, 4282, 4284, 4287, 4349-4350, 4360-4362, 4368, 4374",
    "soOngCount": 11,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491736,
    "ngay": "2026-06-10",
    "ca": "1",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4283",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491737,
    "ngay": "2026-06-12",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4283, 4291",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491738,
    "ngay": "2026-06-05",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4285",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491739,
    "ngay": "2026-06-09",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4294, 4339, 4354, 4363, 4366",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491740,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4241",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491741,
    "ngay": "2026-06-07",
    "ca": "2",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4326",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491742,
    "ngay": "2026-06-03",
    "ca": "1",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4339, 4366",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491743,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4375, 4384, 4708, 4716, 4725, 4728, 4774-4775, 4810, 4996, 5051-5054, 5056-5058, 5060-5062, 5065, 5067, 5360-5361, 5531, 5552",
    "soOngCount": 26,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491744,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4375, 4384, 4708, 4716, 4725, 4728, 4774-4775, 4810, 4996, 5051-5054, 5056-5058, 5060-5062, 5065, 5067, 5236, 5360-5361, 5512, 5531, 5552",
    "soOngCount": 28,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491745,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4380-4383, 4886, 5059, 5340, 5344-5350, 5352-5354, 5357, 5362-5363, 5367, 5371-5373, 5375-5377, 5379-5388, 5390-5398, 5402",
    "soOngCount": 47,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491746,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4383, 4820, TR1_0306, TR2_0306, TR3_0306",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491747,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4536",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491748,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4603, 4712-4713, 4723, 5190-5192",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "161TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491749,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4603, 4636, 4691, 4698, 4707, 4712-4713, 4715, 4717-4719, 4723, 5190-5192, 5194-5197, 5199-5201",
    "soOngCount": 22,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491750,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4603, 4691, 4698, 4715",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491751,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4691, 4698, 4707, 4715, 4717, 5194-5197, 5199-5201",
    "soOngCount": 12,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "161TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491752,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4712-4713, 4717-4719",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491753,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4716, 4725, 4775, 5057, 5335, 5358, 5360-5361, 5368, 5374, 5389, 5399, 5401, 5440",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491754,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4866-4880, 4882-4885, 4887-4897",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491755,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4869-4880, 4882-4885, 4887-4897",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "154TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491756,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4881",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491757,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4886",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491758,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4898-4903",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "158TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491759,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4898-4903, 4986-4988, 4990-4995, 4997-5000, 5049-5050, 5064, 5066, 5068-5070, 5072-5074, 5076",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491760,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4904-4929, 4931",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "155TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491761,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4904-4929, 4931, 4934-4966",
    "soOngCount": 60,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491762,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "4916-4929, 4931-4946",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491763,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4924-4929, 4931-4968",
    "soOngCount": 44,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491764,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4930",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Khuy廕篙 t廕負 ngang (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491765,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "4931-4976",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491766,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4932-4933",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491767,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "4933-4982",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491768,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4934-4936",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "155TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491769,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4937-4966",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "156TP5.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491770,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "4947-5000, 5049-5055, 5057, 5059, 5064, 5066",
    "soOngCount": 65,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491771,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4967-4983",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "157TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491772,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4967-4983",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491773,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4969-5000, 5049-5062, 5064-5066",
    "soOngCount": 49,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L礙 V�n T羅ng",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491774,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "4977-5000, 5049-5080",
    "soOngCount": 56,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491775,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "4983-5000, 5049-5067",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491776,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "4984-5000",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C5",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491777,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4984",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491778,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4985, 4989, 5088, 5098",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491779,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4986-4988, 4990-4995, 4997-5000, 5049-5050, 5064, 5066, 5068-5070, 5072-5074, 5076",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "158TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491780,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5001-5048",
    "soOngCount": 48,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C3",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491781,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5001-5048",
    "soOngCount": 48,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491782,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5049-5075",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C4",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491783,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5055, 5059, 5071, 5075, 5083, 5085-5086, 5091-5092",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491784,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5056, 5058, 5060-5062, 5065",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491785,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5063, 5103-5132",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L礙 V�n T羅ng",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491786,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5067-5088, 5090-5095, 5097-5100, 5133-5162, 5164-5166",
    "soOngCount": 65,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491787,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5067, 5071, 5075, 5086, 5088, 5098",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491788,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5068-5102",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491789,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5068-5070, 5072-5074, 5076-5085, 5087, 5090-5095, 5097, 5099-5100, 5133-5162, 5164-5166",
    "soOngCount": 59,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491790,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5076-5102",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C1",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491791,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5077-5082, 5084, 5087, 5090, 5093-5095, 5097, 5099-5100, 5133-5139",
    "soOngCount": 22,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "159TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491792,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5077-5082, 5084, 5087, 5090-5091, 5093-5095, 5097, 5099-5100, 5133-5162, 5164-5165, 5169, 5171, 5176, 5179, 5181-5185, 5187-5189",
    "soOngCount": 60,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491793,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5086, 5166, 5168, 5172, 5473, 5477, 5485, 5497-5498, 5501, 5507-5508, 5535",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491794,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5089, 5096, 5101-5102, 5163",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491795,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5103-5132",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C2",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491796,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5133-5162",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C7",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491797,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5133-5163",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491798,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5133-5177",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491799,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5140-5146",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "159TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491800,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5147-5162, 5164-5165, 5169, 5171, 5176, 5179, 5181-5185, 5187-5189",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "160TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491801,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5163-5192",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C6",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491802,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5166-5168, 5170, 5172-5173, 5175, 5177-5178",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491803,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5167-5173, 5175-5179, 5181-5185, 5187-5205",
    "soOngCount": 36,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491804,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5174, 5180, 5186",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491805,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5178-5226",
    "soOngCount": 49,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491806,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5180",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491807,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "TR1_0206, TR2_0206, TR1_0106",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491808,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5193-5222",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C8",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491809,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5193-5212",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491810,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5198, 5202, 5212, 5221-5225",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491811,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5203-5211, 5213-5220, 5227, 5229, 5233",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "163TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491812,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5203-5211, 5213-5220, 5227, 5229, 5233, 5257-5293, 5296, 5314-5331, 5333-5334, 5336-5337, 5341, 5343",
    "soOngCount": 82,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491813,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5206-5225, 5227-5229, 5231, 5233-5234, 5236, 5249, 5252, 5257-5278",
    "soOngCount": 51,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491814,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5206-5225, 5227-5229, 5231, 5233-5236, 5257-5258",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491815,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5213-5243",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491816,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5223-5256",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C9",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491817,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5226, 5230, 5232, 5237-5248, 5250-5251, 5253-5256",
    "soOngCount": 21,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491818,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5227-5247, 5249, 5251-5252, 5256-5287",
    "soOngCount": 56,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491819,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5228, 5231, 5234",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491820,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5235, 5295",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491821,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5236",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491822,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5244-5273",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491823,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5248, 5250, 5253-5255",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "T廕哽",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491824,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5249, 5252",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491825,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5249, 5252, 5335",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491826,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5257-5289",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26F1",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491827,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5257-5266",
    "soOngCount": 10,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "163TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491828,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5267-5293, 5296, 5331, 5333-5334, 5336-5337, 5341, 5343",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "164TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491829,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5274-5307",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491830,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5279-5293, 5296, 5314-5363",
    "soOngCount": 66,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491831,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5279-5293, 5295-5296, 5314-5357, 5359-5363",
    "soOngCount": 66,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491832,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5288-5372",
    "soOngCount": 85,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491833,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5290-5313",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C10",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491834,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5294, 5297-5313",
    "soOngCount": 18,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491835,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5295",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "69H6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491836,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5308-5354",
    "soOngCount": 47,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491837,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5314-5330",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26B27",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491838,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5331-5370",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "11/25A5",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491839,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5332, 5338-5340, 5342",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491840,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5344-5350",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "165TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491841,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5355-5389",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491842,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5358",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491843,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5364-5426",
    "soOngCount": 63,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491844,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5371-5402",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "11/25A7",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491845,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5373-5430",
    "soOngCount": 58,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491846,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5390-5412",
    "soOngCount": 23,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491847,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5399, 5401, 5408-5409, 5429, 5435, 5448, 5453, 5455-5456, 5460, 5462, 5465",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "169TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491848,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5403-5442",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G10",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491849,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5403, 5438, 5441-5442, 5463, 5615, 5628, 5641",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491850,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5406-5426",
    "soOngCount": 21,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V⑹①ng �廙妾 Tr廙㤔g",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491851,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5406, 5410-5413, 5415-5426, 5428, 5430-5432, 5436, 5443-5444, 5446-5447, 5450-5452, 5454, 5466-5467, 5474, 5476",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491852,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5407, 5427, 5434, 5437, 5445, 5458, 5461, 5468, 5479",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "167TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491853,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5407, 5427, 5434, 5437, 5445, 5458, 5461, 5468, 5479",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491854,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5413-5443",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491855,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5414, 5459, 5469",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "KH�C",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491856,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5427-5448, 5450-5484",
    "soOngCount": 57,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491857,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5427-5437, 5439, 5442-5443, 5445, 5448, 5451-5453, 5455-5457, 5468-5473, 5475, 5477-5480",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491858,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5431-5448, 5450-5484",
    "soOngCount": 53,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491859,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5433, 5439, 5470-5472",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491860,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5438, 5440-5441, 5444",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491861,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5443-5472",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G6",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491862,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5444-5476",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491863,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5446-5447",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren v� coupling",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491864,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5449",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491865,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5450, 5454, 5467, 5474, 5476",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491866,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5457, 5464, 5473, 5475, 5477-5478, 5480",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491867,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5464, 5475, 5478, 5480, 5481, 5482, 5483, 5484, 5486, 5487, 5488, TR1_1106",
    "soOngCount": 12,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491868,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5473-5512",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G8",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491869,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5477-5507",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491870,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5481, 5483, 5487-5490, 5492-5493, 5497-5499, 5501, 5504, 5506-5507, 5510, 5512-5544, 5546",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491871,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5481-5488, 5493, 5496-5498, 5501, 5507-5508",
    "soOngCount": 15,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491872,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5482, 5484-5486, 5496, 5508, 5545",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491873,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5485-5552",
    "soOngCount": 68,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491874,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5485-5546",
    "soOngCount": 62,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491875,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5489, 5494, 5502-5504, 5506, 5514-5517, 5522-5524, 5527",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491876,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5490-5492, 5495, 5499-5500, 5505, 5509-5511, 5513, 5518-5521, 5525-5526, 5528-5529",
    "soOngCount": 19,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491877,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5491, 5494-5495, 5500, 5502, 5505, 5509, 5511",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491878,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5503",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren v� coupling",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491879,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5508-5538",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491880,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5512",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491881,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5513-5552",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G5",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491882,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5530, 5533-5534, 5536-5540, 5543-5544, 5549-5551, 5554",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491883,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5532, 5535, 5541-5542, 5545-5548, 5553, 5555-5556",
    "soOngCount": 11,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491884,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5539-5552",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491885,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5553-5566, 5568-5573",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G9",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491886,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5553-5566, 5568-5598",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491887,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5553-5566, 5568-5598",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491888,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5557-5618",
    "soOngCount": 62,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491889,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5557",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491890,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5558, 5563-5564, 5566, 5570-5573, 5580, 5582, 5590-5591, 5593",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491891,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5559-5562, 5565, 5568-5569, 5574-5579, 5581, 5583-5586, 5589, 5592, 5594-5614",
    "soOngCount": 41,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491892,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5561-5592",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491893,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5567",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G9",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "LOAI",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491894,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5574-5613",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G1",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491895,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5593-5629",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491896,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5599-5644",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491897,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5614-5653",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G2",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491898,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5616-5627, 5629-5640, 5642-5653",
    "soOngCount": 36,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491899,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5619-5681",
    "soOngCount": 63,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491900,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5630-5653",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491901,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5645-5695",
    "soOngCount": 51,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491902,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5654-5693",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G3",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491903,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5654-5684",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491904,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5685-5719",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  },
  {
    "id": 1781534491905,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5694-5728",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B2",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (Th獺ng 6 - P1)"
  }
];
                let history = JSON.parse(localStorage.getItem('nkt_history') || '[]');
                
                history = history.filter(r => {
                    if (!r.ngay) return true;
                    if (r.ngay >= '2026-06-01' && r.ngay <= '2026-06-12' && r.ghiChu && r.ghiChu.includes('Imported')) return false;
                    return true;
                });
                
                history = [...importedData, ...history];
                history.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
                
                localStorage.setItem('nkt_history', JSON.stringify(history));
                localStorage.setItem('imported_june_done_v4', 'true');
                alert('�瓊 c廕計 nh廕負 l廕【 m瓊 l廙𡟙 chu廕姊 cho c獺c b廕τ ghi t廙� 01/06 - 12/06!');
                window.location.reload();
            } catch(e) {
                console.error('L廙𡟙 khi import:', e);
            }
        }
    }, 2000);
});

// --- FULL JUNE MIGRATION SCRIPT V6 ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!localStorage.getItem('imported_june_done_v6')) {
            try {
                // Remove previous corrupted imports
                historyData = historyData.filter(r => !(r.ghiChu && r.ghiChu.includes('Imported from Excel')));
                
                const importedData = [
  {
    "id": 1781622215588,
    "ngay": "2026-06-07",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4279, 4282, 4284, 4287, 4349-4350, 4360-4362, 4368, 4374",
    "soOngCount": 11,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "166TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215589,
    "ngay": "2026-06-10",
    "ca": "1",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4283",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215590,
    "ngay": "2026-06-12",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4283, 4291",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215591,
    "ngay": "2026-06-05",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4285",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "161TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215592,
    "ngay": "2026-06-09",
    "ca": "1",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4294, 4339, 4354, 4363, 4366",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "167TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215593,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4241, 4375, 4384, 4708, 4716, 4725, 4728, 4774-4775, 4810, 4996, 5051-5054, 5056-5058, 5060-5062, 5065, 5067, 5360-5361, 5531, 5552",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215594,
    "ngay": "2026-06-07",
    "ca": "2",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4326",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "166TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215595,
    "ngay": "2026-06-03",
    "ca": "1",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4339, 4366",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215596,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4375, 4384, 4708, 4716, 4725, 4728, 4774-4775, 4810, 4996, 5051-5054, 5056-5058, 5060-5062, 5065, 5067, 5236, 5360-5361, 5512, 5531, 5552",
    "soOngCount": 28,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "168TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215597,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4380-4383, 4886, 5059, 5340, 5390-5398, 5402",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "166TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215598,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4383, 4820, TR1_0306, TR2_0306, TR3_0306",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215599,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4536, 4691, 4698, 4707, 4715, 4717, 5194-5197, 5199-5201, 5203-5211, 5213-5220, 5227, 5229, 5233",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215600,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4603, 4712-4713, 4723, 5140-5162, 5164-5165, 5169, 5171, 5176, 5179-5185, 5187-5192",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215601,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4603, 4636, 4691, 4698, 4707, 4712-4713, 4715, 4717-4719, 4723, 5190-5192, 5194-5197, 5199-5201",
    "soOngCount": 22,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "161TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215602,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4603, 4691, 4698, 4715",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215603,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4712-4713, 4717-4719",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215604,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "4716, 4725, 4775, 5057, 5335, 5358, 5360-5361, 5368, 5374, 5389, 5399, 5401, 5440",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215605,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4866-4880, 4882-4885, 4887-4897",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "154TP5.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215606,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4869-4880, 4882-4885, 4887-4929, 4931",
    "soOngCount": 60,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215607,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4881",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215608,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4886",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215609,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4898-4903, 4986-4988, 4990-4995, 4997-5000, 5049-5050, 5064, 5066, 5068-5070, 5072-5074, 5076",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "158TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215610,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4904-4929, 4931, 4934-4936",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "155TP5.26",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215611,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "4916-4929, 4931-4946",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215612,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4924-4929, 4931-4968",
    "soOngCount": 44,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215613,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4930",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Khuy廕篙 t廕負 ngang (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215614,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "4931-4976",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215615,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4932-4933",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215616,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "4933-4982",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215617,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4934-4983",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215618,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4937-4966",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "156TP5.26",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215619,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "4947-5000, 5049-5055, 5057, 5059, 5064, 5066",
    "soOngCount": 65,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215620,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "4967-4983",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "157TP6.26",
    "khoang": "X7",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215621,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "4969-5000, 5049-5062, 5064-5066",
    "soOngCount": 49,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L礙 V�n T羅ng",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215622,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "4977-5000, 5049-5080",
    "soOngCount": 56,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215623,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "4983-5000, 5049-5067",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215624,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "4984-5000",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C5",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215625,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4984",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Minh �廕﹀",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215626,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4985, 4989, 5088, 5098",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215627,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "4986-4988, 4990-4995, 4997-5000, 5049-5050, 5064, 5066, 5068-5070, 5072-5074, 5076-5082, 5084, 5087, 5090, 5093-5095, 5097, 5099-5100, 5133-5139",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215628,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5001-5048",
    "soOngCount": 48,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C3",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215629,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5001-5048",
    "soOngCount": 48,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215630,
    "ngay": "2026-06-01",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5049-5075",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C4",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215631,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5055, 5059, 5071, 5075, 5083, 5085-5086, 5091-5092",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215632,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5056, 5058, 5060-5062, 5065",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215633,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5063, 5103-5132",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L礙 V�n T羅ng",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215634,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5067-5088, 5090-5095, 5097-5100, 5133-5162, 5164-5166",
    "soOngCount": 65,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215635,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5067, 5071, 5075, 5086, 5088, 5098",
    "soOngCount": 6,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215636,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5068-5102",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215637,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5068-5070, 5072-5074, 5076-5085, 5087, 5090-5095, 5097, 5099-5100, 5133-5162, 5164-5166",
    "soOngCount": 59,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215638,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5075, 5085, 5092, 5167, 5170-5171, 5173, 5212, 5221-5225, 5495",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215639,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5076-5102",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C1",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215640,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5077-5082, 5084, 5087, 5090-5091, 5093-5095, 5097, 5099-5100, 5133-5146",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "159TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215641,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5086, 5166, 5168, 5172, 5473, 5477, 5485, 5497-5498, 5501, 5507-5508, 5535",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215642,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5089, 5096, 5101-5102, 5163",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215643,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5103-5132",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C2",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215644,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5133-5162",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C7",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215645,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5133-5163",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215646,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5133-5177",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215647,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5147-5162, 5164-5165, 5169, 5171, 5176, 5179, 5181-5185, 5187-5189",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "160TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215648,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5163-5192",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C6",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215649,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5166-5168, 5170, 5172-5173, 5175, 5177-5178",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215650,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5167-5173, 5175-5179, 5181-5185, 5187-5205",
    "soOngCount": 36,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215651,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5168, 5249, 5379, 5389, 5399, 5401, 5408-5409, 5429, 5435, 5441, 5448, 5453, 5455-5457, 5460, 5462, 5464-5465, 5481, 5483, 5485, 5487-5488, 5496, 5498, 5501, 5507-5508",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "169TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215652,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5174, 5180, 5186",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215653,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5178-5226",
    "soOngCount": 49,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215654,
    "ngay": "2026-06-02",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "TR1_0206, TR2_0206, TR1_0106",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215655,
    "ngay": "2026-06-03",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5193-5222",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C8",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215656,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5193-5212",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215657,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5198, 5202, 5212, 5221-5225",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215658,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5203-5211, 5213-5220, 5227, 5229, 5233, 5257-5266",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "163TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215659,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5206-5225, 5227-5229, 5231, 5233-5234, 5236, 5249, 5252, 5257-5278",
    "soOngCount": 51,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215660,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5206-5225, 5227-5229, 5231, 5233-5236, 5257-5258",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215661,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5213-5243",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215662,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5223-5256",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C9",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215663,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5226, 5230, 5232, 5237-5248, 5250-5251, 5253-5256",
    "soOngCount": 21,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215664,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5227-5247, 5249, 5251-5252, 5256-5287",
    "soOngCount": 56,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215665,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5228, 5231, 5234",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215666,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5235, 5295",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215667,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5235, 5295, 5300-5303, 5306-5313, 5449, 5733, 5738, 5773-5789",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "69H6.26",
    "khoang": "V23",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "H廙萏g",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215668,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5236, 5399, 5401, 5408-5409, 5429, 5435, 5448, 5453, 5455-5456, 5460, 5462, 5465",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215669,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5244-5273",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215670,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5248, 5250, 5253-5255",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "T廕哽",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215671,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5249, 5252",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215672,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5249, 5252, 5295, 5335",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215673,
    "ngay": "2026-06-04",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5257-5289",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26F1",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215674,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5257-5293, 5296, 5331, 5333-5334, 5336-5337, 5341, 5343-5350",
    "soOngCount": 52,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215675,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5267-5293, 5296, 5331, 5333-5334, 5336-5337, 5341, 5343",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "164TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215676,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5274-5307",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215677,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5279-5293, 5296, 5314-5363",
    "soOngCount": 66,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215678,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5279-5293, 5295-5296, 5314-5357, 5359-5363",
    "soOngCount": 66,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215679,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5288-5372",
    "soOngCount": 85,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215680,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5290-5313",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "6/26C10",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215681,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5294, 5297-5313",
    "soOngCount": 18,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215682,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5308-5354",
    "soOngCount": 47,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215683,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5314-5330",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26B27",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215684,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5314-5330",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "162TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215685,
    "ngay": "2026-06-05",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5331-5370",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "11/25A5",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215686,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5332, 5338-5340, 5342",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215687,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5344-5350, 5352-5354, 5357, 5362-5363, 5367, 5371-5373, 5375-5377, 5379-5388",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "165TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215688,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5355-5389",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215689,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5358",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215690,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5364-5426",
    "soOngCount": 63,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215691,
    "ngay": "2026-06-06",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5371-5402",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "11/25A7",
    "khoang": "X3",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215692,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5373-5430",
    "soOngCount": 58,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215693,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5389",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215694,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5390-5412",
    "soOngCount": 23,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215695,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5403-5442",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G10",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215696,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5403, 5438, 5441-5442, 5463, 5615, 5628, 5641",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215697,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5406-5426",
    "soOngCount": 21,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V⑹①ng �廙妾 Tr廙㤔g",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215698,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5406, 5410-5413, 5415-5426, 5428, 5430-5432, 5436, 5443-5444, 5446-5447, 5450-5452, 5454, 5466-5467, 5474, 5476",
    "soOngCount": 34,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215699,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5407, 5427, 5434, 5437, 5445, 5458, 5461, 5468, 5479",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215700,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�籀ng g籀i",
    "soOngText": "5407, 5427, 5434, 5437, 5445, 5458, 5461, 5468, 5479",
    "soOngCount": 9,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "167TP6.26",
    "khoang": "X6",
    "apSuat": "",
    "nguoi1": "Tr廕吵 V�n H廕赴",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215701,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5413-5443",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215702,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5414, 5459, 5469",
    "soOngCount": 3,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "KH�C",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215703,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5427-5448, 5450-5484",
    "soOngCount": 57,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215704,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5427-5437, 5439, 5442-5443, 5445, 5448, 5451-5453, 5455-5457, 5468-5473, 5475, 5477-5480",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215705,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5431-5448, 5450-5484",
    "soOngCount": 53,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215706,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5433, 5439, 5470-5472",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215707,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5438, 5440-5441, 5444",
    "soOngCount": 4,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215708,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5440, 5655-5658, 5660-5661, 5663-5665, 5667, 5677-5678, 5681, 5684, 5686-5687, 5701, 5704-5707, 5710, 5712-5717, 5719-5722, 5724, 5726",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215709,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5443-5472",
    "soOngCount": 30,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G6",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215710,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5444-5476",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215711,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5446-5447",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren v� coupling",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215712,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5449",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "Thi廕簑 chi廙� d�y (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215713,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5450, 5454, 5467, 5474, 5476",
    "soOngCount": 5,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215714,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5457, 5464, 5473, 5475, 5477-5478, 5480",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "L礙 �穫nh H羅ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215715,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "Ti廙𡵞 ren m廙𢹂",
    "soOngText": "5464, 5475, 5478, 5480, 5481, 5482, 5483, 5484, 5486, 5487, 5488, TR1_1106",
    "soOngCount": 12,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Th�nh Nh①n",
    "nguoi2": "",
    "tinhTrang": "TR",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215716,
    "ngay": "2026-06-07",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5473-5512",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G8",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "Nguy廙� Duy S①n",
    "nguoi2": "Ph廕《 Duy H⑹ng",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215717,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5477-5507",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215718,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5481, 5483, 5487-5490, 5492-5493, 5497-5499, 5501, 5504, 5506-5507, 5510, 5512-5544, 5546",
    "soOngCount": 50,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215719,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5481-5488, 5493, 5496-5498, 5501, 5507-5508",
    "soOngCount": 15,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215720,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5482, 5484-5486, 5496, 5508, 5545",
    "soOngCount": 7,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215721,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5485-5552",
    "soOngCount": 68,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215722,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5485-5546",
    "soOngCount": 62,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215723,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5489, 5494, 5502-5504, 5506, 5514-5517, 5522-5524, 5527",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215724,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5490-5492, 5495, 5499-5500, 5505, 5509-5511, 5513, 5518-5521, 5525-5526, 5528-5529",
    "soOngCount": 19,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215725,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5491, 5494-5495, 5500, 5502, 5505, 5509, 5511",
    "soOngCount": 8,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215726,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5503",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "H廙萏g ren v� coupling",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215727,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5508-5538",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215728,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5512",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215729,
    "ngay": "2026-06-08",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5513-5552",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G5",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215730,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5530, 5533-5534, 5536-5540, 5543-5544, 5549-5551, 5554",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215731,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5532, 5535, 5541-5542, 5545-5548, 5553, 5555-5556",
    "soOngCount": 11,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215732,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5539-5552",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215733,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5553-5566, 5568-5573",
    "soOngCount": 20,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G9",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215734,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5553-5566, 5568-5598",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215735,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5553-5566, 5568-5598",
    "soOngCount": 45,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215736,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5557-5618",
    "soOngCount": 62,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215737,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5557",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215738,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5558, 5563-5564, 5566, 5570-5573, 5580, 5582, 5590-5591, 5593",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 box",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215739,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5559-5562, 5565, 5568-5569, 5574-5579, 5581, 5583-5586, 5589, 5592, 5594-5614",
    "soOngCount": 41,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215740,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5561-5592",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215741,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5567",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G9",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "LOAI",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215742,
    "ngay": "2026-06-09",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5574-5613",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G1",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215743,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5593-5629",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215744,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5599-5644",
    "soOngCount": 46,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215745,
    "ngay": "2026-06-10",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5614-5653",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G2",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215746,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5616-5627, 5629-5640, 5642-5653",
    "soOngCount": 36,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Th獺i V�n Ng廙㷼",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215747,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5619-5681",
    "soOngCount": 63,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215748,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5630-5653",
    "soOngCount": 24,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215749,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5645-5695",
    "soOngCount": 51,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215750,
    "ngay": "2026-06-11",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5654-5693",
    "soOngCount": 40,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "1/26G3",
    "khoang": "V2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215751,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5654-5684",
    "soOngCount": 31,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "T廕� Ng廙㷼 H簷a",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215752,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5654, 5659, 5662, 5666, 5668-5676, 5679-5680, 5682-5683, 5685, 5688-5693, 5695-5700, 5703, 5708-5709, 5711, 5718, 5723, 5725",
    "soOngCount": 37,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "X穫 c廕� 2 �廕吟",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215753,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5668-5680, 5694-5700, 5702-5703, 5705, 5711, 5717-5718, 5720-5726",
    "soOngCount": 33,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215754,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "L�m s廕︷h, calip ren",
    "soOngText": "5681-5693, 5701, 5704, 5706-5710, 5712-5716, 5719, 5727",
    "soOngCount": 27,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� V�n D廙句",
    "nguoi2": "",
    "tinhTrang": "H廙萏g coupling",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215755,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "NDT",
    "soOngText": "5682-5736",
    "soOngCount": 55,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "L廙� V藺nh An",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215756,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5685-5719",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215757,
    "ngay": "2026-06-12",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5694-5728",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B2",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215758,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�p th廙囤 l廙帷",
    "soOngText": "5694, 5702",
    "soOngCount": 2,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "350",
    "nguoi1": "L礙 �穫nh Ph繳",
    "nguoi2": "Tr廕吵 Qu廙倴 V⑹①ng",
    "tinhTrang": "X穫 pin",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215759,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5696-5724, 5726-5749, 5751-5756",
    "soOngCount": 59,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215760,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5720-5744",
    "soOngCount": 25,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Tr廕吵 Minh �廕﹀",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215761,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "Th繫ng n簷ng",
    "soOngText": "5725",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "Nguy廙� Thanh Hi廙�",
    "nguoi2": "",
    "tinhTrang": "KHAC",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215762,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5729-5743",
    "soOngCount": 15,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B1",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215763,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5744-5749, 5751-5772",
    "soOngCount": 28,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B3",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215764,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5745-5749, 5751-5772, 5790-5794",
    "soOngCount": 32,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215765,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5750",
    "soOngCount": 1,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B3",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215766,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5773-5789",
    "soOngCount": 17,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B4",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "R廙� th璽n, �n m簷n (lo廕【)",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215767,
    "ngay": "2026-06-13",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5790-5807",
    "soOngCount": 18,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "5/26B4",
    "khoang": "X1",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� Thanh H廕ξ",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215768,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "R廙苔 廙𤉋g",
    "soOngText": "5795-5807",
    "soOngCount": 13,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "",
    "khoang": "",
    "apSuat": "",
    "nguoi1": "V觼 V�n Quy廕篙",
    "nguoi2": "",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215769,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5808-5821",
    "soOngCount": 14,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26A3",
    "khoang": "X2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  },
  {
    "id": 1781622215770,
    "ngay": "2026-06-15",
    "ca": "HC",
    "nguyenCong": "�廕吟 v�o",
    "soOngText": "5822-5856",
    "soOngCount": 35,
    "loaiXl": "XNKT",
    "loaiOng": "�73",
    "maBo": "3/26A2",
    "khoang": "X2",
    "apSuat": "",
    "nguoi1": "H廙� Xu璽n H羅ng",
    "nguoi2": "Nguy廙� �廙妾 Huy",
    "tinhTrang": "�廕﹀",
    "ghiChu": "Imported from Excel Update (To�n b廙� Th獺ng 6)"
  }
];
                
                // Keep non-imported records
                historyData = [...historyData, ...importedData];
                
                localStorage.setItem('nkt_history', JSON.stringify(historyData));
                localStorage.setItem('imported_june_done_v6', 'true');
                
                if (typeof renderHistory === 'function') renderHistory();
                if (typeof updateDashboard === 'function') updateDashboard();
                console.log("V6 Migration complete");
            } catch (e) {
                console.error("Migration error:", e);
            }
        }
    }, 2000);
});

// --- �?NG B? GOOGLE SHEETS ---
async function syncFromCloud() {
    let syncUrl = localStorage.getItem('nkt_sync_url_v3');
    if (!syncUrl || syncUrl.trim() === '') {
        syncUrl = prompt("Nh?p du?ng link (URL) Web App c?a Google Apps Script d? d?ng b? b嫪 c嫪 t? c獼g nh滱:");
        if (!syncUrl) return;
        localStorage.setItem('nkt_sync_url_v3', syncUrl.trim());
    }

    const btn = document.querySelector('button[onclick="syncFromCloud()"]');
    let originalContent = '';
    if (btn) {
        originalContent = btn.innerHTML;
        btn.innerHTML = '? <span>胊ng t?i...</span>';
        btn.disabled = true;
    }

    try {
        const response = await fetch(syncUrl);
        if (!response.ok) throw new Error("L?i m?ng khi t?i d? li?u");
        
        const cloudData = await response.json();
        let addedCount = 0;
        
        cloudData.forEach(r => {
            if (!r.id) return;
            const exists = historyData.find(localR => localR.id && localR.id.toString() === r.id.toString());
            if (!exists) {
                historyData.unshift(r);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            historyData.sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0));
            localStorage.setItem('nkt_history', JSON.stringify(historyData));
            
            if (typeof renderHistory === 'function') renderHistory();
            if (typeof updateDashboard === 'function') updateDashboard();
            
            const badge = document.getElementById('report-badge');
            if (badge) {
                badge.style.display = 'inline-block';
                badge.textContent = historyData.length;
            }
            alert(`? �?ng b? th跣h c獼g! 凅 t?i v?  b嫪 c嫪 m?i t? c獼g nh滱.`);
        } else {
            alert('?? D? li?u d� du?c c?p nh?t d?y d? (Kh獼g c� b嫪 c嫪 n跢 m?i).');
        }
    } catch (error) {
        console.error(error);
        const reset = confirm("? L?i d?ng b?! C� th? do sai du?ng link. B?n c� mu?n x鏇 link hi?n t?i d? thi?t l?p l?i kh獼g?");
        if (reset) {
            localStorage.removeItem('nkt_sync_url_v3');
        }
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}
