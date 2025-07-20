/**
 * card.js
 * * カードの作成、表示、削除、学習ステータスの更新などのロジックを管理します。
 */
import { db } from './firebase.js';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { toggleModal } from './ui.js';

/**
 * 単一のカード要素（フリップ機能付き）を生成します。
 * @param {object} card - カードのデータ
 * @returns {HTMLElement} 生成されたカードのHTML要素
 */
const createCardElement = (card) => {
    const div = document.createElement('div');
    div.className = 'flip-card h-48'; // カードの高さを固定
    div.dataset.cardId = card.id;

    div.innerHTML = `
        <div class="flip-card-inner rounded-xl shadow-md">
            <!-- Front of the card -->
            <div class="flip-card-front bg-white border border-slate-200 text-slate-800">
                <p class="text-xl">${card.front}</p>
            </div>
            <!-- Back of the card -->
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

/**
 * カード一覧を画面に描画します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {Array<object>} cards - 描画するカードの配列
 */
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

/**
 * 新しいカードをFirestoreに追加します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {string} deckId - カードを追加するデッキのID
 */
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
        await addDoc(cardCollectionRef, {
            front: front,
            back: back,
            createdAt: serverTimestamp()
            // learningStatus, nextReviewDate などのフィールドも将来的に追加
        });
        ui.modals.addCard.frontInput.value = '';
        ui.modals.addCard.backInput.value = '';
        toggleModal('addCard', false); // 成功したらモーダルを閉じる
    } catch (error) {
        console.error("Error adding card: ", error);
        alert('カードの追加に失敗しました。');
    } finally {
        button.disabled = false;
        button.innerHTML = '追加';
    }
};

/**
 * 指定されたカードを削除します。
 * @param {string} deckId - カードが所属するデッキのID
 * @param {string} cardId - 削除するカードのID
 */
const deleteCard = async (deckId, cardId) => {
    // 確認UIは将来的により洗練されたモーダルに置き換える
    if (!confirm('このカードを本当に削除しますか？')) {
        return;
    }
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
 * @returns {Function} クリーンアップ関数
 */
export const initCardView = (ui, deckId, deckName) => {
    ui.card.deckNameTitle.textContent = deckName;

    const cardsCollectionRef = collection(db, 'decks', deckId, 'cards');
    const q = query(cardsCollectionRef, orderBy("createdAt", "desc"));

    // リアルタイムリスナーを設定
    const cardsUnsubscribe = onSnapshot(q, (querySnapshot) => {
        const cards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCards(ui, cards);
    }, (error) => {
        console.error("Error fetching cards: ", error);
        alert('カードの取得に失敗しました。');
    });

    const addCardHandler = () => addCard(ui, deckId);
    const cardListClickHandler = (e) => {
        const deleteButton = e.target.closest('.delete-card-button');
        if (deleteButton) {
            e.stopPropagation();
            const { cardId } = deleteButton.dataset;
            deleteCard(deckId, cardId);
            return;
        }

        const card = e.target.closest('.flip-card');
        if (card) {
            card.classList.toggle('is-flipped');
        }
    };
    
    // イベントリスナーを登録
    ui.modals.addCard.confirmButton.addEventListener('click', addCardHandler);
    ui.card.list.addEventListener('click', cardListClickHandler);

    // クリーンアップ関数
    return () => {
        if (cardsUnsubscribe) cardsUnsubscribe();
        ui.modals.addCard.confirmButton.removeEventListener('click', addCardHandler);
        ui.card.list.removeEventListener('click', cardListClickHandler);
    };
};
