import { state } from '../state/appState.js';

export function exportSettingsFile() {
    const dataStr = JSON.stringify({ 
        timetableData: state.timetableData, 
        tasks: state.tasks, 
        lists: state.lists, 
        temporaryChanges: state.temporaryChanges, 
        announcements: state.announcements, 
        subjectsList: state.subjectsList 
    });
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = 'teachers-nexus-backup.json';
    a.click(); 
    URL.revokeObjectURL(url);
}

export function importSettingsFile(file) {
    // UI操作から分離し、Promiseで結果のみを返す設計に変更
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('ファイルが選択されていません'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                if(parsed.timetableData) {
                    localStorage.setItem('tn_data', JSON.stringify(parsed));
                    resolve(); // reload() 等のUI副作用は呼び出し元で行う
                } else {
                    reject(new Error('無効なファイル形式です'));
                }
            } catch(err) { 
                reject(new Error('ファイルの読み込みに失敗しました')); 
            }
        };
        reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました'));
        reader.readAsText(file);
    });
}