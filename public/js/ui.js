export let ui = {};

export const initUI = () => {
    ui.views = document.querySelectorAll('.view');
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
        newDeckNameInput: document.getElementById('new-deck-name'),
        addDeckButton: document.getElementById('add-deck-button'),
        logoutButton: document.getElementById('logout-button'),
    };
    ui.card = {
        view: document.getElementById('card-view'),
        list: document.getElementById('card-list'),
        deckNameTitle: document.getElementById('card-view-deck-name'),
        noCardsMessage: document.getElementById('no-cards-message'),
        backToDecksButton: document.getElementById('back-to-decks-button'),
        newCardFrontInput: document.getElementById('new-card-front'),
        newCardBackInput: document.getElementById('new-card-back'),
        addCardButton: document.getElementById('add-card-button'),
    };
    ui.swipe = {
        view: document.getElementById('swipe-view'),
        card: document.getElementById('swipe-card'),
        backButton: document.getElementById('back-to-cards-button'),
    };
};

export const showView = (viewId) => {
    ui.views.forEach(view => {
        view.classList.toggle('active', view.id === viewId);
    });
};