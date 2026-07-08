/**
 * js/state/appState.js
 * アプリケーションのグローバルな状態（State）を一元管理するモジュール。
 * 状態の変更は必ず export された Setter 関数を経由して行うこと。
 */

export const state = {
    // UI表示に関する状態
    currentDay: 'Mon',
    currentWeek: 1,
    selectedFilter: 'all',
    activeModalPeriodId: null,
    activeModalDayStr: null, // モーダルで開いている曜日の保持
    viewMode: 'daily',
    activeMovingTaskId: null,
    isDarkMode: false,

    // アプリケーションデータ
    timetableData: {},
    tasks: [],
    temporaryChanges: {},
    announcements: {},
    lists: ['その他'],
    subjectsList: [],
    classList: ['1A', '1B', '2A', '2B', '3A', '3B'] // クラス候補のデフォルト値
};

// --- UI表示状態の Setter ---
export function setCurrentDay(day) {
    state.currentDay = day;
}

export function setCurrentWeek(week) {
    state.currentWeek = Math.max(1, week); // 週は1以上に保つ（重複ロジックの整理）
}

export function setSelectedFilter(filter) {
    state.selectedFilter = filter;
}

export function setActiveModalPeriodId(id) {
    state.activeModalPeriodId = id;
}

export function setActiveModalDayStr(dayStr) {
    state.activeModalDayStr = dayStr;
}

export function setViewMode(mode) {
    state.viewMode = mode;
}

export function setActiveMovingTaskId(id) {
    state.activeMovingTaskId = id;
}

export function setIsDarkMode(isDark) {
    state.isDarkMode = isDark;
}

// --- アプリケーションデータの Setter ---
export function setTimetableData(data) {
    state.timetableData = data;
}

export function setTasks(tasks) {
    state.tasks = tasks;
}

export function setTemporaryChanges(changes) {
    state.temporaryChanges = changes;
}

export function setAnnouncements(announcements) {
    state.announcements = announcements;
}

export function setLists(lists) {
    state.lists = lists;
}

export function setSubjectsList(subjectsList) {
    state.subjectsList = subjectsList;
}

export function setClassList(list) {
    state.classList = list;
}