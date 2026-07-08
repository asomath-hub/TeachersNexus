/**
 * js/components/SubjectSettingsModal.js
 * 科目と色の設定モーダルのUIとイベントを管理するコンポーネント。
 */

import { state, setSubjectsList } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';
import { colorPalettes } from '../utils/colors.js';

let onStateChange = null;
let initialized = false;

/**
 * SubjectSettingsModalコンポーネントの初期化
 * @param {Object} callbacks - 外部との連携用コールバック関数群
 */
export function initSubjectSettingsModal(callbacks = {}) {
    onStateChange = callbacks.onStateChange || null;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }
}

function setupEventListeners() {
    const modal = document.getElementById('subject-settings-modal');
    if (!modal) return;

    // 閉じるボタン (右上の×と、下部のキャンセルボタンの複数存在するため querySelectorAll で取得)
    const closeBtns = modal.querySelectorAll('[data-action="close-subject-settings"]');
    closeBtns.forEach(btn => {
        btn.removeAttribute('onclick'); // 古いインラインイベントの安全措置
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeSubjectSettingsModal();
        });
    });

    // 追加ボタン
    const addBtn = modal.querySelector('[data-action="add-subject"]');
    if (addBtn) {
        addBtn.removeAttribute('onclick');
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addNewSubject();
        });
    }

    // 保存ボタン
    const saveBtn = modal.querySelector('[data-action="save-subject-settings"]');
    if (saveBtn) {
        saveBtn.removeAttribute('onclick');
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveSubjectSettings();
        });
    }
}

export function openSubjectSettingsModal() {
    renderSubjectSettingsList();
    const modal = document.getElementById('subject-settings-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeSubjectSettingsModal() { 
    const modal = document.getElementById('subject-settings-modal');
    if (modal) modal.classList.add('hidden'); 
}

function renderSubjectSettingsList() {
    const container = document.getElementById('subject-settings-list');
    if (!container) return;
    
    container.innerHTML = '';
    state.subjectsList.forEach((sub) => {
        container.appendChild(createSubjectRow(sub.name, sub.colorIndex));
    });
}

function createSubjectRow(name, colorIndex) {
    const row = document.createElement('div');
    row.className = "flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm subject-row";
    
    // カラーパレットから option 要素の文字列を生成
    let colorOptions = colorPalettes.map(c => 
        `<option value="${c.id}" ${c.id === colorIndex ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    
    const inputHtml = `<input type="text" class="flex-1 text-xs border border-slate-200 rounded p-1.5 font-bold ss-name focus:ring-1 focus:ring-blue-500" value="${escapeHTML(name)}" placeholder="科目名">`;
    const selectHtml = `<select class="w-24 text-xs border border-slate-200 rounded p-1.5 ss-color bg-slate-50 focus:ring-1 focus:ring-blue-500">${colorOptions}</select>`;
    
    row.innerHTML = inputHtml + selectHtml;
    
    // 削除ボタン (安全な形に修正)
    const delBtn = document.createElement('button');
    delBtn.className = "text-red-500 hover:bg-red-50 p-1.5 rounded";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        row.remove();
    });
    
    row.appendChild(delBtn);
    return row;
}

function addNewSubject() {
    const container = document.getElementById('subject-settings-list');
    if (!container) return;
    
    const newRow = createSubjectRow('', 0);
    container.appendChild(newRow);
    container.scrollTop = container.scrollHeight; // スクロールを最下部へ
}

function saveSubjectSettings() {
    const rows = document.querySelectorAll('#subject-settings-list .subject-row');
    const newList = [];
    
    rows.forEach(row => {
        const nameInput = row.querySelector('.ss-name');
        const colorSelect = row.querySelector('.ss-color');
        
        if (nameInput && colorSelect) {
            const name = nameInput.value.trim();
            const colorIndex = parseInt(colorSelect.value, 10);
            if (name) {
                newList.push({ name, colorIndex });
            }
        }
    });
    
    // ImmutableにStateを更新
    setSubjectsList(newList);
    saveAllData(); 
    closeSubjectSettingsModal(); 
    
    // メイン画面の再描画などを依頼
    if (onStateChange) onStateChange(); 
    
    showToast('科目設定を保存しました');
}