import { initFirebase } from './firebase.js';
import { initAuth } from './auth.js';
import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initUI(); // 1. UI要素を取得・初期化
        await initFirebase();
        console.log("Firebase initialized successfully.");
        initAuth(); // 2. 認証関連の機能を初期化
    } catch (e) {
        console.error("Firebase initialization failed:", e);
        alert("Firebaseの初期化に失敗しました。設定を確認してください。");
    }
});