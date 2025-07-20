import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
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
        default:
            return '認証に失敗しました。もう一度お試しください。';
    }
};

// 認証関連のUIイベントを初期化
export const initAuth = () => {
    // タブ切り替え
    ui.auth.showLoginTab.addEventListener('click', () => {
        ui.auth.loginForm.classList.remove('hidden');
        ui.auth.signupForm.classList.add('hidden');
        ui.auth.showLoginTab.classList.add('text-indigo-600', 'border-indigo-600');
        ui.auth.showLoginTab.classList.remove('text-gray-500');
        ui.auth.showSignupTab.classList.add('text-gray-500');
        ui.auth.showSignupTab.classList.remove('text-indigo-600', 'border-indigo-600');
        ui.auth.error.textContent = '';
    });

    ui.auth.showSignupTab.addEventListener('click', () => {
        ui.auth.loginForm.classList.add('hidden');
        ui.auth.signupForm.classList.remove('hidden');
        ui.auth.showSignupTab.classList.add('text-indigo-600', 'border-indigo-600');
        ui.auth.showSignupTab.classList.remove('text-gray-500');
        ui.auth.showLoginTab.classList.add('text-gray-500');
        ui.auth.showLoginTab.classList.remove('text-indigo-600', 'border-indigo-600');
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

    // ログアウトボタン
    ui.deck.logoutButton.addEventListener('click', () => signOut(auth));

    // 認証状態の監視
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showView('deck-view');
        } else {
            showView('auth-view');
        }
    });
};