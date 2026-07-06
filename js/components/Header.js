/**
 * js/components/Header.js
 * ヘッダー部分（ビュー切替、曜日切替、週移動）のイベントとUI更新を担当するコンポーネント。
 */

import { state, setViewMode, setCurrentDay, setCurrentWeek } from '../state/appState.js';
import { dayNames, getFormattedDate, get3Days, calculateTodayInfo } from '../utils/date.js';

// 状態が変更された際に、外部（main.js等）へ再描画を依頼するためのコールバック関数
let onStateChangeCallback = null;
let initialized = false;

/**
 * ヘッダーコンポーネントの初期化
 * @param {Function} onChangeCallback - State変更時に呼ばれる関数（他コンポーネントの再描画用）
 */
export function initHeader(onChangeCallback) {
    onStateChangeCallback = onChangeCallback;

    // 二重初期化（イベントリスナーの重複登録）を防止
    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }

    updateHeaderUI();
}

function setupEventListeners() {
    // 1. ビュー切替ボタン (日 / 3日 / 週)
    ['daily', 'three-day', 'weekly'].forEach(v => {
        const btn = document.querySelector(`[data-action="change-view-${v}"]`);
        if (btn) {
            btn.removeAttribute('onclick'); // HTML側に残っているインラインハンドラを安全に剥がす
            btn.addEventListener('click', () => handleViewChange(v));
        }
    });

    // 2. 曜日切替ボタン (月 〜 金)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    days.forEach(d => {
        const btn = document.querySelector(`[data-action="change-day-${d}"]`);
        if (btn) {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', () => handleDayChange(d));
        }
    });

    // 3. 週移動ボタン (＜ ＞)
    const prevWeekBtn = document.querySelector('[data-action="prev-week"]');
    if (prevWeekBtn) {
        prevWeekBtn.removeAttribute('onclick');
        prevWeekBtn.addEventListener('click', () => handleWeekChange(-1));
    }

    const nextWeekBtn = document.querySelector('[data-action="next-week"]');
    if (nextWeekBtn) {
        nextWeekBtn.removeAttribute('onclick');
        nextWeekBtn.addEventListener('click', () => handleWeekChange(1));
    }
}

/**
 * 現在の日付に合わせてStateを更新し、UIを再描画する
 * （初期化時や、将来的な「今日へ」ボタン用）
 */
export function handleJumpToToday() {
    const { currentDay, currentWeek } = calculateTodayInfo();
    setCurrentDay(currentDay);
    setCurrentWeek(currentWeek);
    
    updateHeaderUI();
    if (onStateChangeCallback) onStateChangeCallback();
}

function handleViewChange(v) {
    setViewMode(v);
    updateHeaderUI();
    if (onStateChangeCallback) onStateChangeCallback();
}

function handleDayChange(d) {
    setCurrentDay(d);
    updateHeaderUI();
    if (onStateChangeCallback) onStateChangeCallback();
}

function handleWeekChange(delta) {
    setCurrentWeek(state.currentWeek + delta);
    updateHeaderUI();
    if (onStateChangeCallback) onStateChangeCallback();
}

/**
 * 現在のStateに基づいて、ヘッダー自身のUI（ボタンの色や日付ラベル）を更新する
 */
export function updateHeaderUI() {
    // 1. ビュー切替ボタンのアクティブ状態更新
    ['daily', 'three-day', 'weekly'].forEach(id => {
        const btn = document.querySelector(`[data-action="change-view-${id}"]`);
        if (btn) {
            btn.className = (state.viewMode === id) 
                ? "px-3 py-1.5 rounded-md bg-white shadow-sm text-blue-600" 
                : "px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-700";
        }
    });

    // 2. 曜日切替ボタンの表示制御とアクティブ状態更新
    const nav = document.getElementById('day-nav-buttons');
    if (nav) {
        nav.className = state.viewMode === 'weekly' ? 'flex gap-1 invisible' : 'flex gap-1';
    }

    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(x => {
        const btn = document.querySelector(`[data-action="change-day-${x}"]`);
        if (btn) {
            btn.className = (x === state.currentDay) 
                ? "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-600 text-white shadow-sm" 
                : "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100";
        }
    });

    // 3. 日付と曜日ラベルの更新
    const lblDay = document.getElementById('current-day-label');
    const lblDate = document.getElementById('day-date-label');
    if (lblDay && lblDate) {
        if (state.viewMode === 'daily') {
            lblDay.innerText = dayNames[state.currentDay];
            lblDate.innerText = getFormattedDate(state.currentWeek, state.currentDay);
        } else if (state.viewMode === 'three-day') {
            lblDay.innerText = '3日表示';
            const d = get3Days(state.currentDay);
            lblDate.innerText = getFormattedDate(state.currentWeek, d[0]) + '〜' + getFormattedDate(state.currentWeek, d[2]);
        } else {
            lblDay.innerText = '週表示';
            lblDate.innerText = getFormattedDate(state.currentWeek, 'Mon') + '〜' + getFormattedDate(state.currentWeek, 'Fri');
        }
    }
}