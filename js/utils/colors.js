/**
 * js/utils/colors.js
 * 色パレットや科目の定義、および色判定ロジックを提供する純粋関数群。
 */

export const colorPalettes = [
    { id: 0, name: '赤系', bg: 'bg-red-50', borderL: 'border-red-400 border-l-4', badge: 'bg-red-200 text-red-800' },
    { id: 1, name: '青系', bg: 'bg-blue-50', borderL: 'border-blue-400 border-l-4', badge: 'bg-blue-200 text-blue-800' },
    { id: 2, name: '緑系', bg: 'bg-emerald-50', borderL: 'border-emerald-400 border-l-4', badge: 'bg-emerald-200 text-emerald-800' },
    { id: 3, name: '紫系', bg: 'bg-purple-50', borderL: 'border-purple-400 border-l-4', badge: 'bg-purple-200 text-purple-800' },
    { id: 4, name: '黄系', bg: 'bg-amber-50', borderL: 'border-amber-400 border-l-4', badge: 'bg-amber-200 text-amber-800' },
    { id: 5, name: 'ピンク系', bg: 'bg-pink-50', borderL: 'border-pink-400 border-l-4', badge: 'bg-pink-200 text-pink-800' },
    { id: 6, name: '水色系', bg: 'bg-cyan-50', borderL: 'border-cyan-400 border-l-4', badge: 'bg-cyan-200 text-cyan-800' },
    { id: 7, name: 'ローズ系', bg: 'bg-rose-50', borderL: 'border-rose-400 border-l-4', badge: 'bg-rose-200 text-rose-800' },
    { id: 8, name: '黄緑系', bg: 'bg-lime-50', borderL: 'border-lime-400 border-l-4', badge: 'bg-lime-200 text-lime-800' },
    { id: 9, name: '藍色系', bg: 'bg-indigo-50', borderL: 'border-indigo-400 border-l-4', badge: 'bg-indigo-200 text-indigo-800' }
];

export const defaultSubjectsList = [
    { name: '国語', colorIndex: 0 }, { name: '社会', colorIndex: 4 },
    { name: '数学', colorIndex: 1 }, { name: '理科', colorIndex: 2 },
    { name: '音楽', colorIndex: 6 }, { name: '美術', colorIndex: 3 },
    { name: '体育', colorIndex: 8 }, { name: '技術・家庭', colorIndex: 7 },
    { name: '英語', colorIndex: 5 }, { name: '道徳', colorIndex: 9 },
    { name: '学活', colorIndex: 1 }, { name: '総合', colorIndex: 2 }
];

/**
 * 科目名から色情報を取得する（純粋関数化のため、現在の科目リストを引数に取るよう変更）
 */
export function getSubjectColors(subject, type, currentSubjectsList) {
    if (type === 'empty') return { bg: 'bg-transparent border-dashed', borderL: 'border-slate-300', badge: 'bg-slate-200 text-slate-700' };
    if (type === 'afterschool') return { bg: 'bg-indigo-50 border-solid', borderL: 'border-indigo-200', badge: 'bg-indigo-200 text-indigo-800' };
    
    const found = currentSubjectsList.find(s => s.name === subject);
    if (found) return colorPalettes[found.colorIndex % colorPalettes.length];
    
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return colorPalettes[Math.abs(hash) % colorPalettes.length];
}