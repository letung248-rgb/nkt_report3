    // 2. table-size-body (Theo Size ống)
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
        
        Object.entries(sizeStats).sort((a,b) => b[1].total - a[1].total).forEach(([size, data]) => {
            const kh = monthlyPlan[size] || 0;
            let pVal = kh > 0 ? Math.round((data.ok / kh) * 100) : (data.ok > 0 ? 100 : 0);
            const percentStr = pVal === 0 ? '-' : pVal + '%';
            tSize.innerHTML += `<tr>
                <td>${size}</td>
                <td style="font-weight: bold; color: var(--primary-color);">${kh}</td>
                <td>${data.total}</td>
                <td style="color:green">${data.ok}</td>
                <td style="color:orange">${data.repair}</td>
                <td style="color:red">${data.fail}</td>
                <td style="font-weight: 500;">${percentStr}</td>
            </tr>`;
        });
    }
    
    // 3. table-date-body (Theo ngày)
    const tDate = document.getElementById('table-date-body');
    if (tDate) {
        tDate.innerHTML = '';
        Object.entries(dateStats).sort((a,b) => new Date(b[0]) - new Date(a[0])).slice(0, 10).forEach(([date, data]) => {
            const dayPlan = (typeof planData !== 'undefined' && planData[date]) ? planData[date] : {};
            let khTotal = 0;
            Object.values(dayPlan).forEach(v => khTotal += v);
            let pVal = khTotal > 0 ? Math.round((data.ok / khTotal) * 100) : (data.ok > 0 ? 100 : 0);
            const percentStr = pVal === 0 ? '-' : pVal + '%';
            tDate.innerHTML += `<tr><td>${formatDate(date)}</td><td style="font-weight: bold; color: var(--primary-color);">${khTotal}</td><td>${data.total}</td><td style="color:green">${data.ok}</td><td style="color:orange">${data.repair}</td><td style="color:red">${data.fail}</td><td style="font-weight: 500;">${percentStr}</td></tr>`;
        });
    }
    
    // 4. table-errors-body (Thống kê mã lỗi)
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
                        labels: ['Đạt', 'Hỏng (Loại)', 'Cần sửa chữa'],
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
                            label: 'Số lượng ống',
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
const commonSizes = ['Ø60', 'Ø73', 'Ø73 NVTL', 'Ø89', 'Ø89 NVTL', 'Ø114', 'Ø114 NVTL'];

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
    if (!dateVal) return alert('Vui lòng chọn ngày!');
    
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
    alert('Đã lưu kế hoạch ngày ' + dateVal);
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
            
            if (r.tinhTrang === 'Đạt' && r.nguyenCong && r.nguyenCong.toLowerCase() === 'ép thủy lực') {
                isTP = true;
            } else if (r.tinhTrang && r.tinhTrang.toLowerCase().includes('loại')) {
                isFail = true;
            } else if (r.tinhTrang && ['Hỏng ren', 'Hỏng coupling', 'Xì pin', 'Xì box', 'Xì cả 2 đầu', 'Xì 2 đầu'].includes(r.tinhTrang)) {
                isRepair = true;
            }
            
            if (isTP) daysData[day][size].st.ok += count;
            if (isFail) daysData[day][size].st.fail += count;
            if (isRepair) daysData[day][size].st.repair += count;
            
            daysData[day][size].st.total = daysData[day][size].st.ok + daysData[day][size].st.fail + daysData[day][size].st.repair;
        }
    });
    
    let html = '';
    
    Object.keys(daysData).sort((a,b) => new Date(b) - new Date(a)).forEach(day => {
        Object.keys(daysData[day]).sort().forEach(size => {
            const { kh, st } = daysData[day][size];
            let pVal = kh > 0 ? Math.round((st.ok / kh) * 100) : (st.ok > 0 ? 100 : 0);
            const percentStr = pVal === 0 ? '-' : pVal + '%';
            html += `<tr>
                <td>${formatDate(day)}</td>
                <td>${size}</td>
                <td style="font-weight: bold; color: var(--primary-color);">${kh}</td>
                <td>${st.total}</td>
                <td style="color: green;">${st.ok}</td>
                <td style="color: orange;">${st.repair}</td>
                <td style="color: red;">${st.fail}</td>
                <td style="font-weight: 500;">${percentStr}</td>
                <td>
                    <button class="btn btn-sm btn-outline" style="padding: 2px 6px; font-size: 12px; margin-right: 4px;" onclick="editPlan('${day}')">Sửa</button>
                    <button class="btn btn-sm btn-danger" style="padding: 2px 6px; font-size: 12px;" onclick="deletePlan('${day}', '${size}')">Xóa</button>
                </td>
            </tr>`;
        });
