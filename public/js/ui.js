/**
 * ui.js
 * * アプリケーションの全UI要素への参照を管理し、
 * UI関連の共通関数（ビューの切り替え、モーダルの表示/非表示など）を提供します。
 */

export let ui = {};

export const initUI = () => {
    // ... (Auth, Deck Views - 変更なし) ...
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
    ui.deck = {
        view: document.getElementById('deck-view'),
        list: document.getElementById('deck-list'),
        noDecksMessage: document.getElementById('no-decks-message'),
        logoutButton: document.getElementById('logout-button'),
        addDeckFab: document.getElementById('add-deck-fab'),
    };

    // ===== Card View =====
    ui.card = {
        view: document.getElementById('card-view'),
        list: document.getElementById('card-list'),
        deckNameTitle: document.getElementById('card-view-deck-name'),
        noCardsMessage: document.getElementById('no-cards-message'),
        backToDecksButton: document.getElementById('back-to-decks-button'),
        startSwipeButton: document.getElementById('start-swipe-button'),
        toggleGalleryButton: document.getElementById('toggle-gallery-button'), // 追加
        addCardFab: document.getElementById('add-card-fab'),
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

    // ===== Gallery View =====
    ui.gallery = {
        view: document.getElementById('gallery-view'),
        grid: document.getElementById('gallery-grid'),
        zoomSlider: document.getElementById('gallery-zoom-slider'),
        backButton: document.getElementById('back-to-cards-from-gallery'),
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
        },
        gallery: { // 追加
            modal: document.getElementById('gallery-modal'),
            content: document.getElementById('gallery-modal-content'),
        }
    };
};

// ... (showView, toggleModal - 変更なし) ...
export const showView = (viewId) => {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === viewId);
    });
};

export const toggleModal = (modalName, show) => {
    const modalElement = ui.modals[modalName]?.modal;
    if (!modalElement) return;

    if (show) {
        modalElement.classList.remove('hidden');
    } else {
        modalElement.classList.add('hidden');
    }
};
