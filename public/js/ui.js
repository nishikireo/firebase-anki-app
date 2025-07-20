/**
 * ui.js
 * * アプリケーションの全UI要素への参照を管理し、
 * UI関連の共通関数（ビューの切り替え、モーダルの表示/非表示など）を提供します。
 */

// アプリ全体のUI要素を格納するオブジェクト
export let ui = {};

/**
 * UI要素をDOMから取得し、uiオブジェクトに格納します。
 * アプリケーション起動時に一度だけ呼び出されます。
 */
export const initUI = () => {
    // ===== Views =====
    ui.views = document.querySelectorAll('.view');

    // ===== Auth View =====
    ui.auth = {
        view: document.getElementById('auth-view'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        showLoginTab: document.getElementById('show-login-tab'),
        showSignupTab: document.getElementById('show-signup-tab'),
        loginButton: document.getElementById('login-button'),
        signupButton: document.getElementById('signup-button'),
        error: document.getElementById('auth-error'),
    };

    // ===== Deck View =====
    ui.deck = {
        view: document.getElementById('deck-view'),
        list: document.getElementById('deck-list'),
        noDecksMessage: document.getElementById('no-decks-message'),
        logoutButton: document.getElementById('logout-button'),
        addDeckFab: document.getElementById('add-deck-fab'), // Floating Action Button
    };

    // ===== Card View =====
    ui.card = {
        view: document.getElementById('card-view'),
        list: document.getElementById('card-list'),
        deckNameTitle: document.getElementById('card-view-deck-name'),
        noCardsMessage: document.getElementById('no-cards-message'),
        backToDecksButton: document.getElementById('back-to-decks-button'),
        startSwipeButton: document.getElementById('start-swipe-button'),
        addCardFab: document.getElementById('add-card-fab'), // Floating Action Button
    };
    
    // ===== Swipe View =====
    ui.swipe = {
        view: document.getElementById('swipe-view'),
        container: document.getElementById('swipe-card-container'),
        backButton: document.getElementById('back-to-cards-button'),
        progressCurrent: document.getElementById('swipe-progress-current'),
        progressTotal: document.getElementById('swipe-progress-total'),
        forgotButton: document.getElementById('swipe-forgot-button'),
        rememberedButton: document.getElementById('swipe-remembered-button'),
    };

    // ===== Modals =====
    ui.modals = {
        addDeck: {
            modal: document.getElementById('add-deck-modal'),
            nameInput: document.getElementById('new-deck-name'),
            confirmButton: document.getElementById('confirm-add-deck'),
            cancelButton: document.getElementById('cancel-add-deck'),
        },
        addCard: {
            modal: document.getElementById('add-card-modal'),
            frontInput: document.getElementById('new-card-front'),
            backInput: document.getElementById('new-card-back'),
            confirmButton: document.getElementById('confirm-add-card'),
            cancelButton: document.getElementById('cancel-add-card'),
        }
    };
};

/**
 * 指定されたIDのビューを表示し、他を非表示にします。
 * @param {string} viewId 表示するビューのID
 */
export const showView = (viewId) => {
    ui.views.forEach(view => {
        view.classList.toggle('active', view.id === viewId);
    });
};

/**
 * 指定されたモーダルの表示/非表示を切り替えます。
 * @param {'addDeck' | 'addCard'} modalName 操作するモーダルの名前
 * @param {boolean} show 表示する場合はtrue、非表示にする場合はfalse
 */
export const toggleModal = (modalName, show) => {
    const modalElement = ui.modals[modalName]?.modal;
    if (!modalElement) return;

    if (show) {
        modalElement.classList.remove('hidden');
    } else {
        modalElement.classList.add('hidden');
    }
};
