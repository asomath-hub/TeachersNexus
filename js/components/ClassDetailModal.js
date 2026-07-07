/**
 * js/components/ClassDetailModal.js
 * 授業詳細モーダル（一時変更、連絡事項、配置済みタスク表示）のUIとイベントを管理するコンポーネント。
 */

import { state, setActiveModalPeriodId, setActiveModalDayStr, setTemporaryChanges, setAnnouncements } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';

let onReturnTaskToUnplanned = null;
let onStartMoveTask = null;
let onToggleTask = null;
let onStateChange = null;
let initialized = false;

/**
 * ClassDetailModalコンポーネントの初期化
 * @param {Object} callbacks - 外部との連携用コールバック関数群
 */
export function initClassDetailModal(callbacks = {}) {
    onReturnTaskToUnplanned = callbacks.onReturnTaskToUnplanned || null;
    onStartMoveTask = callbacks.onStartMoveTask || null;
    onToggleTask = callbacks.onToggleTask || null;
    onStateChange = callbacks.onStateChange || null;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }
}

function setupEventListeners() {
    const modal = document.getElementById('class-detail-modal');
    if (!modal) return;

    // HTMLのonclick属性を安全に剥がし、addEventListenerに置き換える
    const closeBtn = modal.querySelector('[data-action="close-class-detail"]')
    if (closeBtn) {
        closeBtn.removeAttribute('onclick');
        closeBtn.addEventListener('click', closeClassDetailModal);
    }

    const toggleBtn = modal.querySelector('[data-action="toggle-temp-change"]')
    if (toggleBtn) {
        toggleBtn.removeAttribute('onclick');
        toggleBtn.addEventListener('click', toggleTempChangeMode);
    }

    const resetBtn = modal.querySelector('[data-action="reset-temp-change"]')
    if (resetBtn) {
        resetBtn.removeAttribute('onclick');
        resetBtn.addEventListener('click', resetTempChange);
    }

    const saveBtn = modal.querySelector('[data-action="save-temp-change"]')
    if (saveBtn) {
        saveBtn.removeAttribute('onclick');
        saveBtn.addEventListener('click', saveTempChange);
    }

    const addAnnounceBtn = modal.querySelector('[data-action="add-announcement"]')
    if (addAnnounceBtn) {
        addAnnounceBtn.removeAttribute('onclick');
        addAnnounceBtn.addEventListener('click', addAnnouncement);
    }
}

/**
 * 授業詳細モーダルを開く
 * @param {string} id - 時限のID (例: 'p1')
 * @param {string} dayStr - 曜日文字列 (例: 'Mon')
 */
export function openClassDetailModal(id, dayStr) {
    setActiveModalPeriodId(id);
    setActiveModalDayStr(dayStr);
    
    document.getElementById('class-detail-modal').classList.remove('hidden');
    document.getElementById('temp-change-form').classList.add('hidden');
    
    const key = 'w' + state.currentWeek + '-' + dayStr + '-' + id;
    const p = state.timetableData[dayStr].find(x => x.id === id);
    if (!p) return;

    // 一時変更がある場合はマージ
    const d = state.temporaryChanges[key] ? { ...p, ...state.temporaryChanges[key] } : p;
    
    document.getElementById('modal-period').innerText = d.num;
    document.getElementById('modal-title').innerText = d.subject + (d.class ? ' (' + d.class + ')' : '');
    document.getElementById('tc-type').value = d.type;
    
    const subjectSelect = document.getElementById('tc-subject');
    let opts = '<option value="">(未設定)</option>';
    state.subjectsList.forEach(s => {
        opts += `<option value="${escapeHTML(s.name)}" ${s.name === d.subject ? 'selected' : ''}>${escapeHTML(s.name)}</option>`;
    });
    if (d.subject && !state.subjectsList.find(s => s.name === d.subject)) {
        opts += `<option value="${escapeHTML(d.subject)}" selected>${escapeHTML(d.subject)}</option>`;
    }
    subjectSelect.innerHTML = opts;

    document.getElementById('tc-class').value = d.class || '';

    renderAnnouncements();
    renderModalTasks();
}

function closeClassDetailModal() { 
    document.getElementById('class-detail-modal').classList.add('hidden'); 
    setActiveModalPeriodId(null); 
    setActiveModalDayStr(null);
}

function toggleTempChangeMode() { 
    document.getElementById('temp-change-form').classList.toggle('hidden'); 
}

function saveTempChange() {
    const key = 'w' + state.currentWeek + '-' + state.activeModalDayStr + '-' + state.activeModalPeriodId;
    
    // ImmutableにStateを更新
    const newChanges = { ...state.temporaryChanges };
    newChanges[key] = {
        type: document.getElementById('tc-type').value,
        subject: document.getElementById('tc-subject').value,
        class: document.getElementById('tc-class').value
    };
    
    setTemporaryChanges(newChanges);
    saveAllData(); 
    toggleTempChangeMode(); 
    openClassDetailModal(state.activeModalPeriodId, state.activeModalDayStr); 
    if (onStateChange) onStateChange();
    showToast('今週の変更を保存しました');
}

