import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

const firebaseConfig = {
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBiGe9ueuYzGfibPiwR7rCq1hrpoXuwKmI",
    authDomain: "anki-app-nishikireo.firebaseapp.com",
    projectId: "anki-app-nishikireo",
    storageBucket: "anki-app-nishikireo.firebasestorage.app",
    messagingSenderId: "812870291841",
    appId: "1:812870291841:web:a3e505b56b303c127b1880",
    measurementId: "G-KW7J5HW9TY"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
};

let app, auth, db, storage;

/**
 * Firebaseサービスを初期化します。
 * firebaseConfigが正しく設定されている必要があります。
 */
export const initFirebase = () => {
    // 既に初期化済みの場合は何もしない
    if (app) {
        return;
    }
    try {
        // firebaseConfigが空か、必須プロパティが含まれているかを確認
        if (!firebaseConfig || !firebaseConfig.apiKey) {
            throw new Error("Firebase設定オブジェクトが空か、正しくありません。firebase.jsファイルにあなたのプロジェクトの設定を貼り付けてください。");
        }
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app); // Storageを初期化
        console.log("Firebase services initialized successfully.");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // ユーザーにエラーを通知するUIを表示
        document.body.innerHTML = `<div class="p-4 text-center text-red-600 bg-red-100">Firebaseの初期化に失敗しました。firebase.jsの設定を確認してください。<br>${error.message}</div>`;
        throw error; // エラーを再スローして処理を中断
    }
};

export { app, auth, db, storage };
