import { state, setTimetableData, setTasks, setTemporaryChanges, setAnnouncements, setLists, setSubjectsList, setClassList } from '../state/appState.js';
import { defaultSubjectsList } from '../utils/colors.js';

const defaultClassList = ['1A', '1B', '2A', '2B', '3A', '3B'];

export function generateDefaultTimetable() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const tt = {};
    days.forEach(d => {
        tt[d] = [];
        for(let i=1; i<=7; i++) {
            tt[d].push({ id: `p${i}`, num: `${i}`, type: 'empty', subject: '空き', class: '' });
            if(i === 4) tt[d].push({ id: `p_noon`, num: `昼`, type: 'empty', subject: '昼休み', class: '' });
        }
        tt[d].push({ id: `p_after`, num: `放`, type: 'afterschool', subject: '放課後', class: '' });
    });
    return tt;
}

export function loadAllData() {
    try {
        const svd = localStorage.getItem('tn_data');
        if(svd) {
            const parsed = JSON.parse(svd);
            let loadedTimetableData = parsed.timetableData || generateDefaultTimetable();
            
            // 下位互換性: 7限目の追加処理
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            days.forEach(d => {
                if (loadedTimetableData[d] && !loadedTimetableData[d].find(p => p.id === 'p7')) {
                    const p7 = { id: `p7`, num: `7`, type: 'empty', subject: '空き', class: '' };
                    const afterIndex = loadedTimetableData[d].findIndex(p => p.id === 'p_after');
                    if (afterIndex > -1) loadedTimetableData[d].splice(afterIndex, 0, p7);
                    else loadedTimetableData[d].push(p7);
                }
            });
            
            // appStateのSetterを利用して安全に状態を更新
            setTimetableData(loadedTimetableData);
            setTasks(parsed.tasks || []);
            setLists(parsed.lists || ['その他']);
            setTemporaryChanges(parsed.temporaryChanges || {});
            setAnnouncements(parsed.announcements || {});
            setSubjectsList(parsed.subjectsList || [...defaultSubjectsList]);
            setClassList(parsed.classList || [...defaultClassList]);
        } else {
            setTimetableData(generateDefaultTimetable());
            setTasks([{ id: 't1', title: '【例】数学小テスト印刷', list: 'その他', completed: false, assignedPeriodId: null }]);
            setSubjectsList([...defaultSubjectsList]);
            setClassList([...defaultClassList]);
        }
    } catch(e) {
        setTimetableData(generateDefaultTimetable());
        setSubjectsList([...defaultSubjectsList]);
        setClassList([...defaultClassList]);
    }
}

export function saveAllData() {
    localStorage.setItem('tn_data', JSON.stringify({
        timetableData: state.timetableData,
        tasks: state.tasks,
        lists: state.lists,
        temporaryChanges: state.temporaryChanges,
        announcements: state.announcements,
        subjectsList: state.subjectsList,
        classList: state.classList
    }));
}