function resetTempChange() {
    const key = 'w' + state.currentWeek + '-' + state.activeModalDayStr + '-' + state.activeModalPeriodId;
    
    // ImmutableにStateを更新
    const newChanges = { ...state.temporaryChanges };
    delete newChanges[key];
    
    setTemporaryChanges(newChanges);
    saveAllData(); 
    toggleTempChangeMode(); 
    openClassDetailModal(state.activeModalPeriodId, state.activeModalDayStr); 
    if (onStateChange) onStateChange();
    showToast('基本の時間割に戻しました');
}

function renderAnnouncements() {
    const key = 'w' + state.currentWeek + '-' + state.activeModalDayStr + '-' + state.activeModalPeriodId;
    const al = state.announcements[key] || [];
    const ul = document.getElementById('modal-announcements');
    ul.innerHTML = '';
    
    al.forEach((a, i) => {
        const li = document.createElement('li');
        li.className = "text-xs bg-slate-50 border border-slate-200 rounded p-2 flex justify-between items-center group";
        
        const span = document.createElement('span');
        span.className = "text-slate-700";
        span.innerText = a; // escapeHTMLと同様の効果
        
        const delBtn = document.createElement('button');
        delBtn.className = "text-red-500 opacity-0 group-hover:opacity-100 p-1";
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.addEventListener('click', () => deleteAnnouncement(i));
        
        li.appendChild(span);
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
}

function addAnnouncement() {
    const val = document.getElementById('new-announcement-input').value.trim();
    if (!val) return;
    const key = 'w' + state.currentWeek + '-' + state.activeModalDayStr + '-' + state.activeModalPeriodId;
    
    // ImmutableにStateを更新
    const newAnnouncements = { ...state.announcements };
    if (!newAnnouncements[key]) newAnnouncements[key] = [];
    newAnnouncements[key] = [...newAnnouncements[key], val];
    
    setAnnouncements(newAnnouncements);
    saveAllData(); 
    renderAnnouncements(); 
    document.getElementById('new-announcement-input').value = '';
}

function deleteAnnouncement(idx) {
    const key = 'w' + state.currentWeek + '-' + state.activeModalDayStr + '-' + state.activeModalPeriodId;
    
    // ImmutableにStateを更新
    const newAnnouncements = { ...state.announcements };
    if (newAnnouncements[key]) {
        newAnnouncements[key] = newAnnouncements[key].filter((_, i) => i !== idx);
        if (newAnnouncements[key].length === 0) {
            delete newAnnouncements[key];
        }
    }
    
    setAnnouncements(newAnnouncements);
    saveAllData(); 
    renderAnnouncements();
}

function renderModalTasks() {
    const key = 'w' + state.currentWeek + '-' + state.activeModalDayStr + '-' + state.activeModalPeriodId;
    const ts = state.tasks.filter(t => t.assignedPeriodId === key && !t.completed);
    const container = document.getElementById('modal-assigned-tasks');
    container.innerHTML = '';
    
    if (ts.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-dashed border-slate-200">この時間のタスクはありません</p>';
        return;
    }
    
    ts.forEach(t => {
        const wrapper = document.createElement('div');
        wrapper.className = "flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 shadow-sm";
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = "mt-0.5 cursor-pointer";
        checkbox.addEventListener('change', () => {
            if (onToggleTask) onToggleTask(t.id);
        });
        
        const titleSpan = document.createElement('span');
        titleSpan.className = "flex-1 text-xs font-bold text-slate-800 leading-tight";
        titleSpan.innerText = t.title;
        
        const btnDiv = document.createElement('div');
        btnDiv.className = "flex gap-1 shrink-0";
        
        const moveBtn = document.createElement('button');
        moveBtn.className = "text-blue-600 bg-blue-100 p-1.5 rounded-lg hover:bg-blue-200";
        moveBtn.title = "別のコマへ移動";
        moveBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>';
        moveBtn.addEventListener('click', () => {
            if (onStartMoveTask) onStartMoveTask(t.id);
            closeClassDetailModal();
        });
        
        const returnBtn = document.createElement('button');
        returnBtn.className = "text-slate-600 bg-slate-200 p-1.5 rounded-lg hover:bg-slate-300";
        returnBtn.title = "未計画に戻す";
        returnBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
        returnBtn.addEventListener('click', () => {
            if (onReturnTaskToUnplanned) onReturnTaskToUnplanned(t.id);
        });
        
        btnDiv.appendChild(moveBtn);
        btnDiv.appendChild(returnBtn);
        wrapper.appendChild(checkbox);
        wrapper.appendChild(titleSpan);
        wrapper.appendChild(btnDiv);
        container.appendChild(wrapper);
    });
}