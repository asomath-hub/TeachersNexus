/**
 * js/components/SettingsModal.js
 * システム設定モーダル（ダークモード切替など）のUIとイベントを管理するコンポーネント。
 */

import { state, setIsDarkMode } from '../state/appState.js';

let onExportCSV = null;
let onExportSettingsFile = null;
let onImportSettingsFile = null;
let onAuthenticateGoogle = null;
let onSyncTasks = null;
let onOpenSubjectSettingsModal = null;
let onOpenBaseSettingsModal = null;

let initialized = false;

/**
 * SettingsModalコンポーネントの初期化
 * @param {Object} callbacks - 外部との連携用コールバック関数群
 */
export function initSettingsModal(callbacks = {}) {
    onExportCSV = callbacks.onExportCSV || null;
    onExportSettingsFile = callbacks.onExportSettingsFile || null;
    onImportSettingsFile = callbacks.onImportSettingsFile || null;
    onAuthenticateGoogle = callbacks.onAuthenticateGoogle || null;
    onSyncTasks = callbacks.onSyncTasks || null;
    onOpenSubjectSettingsModal = callbacks.onOpenSubjectSettingsModal || null;
    onOpenBaseSettingsModal = callbacks.onOpenBaseSettingsModal || null;

    if (!initialized) {
        setupEventListeners();
        initialized = true;
    }

    updateDarkModeUI();
}

function setupEventListeners() {
    // ヘッダーなどに存在する開くボタン
    const openBtn = document.querySelector('button[onclick="openSettingsModal()"]');
    if (openBtn) {
        openBtn.removeAttribute('onclick');
        openBtn.addEventListener('click', openSettingsModal);
    }

    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // 閉じるボタン
    const closeBtn = modal.querySelector('button[onclick="closeSettingsModal()"]');
    if (closeBtn) {
        closeBtn.removeAttribute('onclick');
        closeBtn.addEventListener('click', closeSettingsModal);
    }

    // ダークモード切替ボタン
    const darkModeBtn = modal.querySelector('button[onclick="toggleDarkMode()"]');
    if (darkModeBtn) {
        darkModeBtn.removeAttribute('onclick');
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }

    // 科目と色の設定モーダルを開くボタン
    const subjectBtn = modal.querySelector('button[onclick="openSubjectSettingsModal()"]');
    if (subjectBtn) {
        subjectBtn.removeAttribute('onclick');
        subjectBtn.addEventListener('click', () => {
            if (onOpenSubjectSettingsModal) onOpenSubjectSettingsModal();
        });
    }

    // 基本時間割設定モーダルを開くボタン
    const baseBtn = modal.querySelector('button[onclick="openBaseSettingsModal()"]');
    if (baseBtn) {
        baseBtn.removeAttribute('onclick');
        baseBtn.addEventListener('click', () => {
            if (onOpenBaseSettingsModal) onOpenBaseSettingsModal();
        });
    }

    // CSVエクスポートボタン
    const csvBtn = modal.querySelector('button[onclick="exportCSV()"]');
    if (csvBtn) {
        csvBtn.removeAttribute('onclick');
        csvBtn.addEventListener('click', () => {
            if (onExportCSV) onExportCSV();
        });
    }

    // バックアップエクスポートボタン
    const exportBtn = modal.querySelector('button[onclick="exportSettingsFile()"]');
    if (exportBtn) {
        exportBtn.removeAttribute('onclick');
        exportBtn.addEventListener('click', () => {
            if (onExportSettingsFile) onExportSettingsFile();
        });
    }

    // バックアップインポート（onchange）
    const importInput = modal.querySelector('input[onchange="importSettingsFile(event)"]');
    if (importInput) {
        importInput.removeAttribute('onchange');
        importInput.addEventListener('change', (e) => {
            if (onImportSettingsFile) onImportSettingsFile(e);
        });
    }

    // Google認証ボタン
    const authBtn = modal.querySelector('button[onclick="authenticateGoogle()"]');
    if (authBtn) {
        authBtn.removeAttribute('onclick');
        authBtn.addEventListener('click', () => {
            if (onAuthenticateGoogle) onAuthenticateGoogle();
        });
    }

    // 同期ボタン
    const syncBtn = modal.querySelector('button[onclick="syncTasks()"]');
    if (syncBtn) {
        syncBtn.removeAttribute('onclick');
        syncBtn.addEventListener('click', () => {
            if (onSyncTasks) onSyncTasks();
        });
    }
}

export function openSettingsModal() { 
    document.getElementById('settings-modal').classList.remove('hidden'); 
}

export function closeSettingsModal() { 
    document.getElementById('settings-modal').classList.add('hidden'); 
}

function toggleDarkMode() {
    setIsDarkMode(!state.isDarkMode);
    if(state.isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tn_dark_mode', 'true');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tn_dark_mode', 'false');
    }
    updateDarkModeUI();
}

export function updateDarkModeUI() {
    const st = document.getElementById('dark-mode-status');
    if(st) st.innerText = state.isDarkMode ? 'オン' : 'オフ';
}