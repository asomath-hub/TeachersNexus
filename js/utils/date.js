/**
 * js/utils/date.js
 * 日付・曜日に関する計算ロジックを提供する純粋関数群。
 */

export const dayNames = { 'Mon':'月曜日', 'Tue':'火曜日', 'Wed':'水曜日', 'Thu':'木曜日', 'Fri':'金曜日' };

export function getFormattedDate(week, dayStr) {
    return '第' + week + '週 ' + dayNames[dayStr];
}

/**
 * 基準日を含む3日間の配列を返す（純粋関数化のため引数で基準日を取る）
 */
export function get3Days(currentDayStr) {
    const days = ['Mon','Tue','Wed','Thu','Fri'];
    let idx = days.indexOf(currentDayStr);
    if(idx > 2) idx = 2; // 木・金が基準の場合は水木金とする
    return [days[idx], days[idx+1], days[idx+2]];
}

/**
 * 現在のDateオブジェクトから「何週目の何曜日か」を算出する（副作用を排除した純粋関数）
 * 元の jumpToToday 関数をリファクタリングし、状態更新の責務を取り除きました。
 */
export function calculateTodayInfo(now = new Date()) {
    const startOfYear = new Date(now.getFullYear(), 3, 1);
    const diff = now - startOfYear;
    const weekNum = Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
    
    let dayIndex = now.getDay();
    let targetDayStr = 'Mon';
    let targetWeek;
    
    // 元のロジックと100%一致するようにif-else内で代入
    if (dayIndex >= 1 && dayIndex <= 5) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        targetDayStr = days[dayIndex];
        targetWeek = Math.max(1, weekNum);
    } else {
        targetDayStr = 'Mon';
        targetWeek = Math.max(1, weekNum + 1);
    }
    
    return { currentDay: targetDayStr, currentWeek: targetWeek };
}

/**
 * 指定した週と曜日から、実際の日付(Dateオブジェクト)を逆算する純粋関数
 */
export function getDateFromWeekAndDay(week, dayStr, now = new Date()) {
    const startOfYear = new Date(now.getFullYear(), 3, 1);
    // その週のベースとなる日付 (4月1日から (week-1)*7 日後)
    const baseDate = new Date(startOfYear.getFullYear(), startOfYear.getMonth(), startOfYear.getDate() + (week - 1) * 7);
    
    // baseDate が属する週の月曜日を求める
    const baseDayIndex = baseDate.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const diffToMonday = baseDayIndex === 0 ? -6 : 1 - baseDayIndex;
    const mondayOfThatWeek = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + diffToMonday);
    
    // dayStr に応じて月曜日からのオフセットを加算
    const daysOffset = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
    const offset = daysOffset[dayStr] || 0;
    
    return new Date(mondayOfThatWeek.getFullYear(), mondayOfThatWeek.getMonth(), mondayOfThatWeek.getDate() + offset);
}

/**
 * Dateオブジェクトを「M/D（曜）」形式にフォーマットする純粋関数
 */
export function formatDateWithDay(date) {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()}（${days[date.getDay()]}）`;
}

/**
 * 3日表示用：開始日と終了日の範囲文字列を返す純粋関数
 */
export function getThreeDaysRangeString(week, dayStr) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let idx = days.indexOf(dayStr);
    if(idx > 2) idx = 2; // 木・金が基準の場合は水木金とする
    
    const startDate = getDateFromWeekAndDay(week, days[idx]);
    const endDate = getDateFromWeekAndDay(week, days[idx + 2]);
    
    return `${formatDateWithDay(startDate)}〜${formatDateWithDay(endDate)}`;
}

/**
 * 週表示用：月曜日から金曜日の範囲文字列を返す純粋関数
 */
export function getWeeklyRangeString(week) {
    const startDate = getDateFromWeekAndDay(week, 'Mon');
    const endDate = getDateFromWeekAndDay(week, 'Fri');
    
    return `${formatDateWithDay(startDate)}〜${formatDateWithDay(endDate)}`;
}