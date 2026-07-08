/**
 * js/components/ClassDetailModal.js
 * 授業詳細モーダルのUIとイベントを管理するコンポーネント。
 */

import { state, setActiveModalPeriodId, setActiveModalDayStr, setTemporaryChanges, setAnnouncements } from '../state/appState.js';
import { saveAllData } from '../services/storage.js';
import { showToast } from './Toast.js';
import { escapeHTML } from '../utils/escape.js';
import { getSubjectColors } from '../utils/colors.js';
import { dayNames } from '../utils/date.js';

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

    // 閉じるボタン
    const closeBtns = modal.querySelectorAll('[data-action="close-class-detail"]');
    closeBtns.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', closeClassDetailModal);
    });

    // 今週だけ変更切替ボタン
    const toggleTempBtn = modal.querySelector('[data-action="toggle-temp-change"]');
    if (toggleTempBtn) {
        toggleTempBtn.removeAttribute('onclick');
        toggleTempBtn.addEventListener('click', toggleTempChangeMode);
    }

    // 基本に戻すボタン
    const resetTempBtn = modal.querySelector('[data-action="reset-temp-change"]');
    if (resetTempBtn) {
        resetTempBtn.removeAttribute('onclick');
        resetTempBtn.addEventListener('click', resetTempChange);
    }

    // 変更を保存ボタン
    const saveTempBtn = modal.querySelector('[data-action="save-temp-change"]');
    if (saveTempBtn) {
        saveTempBtn.removeAttribute('onclick');
        saveTempBtn.addEventListener('click', saveTempChange);
    }

    // 連絡事項追加ボタン
    const addAnnouncementBtn = modal.querySelector('[data-action="add-announcement"]');
    if (addAnnouncementBtn) {
        addAnnouncementBtn.removeAttribute('onclick');
        addAnnouncementBtn.addEventListener('click', addAnnouncement);
    }

    // 今週だけ変更の種別(tc-type)変更イベント
    const typeSelect = modal.querySelector('#tc-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', handleTempTypeChange);
    }
}

function handleTempTypeChange(e) {
    if (e.target.value === 'empty') {
        const subjectSelect = document.getElementById('tc-subject');
        const classInput = document.getElementById('tc-class');
        
        if (subjectSelect) {
            if (subjectSelect.tagName.toLowerCase() === 'select') {
                let hasEmptyOption = false;
                for (let i = 0; i < subjectSelect.options.length; i++) {
                    if (subjectSelect.options[i].value === '空きコマ') {
                        hasEmptyOption = true;
                        break;
                    }
                }
                if (!hasEmptyOption) {
                    const option = document.createElement('option');
                    option.value = '空きコマ';
                    option.text = '空きコマ';
                    subjectSelect.appendChild(option);
                }
            }
            subjectSelect.value = '空きコマ';
        }
        
        if (classInput) {
            classInput.value = '';
        }
    }
}

export function openClassDetailModal(periodId, dayStr) {
    setActiveModalPeriodId(periodId);
    setActiveModalDayStr(dayStr);
    
    renderModalContent();

    const modal = document.getElementById('class-detail-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeClassDetailModal() {
    setActiveModalPeriodId(null);
    setActiveModalDayStr(null);
    const modal = document.getElementById('class-detail-modal');
    if (modal) modal.classList.add('hidden');
}

function renderModalContent() {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const basePeriod = (state.timetableData[dayStr] || []).find(p => p.id === periodId);
    if (!basePeriod) return;

    const tempKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    const temp = state.temporaryChanges[tempKey];
    
    const displaySubject = temp ? temp.subject : basePeriod.subject;
    const displayClass = temp ? temp.class : basePeriod.class;
    const displayType = temp ? temp.type : basePeriod.type;
    
    const periodEl = document.getElementById('modal-period');
    if (periodEl) {
        periodEl.textContent = `${dayNames[dayStr].replace('曜日', '')}${basePeriod.num}`;
    }

    const titleEl = document.getElementById('modal-title');
    if (titleEl) {
        titleEl.textContent = displaySubject + (displayClass ? ` ${displayClass}` : '');
    }

    const typeSelect = document.getElementById('tc-type');
    if (typeSelect) {
        typeSelect.value = displayType;
    }

    const inputSubject = document.getElementById('tc-subject');
    if (inputSubject) {
        if (inputSubject.tagName.toLowerCase() === 'select') {
            inputSubject.innerHTML = '';
            state.subjectsList.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub.name;
                opt.textContent = sub.name;
                inputSubject.appendChild(opt);
            });
            
            let hasOption = false;
            for (let i = 0; i < inputSubject.options.length; i++) {
                if (inputSubject.options[i].value === displaySubject) {
                    hasOption = true;
                    break;
                }
            }
            if (!hasOption && displaySubject) {
                const opt = document.createElement('option');
                opt.value = displaySubject;
                opt.textContent = displaySubject;
                inputSubject.appendChild(opt);
            }
        }
        inputSubject.value = displaySubject;
    }

    let inputClass = document.getElementById('tc-class');
    if (inputClass) {
        // もしHTML側が input なら動的に select に置き換える
        if (inputClass.tagName.toLowerCase() === 'input') {
            const selectClass = document.createElement('select');
            selectClass.id = inputClass.id;
            selectClass.className = inputClass.className;
            inputClass.parentNode.replaceChild(selectClass, inputClass);
            inputClass = selectClass;
        }

        if (inputClass.tagName.toLowerCase() === 'select') {
            inputClass.innerHTML = '';
            
            // 先頭に空欄用の選択肢を追加
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = 'なし';
            inputClass.appendChild(emptyOpt);

            // state の classList から option を生成
            state.classList.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.textContent = cls;
                inputClass.appendChild(opt);
            });

            // 現在の displayClass が選択肢に無い場合は一時的に追加する
            let hasOption = false;
            for (let i = 0; i < inputClass.options.length; i++) {
                if (inputClass.options[i].value === displayClass) {
                    hasOption = true;
                    break;
                }
            }
            if (!hasOption && displayClass) {
                const opt = document.createElement('option');
                opt.value = displayClass;
                opt.textContent = displayClass;
                inputClass.appendChild(opt);
            }
        }
        inputClass.value = displayClass || '';
    }

    const editForm = document.getElementById('temp-change-form');
    if (editForm) editForm.classList.add('hidden');

    renderAnnouncements();
    renderModalTasks();
}

