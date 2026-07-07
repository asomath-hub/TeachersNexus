/**
 * js/components/Header.js
 * アプリケーションヘッダー（ビュー切替、日付ナビゲーション等）を管理するコンポーネント。
 */

import { state, setCurrentDay, setCurrentWeek, setViewMode } from '../state/appState.js';
import { dayNames, get3Days, calculateTodayInfo, getDateFromWeekAndDay, formatDateWithDay, getThreeDaysRangeString, getWeeklyRangeString } from '../utils/date.js';

let onStateChangeCallback = null;
let initialized = false;

export function initHeader(callback) {
    onStateChangeCallback = callback || null;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }
}

function setupEventListeners() {
    // ビュー切替
    const viewBtns = document.querySelectorAll('[data-action^="change-view-"]');
    viewBtns.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            const mode = action.replace('change-view-', '');
            changeView(mode);
        });
    });

    // 週移動
    const prevWeekBtn = document.querySelector('[data-action="prev-week"]');
    if (prevWeekBtn) {
        prevWeekBtn.removeAttribute('onclick');
        prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    }
    const nextWeekBtn = document.querySelector('[data-action="next-week"]');
    if (nextWeekBtn) {
        nextWeekBtn.removeAttribute('onclick');
        nextWeekBtn.addEventListener('click', () => changeWeek(1));
    }

    // 曜日切替
    const dayBtns = document.querySelectorAll('[data-action^="change-day-"]');
    dayBtns.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            const day = action.replace('change-day-', '');
            changeDay(day);
        });
    });
}

export function updateHeaderUI() {
    // ビューボタンのアクティブ状態
    ['daily', 'three-day', 'weekly'].forEach(mode => {
        const btn = document.querySelector(`[data-action="change-view-${mode}"]`);
        if (btn) {
            if (state.viewMode === mode) {
                btn.className = "px-3 py-1.5 rounded-md bg-white shadow-sm text-blue-600";
            } else {
                btn.className = "px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-700";
            }
        }
    });

    // 曜日ナビボタンのアクティブ状態
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let activeDays = [];
    if (state.viewMode === 'daily') activeDays = [state.currentDay];
    else if (state.viewMode === 'three-day') activeDays = get3Days(state.currentDay);
    else activeDays = days;

    days.forEach(day => {
        const btn = document.querySelector(`[data-action="change-day-${day}"]`);
        if (btn) {
            if (activeDays.includes(day)) {
                btn.className = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-600 text-white shadow-sm";
            } else {
                btn.className = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100";
            }
        }
    });

    // 週と曜日のラベル
    const label = document.getElementById('current-day-label');
    if (label) {
        if (state.viewMode === 'daily') {
            label.innerText = `第${state.currentWeek}週 ${dayNames[state.currentDay]}`;
        } else if (state.viewMode === 'three-day') {
            const tDays = get3Days(state.currentDay);
            label.innerText = `第${state.currentWeek}週 ${dayNames[tDays[0]]}〜`;
        } else {
            label.innerText = `第${state.currentWeek}週`;
        }
    }

    // 実際の日付のラベル更新
    const dayDateLabel = document.getElementById('day-date-label');
    if (dayDateLabel) {
        if (state.viewMode === 'daily') {
            const d = getDateFromWeekAndDay(state.currentWeek, state.currentDay);
            dayDateLabel.textContent = formatDateWithDay(d);
        } else if (state.viewMode === 'three-day') {
            dayDateLabel.textContent = getThreeDaysRangeString(state.currentWeek, state.currentDay);
        } else if (state.viewMode === 'weekly') {
            dayDateLabel.textContent = getWeeklyRangeString(state.currentWeek);
        }
    }
}

export function handleJumpToToday() {
    const todayInfo = calculateTodayInfo();
    setCurrentDay(todayInfo.currentDay);
    setCurrentWeek(todayInfo.currentWeek);
    // ジャンプ後は状態が変わるので親に通知
    if (onStateChangeCallback) onStateChangeCallback();
}

function changeView(mode) {
    setViewMode(mode);
    if (onStateChangeCallback) onStateChangeCallback();
}

function changeWeek(diff) {
    let newWeek = state.currentWeek + diff;
    if (newWeek < 1) newWeek = 1;
    setCurrentWeek(newWeek);
    if (onStateChangeCallback) onStateChangeCallback();
}

function changeDay(day) {
    setCurrentDay(day);
    if (onStateChangeCallback) onStateChangeCallback();
}