import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { ui, showView } from './ui.js';
import { auth } from './firebase.js';

// Firebase Authのエラーコードを日本語メッセージに変換
const getAuthErrorMessage = (error) => {
    switch (error.code) {
        case 'auth/invalid-email':
            return '有効なメールアドレスを入力してください。';
        case 'auth/user-not-found':
            return 'このメールアドレスは登録されていません。';
        case 'auth/wrong-password':
            return 'パスワードが間違っています。';
        case 'auth/email-already-in-use':
            return 'このメールアドレスは既に使用されています。';
        case 'auth/weak-password':
            return 'パスワードは6文字以上で入力してください。';
        case 'auth/popup-closed-by-user':
            return 'ログインがキャンセルされました。';
        case 'auth/account-exists-with-different-credential':
            return 'このメールアドレスは既に使用されています。';
        default:
            return '認証に失敗しました。もう一度お試しください。';
    }
};

// 認証関連のUIイベントを初期化
// 引数としてログイン・ログアウト時のコールバック関数を受け取る
export const initAuth = ({ onLogin, onLogout }) => {
    // タブ切り替え
    ui.auth.showLoginTab.addEventListener('click', () => {
        ui.auth.loginForm.classList.remove('hidden');
        ui.auth.signupForm.classList.add('hidden');
        ui.auth.showLoginTab.classList.add('text-blue-600', 'border-blue-600');
        ui.auth.showLoginTab.classList.remove('text-slate-500');
        ui.auth.showSignupTab.classList.add('text-slate-500');
        ui.auth.showSignupTab.classList.remove('text-blue-600', 'border-blue-600');
        ui.auth.error.textContent = '';
    });

    ui.auth.showSignupTab.addEventListener('click', () => {
        ui.auth.loginForm.classList.add('hidden');
        ui.auth.signupForm.classList.remove('hidden');
        ui.auth.showSignupTab.classList.add('text-blue-600', 'border-blue-600');
        ui.auth.showSignupTab.classList.remove('text-slate-500');
        ui.auth.showLoginTab.classList.add('text-slate-500');
        ui.auth.showLoginTab.classList.remove('text-blue-600', 'border-blue-600');
        ui.auth.error.textContent = '';
    });

    // 新規登録ボタン
    ui.auth.signupButton.addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        ui.auth.error.textContent = '';
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            ui.auth.error.textContent = getAuthErrorMessage(error);
        }
    });

    // ログインボタン
    ui.auth.loginButton.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        ui.auth.error.textContent = '';
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            ui.auth.error.textContent = getAuthErrorMessage(error);
        }
    });

    // Googleログインボタン
    ui.auth.googleSigninButton.addEventListener('click', async () => {
        ui.auth.error.textContent = '';
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // 成功するとonAuthStateChangedが発火するので、ここでの特別な処理は不要
        } catch (error) {
            ui.auth.error.textContent = getAuthErrorMessage(error);
        }
    });

    // ログアウトボタン
    ui.deck.logoutButton.addEventListener('click', () => signOut(auth));

    // 認証状態の監視
    onAuthStateChanged(auth, (user) => {
        if (user) { // ログイン時
            onLogin(user);
        } else { // ログアウト時
            onLogout();
        }
    });
};