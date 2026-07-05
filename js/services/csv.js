import { state } from '../state/appState.js';
import { dayNames } from '../utils/date.js';

export function exportCSV() {
    let csv = "曜日,時限,種類,科目,クラス\n";
    ['Mon','Tue','Wed','Thu','Fri'].forEach(d => {
        state.timetableData[d].forEach(p => csv += `${dayNames[d]},${p.num},${p.type},${p.subject},${p.class||''}\n`);
    });
    
    // ブラウザのダウンロードAPI操作
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); 
    link.setAttribute("download", "timetable.csv");
    link.style.visibility = 'hidden'; 
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link);
    
    // ※元の closeModal はコンポーネント側で実行するよう分離しました
}