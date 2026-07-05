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