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
                document.getElementById('today-schedule').innerHTML = '<div class="no-events">班表資料載入中...</div>';
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
                    html += `<strong>📅 ${row[0]} ${row[1]}</strong><br>`;
                    if (cleanSession1) html += `🏥 ${cleanSession1}<br>`;
                    if (cleanSession2) html += `🏥 ${cleanSession2}<br>`;
                    if (cleanSession3) html += `🏥 ${cleanSession3}<br>`;
                    html += '</div>';

                    // 檢查例外日期
                    const todayDateString = getTodayString();
                    if ((row[5] && row[5].includes(todayDateString.slice(-5))) || 
                        (row[6] && row[6].includes(todayDateString.slice(-5)))) {
                        html += '<div class="today-item" style="background: rgba(255, 107, 107, 0.3);">';
                        html += '🚫 <strong>今日不上診</strong> (例外日期)';
                        html += '</div>';
                    }
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
                document.getElementById('today-academic').innerHTML = '<div class="no-events">學術活動資料載入中...</div>';
                return;
            }

            const todayString = getTodayString(); // 114/08/12
            const todayStringWithZero = '0' + todayString; // 0114/08/12
            let html = '';
            let found = false;

            const rows = academicData.slice(1);
            rows.forEach(row => {
                // 比對兩種格式
                if (row[1] === todayString || row[1] === todayStringWithZero) {
                    found = true;
                    const time = row[2] || '';
                    const title = row[3] || '未命名活動';
                    const location = row[4] || '';
                    const speaker = row[5] || '';

                    html += '<div class="today-item highlight">';
                    html += `<strong>🎓 ${title}</strong><br>`;
                    if (time) html += `⏰ ${time}<br>`;
                    if (location) html += `📍 ${location}<br>`;
                    if (speaker) html += `🎤 ${speaker}`;
                    html += '</div>';
                }
            });

            if (!found) {
                html = '<div class="no-events">今日無學術活動安排</div>';
            }

            document.getElementById('today-academic').innerHTML = html;
        }

        // 渲染今日預排行程
        function renderTodayAppointments() {
            if (!appointmentsData) {
                document.getElementById('today-appointments').innerHTML = '<div class="no-events">預排行程資料載入中...</div>';
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
                    html += `<strong>📋 ${location || '預排行程'}</strong><br>`;
                    if (endDate && endDate !== startDate) {
                        html += `📅 ${startDate} ~ ${endDate}`;
                    } else {
                        html += `📅 ${startDate}`;
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
            const upcomingAcademic = getUpcomingEvents(academicData, 1); // 學術活動從B欄位取日期
            const upcomingAppointments = getUpcomingEvents(appointmentsData, 0); // 預排行程從A欄位取日期

            if (upcomingAcademic.length > 0) {
                html += '<h4 style="color: #78c8ff; margin-bottom: 12px;">🎓 即將到來的學術活動</h4>';
                upcomingAcademic.forEach(event => {
                    html += `
                        <div class="upcoming-item">
                            <div class="upcoming-date">📅 ${event.date}</div>
                            <strong>${event.title}</strong>
                            ${event.details ? `<br><small>${event.details}</small>` : ''}
                        </div>
                    `;
                });
            }

            if (upcomingAppointments.length > 0) {
                html += '<h4 style="color: #78c8ff; margin-bottom: 12px; margin-top: 20px;">📋 即將到來的預排行程</h4>';
                upcomingAppointments.forEach(event => {
                    html += `
                        <div class="upcoming-item">
                            <div class="upcoming-date">📅 ${event.date}</div>
                            <strong>${event.title}</strong>
                        </div>
                    `;
                });
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

        // 渲染班表資料
        function renderSchedule(data) {
            if (!data || data.length <= 1) {
                return '<div class="error">無法載入班表資料或資料為空</div>';
            }

            const header = data[0];
            // 按日期和星期排序
            const rows = data.slice(1).sort((a, b) => {
                // 星期排序優先級
                const weekOrder = {
                    '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, 
                    '星期五': 5, '星期六': 6, '星期日': 7
                };
                
                // 先按月份排序，再按星期排序
                const monthA = a[0] || '';
                const monthB = b[0] || '';
                
                if (monthA !== monthB) {
                    return monthA.localeCompare(monthB);
                }
                
                const weekA = weekOrder[a[1]] || 999;
                const weekB = weekOrder[b[1]] || 999;
                return weekA - weekB;
            });

            let html = '<div class="schedule-grid">';

            rows.forEach(row => {
                if (row[0] && row[1]) { // 確保有月份和星期資料
                    // 清理診次資料，移除可能的前綴
                    const cleanSession1 = row[2] ? row[2].replace(/診次一[：:]\s*/g, '') : '';
                    const cleanSession2 = row[3] ? row[3].replace(/診次二[：:]\s*/g, '') : '';
                    const cleanSession3 = row[4] ? row[4].replace(/診次三[：:]\s*/g, '') : '';

                    html += `
                        <div class="schedule-card">
                            <h3>📅 ${row[0]} ${row[1]}</h3>
                            ${cleanSession1 ? `<div class="clinic-session">🏥 ${cleanSession1}</div>` : ''}
                            ${cleanSession2 ? `<div class="clinic-session">🏥 ${cleanSession2}</div>` : ''}
                            ${cleanSession3 ? `<div class="clinic-session">🏥 ${cleanSession3}</div>` : ''}
                            ${renderExceptionDate(row[5], '例外日期一')}
                            ${renderExceptionDate(row[6], '例外日期二')}
                        </div>
                    `;
                }
            });

            html += '</div>';
            return html;
        }

        // 渲染例外日期的函數
        function renderExceptionDate(dateStr, label) {
            if (!dateStr) return '';
            
            const isPast = isDatePast(dateStr);
            const cssClass = isPast ? 'exception-date past' : 'exception-date';
            const icon = isPast ? '✅' : '🚫';
            const status = isPast ? '(已過期)' : '(不上診)';
            
            return `<div class="${cssClass}">${icon} ${label}：${dateStr} ${status}</div>`;
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

            let html = '<div class="activity-timeline">';

            rows.forEach(row => {
                if (row[0]) { // 確保有開始日期
                    const startDate = row[0] || '';    // A欄位：活動開始日期
                    const endDate = row[1] || '';      // B欄位：活動結束日期
                    const location = row[2] || '';     // C欄位：活動地點

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
                                📅 ${startDate}${endDate && endDate !== startDate ? ` ~ ${endDate}` : ''}
                            </div>
                            <div class="activity-title">${location || '預排行程'}</div>
                            <div class="activity-details">
                                ${location ? `<span>📍 ${location}</span>` : ''}
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
            document.getElementById('schedule-content').innerHTML = renderSchedule(scheduleData);
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
