import { db } from './firebase.js';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 単一のカード要素を作成する
const createCardElement = (card) => {
    const div = document.createElement('div');
    // TODO: カードのクリックで裏返す機能などをここに追加
    div.className = 'card-item bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-start';
    div.dataset.cardId = card.id;
    div.innerHTML = `
        <div>
            <p class="text-gray-800">${card.front}</p>
            <hr class="my-2 border-gray-200">
            <p class="text-gray-600">${card.back}</p>
        </div>
        <button data-card-id="${card.id}" class="delete-card-button text-gray-400 hover:text-red-500 transition text-sm ml-2 flex-shrink-0">
            <i class="fas fa-trash"></i>
        </button>
    `;
    return div;
};

// カード一覧を画面に描画
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

// カードを追加
const addCard = async (ui, deckId) => {
    const front = ui.card.newCardFrontInput.value.trim();
    const back = ui.card.newCardBackInput.value.trim();

    if (!front || !back) {
        alert('表と裏の両方を入力してください。');
        return;
    }

    const button = ui.card.addCardButton;
    const originalButtonContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 追加中...';

    try {
        const cardCollectionRef = collection(db, 'decks', deckId, 'cards');
        await addDoc(cardCollectionRef, {
            front: front,
            back: back,
            createdAt: serverTimestamp()
        });
        ui.card.newCardFrontInput.value = '';
        ui.card.newCardBackInput.value = '';
        ui.card.newCardFrontInput.focus(); // 入力後、次の入力をしやすくする
    } catch (error) {
        console.error("Error adding card: ", error);
        alert('カードの追加に失敗しました。');
    } finally {
        button.disabled = false;
        button.innerHTML = originalButtonContent;
    }
};

// カードを削除
const deleteCard = async (deckId, cardId) => {
    if (!confirm('このカードを本当に削除しますか？')) {
        return;
    }
    try {
        const cardRef = doc(db, 'decks', deckId, 'cards', cardId);
        await deleteDoc(cardRef);
    } catch (error) {
        console.error("Error deleting card: ", error);
        alert('カードの削除に失敗しました。');
    }
};

// カードビューの初期化
export const initCardView = (ui, deckId, deckName) => {
    ui.card.deckNameTitle.textContent = deckName;

    const cardsCollectionRef = collection(db, 'decks', deckId, 'cards');
    const q = query(cardsCollectionRef, orderBy("createdAt", "desc"));

    const cardsUnsubscribe = onSnapshot(q, (querySnapshot) => {
        const cards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCards(ui, cards);
    }, (error) => {
        console.error("Error fetching cards: ", error);
        alert('カードの取得に失敗しました。');
    });

    const addCardHandler = () => addCard(ui, deckId);
    ui.card.addCardButton.addEventListener('click', addCardHandler);

    const cardListClickHandler = (e) => {
        const deleteButton = e.target.closest('.delete-card-button');
        if (deleteButton) {
            const { cardId } = deleteButton.dataset;
            deleteCard(deckId, cardId);
        }
    };
    ui.card.list.addEventListener('click', cardListClickHandler);


    // クリーンアップ関数を返す
    return () => {
        if (cardsUnsubscribe) cardsUnsubscribe();
        ui.card.addCardButton.removeEventListener('click', addCardHandler);
        ui.card.list.removeEventListener('click', cardListClickHandler);
    };
};