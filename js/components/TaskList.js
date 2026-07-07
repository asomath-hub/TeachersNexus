/**
 * js/components/TaskList.js
 * 未計画タスク一覧、リストのタブ切り替え、タスク追加・完了・移動等の操作を担当するコンポーネント。
 */

import { state, setSelectedFilter, setActiveMovingTaskId, setTasks } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';

let onStateChangeCallback = null;
let initialized = false;

/**
 * TaskListコンポーネントの初期化
 * @param {Function} onChangeCallback - State変更時に外部（Timetable等）の再描画を促すコールバック
 */
export function initTaskList(onChangeCallback) {
    onStateChangeCallback = onChangeCallback;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }

    updateTaskListUI();
}

function setupEventListeners() {
    // フォームのonsubmitを安全に剥がし、addEventListenerに置き換える
    const form = document.querySelector('[data-action="add-task"]');
    if (form) {
        form.removeAttribute('onsubmit');
        form.addEventListener('submit', handleAddTask);
    }
}

/**
 * 自身のUI（リストタブと未計画タスク一覧）を再描画する
 */
export function updateTaskListUI() {
    renderLists();
    renderUnplannedTasks();
}

function renderLists() {
    const lc = document.getElementById('list-tabs-container');
    if (!lc) return;
    lc.innerHTML = '';
    
    // 「すべて」ボタンの生成
    const btnAll = document.createElement('button');
    btnAll.className = "px-3 py-1 rounded-full text-[10px] font-bold shrink-0 " + (state.selectedFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600');
    btnAll.innerText = "すべて";
    btnAll.addEventListener('click', () => filterTasks('all'));
    lc.appendChild(btnAll);

    // 各リストのボタンの生成
    state.lists.forEach(l => {
        const btn = document.createElement('button');
        btn.className = "px-3 py-1 rounded-full text-[10px] font-bold shrink-0 " + (state.selectedFilter === l ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600');
        btn.innerText = l;
        btn.addEventListener('click', () => filterTasks(l));
        lc.appendChild(btn);
    });
}

function filterTasks(cat) { 
    setSelectedFilter(cat); 
    updateTaskListUI(); 
}

function renderUnplannedTasks() {
    const lc = document.getElementById('unplanned-task-list');
    const countEl = document.getElementById('unplanned-count');
    if (!lc || !countEl) return;
    
    lc.innerHTML = '';
    
    // 件数の更新
    const unplannedCount = state.tasks.filter(t => !t.assignedPeriodId && !t.completed).length;
    countEl.innerText = unplannedCount + '件';

    const movingMsg = document.getElementById('moving-task-message');
    if (movingMsg) {
        if (state.activeMovingTaskId) {
            movingMsg.innerHTML = '';
            const msgDiv = document.createElement('div');
            msgDiv.className = "bg-blue-600 text-white p-2.5 rounded-xl text-xs font-bold shadow-md flex justify-between items-center animate-pulse cursor-pointer";
            msgDiv.addEventListener('click', cancelMoveTask);
            
            const span = document.createElement('span');
            span.className = "truncate pr-2";
            span.innerText = "配置先コマをタップ...";
            
            const btn = document.createElement('button');
            btn.className = "bg-blue-800 px-3 py-1 rounded-lg shrink-0 text-[10px]";
            btn.innerText = "キャンセル";
            
            msgDiv.appendChild(span);
            msgDiv.appendChild(btn);
            movingMsg.appendChild(msgDiv);
        } else {
            movingMsg.innerHTML = '';
        }
    }

    const ft = state.tasks.filter(t => (!t.assignedPeriodId && !t.completed && (state.selectedFilter === 'all' || t.list === state.selectedFilter)));
    
    ft.forEach(t => {
        const isMoving = t.id === state.activeMovingTaskId;
        const d = document.createElement('div');
        d.className = isMoving 
            ? "bg-blue-50 border-2 border-blue-400 p-2.5 rounded-lg shadow-sm text-xs flex gap-2 items-start" 
            : "bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs flex gap-2 items-start hover:border-blue-300 transition-colors cursor-pointer";
        
        // 領域クリックでキャンセルする処理
        d.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                if (state.activeMovingTaskId) cancelMoveTask();
            }
        });

        // チェックボックス
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mt-0.5';
        checkbox.addEventListener('change', () => toggleTask(t.id));

        // タイトル
        const titleDiv = document.createElement('div');
        titleDiv.className = 'font-bold flex-1 text-slate-700 leading-tight pt-0.5';
        titleDiv.innerHTML = escapeHTML(t.title);

        // 配置・移動ボタン
        const btn = document.createElement('button');
        btn.className = 'text-blue-500 hover:bg-blue-100 p-1.5 rounded-lg transition-colors shrink-0';
        btn.title = '配置・移動';
        btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket text-sm"></i>';
        btn.addEventListener('click', () => startMoveTask(t.id));

        d.appendChild(checkbox);
        d.appendChild(titleDiv);
        d.appendChild(btn);
        
        lc.appendChild(d);
    });
}

