/**
 * js/services/googleSync.js
 * Google ToDo連携（認証およびタスク取得）を管理するサービス。
 * アプリのStateの直接更新は行わず、取得結果の整形までを担当する。
 */

import { showToast } from '../components/Toast.js';

let accessToken = null;
let tokenClient = null;
let isGsiLoaded = false;

/**
 * 初期化：保存されたClient IDの復元とUIの更新を行う
 */
export function initGoogleSyncUI() {
    const savedClientId = localStorage.getItem('tn_google_client_id');
    const input = document.getElementById('client-id-input');
    if (input && savedClientId) {
        input.value = savedClientId;
    }

    const status = document.getElementById('sync-status-display');
    if (status && savedClientId && !accessToken) {
        status.innerHTML = '<i class="fa-solid fa-circle-info text-blue-500"></i> 未接続（Client ID保存済み）';
    }
}

// 自己初期化 (DOMの読み込み完了時に実行)
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGoogleSyncUI);
    } else {
        initGoogleSyncUI();
    }
}

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

    // Client ID を localStorage に保存
    localStorage.setItem('tn_google_client_id', clientId);

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
 * タスクの同期処理（APIからタスクを取得し、ローカル用の形式に変換して返す）
 */
export async function syncTasks() {
    if (!accessToken) {
        const savedClientId = localStorage.getItem('tn_google_client_id');
        if (savedClientId) {
            showToast('Googleに再接続してください');
        } else {
            showToast('設定からGoogle Client IDを入力して接続してください');
        }
        return { ok: false, error: 'Not authenticated' };
    }
    
    try {
        // 1. リスト一覧の取得
        const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            console.error('Google Tasks API Error (Lists):', response.status, response.statusText, errorDetail);
            showToast('Google ToDoリストの取得に失敗しました');
            return { ok: false, error: 'Failed to fetch lists' };
        }

        const data = await response.json();

        if (!data || !data.items || data.items.length === 0) {
            showToast('Google ToDoリストがありません');
            return { ok: true, tasks: [], lists: [], fetchedCount: 0 };
        }

        let formattedTasks = [];
        let fetchedLists = [];
        let totalTaskCount = 0;

        // 2. 各リストのタスク一覧を取得
        for (const list of data.items) {
            fetchedLists.push(list.title);
            try {
                const tasksUrl = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?showCompleted=false&showHidden=false`;
                const tasksResponse = await fetch(tasksUrl, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!tasksResponse.ok) {
                    const errorDetail = await tasksResponse.text();
                    console.error(`Google Tasks API Error (Tasks for list ${list.title}):`, tasksResponse.status, tasksResponse.statusText, errorDetail);
                    continue; // 失敗しても他のリストの取得は続行
                }

                const tasksData = await tasksResponse.json();

                if (tasksData && tasksData.items && tasksData.items.length > 0) {
                    tasksData.items.forEach(task => {
                        formattedTasks.push({
                            id: 'g_' + list.id + '_' + task.id,
                            title: task.title,
                            list: list.title,
                            completed: false,
                            assignedPeriodId: null,
                            googleTaskId: task.id,
                            googleListId: list.id,
                            source: 'google'
                        });
                        totalTaskCount++;
                    });
                }
            } catch (taskError) {
                console.error(`Failed to fetch tasks for list ${list.title}:`, taskError);
            }
        }

        return {
            ok: true,
            tasks: formattedTasks,
            lists: fetchedLists,
            fetchedCount: totalTaskCount
        };

    } catch (error) {
        console.error('Failed to fetch Google Tasks:', error);
        showToast('Google ToDoタスクの取得中にエラーが発生しました');
        return { ok: false, error: error.message };
    }
}

/**
 * Google由来のタスクを完了状態にする処理
 */
export async function completeGoogleTask(googleListId, googleTaskId) {
    if (!accessToken) {
        console.error('completeGoogleTask: No access token');
        const savedClientId = localStorage.getItem('tn_google_client_id');
        if (savedClientId) {
            showToast('Googleに再接続してください');
        } else {
            showToast('設定からGoogle Client IDを入力して接続してください');
        }
        return { ok: false, error: 'Not authenticated' };
    }
    if (!googleListId || !googleTaskId) {
        console.error('completeGoogleTask: Missing googleListId or googleTaskId');
        return { ok: false, error: 'Missing parameters' };
    }

    try {
        const url = `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(googleListId)}/tasks/${encodeURIComponent(googleTaskId)}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed',
                completed: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            console.error('Google Tasks complete API Error:', response.status, response.statusText, errorDetail);
            return { ok: false, error: 'Failed to complete Google task' };
        }

        return { ok: true };

    } catch (error) {
        console.error('Failed to complete Google Task request:', error);
        return { ok: false, error: error.message };
    }
}