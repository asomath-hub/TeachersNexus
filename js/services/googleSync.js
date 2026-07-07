/**
 * js/services/googleSync.js
 * Google ToDo連携（認証およびタスク同期）を管理するサービス。
 */

import { showToast } from '../components/Toast.js';

let accessToken = null;
let tokenClient = null;
let isGsiLoaded = false;

/**
 * Google Identity Services のスクリプトを動的に読み込む
 */
function loadGsiScript() {
    return new Promise((resolve, reject) => {
        if (isGsiLoaded) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            isGsiLoaded = true;
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Google Identity Services の読み込みに失敗しました'));
        };
        document.body.appendChild(script);
    });
}

/**
 * Google 認証ポップアップを表示し、アクセストークンを取得する
 */
export async function authenticateGoogle() {
    const input = document.getElementById('client-id-input');
    if (!input) {
        showToast('Client IDの入力欄が見つかりません');
        return;
    }
    
    const clientId = input.value.trim();
    if (!clientId) {
        showToast('Google Client IDを入力してください');
        return;
    }

    try {
        await loadGsiScript();
        
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/tasks',
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    accessToken = tokenResponse.access_token;
                    
                    const status = document.getElementById('sync-status-display');
                    if (status) {
                        status.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i> 接続済み';
                    }

                    const syncBtn = document.getElementById('btn-sync');
                    if (syncBtn) {
                        syncBtn.classList.remove('hidden');
                    }

                    showToast('Google ToDoに接続しました');
                } else {
                    console.error('Google authentication failed:', tokenResponse);
                    showToast('Google認証に失敗しました');
                }
            },
        });
        
        tokenClient.requestAccessToken();

    } catch (error) {
        console.error('Google authentication failed:', error);
        showToast('Google認証に失敗しました');
    }
}

/**
 * タスクの同期処理（仮実装）
 */
export function syncTasks() {
    if (!accessToken) {
        showToast('先にGoogleに接続してください');
        return;
    }
    
    showToast('Google ToDo同期は次の段階で実装します');
}