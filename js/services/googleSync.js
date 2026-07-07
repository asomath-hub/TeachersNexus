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

    // すでに tokenClient が初期化済みの場合（2回目以降のクリック）
    if (tokenClient) {
        if (typeof google === 'undefined' || !google.accounts) {
            console.error('google.accounts is not available');
            showToast('Google認証ライブラリがロードされていません');
            return;
        }
        try {
            // クリックイベントと直接同期して呼び出すことでポップアップブロックを回避
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            console.error('Google token request failed:', error);
            showToast('Google認証のリクエストに失敗しました');
        }
        return;
    }

    // 初回クリック時：スクリプトの読み込みと tokenClient の初期化
    try {
        await loadGsiScript();
        
        if (typeof google === 'undefined' || !google.accounts) {
            throw new Error('google.accounts is not available after script load');
        }
        
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
                    console.error('Google authentication failed (token response):', tokenResponse);
                    showToast('Google認証に失敗しました');
                }
            },
        });
        
        // 初回クリックでは requestAccessToken は呼ばず、ユーザーにもう一度押すよう促す
        showToast('Google認証の準備ができました。もう一度ボタンを押してください');

    } catch (error) {
        console.error('Google authentication setup failed:', error);
        showToast('Google認証の準備に失敗しました');
    }
}

/**
 * タスクの同期処理（APIリスト取得の確認実装）
 */
export async function syncTasks() {
    if (!accessToken) {
        showToast('先にGoogleに接続してください');
        return;
    }
    
    try {
        const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            console.error('Google Tasks API Error:', response.status, response.statusText, errorDetail);
            showToast('Google ToDoリストの取得に失敗しました');
            return;
        }

        const data = await response.json();

        if (data && data.items) {
            console.log('--- 取得したGoogle ToDoリスト ---');
            data.items.forEach(list => {
                console.log(`・${list.title} (ID: ${list.id})`);
            });
            showToast(`Google ToDoリストを${data.items.length}件取得しました`);
        } else {
            console.log('Google ToDoリストが見つかりませんでした');
            showToast('Google ToDoリストを0件取得しました');
        }

    } catch (error) {
        console.error('Failed to fetch Google Tasks lists:', error);
        showToast('Google ToDoリストの取得中にエラーが発生しました');
    }
}