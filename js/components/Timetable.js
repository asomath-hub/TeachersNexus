/**
 * js/components/Timetable.js
 * 時間割エリアの描画と、各コマのクリック操作（タスク配置 / 詳細モーダルを開く）を担当するコンポーネント。
 */

import { state } from '../state/appState.js';
import { get3Days, dayNames } from '../utils/date.js';
import { getSubjectColors } from '../utils/colors.js';
import { escapeHTML } from '../utils/escape.js';

let onAssignTaskToPeriod = null;
let onOpenClassDetail = null;
let initialized = false;

/**
 * Timetableコンポーネントの初期化
 * @param {Object} callbacks - 外部との連携用コールバック関数群
 */
export function initTimetable(callbacks = {}) {
    onAssignTaskToPeriod = callbacks.onAssignTaskToPeriod || null;
    onOpenClassDetail = callbacks.onOpenClassDetail || null;

    if (!initialized) {
        // Timetableの各要素は動的生成のため、ここでは静的なaddEventListenerは不要です。
        // 代わりに renderPeriods 内で要素生成時に都度リスナーを登録します。
        initialized = true;
    }

    updateTimetableUI();
}

/**
 * 時間割全体のUI（日/3日/週表示）を再描画する
 */
export function updateTimetableUI() {
    const tc = document.getElementById('timetable-container');
    if (!tc) return;
    
    tc.innerHTML = '';
    
    if (state.viewMode === 'daily') {
        tc.className = "flex flex-col space-y-3 max-w-2xl mx-auto";
        const periods = state.timetableData[state.currentDay] || [];
        renderPeriods(periods, tc, state.currentDay);
    } else {
        tc.className = state.viewMode === 'three-day' ? "grid grid-cols-3 gap-1 md:gap-3" : "grid grid-cols-5 gap-1 md:gap-2";
        const days = state.viewMode === 'three-day' ? get3Days(state.currentDay) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        days.forEach(dc => {
            // 列（1日分）のコンテナ作成
            const col = document.createElement('div');
            col.className = "bg-white border border-slate-200 rounded-lg md:rounded-xl p-0.5 md:p-1.5 shadow-sm min-w-0";
            
            // ヘッダー（曜日）
            const title = document.createElement('h3');
            title.className = "font-bold text-center mb-1 text-slate-800 text-[11px] md:text-sm";
            title.innerText = dayNames[dc].charAt(0); // 「月曜日」の「月」だけ取得
            col.appendChild(title);
            
            // コマ一覧のラッパー
            const wrap = document.createElement('div');
            wrap.className = "space-y-1 md:space-y-1.5";
            const periods = state.timetableData[dc] || [];
            renderPeriods(periods, wrap, dc);
            
            col.appendChild(wrap);
            tc.appendChild(col);
        });
    }
}

/**
 * 指定された曜日のコマ一覧をレンダリングしてコンテナに追加する
 */
function renderPeriods(periods, container, dc) {
    periods.forEach(p => {
        const key = 'w' + state.currentWeek + '-' + dc + '-' + p.id;
        
        // 今週だけの変更（temporaryChanges）があれば上書きマージ
        const d = (state.temporaryChanges[key]) ? { ...p, ...state.temporaryChanges[key] } : p;
        const colors = getSubjectColors(d.subject, d.type, state.subjectsList);
        
        let hClass = "min-h-[88px]";
        if (d.num === '昼') hClass = "min-h-[32px] py-0.5";
        else if (d.num === '放') hClass = "min-h-[65px]";

        const el = document.createElement('div');
        
        if (state.activeMovingTaskId) {
            el.className = colors.bg + " border " + colors.borderL + " rounded-lg p-1 md:px-2 md:py-1.5 flex flex-col justify-between cursor-pointer " + hClass + " shadow-sm relative ring-2 ring-blue-500 ring-offset-1 animate-pulse hover:bg-blue-100 transition-colors";
        } else {
            el.className = colors.bg + " border " + colors.borderL + " rounded-lg p-1 md:px-2 md:py-1.5 flex flex-col justify-between cursor-pointer " + hClass + " shadow-sm relative group hover:brightness-95 transition-all";
        }
        
        // 動的生成要素への addEventListener（onclick 廃止）
        el.addEventListener('click', () => {
            if (state.activeMovingTaskId) {
                // タスク配置モード
                if (onAssignTaskToPeriod) onAssignTaskToPeriod(key);
            } else {
                // 授業詳細モーダルを開く
                if (onOpenClassDetail) onOpenClassDetail(p.id, dc);
            }
        });

        const badge = `<span class="inline-block px-1 w-6 py-0.5 text-center text-[10px] font-black rounded-sm ${colors.badge}">${escapeHTML(d.num)}</span>`;
        
        // このコマに配置されている未完了タスクのHTML生成
        let tHtml = '';
        const ts = state.tasks.filter(t => t.assignedPeriodId === key && !t.completed);
        if (ts.length > 0) {
            tHtml = '<div class="mt-1 space-y-0.5">' + 
                    ts.map(t => `<div class="text-[10px] bg-white/80 px-1 py-0.5 rounded truncate border border-slate-100 font-bold">${escapeHTML(t.title)}</div>`).join('') + 
                    '</div>';
        }

        // 科目やクラス名などのHTML組み立て
        if (d.type === 'empty') {
            el.innerHTML = `<div class="flex gap-1 md:gap-1.5">${badge}<span class="text-[12px] md:text-[14px] font-extrabold opacity-60 text-slate-500 truncate mt-0.5">${escapeHTML(d.subject)}</span></div>${tHtml}`;
        } else if (d.type === 'afterschool') {
            el.innerHTML = `<div class="flex gap-1 md:gap-1.5">${badge}<span class="text-[12px] md:text-[14px] font-extrabold text-indigo-900 truncate mt-0.5">${escapeHTML(d.subject)}</span></div>${tHtml}`;
        } else {
            el.innerHTML = [
                '<div class="flex flex-col gap-0.5">',
                `  <div class="flex gap-1 md:gap-1.5">${badge}<span class="text-[13px] md:text-[14px] font-extrabold text-slate-900 truncate mt-0.5">${escapeHTML(d.subject)}</span></div>`,
                d.class ? `  <div class="text-[10px] font-bold text-slate-600 truncate ml-7">${escapeHTML(d.class)}</div>` : '',
                '</div>', 
                tHtml
            ].join('');
        }
        
        container.appendChild(el);
    });
}