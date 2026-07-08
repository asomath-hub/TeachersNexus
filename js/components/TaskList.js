/**
 * js/components/TaskList.js
 * タスクリスト（未計画タスク）のUIとイベントを管理するコンポーネント。
 */

import { state, setTasks, setActiveMovingTaskId, setSelectedFilter } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';
import { completeGoogleTask } from '../services/googleSync.js';

let onChangeCallback = null;
let initialized = false;

/**
 * TaskListコンポーネントの初期化
 * @param {Function} callback - 状態変更時の再描画コールバック
 */
export function initTaskList(callback) {
    onChangeCallback = callback || null;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }
}

function setupEventListeners() {
    // フォームの取得
    const form = document.querySelector('[data-action="add-task"]');
    if (form) {
        form.removeAttribute('onsubmit'); // 移行途中の安全措置
        form.addEventListener('submit', handleAddTask);
    }

    // タブ切り替え（フィルタ）のイベントリスナー設定
    const tabsContainer = document.getElementById('list-tabs-container');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const filter = btn.getAttribute('data-filter');
            if (filter) {
                setSelectedFilter(filter);
                updateTaskListUI();
                if (onChangeCallback) onChangeCallback();
            }
        });
    }
}

export function updateTaskListUI() {
    renderLists();
    renderUnplannedTasks();
}

function renderLists() {
    const container = document.getElementById('list-tabs-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // "すべて" タブ
    const allBtn = document.createElement('button');
    allBtn.className = `px-3 py-1 text-sm rounded-full whitespace-nowrap ${state.selectedFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`;
    allBtn.textContent = 'すべて';
    allBtn.setAttribute('data-filter', 'all');
    container.appendChild(allBtn);

    // 各リストタブ
    state.lists.forEach(listName => {
        const btn = document.createElement('button');
        btn.className = `px-3 py-1 text-sm rounded-full whitespace-nowrap ${state.selectedFilter === listName ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`;
        btn.textContent = escapeHTML(listName);
        btn.setAttribute('data-filter', listName);
        container.appendChild(btn);
    });
}

function renderUnplannedTasks() {
    const container = document.getElementById('unplanned-task-list');
    const countEl = document.getElementById('unplanned-count');
    const msgEl = document.getElementById('moving-task-message');

    if (!container) return;
    
    container.innerHTML = '';
    
    const targetTasks = state.tasks.filter(t => !t.assignedPeriodId && !t.completed);
    const filteredTasks = state.selectedFilter === 'all' ? targetTasks : targetTasks.filter(t => t.list === state.selectedFilter);
    
    // 件数バッジの更新
    if (countEl) {
        countEl.textContent = `${filteredTasks.length}件`;
    }

    // 移動中メッセージの更新
    if (msgEl) {
        if (state.activeMovingTaskId) {
            msgEl.innerHTML = '<div class="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded mb-2"><i class="fa-solid fa-people-carry mr-1"></i>配置するコマをクリックしてください</div>';
        } else {
            msgEl.innerHTML = '';
        }
    }

    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="text-slate-500 text-sm p-4 text-center">未計画のタスクはありません</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const div = document.createElement('div');
        const isMoving = state.activeMovingTaskId === task.id;
        
        div.className = `flex items-center gap-2 p-3 border-b border-slate-100 transition-colors ${isMoving ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`;
        
        div.innerHTML = `
            <input type="checkbox" class="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
            <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-800 truncate">${escapeHTML(task.title)}</div>
                <div class="text-xs text-slate-500">${escapeHTML(task.list)}</div>
            </div>
            <button class="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors btn-move" title="時間割に配置">
                <i class="fas fa-arrow-right"></i>
            </button>
        `;
        
        const chk = div.querySelector('input[type="checkbox"]');
        chk.addEventListener('change', () => toggleTask(task.id));
        
        const moveBtn = div.querySelector('.btn-move');
        moveBtn.addEventListener('click', () => startMoveTask(task.id));
        
        container.appendChild(div);
    });
}

function handleAddTask(event) {
    event.preventDefault();
    const input = document.getElementById('new-task-title');
    
    if (!input) return;
    
    const title = input.value.trim();
    if (!title) return;
    
    // 現在選択中のタブ(フィルタ)をデフォルトのリスト名として使用
    const list = state.selectedFilter !== 'all' ? state.selectedFilter : (state.lists[0] || 'その他');
    
    const newTask = {
        id: 't' + Date.now(),
        title: title,
        list: list,
        completed: false,
        assignedPeriodId: null
    };
    
    setTasks([newTask, ...state.tasks]);
    saveAllData();
    
    input.value = '';
    
    if (onChangeCallback) onChangeCallback();
    showToast('タスクを追加しました');
}

export async function toggleTask(id) {
    const targetTask = state.tasks.find(task => task.id === id);

    // ローカルの完了処理を先に行う
    setTasks(
        state.tasks.map(task => 
            task.id === id 
                ? { ...task, completed: true } 
                : task
        )
    );
    saveAllData();
    
    if (onChangeCallback) onChangeCallback();

    // Google由来のタスクの場合、Google側にも完了を反映する
    if (targetTask && targetTask.source === 'google' && targetTask.googleTaskId && targetTask.googleListId) {
        const result = await completeGoogleTask(targetTask.googleListId, targetTask.googleTaskId);
        if (!result.ok) {
            showToast('ローカルでは完了しましたが、Google ToDoへの反映に失敗しました');
        }
    }
}

export function startMoveTask(id) {
    if (state.activeMovingTaskId === id) {
        setActiveMovingTaskId(null);
    } else {
        setActiveMovingTaskId(id);
        showToast('配置するコマをクリックしてください');
    }
    if (onChangeCallback) onChangeCallback();
}

export function assignTaskToPeriod(periodId) {
    if (!state.activeMovingTaskId) return;
    
    setTasks(
        state.tasks.map(task => 
            task.id === state.activeMovingTaskId 
                ? { ...task, assignedPeriodId: periodId } 
                : task
        )
    );
    setActiveMovingTaskId(null);
    saveAllData();
    
    if (onChangeCallback) onChangeCallback();
    showToast('タスクを配置しました');
}

export function returnTaskToUnplanned(id) {
    setTasks(
        state.tasks.map(task => 
            task.id === id 
                ? { ...task, assignedPeriodId: null } 
                : task
        )
    );
    saveAllData();
    
    if (onChangeCallback) onChangeCallback();
}