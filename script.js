const SPREADSHEET_ID = '1VScB4K-05GBe8p6hcWRyE2vCVRG-x4rmWfCigixPZNg';

// 取得各分頁的 GID
const SHEET_GIDS = {
    schedule: '0',              // 班表
    academic: '320687539',      // 學術活動
    appointments: '675364379'   // 預排行程
};

// 全域變數儲存載入的資料
let scheduleData = null;
let academicData = null;
let appointmentsData = null;

// 月曆相關變數
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();

// 分頁切換功能
function showTab(tabName) {
    // 隱藏所有分頁內容
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // 移除所有按鈕的 active 狀態
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    
    // 顯示選中的分頁
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// 月份切換函數
function changeMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    
    renderScheduleCalendar(scheduleData);
}

// 日期比較函數
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // 處理格式：0114/08/05 或 114/08/05
    const cleanDate = dateStr.replace(/^0?/, '');
    const parts = cleanDate.split('/');
    
    if (parts.length === 3) {
        const year = parseInt(parts[0]) + 1911; // 民國年轉西元年
        const month = parseInt(parts[1]) - 1;   // 月份從0開始
        const day = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return null;
}

function isDatePast(dateStr) {
    const eventDate = parseDate(dateStr);
    if (!eventDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventDate < today;
}

function isDateToday(dateStr) {
    const eventDate = parseDate(dateStr);
    if (!eventDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventDate.getTime() === today.getTime();
}

// 取得今天的日期字串
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear() - 1911; // 轉換為民國年
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 取得星期幾
function getTodayWeekday() {
    const today = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[today.getDay()];
}

// 取得班別代號
function getShiftCode(session1, session2, session3) {
    const sessions = [session1, session2, session3].filter(s => s && s.trim() !== '');
    
    if (sessions.length === 0) return { code: '休', class: 'shift-off' };
    
    const hasEarly = sessions.some(s => s.includes('早') || s.includes('上午'));
    const hasAfternoon = sessions.some(s => s.includes('午') || s.includes('下午'));
    const hasEvening = sessions.some(s => s.includes('晚') || s.includes('夜'));
    
    // 判斷班別組合
    if (sessions.length === 3 || (hasEarly && hasAfternoon && hasEvening)) {
        return { code: '全', class: 'shift-full' };
    } else if (hasEarly && hasAfternoon && !hasEvening) {
        return { code: 'A', class: 'shift-A' };
    } else if (!hasEarly && hasAfternoon && hasEvening) {
        return { code: 'B', class: 'shift-B' };
    } else if (hasEarly && !hasAfternoon && hasEvening) {
        return { code: 'C', class: 'shift-C' };
    } else if (hasEarly && !hasAfternoon && !hasEvening) {
        return { code: '早', class: 'shift-morning' };
    } else if (!hasEarly && hasAfternoon && !hasEvening) {
        return { code: '午', class: 'shift-afternoon' };
    } else if (!hasEarly && !hasAfternoon && hasEvening) {
        return { code: '晚', class: 'shift-evening' };
    }
    
    return { code: '其', class: 'shift-other' };
}

// 渲染今日總覽
function renderOverview() {
    const todayString = getTodayString();
    const todayWeekday = getTodayWeekday();
    
    // 更新今日日期
    document.getElementById('today-date').textContent = `${todayString} (${todayWeekday})`;
    
    // 渲染今日班表
    renderTodaySchedule();
    
    // 渲染今日學術活動
    renderTodayAcademic();
    
    // 渲染今日預排行程
    renderTodayAppointments();
    
    // 渲染近期預告
    renderUpcomingEvents();
}

// 渲染今日班表
function renderTodaySchedule() {
    if (!scheduleData) {
        document.getElementById('today-schedule').innerHTML = '<div class="loading-item">班表資料載入中...</div>';
        return;
    }

    const todayWeekday = getTodayWeekday();
    let html = '';
    let found = false;

    const rows = scheduleData.slice(1);
    rows.forEach(row => {
        if (row[1] === todayWeekday) {
            found = true;
            const cleanSession1 = row[2] ? row[2].replace(/診次一[：:]\s*/g, '') : '';
            const cleanSession2 = row[3] ? row[3].replace(/診次二[：:]\s*/g, '') : '';
            const cleanSession3 = row[4] ? row[4].replace(/診次三[：:]\s*/g, '') : '';

            html += '<div class="today-item highlight">';
            html += `<div class="schedule-date">📅 ${row[0]} ${row[1]}</div>`;
            if (cleanSession1) html += `<div class="schedule-session">🏥 ${cleanSession1}</div>`;
            if (cleanSession2) html += `<div class="schedule-session">🏥 ${cleanSession2}</div>`;
            if (cleanSession3) html += `<div class="schedule-session">🏥 ${cleanSession3}</div>`;

            // 檢查例外日期
            const todayDateString = getTodayString();
            if ((row[5] && row[5].includes(todayDateString.slice(-5))) || 
                (row[6] && row[6].includes(todayDateString.slice(-5)))) {
                html += '<div class="schedule-exception">🚫 今日不上診 (例外日期)</div>';
            }
            html += '</div>';
        }
    });

    if (!found) {
        html = '<div class="no-events">今日無排班資訊</div>';
    }

    document.getElementById('today-schedule').innerHTML = html;
}

// 渲染今日學術活動
function renderTodayAcademic() {
    if (!academicData) {
        document.getElementById('today-academic').innerHTML = '<div class="loading-item">學術活動資料載入中...</div>';
        return;
    }

    const todayString = getTodayString();
    const todayStringWithZero = '0' + todayString;
    let html = '';
    let found = false;

    const rows = academicData.slice(1);
    rows.forEach(row => {
        if (row[1] === todayString || row[1] === todayStringWithZero) {
            found = true;
            const time = row[2] || '';
            const title = row[3] || '未命名活動';
            const location = row[4] || '';
            const speaker = row[5] || '';

            html += '<div class="today-item highlight">';
            html += `<div class="academic-title">🎓 ${title}</div>`;
            if (time) html += `<div class="academic-time">${time}</div>`;
            if (location) html += `<div class="academic-location">📍 ${location}</div>`;
            if (speaker) html += `<div class="academic-speaker">🎤 ${speaker}</div>`;
            html += '</div>';
        }
    });

    if (!found) {
        html = '<div class="no-events">今日無學術活動安排</div>';
    }

    document.getElementById('today-academic').innerHTML = html;
}

function renderTodayAppointments() {
    if (!appointmentsData) {
        document.getElementById('today-appointments').innerHTML = '<div class="loading-item">預排行程資料載入中...</div>';
        return;
    }

    const todayString = getTodayString();
    let html = '';
    let found = false;

    const rows = appointmentsData.slice(1);
    rows.forEach(row => {
        if (row[0] === todayString || 
            (row[1] && parseDate(row[0]) <= new Date() && parseDate(row[1]) >= new Date())) {
            found = true;
            const startDate = row[0] || '';
            const endDate = row[1] || '';
            const location = row[2] || '';

            html += '<div class="today-item highlight">';
            html += `<div class="appointment-title">📋 ${location || '預排行程'}</div>`;
            if (endDate && endDate !== startDate) {
                html += `<div class="appointment-date">📅 ${startDate} ~ ${endDate}</div>`;
            } else {
                html += `<div class="appointment-date">📅 ${startDate}</div>`;
            }
            html += '</div>';
        }
    });

    if (!found) {
        html = '<div class="no-events">今日無預排行程</div>';
    }

    document.getElementById('today-appointments').innerHTML = html;
}

// 渲染近期預告
function renderUpcomingEvents() {
    let html = '';
    const upcomingAcademic = getUpcomingEvents(academicData, 1);
    const upcomingAppointments = getUpcomingEvents(appointmentsData, 0);

    if (upcomingAcademic.length > 0) {
        html += '<div class="upcoming-section">';
        html += '<div class="upcoming-section-title">🎓 即將到來的學術活動</div>';
        upcomingAcademic.forEach(event => {
            html += `
                <div class="upcoming-item">
                    <div class="upcoming-date">${event.date}</div>
                    <div class="upcoming-title">${event.title}</div>
                    ${event.details ? `<div class="upcoming-details"><span class="upcoming-location">${event.details}</span></div>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }

    if (upcomingAppointments.length > 0) {
        html += '<div class="upcoming-section">';
        html += '<div class="upcoming-section-title">📋 即將到來的預排行程</div>';
        upcomingAppointments.forEach(event => {
            html += `
                <div class="upcoming-item">
                    <div class="upcoming-date">${event.date}</div>
                    <div class="upcoming-title">${event.title}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (upcomingAcademic.length === 0 && upcomingAppointments.length === 0) {
        html = '<div class="no-events">近期一週無特別安排</div>';
    }

    document.getElementById('upcoming-events').innerHTML = html;
}

// 取得即將到來的事件
function getUpcomingEvents(data, dateColumnIndex) {
    if (!data) return [];

    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    const events = [];
    const rows = data.slice(1);

    rows.forEach(row => {
        const dateStr = row[dateColumnIndex];
        if (!dateStr) return;

        const eventDate = parseDate(dateStr);
        if (!eventDate) return;

        if (eventDate > today && eventDate <= weekFromNow) {
            let title, details;
            
            if (dateColumnIndex === 1) { // 學術活動
                title = row[3] || '未命名活動';
                const location = row[4] || '';
                const speaker = row[5] || '';
                details = [location, speaker].filter(x => x).join(' | ');
            } else { // 預排行程
                title = row[2] || '預排行程';
                details = '';
            }

            events.push({
                date: dateStr,
                title: title,
                details: details,
                sortDate: eventDate
            });
        }
    });

    // 按日期排序
    return events.sort((a, b) => a.sortDate - b.sortDate);
}

function isDateUpcoming(dateStr) {
    const eventDate = parseDate(dateStr);
    if (!eventDate) return false;
    
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    
    return eventDate > today && eventDate <= weekFromNow;
}

// 載入 CSV 資料的通用函數
async function loadSheetData(sheetName, gid) {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => {
            // 簡單的 CSV 解析，處理逗號分隔
            return row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        });
        
        return rows.filter(row => row.some(cell => cell.length > 0)); // 過濾空行
    } catch (error) {
        console.error(`載入 ${sheetName} 資料時發生錯誤:`, error);
        return null;
    }
}

// 新的月曆渲染函數
function renderScheduleCalendar(data) {
    if (!data || data.length <= 1) {
        document.getElementById('schedule-content').innerHTML = '<div class="error">無法載入班表資料或資料為空</div>';
        return;
    }

    // 更新月份標題
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    document.getElementById('current-month').textContent = 
        `${currentCalendarYear}年 ${monthNames[currentCalendarMonth]}`;

    // 建立日期到班表的映射
    const scheduleMap = new Map();
    const exceptionMap = new Map();
    
    const rows = data.slice(1);
    rows.forEach(row => {
        if (row[0] && row[1]) { // 確保有月份和星期
            const monthStr = row[0];
            const weekday = row[1];
            const session1 = row[2] ? row[2].replace(/診次一[：:]\s*/g, '') : '';
            const session2 = row[3] ? row[3].replace(/診次二[：:]\s*/g, '') : '';
            const session3 = row[4] ? row[4].replace(/診次三[：:]\s*/g, '') : '';
            
            // 儲存班表資料
            scheduleMap.set(weekday, {
                month: monthStr,
                sessions: [session1, session2, session3],
                shift: getShiftCode(session1, session2, session3)
            });
            
            // 處理例外日期
            if (row[5]) exceptionMap.set(row[5], true);
            if (row[6]) exceptionMap.set(row[6], true);
        }
    });

    // 生成月曆HTML
    let html = '<div class="calendar-header">';
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    weekdays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });
    html += '</div>';

    // 計算月曆天數
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 生成42天的格子（6週）
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const isCurrentMonth = currentDate.getMonth() === currentCalendarMonth;
        const isToday = currentDate.getTime() === today.getTime();
        
        // 格式化日期字串用於查找例外
        const year = currentDate.getFullYear() - 1911;
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${month}/${day}`;
        
        const hasException = exceptionMap.has(dateStr);
        
        let dayClass = 'calendar-day';
        if (!isCurrentMonth) dayClass += ' other-month';
        if (isToday) dayClass += ' today';
        if (hasException) dayClass += ' has-exception';

        html += `<div class="${dayClass}">`;
        html += `<div class="day-number">${currentDate.getDate()}</div>`;
        
        if (isCurrentMonth && !hasException) {
            const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            const weekdayName = weekdayNames[currentDate.getDay()];
            
            if (scheduleMap.has(weekdayName)) {
                const schedule = scheduleMap.get(weekdayName);
                html += `<div class="shift-code ${schedule.shift.class}">${schedule.shift.code}</div>`;
            }
        } else if (hasException) {
            html += '<div class="exception-indicator"></div>';
            html += '<div class="shift-code shift-off">休</div>';
        }
        
        html += '</div>';
    }

    document.getElementById('schedule-content').innerHTML = html;
}

// 修改原本的 renderSchedule 函數
function renderSchedule(data) {
    return renderScheduleCalendar(data);
}

// 渲染學術活動資料
function renderAcademic(data) {
    if (!data || data.length <= 1) {
        return '<div class="error">無法載入學術活動資料或資料為空</div>';
    }

    // 按日期排序
    const rows = data.slice(1).sort((a, b) => {
        const dateA = parseDate(a[1]);
        const dateB = parseDate(b[1]);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
    });

    let html = '<div class="activity-timeline">';

    rows.forEach(row => {
        if (row[1] || row[3]) { // 確保有開始日期或活動名稱
            const startDate = row[1] || '';  // B欄位：活動開始日期
            const time = row[2] || '';       // C欄位：時間
            const title = row[3] || '未命名活動';  // D欄位：活動名稱
            const location = row[4] || '';   // E欄位：活動地點
            const speaker = row[5] || '';    // F欄位：講者

            let cssClass = 'activity-item';
            if (isDatePast(startDate)) {
                cssClass += ' past';
            } else if (isDateToday(startDate)) {
                cssClass += ' today-marker';
            } else if (isDateUpcoming(startDate)) {
                cssClass += ' upcoming';
            }

            html += `
                <div class="${cssClass}">
                    <div class="activity-date">
                        📅 ${startDate}
                        ${time ? ` ⏰ ${time}` : ''}
                    </div>
                    <div class="activity-title">${title}</div>
                    <div class="activity-details">
                        ${location ? `<span>📍 ${location}</span>` : ''}
                        ${speaker ? `<span>🎤 ${speaker}</span>` : ''}
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
}

// 渲染預排行程資料
function renderAppointments(data) {
    if (!data || data.length <= 1) {
        return '<div class="error">無法載入預排行程資料或資料為空</div>';
    }

    // 按日期排序
    const rows = data.slice(1).sort((a, b) => {
        const dateA = parseDate(a[0]);
        const dateB = parseDate(b[0]);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
    });

    let html = '<div class="events-list">';

    rows.forEach(row => {
        if (row[0]) { // 確保有開始日期
            const startDate = row[0] || '';    // A欄位：活動開始日期
            const endDate = row[1] || '';      // B欄位：活動結束日期
            const location = row[2] || '';     // C欄位：活動地點

            let cssClass = 'event-item';
            if (isDatePast(startDate)) {
                cssClass += ' past';
            } else if (isDateToday(startDate)) {
                cssClass += ' today';
            } else if (isDateUpcoming(startDate)) {
                cssClass += ' upcoming';
            }

            html += `
                <div class="${cssClass}">
                    <div class="item-title">${location || '預排行程'}</div>
                    <div class="item-details">
                        ${startDate}${endDate && endDate !== startDate ? ` ~ ${endDate}` : ''}
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
}

// 載入所有資料
async function loadAllData() {
    const updateTime = new Date().toLocaleString('zh-TW');

    // 載入班表
    document.getElementById('schedule-content').innerHTML = '<div class="loading">正在載入班表資料...</div>';
    scheduleData = await loadSheetData('班表', SHEET_GIDS.schedule);
    renderScheduleCalendar(scheduleData);
    document.getElementById('schedule-update-time').textContent = updateTime;

    // 載入學術活動
    document.getElementById('academic-content').innerHTML = '<div class="loading">正在載入學術活動資料...</div>';
    academicData = await loadSheetData('學術活動', SHEET_GIDS.academic);
    document.getElementById('academic-content').innerHTML = renderAcademic(academicData);
    document.getElementById('academic-update-time').textContent = updateTime;

    // 載入預排行程
    document.getElementById('appointments-content').innerHTML = '<div class="loading">正在載入預排行程資料...</div>';
    appointmentsData = await loadSheetData('預排行程', SHEET_GIDS.appointments);
    document.getElementById('appointments-content').innerHTML = renderAppointments(appointmentsData);
    document.getElementById('appointments-update-time').textContent = updateTime;

    // 更新總覽頁面
    document.getElementById('overview-update-time').textContent = updateTime;
    renderOverview();
}

// 頁面載入完成後自動載入資料
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
});
