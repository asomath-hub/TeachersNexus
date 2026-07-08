import { loadAllData, saveAllData } from './services/storage.js';
import { exportCSV } from './services/csv.js';
import { exportSettingsFile, importSettingsFile } from './services/backup.js';
import { authenticateGoogle, syncTasks } from './services/googleSync.js';

import { initHeader, updateHeaderUI, handleJumpToToday } from './components/Header.js';
import { initTaskList, updateTaskListUI, assignTaskToPeriod, returnTaskToUnplanned, startMoveTask, toggleTask } from './components/TaskList.js';
import { initTimetable, updateTimetableUI } from './components/Timetable.js';
import { initClassDetailModal, openClassDetailModal } from './components/ClassDetailModal.js';
import { initSettingsModal } from './components/SettingsModal.js';
import { initSubjectSettingsModal, openSubjectSettingsModal } from './components/SubjectSettingsModal.js';
import { initBaseSettingsModal, openBaseSettingsModal } from './components/BaseSettingsModal.js';

import { state, setTasks, setLists } from './state/appState.js';
import { showToast } from './components/Toast.js';

function handleStateChange() {
    updateHeaderUI();
    updateTaskListUI();
    updateTimetableUI();
}

/**
 * Google ToDoのタスク取得とローカルStateへのマージを管理するラッパー関数
 */
async function handleSyncTasks() {
    const result = await syncTasks();

    if (!result || !result.ok) return;

    let addedCount = 0;
    const newTasks = [...state.tasks];
    
    // 既存の state.tasks と重複しないものだけ追加
    result.tasks.forEach(newTask => {
        const isDuplicate = newTasks.some(t =>
    t.googleTaskId === newTask.googleTaskId &&
    t.googleListId === newTask.googleListId
);
        if (!isDuplicate) {
            newTasks.push(newTask);
            addedCount++;
        }
    });

    // result.lists を state.lists にマージ
    const newLists = [...state.lists];
    result.lists.forEach(listName => {
        if (!newLists.includes(listName)) {
            newLists.push(listName);
        }
    });

    if (addedCount > 0) {
        setTasks(newTasks);
        setLists(newLists);
        saveAllData();
        handleStateChange();
        showToast(`Google ToDoから${addedCount}件取り込みました`);
    } else {
        showToast('新しく取り込むGoogle ToDoはありません');
    }
}

function initApp() {
    loadAllData();

    initHeader(handleStateChange);
    initTaskList(handleStateChange);
    
    initTimetable({
        onAssignTaskToPeriod: assignTaskToPeriod,
        onOpenClassDetail: openClassDetailModal
    });
    
    initClassDetailModal({
        onReturnTaskToUnplanned: returnTaskToUnplanned,
        onStartMoveTask: startMoveTask,
        onToggleTask: toggleTask,
        onStateChange: handleStateChange
    });

    initSettingsModal({
        onExportCSV: exportCSV,
        onExportSettingsFile: exportSettingsFile,
        onImportSettingsFile: importSettingsFile,
        onAuthenticateGoogle: authenticateGoogle,
        onSyncTasks: handleSyncTasks,
        onOpenSubjectSettingsModal: openSubjectSettingsModal,
        onOpenBaseSettingsModal: openBaseSettingsModal
    });

    initSubjectSettingsModal({
        onStateChange: handleStateChange
    });

    initBaseSettingsModal({
        onStateChange: handleStateChange
    });

    handleJumpToToday();
    handleStateChange();
}

window.addEventListener('DOMContentLoaded', initApp);