function toggleTempChangeMode() {
    const form = document.getElementById('temp-change-form');
    if (form) {
        form.classList.toggle('hidden');
    }
}

function resetTempChange() {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const tempKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    
    if (state.temporaryChanges[tempKey]) {
        const newChanges = { ...state.temporaryChanges };
        delete newChanges[tempKey];
        setTemporaryChanges(newChanges);
        saveAllData();
        
        if (onStateChange) onStateChange();
        showToast('基本の時間割に戻しました');
        
        renderModalContent();
    }
}

function saveTempChange() {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const typeSelect = document.getElementById('tc-type');
    const inputSubject = document.getElementById('tc-subject');
    const inputClass = document.getElementById('tc-class');
    
    if (!typeSelect || !inputSubject || !inputClass) return;

    let type = typeSelect.value;
    let subject = inputSubject.value.trim();
    let cls = inputClass.value.trim();

    // 種別が empty の場合は自動的に補正する
    if (type === 'empty') {
        subject = '空きコマ';
        cls = '';
    }

    if (!subject) {
        showToast('科目名を入力してください');
        return;
    }

    const tempKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    const newChanges = { ...state.temporaryChanges };
    newChanges[tempKey] = {
        subject: subject,
        class: cls,
        type: type 
    };
    
    setTemporaryChanges(newChanges);
    saveAllData();
    
    if (onStateChange) onStateChange();
    showToast('今週の変更を保存しました');
    
    renderModalContent();
}

function renderAnnouncements() {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const container = document.getElementById('modal-announcements');
    if (!container) return;
    
    container.innerHTML = '';
    const tempKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    const list = state.announcements[tempKey] || [];
    
    list.forEach((ann, index) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200 text-sm mb-2';
        div.innerHTML = `
            <span>${escapeHTML(ann)}</span>
            <button class="text-red-500 hover:bg-red-100 p-1 rounded" data-index="${index}"><i class="fas fa-trash"></i></button>
        `;
        const delBtn = div.querySelector('button');
        delBtn.addEventListener('click', () => deleteAnnouncement(index));
        container.appendChild(div);
    });
}

function addAnnouncement() {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const input = document.getElementById('new-announcement-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    const tempKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    const newAnnouncements = { ...state.announcements };
    if (!newAnnouncements[tempKey]) {
        newAnnouncements[tempKey] = [];
    }
    
    newAnnouncements[tempKey] = [...newAnnouncements[tempKey], text];
    setAnnouncements(newAnnouncements);
    saveAllData();
    
    input.value = '';
    renderAnnouncements();
    if (onStateChange) onStateChange();
}

function deleteAnnouncement(index) {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const tempKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    if (!state.announcements[tempKey]) return;

    const newAnnouncements = { ...state.announcements };
    newAnnouncements[tempKey] = [...newAnnouncements[tempKey]];
    newAnnouncements[tempKey].splice(index, 1);
    
    if (newAnnouncements[tempKey].length === 0) {
        delete newAnnouncements[tempKey];
    }
    
    setAnnouncements(newAnnouncements);
    saveAllData();
    
    renderAnnouncements();
    if (onStateChange) onStateChange();
}




function renderModalTasks() {
    const periodId = state.activeModalPeriodId;
    const dayStr = state.activeModalDayStr;
    if (!periodId || !dayStr) return;

    const container = document.getElementById('modal-assigned-tasks');
    if (!container) return;
    
    container.innerHTML = '';

    const periodKey = 'w' + state.currentWeek + '-' + dayStr + '-' + periodId;
    const assignedTasks = state.tasks.filter(t => t.assignedPeriodId === periodKey && !t.completed);
    
    if (assignedTasks.length === 0) {
        container.innerHTML = '<div class="text-slate-400 text-sm py-2">配置されたタスクはありません</div>';
        return;
    }

    assignedTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 p-2 bg-white border border-slate-200 rounded text-sm mb-2';
        
        div.innerHTML = `
            <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded border-slate-300">
            <span class="flex-1">${escapeHTML(task.title)}</span>
            <button class="text-slate-400 hover:text-indigo-600 p-1 btn-move" title="移動"><i class="fas fa-people-carry"></i></button>
            <button class="text-slate-400 hover:text-red-500 p-1 btn-return" title="未計画に戻す"><i class="fas fa-undo"></i></button>
        `;

        const chk = div.querySelector('input');
        chk.addEventListener('change', () => {
            if (onToggleTask) onToggleTask(task.id);
            if (onStateChange) onStateChange();
            setTimeout(renderModalTasks, 300); 
        });

        const moveBtn = div.querySelector('.btn-move');
        moveBtn.addEventListener('click', () => {
            if (onStartMoveTask) onStartMoveTask(task.id);
            closeClassDetailModal();
        });

        const returnBtn = div.querySelector('.btn-return');
        returnBtn.addEventListener('click', () => {
            if (onReturnTaskToUnplanned) onReturnTaskToUnplanned(task.id);
            renderModalTasks(); 
            if (onStateChange) onStateChange();
        });

        container.appendChild(div);
    });
}