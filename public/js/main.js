/**
 * main.js
 * * アプリケーションのエントリーポイント。
 */

import { initFirebase } from './firebase.js';
import { initAuth } from './auth.js';
import { initUI, ui, showView, toggleModal } from './ui.js';
import { initDeckView } from './deck.js';
import { initCardView } from './card.js';
import { initSwipeView } from './swipe.js';
import { initGalleryView } from './gallery.js'; // gallery.jsをインポート

// クリーンアップ関数を保持する変数
let cleanupDeckView = null;
let cleanupCardView = null;
let cleanupSwipeView = null;
let cleanupGalleryView = null; // ギャラリービュー用を追加

// DOMの読み込みが完了したら、アプリケーションの初期化を開始します。
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. UI要素の参照を初期化
        initUI();
        // 2. Firebaseサービスを初期化
        initFirebase();
        // 3. モーダル関連のイベントリスナーを設定
        setupModalEventListeners();
        // 4. 認証関連の処理を初期化し、ログイン・ログアウト時のコールバックを渡す
        initAuth({ onLogin: handleLogin, onLogout: handleLogout });
        // 5. ビュー間の画面遷移イベントリスナーを設定
        setupNavigationEventListeners();
    } catch (e) {
        // 初期化中にエラーが発生した場合、コンソールにログを出力します。
        // エラーメッセージの表示は initFirebase 内で行われます。
        console.error("Initialization failed:", e);
    }
});

function handleLogin(user) {
    showView('deck-view');
    if (cleanupDeckView) cleanupDeckView();
    cleanupDeckView = initDeckView(ui, user.uid, {
        onDeckClick: (deckId, deckName) => {
            showView('card-view');
            if (cleanupCardView) cleanupCardView();
            cleanupCardView = initCardView(ui, deckId, deckName, {
                onStartSwipe: (cards) => {
                    if (cards.length === 0) return alert("学習するカードがありません。");
                    showView('swipe-view');
                    if (cleanupSwipeView) cleanupSwipeView();
                    cleanupSwipeView = initSwipeView(ui, deckId, cards, user.uid);
                },
                onShowGallery: (cards) => { // 追加
                    if (cards.length === 0) return alert("表示するカードがありません。");
                    showView('gallery-view');
                    if (cleanupGalleryView) cleanupGalleryView();
                    cleanupGalleryView = initGalleryView(ui, cards);
                }
            });
        }
    });
}

function handleLogout() {
    showView('auth-view');
    if (cleanupDeckView) cleanupDeckView();
    if (cleanupCardView) cleanupCardView();
    if (cleanupSwipeView) cleanupSwipeView();
    if (cleanupGalleryView) cleanupGalleryView(); // 追加
    cleanupDeckView = cleanupCardView = cleanupSwipeView = cleanupGalleryView = null;
    ui.deck.list.innerHTML = '';
    ui.deck.noDecksMessage.classList.remove('hidden');
}

function setupModalEventListeners() {
    ui.deck.addDeckFab.addEventListener('click', () => toggleModal('addDeck', true));
    ui.modals.addDeck.cancelButton.addEventListener('click', () => toggleModal('addDeck', false));
    ui.card.addCardFab.addEventListener('click', () => toggleModal('addCard', true));
    ui.modals.addCard.cancelButton.addEventListener('click', () => toggleModal('addCard', false));
}

function setupNavigationEventListeners() {
    ui.card.backToDecksButton.addEventListener('click', () => {
        showView('deck-view');
        if (cleanupCardView) cleanupCardView();
        cleanupCardView = null;
    });
    ui.swipe.backButton.addEventListener('click', () => {
        showView('card-view');
        if (cleanupSwipeView) cleanupSwipeView();
        cleanupSwipeView = null;
    });
    ui.gallery.backButton.addEventListener('click', () => { // 追加
        showView('card-view');
        if (cleanupGalleryView) cleanupGalleryView();
        cleanupGalleryView = null;
    });
}
