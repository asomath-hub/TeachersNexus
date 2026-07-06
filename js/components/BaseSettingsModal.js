/**
 * js/components/BaseSettingsModal.js
 * 基本時間割設定モーダルのUIとイベント、および保存処理を管理するコンポーネント。
 */

import { state, setTimetableData } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';
import { dayNames } from '../utils/date.js';

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
    const closeBtns = modal.querySelectorAll('button[onclick="closeBaseSettingsModal()"]');
    closeBtns.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', closeBaseSettingsModal);
    });

    // 保存ボタン
    const saveBtn = modal.querySelector('button[onclick="saveBaseSettings()"]');
    if (saveBtn) {
        saveBtn.removeAttribute('onclick');
        saveBtn.addEventListener('click', saveBaseSettings);
    }
}

export function openBaseSettingsModal() {
    renderBaseSettingsGrid();
    document.getElementById('base-settings-modal').classList.remove('hidden');
}

export function closeBaseSettingsModal() { 
    document.getElementById('base-settings-modal').classList.add('hidden'); 
}

function renderBaseSettingsGrid() {
    const g = document.getElementById('base-settings-grid');
    if (!g) return;
    
    g.innerHTML = '';
    
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => {
        const col = document.createElement('div');
        col.className = 'border border-slate-200 rounded-lg p-2 bg-white';
        col.innerHTML = `<h4 class="font-bold text-center text-sm mb-2">${escapeHTML(dayNames[d])}</h4>`;
        
        let subjectOptionsHTML = '<option value="">(未設定)</option>' + 
            state.subjectsList.map(s => `<option value="${escapeHTML(s.name)}">${escapeHTML(s.name)}</option>`).join('');
        
        state.timetableData[d].forEach(p => {
            let sOpts = subjectOptionsHTML;
            if (p.subject && !state.subjectsList.find(s => s.name === p.subject)) {
                sOpts += `<option value="${escapeHTML(p.subject)}">${escapeHTML(p.subject)}</option>`;
            }
            
            col.innerHTML += `
                <div class="mb-2 p-1 border border-slate-100 rounded bg-slate-50" data-id="${p.id}" data-day="${d}">
                    <div class="text-[10px] font-bold text-slate-500 mb-1">${escapeHTML(p.num)}限</div>
                    <select class="w-full text-xs border rounded p-1 mb-1 bs-type bg-white">
                        <option value="class" ${p.type === 'class' ? 'selected' : ''}>授業</option>
                        <option value="empty" ${p.type === 'empty' ? 'selected' : ''}>空き</option>
                        <option value="afterschool" ${p.type === 'afterschool' ? 'selected' : ''}>放課後</option>
                    </select>
                    <select class="w-full text-xs border rounded p-1 mb-1 bs-subject bg-white">
                        ${sOpts.replace(`value="${escapeHTML(p.subject)}"`, `value="${escapeHTML(p.subject)}" selected`)}
                    </select>
                    <input type="text" class="w-full text-xs border rounded p-1 bs-class bg-white" placeholder="クラス" value="${escapeHTML(p.class || '')}">
                </div>
            `;
        });
        g.appendChild(col);
    });
}

function saveBaseSettings() {
    // 既存の状態を深くコピー（イミュータブルな更新のため）
    const newTimetableData = JSON.parse(JSON.stringify(state.timetableData));
    
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => {
        const divs = document.querySelectorAll(`#base-settings-grid div[data-day="${d}"]`);
        divs.forEach((div, i) => {
            if (newTimetableData[d] && newTimetableData[d][i]) {
                newTimetableData[d][i].type = div.querySelector('.bs-type').value;
                newTimetableData[d][i].subject = div.querySelector('.bs-subject').value;
                newTimetableData[d][i].class = div.querySelector('.bs-class').value;
            }
        });
    });
    
    // Setterを用いて状態を更新
    setTimetableData(newTimetableData);
    saveAllData(); 
    closeBaseSettingsModal(); 
    
    // 画面全体の再描画を上位に依頼
    if (onStateChange) onStateChange();
    
    showToast('基本時間割を保存しました');
}