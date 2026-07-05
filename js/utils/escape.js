/**
 * js/utils/escape.js
 * HTMLエスケープなどの文字列表現を安全に処理する純粋関数群。
 */

export function escapeHTML(str) { 
    return String(str ?? '').replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag])); 
}