export function startMoveTask(id) { 
    setActiveMovingTaskId(id); 
    updateTaskListUI();
    if (onStateChangeCallback) onStateChangeCallback();
    showToast('配置したいコマをタップしてください'); 
}

export function cancelMoveTask() { 
    setActiveMovingTaskId(null); 
    updateTaskListUI();
    if (onStateChangeCallback) onStateChangeCallback();
}

/**
 * タスクを時間割に配置する (Timetableから呼ばれる想定)
 */
export function assignTaskToPeriod(periodKey) {
    const targetExists = state.tasks.some(x => x.id === state.activeMovingTaskId);
    if (targetExists) {
        // immutable state update
        setTasks(state.tasks.map(task => 
            task.id === state.activeMovingTaskId ? { ...task, assignedPeriodId: periodKey } : task
        ));
        
        setActiveMovingTaskId(null);
        saveAllData(); 
        updateTaskListUI();
        if (onStateChangeCallback) onStateChangeCallback();
        showToast('タスクを配置しました');
    }
}

/**
 * タスクを未計画に戻す (Modalや他のコンポーネントからも呼ばれる想定)
 */
export function returnTaskToUnplanned(id) {
    const targetExists = state.tasks.some(x => x.id === id);
    if (targetExists) { 
        // immutable state update
        setTasks(state.tasks.map(task => 
            task.id === id ? { ...task, assignedPeriodId: null } : task
        ));

        if (state.activeMovingTaskId === id) setActiveMovingTaskId(null);
        
        saveAllData(); 
        updateTaskListUI();
        if (onStateChangeCallback) onStateChangeCallback(); 
        showToast('未計画に戻しました'); 
    }
}

export function handleAddTask(e) {
    e.preventDefault();
    const input = document.getElementById('new-task-title');
    if (!input) return;
    
    const val = input.value.trim();
    const list = state.selectedFilter === 'all' ? (state.lists[0] || 'その他') : state.selectedFilter;
    if (val) { 
        const newTask = { id: 't_' + Date.now(), title: val, list: list, completed: false, assignedPeriodId: null };
        // immutable state update
        setTasks([newTask, ...state.tasks]); 

        saveAllData(); 
        updateTaskListUI();
        if (onStateChangeCallback) onStateChangeCallback();
        input.value = ''; 
    }
}

export function toggleTask(id) {
    const targetExists = state.tasks.some(x => x.id === id);
    if (targetExists) { 
        // immutable state update
        setTasks(state.tasks.map(task => 
            task.id === id ? { ...task, completed: true } : task
        ));
        
        saveAllData(); 
        updateTaskListUI();
        if (onStateChangeCallback) onStateChangeCallback();
        showToast('タスク完了！'); 
    }
}