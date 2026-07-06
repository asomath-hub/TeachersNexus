import { loadAllData } from './services/storage.js';
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

function handleStateChange() {
    updateHeaderUI();
    updateTaskListUI();
    updateTimetableUI();
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
        onSyncTasks: syncTasks,
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