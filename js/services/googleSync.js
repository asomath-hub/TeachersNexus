export function authenticateGoogle() {
    // 実際の認証処理のプレースホルダー
    // UIの操作（ボタンの非表示など）はコンポーネント側に移譲し、Promiseのみを返す
    return Promise.resolve(true);
}

export function syncTasks(selectedLists, currentLists) {
    // 選択されたリストを既存リストに追加するロジックのみを定義
    // UIの描画（Toast表示等）や state への反映はコンポーネント側で行う
    selectedLists.forEach(listName => {
        if (!currentLists.includes(listName)) {
            currentLists.push(listName);
        }
    });
    return currentLists;
}