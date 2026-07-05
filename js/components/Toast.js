/**
 * js/components/Toast.js
 * 画面下部の通知（Toast）UIの表示・非表示を管理するコンポーネント。
 * グローバル状態（State）や他のコンポーネントには依存しません。
 */

export function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return; // コンテナが存在しない場合のエラー防止

    const toastElement = document.createElement('div');
    toastElement.className = 'toast'; 
    toastElement.innerText = msg;
    
    container.appendChild(toastElement);
    
    setTimeout(() => { 
        if (container.contains(toastElement)) {
            container.removeChild(toastElement);
        }
    }, 3000);
}