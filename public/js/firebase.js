import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

let app, auth, db, storage;

export const initFirebase = async () => {
    // 既に初期化済みの場合は何もしない
    if (app) {
        return;
    }
    try {
        const response = await fetch('/__/firebase/init.json');
        const firebaseConfig = await response.json();
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app); // Storageを初期化
        console.log("Firebase services initialized.");
    } catch (error) {
        console.error("Firebase initialization failed", error);
        // ユーザーにエラーを通知するUIを表示
        document.body.innerHTML = `<div class="p-4 text-center text-red-600 bg-red-100">Firebaseの初期化に失敗しました。設定を確認してください。</div>`;
        throw error; // エラーを再スローして処理を中断
    }
};

export { app, auth, db, storage };
