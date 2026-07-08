/**
 * js/components/BaseSettingsModal.js
 * 基本時間割設定モーダルのUIとイベントを管理するコンポーネント。
 */

import { state, setTimetableData, setClassList } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';

let onStateChange = null;
let initialized = false;

/**
 * BaseSettingsModalコンポーネントの初期化
 * @param {Object} callbacks - 外部との連携用コールバック関数群
 */
export function initBaseSettingsModal(callbacks = {}) {
    onStateChange = callbacks.onStateChange || null;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }
}

function setupEventListeners() {
    const modal = document.getElementById('base-settings-modal');
    if (!modal) return;

    // 閉じるボタン (複数存在するため querySelectorAll で取得)
    const closeBtns = modal.querySelectorAll('[data-action="close-base-settings"]');
    closeBtns.forEach(btn => {
        btn.removeAttribute('onclick'); // 移行途中の安全措置
        btn.addEventListener('click', closeBaseSettingsModal);
    });

    // 保存ボタン
    const saveBtn = modal.querySelector('[data-action="save-base-settings"]');
    if (saveBtn) {
        saveBtn.removeAttribute('onclick'); // 移行途中の安全措置
        saveBtn.addEventListener('click', saveBaseSettings);
    }
}

export function openBaseSettingsModal() {
    renderBaseSettingsGrid();
    const modal = document.getElementById('base-settings-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeBaseSettingsModal() {
    const modal = document.getElementById('base-settings-modal');
    if (modal) modal.classList.add('hidden');
}

function renderBaseSettingsGrid() {
    const container = document.getElementById('base-settings-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayLabels = { 'Mon': '月', 'Tue': '火', 'Wed': '水', 'Thu': '木', 'Fri': '金' };

    days.forEach(day => {
        const dayCol = document.createElement('div');
        dayCol.className = 'flex flex-col gap-2';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'font-bold text-center text-slate-700 pb-2 border-b';
        dayHeader.textContent = dayLabels[day];
        dayCol.appendChild(dayHeader);

        const periods = state.timetableData[day] || [];
        periods.forEach(p => {
            const pDiv = document.createElement('div');
            pDiv.className = 'bg-slate-50 p-2 rounded border border-slate-200 text-xs flex flex-col gap-1';
            
            pDiv.innerHTML = `
                <div class="font-bold text-slate-500">${escapeHTML(p.num)}</div>
                <select class="border border-slate-200 rounded p-1 bs-type" data-day="${day}" data-id="${p.id}">
                    <option value="empty" ${p.type === 'empty' ? 'selected' : ''}>空き</option>
                    <option value="class" ${p.type === 'class' ? 'selected' : ''}>授業</option>
                    <option value="task" ${p.type === 'task' ? 'selected' : ''}>校務</option>
                    <option value="afterschool" ${p.type === 'afterschool' ? 'selected' : ''}>放課後</option>
                </select>
                <input type="text" class="border border-slate-200 rounded p-1 bs-subject" value="${escapeHTML(p.subject)}" placeholder="科目/タスク名">
                <input type="text" class="border border-slate-200 rounded p-1 bs-class" value="${escapeHTML(p.class || '')}" placeholder="対象クラス">
            `;
            dayCol.appendChild(pDiv);
        });
        
        container.appendChild(dayCol);
    });

    // クラスリスト編集エリアの動的追加
    let classListSection = document.getElementById('base-settings-class-list-section');
    if (!classListSection) {
        classListSection = document.createElement('div');
        classListSection.id = 'base-settings-class-list-section';
        classListSection.className = 'mt-6 pt-4 border-t border-slate-200';
        container.parentElement.appendChild(classListSection);
    }
    
    classListSection.innerHTML = `
        <h4 class="font-bold text-slate-700 mb-2"><i class="fa-solid fa-users mr-2 text-slate-400"></i>クラス候補の設定</h4>
        <p class="text-[10px] text-slate-500 mb-2">1行に1クラス入力してください。授業変更時のプルダウンに表示されます。</p>
        <textarea id="class-list-textarea" class="w-full h-32 border border-slate-200 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white"></textarea>
    `;
    
    const textarea = document.getElementById('class-list-textarea');
    if (textarea) {
        textarea.value = state.classList.join('\n');
    }
}

function saveBaseSettings() {
    const container = document.getElementById('base-settings-grid');
    if (!container) return;
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const newData = {};
    
    days.forEach(day => {
        newData[day] = [];
        const originalPeriods = state.timetableData[day] || [];
        
        originalPeriods.forEach((origP, index) => {
            const selects = container.querySelectorAll(`select[data-day="${day}"]`);
            if (selects[index]) {
                const parent = selects[index].parentElement;
                const type = selects[index].value;
                const subject = parent.querySelector('.bs-subject').value.trim();
                const cls = parent.querySelector('.bs-class').value.trim();
                
                newData[day].push({
                    id: origP.id,
                    num: origP.num,
                    type: type,
                    subject: subject,
                    class: cls
                });
            } else {
                newData[day].push({ ...origP });
            }
        });
    });

    // クラスリストの保存処理
    const classListTextarea = document.getElementById('class-list-textarea');
    if (classListTextarea) {
        const newClassList = classListTextarea.value
            .split('\n')
            .map(c => c.trim())
            .filter(c => c !== '');
        setClassList(newClassList);
    }
    
    // ImmutableにStateを更新
    setTimetableData(newData);
    saveAllData(); 
    closeBaseSettingsModal(); 
    
    // メイン画面の再描画などを依頼
    if (onStateChange) onStateChange(); 
    
    showToast('基本時間割とクラス候補を保存しました');
}