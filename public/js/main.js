import { initFirebase } from './firebase.js';
import { initAuth } from './auth.js';
import { initUI, ui, showView } from './ui.js';
import { initDeckView } from './deck.js';
import { initCardView } from './card.js';

let cleanupDeckView = null; // デッキビューのクリーンアップ関数を保持する変数
let cleanupCardView = null; // カードビューのクリーンアップ関数を保持する変数

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initUI(); // 1. UI要素を取得・初期化
        await initFirebase();
        console.log("Firebase initialized successfully.");

        // 2. 認証関連の機能を初期化
        initAuth(ui, {
            // ログイン時に実行される処理
            onLogin: (user) => {
                showView('deck-view');
                // 以前のリスナーが残っていれば解除
                if (cleanupDeckView) {
                    cleanupDeckView();
                }
                // 新しいユーザーでデッキビューを初期化し、クリーンアップ関数を保存
                cleanupDeckView = initDeckView(ui, user.uid, {
                    // デッキがクリックされた時の処理
                    onDeckClick: (deckId, deckName) => {
                        showView('card-view');
                        if (cleanupCardView) cleanupCardView(); // 以前のリスナーを解除
                        cleanupCardView = initCardView(ui, deckId, deckName);
                    },
                    // 削除ボタンがクリックされた時の処理
                    onDeleteClick: (deckId, deckName) => {
                        // TODO: デッキ削除機能の実装
                    }
                });
            },
            // ログアウト時に実行される処理
            onLogout: () => {
                showView('auth-view');
                // リスナーを解除
                if (cleanupDeckView) {
                    cleanupDeckView();
                    cleanupDeckView = null;
                }
                // カードビューのリスナーも解除
                if (cleanupCardView) {
                    cleanupCardView();
                    cleanupCardView = null;
                }
                // 画面上のデッキリストをクリア
                ui.deck.list.innerHTML = '';
                ui.deck.noDecksMessage.classList.remove('hidden');
            }
        });
    } catch (e) {
        console.error("Initialization failed:", e);
        alert("アプリの初期化に失敗しました。");
    }

    // カードビューからデッキビューに戻るボタンの処理
    ui.card.backToDecksButton.addEventListener('click', () => {
        showView('deck-view');
        // カードビューのリスナーを解除してメモリリークを防ぐ
        if (cleanupCardView) {
            cleanupCardView();
            cleanupCardView = null;
        }
    });
});