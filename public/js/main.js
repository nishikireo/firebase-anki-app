/**
 * main.js
 * * アプリケーションのエントリーポイント。
 * Firebaseの初期化、UIの初期化、認証状態の監視、
 * 各ビューのロジックの初期化とクリーンアップを管理します。
 */

import { initFirebase } from './firebase.js';
import { initAuth } from './auth.js';
import { initUI, ui, showView, toggleModal } from './ui.js';
import { initDeckView } from './deck.js';
import { initCardView } from './card.js';

// 各ビューのイベントリスナーを解除するためのクリーンアップ関数を保持する変数
let cleanupDeckView = null;
let cleanupCardView = null;

/**
 * DOMの読み込みが完了したらアプリケーションを初期化します。
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. UI要素の参照を初期化
        initUI();
        
        // 2. Firebaseを初期化
        await initFirebase();
        console.log("Firebase initialized successfully.");

        // 3. モーダルの表示/非表示イベントを設定
        setupModalEventListeners();

        // 4. 認証機能を初期化し、ログイン/ログアウト時の処理を定義
        initAuth(ui, {
            onLogin: handleLogin,
            onLogout: handleLogout
        });

    } catch (e) {
        console.error("Initialization failed:", e);
        // ユーザーにエラーを通知するUIをここに実装することも可能
        document.body.innerHTML = '<div class="text-center p-8 text-red-500">アプリケーションの初期化に失敗しました。ページを再読み込みしてください。</div>';
    }

    // 5. ページナビゲーションのイベントを設定
    setupNavigationEventListeners();
});

/**
 * ログイン成功時の処理
 * @param {object} user Firebaseのユーザーオブジェクト
 */
function handleLogin(user) {
    showView('deck-view');
    
    // 以前のデッキビューのリスナーが残っていれば解除
    if (cleanupDeckView) cleanupDeckView();

    // 新しいユーザーでデッキビューを初期化し、クリーンアップ関数を受け取る
    cleanupDeckView = initDeckView(ui, user.uid, {
        // デッキがクリックされた時のコールバック
        onDeckClick: (deckId, deckName) => {
            showView('card-view');
            if (cleanupCardView) cleanupCardView(); // 以前のカードビューのリスナーを解除
            cleanupCardView = initCardView(ui, deckId, deckName);
        },
        // (将来的に)削除ボタンがクリックされた時のコールバック
        onDeleteClick: (deckId, deckName) => {
            console.log(`Delete deck: ${deckName} (${deckId})`);
            // TODO: デッキ削除確認モーダルを表示し、削除処理を実行
        }
    });
}

/**
 * ログアウト時の処理
 */
function handleLogout() {
    showView('auth-view');
    
    // 全てのビューのリスナーを解除
    if (cleanupDeckView) {
        cleanupDeckView();
        cleanupDeckView = null;
    }
    if (cleanupCardView) {
        cleanupCardView();
        cleanupCardView = null;
    }
    
    // 表示をリセット
    ui.deck.list.innerHTML = '';
    ui.deck.noDecksMessage.classList.remove('hidden');
}

/**
 * モーダルを開閉するためのイベントリスナーを設定します。
 */
function setupModalEventListeners() {
    // デッキ追加FABクリック -> デッキ追加モーダル表示
    ui.deck.addDeckFab.addEventListener('click', () => toggleModal('addDeck', true));
    // デッキ追加モーダルでキャンセル
    ui.modals.addDeck.cancelButton.addEventListener('click', () => toggleModal('addDeck', false));

    // カード追加FABクリック -> カード追加モーダル表示
    ui.card.addCardFab.addEventListener('click', () => toggleModal('addCard', true));
    // カード追加モーダルでキャンセル
    ui.modals.addCard.cancelButton.addEventListener('click', () => toggleModal('addCard', false));
}

/**
 * ビュー間の「戻る」ナビゲーションのイベントリスナーを設定します。
 */
function setupNavigationEventListeners() {
    // カード一覧画面 -> デッキ一覧画面
    ui.card.backToDecksButton.addEventListener('click', () => {
        showView('deck-view');
        // カードビューのリスナーを解除してメモリリークを防ぐ
        if (cleanupCardView) {
            cleanupCardView();
            cleanupCardView = null;
        }
    });

    // 学習画面 -> カード一覧画面
    ui.swipe.backButton.addEventListener('click', () => {
        // TODO: 学習を中断するか確認するモーダルを挟むのが親切
        showView('card-view');
        // TODO: スワイプビューのクリーンアップ処理
    });
}
