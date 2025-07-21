/**
 * card.js
 * * カードの作成、表示、削除、学習ステータスの更新などのロジックを管理します。
 */
import { db } from './firebase.js';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { toggleModal } from './ui.js';

// ... (createCardElement, renderCards, addCard, deleteCard - 変更なし) ...
const createCardElement = (card) => {
    const div = document.createElement('div');
    div.className = 'flip-card h-48';
    div.dataset.cardId = card.id;
    div.innerHTML = `
        <div class="flip-card-inner rounded-xl shadow-md">
            <div class="flip-card-front bg-white border border-slate-200 text-slate-800">
                <p class="text-xl">${card.front}</p>
            </div>
            <div class="flip-card-back bg-blue-600 text-white">
                <p class="text-xl font-semibold">${card.back}</p>
                <button data-card-id="${card.id}" class="delete-card-button absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    return div;
};
const renderCards = (ui, cards) => {
    ui.card.list.innerHTML = '';
    if (cards.length === 0) {
        ui.card.noCardsMessage.classList.remove('hidden');
    } else {
        ui.card.noCardsMessage.classList.add('hidden');
        cards.forEach(card => {
            ui.card.list.appendChild(createCardElement(card));
        });
    }
};
const addCard = async (ui, deckId) => {
    const front = ui.modals.addCard.frontInput.value.trim();
    const back = ui.modals.addCard.backInput.value.trim();
    if (!front || !back) {
        alert('おもてと裏の両方を入力してください。');
        return;
    }
    const button = ui.modals.addCard.confirmButton;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 追加中...';
    try {
        const cardCollectionRef = collection(db, 'decks', deckId, 'cards');
        await addDoc(cardCollectionRef, { front, back, createdAt: serverTimestamp() });
        ui.modals.addCard.frontInput.value = '';
        ui.modals.addCard.backInput.value = '';
        toggleModal('addCard', false);
    } catch (error) {
        console.error("Error adding card: ", error);
        alert('カードの追加に失敗しました。');
    } finally {
        button.disabled = false;
        button.innerHTML = '追加';
    }
};
const deleteCard = async (deckId, cardId) => {
    if (!confirm('このカードを本当に削除しますか？')) return;
    try {
        await deleteDoc(doc(db, 'decks', deckId, 'cards', cardId));
    } catch (error) {
        console.error("Error deleting card: ", error);
        alert('カードの削除に失敗しました。');
    }
};


/**
 * カードビューのイベントリスナーなどを初期化します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {string} deckId - 表示するデッキのID
 * @param {string} deckName - 表示するデッキの名前
 * @param {object} callbacks - コールバック関数 { onStartSwipe, onShowGallery }
 * @returns {Function} クリーンアップ関数
 */
export const initCardView = (ui, deckId, deckName, { onStartSwipe, onShowGallery }) => {
    ui.card.deckNameTitle.textContent = deckName;
    let currentCards = [];

    const cardsCollectionRef = collection(db, 'decks', deckId, 'cards');
    const q = query(cardsCollectionRef, orderBy("createdAt", "desc"));

    const cardsUnsubscribe = onSnapshot(q, (querySnapshot) => {
        currentCards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCards(ui, currentCards);
    }, (error) => {
        console.error("Error fetching cards: ", error);
        alert('カードの取得に失敗しました。');
    });

    const addCardHandler = () => addCard(ui, deckId);
    const cardListClickHandler = (e) => {
        const deleteButton = e.target.closest('.delete-card-button');
        if (deleteButton) {
            e.stopPropagation();
            deleteCard(deckId, deleteButton.dataset.cardId);
            return;
        }
        const card = e.target.closest('.flip-card');
        if (card) card.classList.toggle('is-flipped');
    };
    
    const startSwipeHandler = () => onStartSwipe(currentCards);
    const showGalleryHandler = () => onShowGallery(currentCards); // 変更

    // イベントリスナーを登録
    ui.modals.addCard.confirmButton.addEventListener('click', addCardHandler);
    ui.card.list.addEventListener('click', cardListClickHandler);
    ui.card.startSwipeButton.addEventListener('click', startSwipeHandler);
    ui.card.toggleGalleryButton.addEventListener('click', showGalleryHandler); // 追加

    // クリーンアップ関数
    return () => {
        if (cardsUnsubscribe) cardsUnsubscribe();
        ui.modals.addCard.confirmButton.removeEventListener('click', addCardHandler);
        ui.card.list.removeEventListener('click', cardListClickHandler);
        ui.card.startSwipeButton.removeEventListener('click', startSwipeHandler);
        ui.card.toggleGalleryButton.removeEventListener('click', showGalleryHandler); // 追加
    };
};
