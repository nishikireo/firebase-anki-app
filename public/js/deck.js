/**
 * deck.js
 * * デッキの作成、表示、削除などのロジックを管理します。
 */
import { db } from './firebase.js';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { toggleModal } from './ui.js';

/**
 * 単一のデッキ要素を生成します。
 * @param {object} deck - デッキのデータ
 * @returns {HTMLElement} 生成されたデッキのHTML要素
 */
const createDeckElement = (deck) => {
    const div = document.createElement('div');
    div.className = 'deck-card bg-white rounded-xl shadow-md p-4 flex flex-col justify-between transition-all transform hover:-translate-y-1 cursor-pointer';
    div.dataset.deckId = deck.id;
    div.dataset.deckName = deck.name;

    // カード枚数を表示するプレースホルダー（将来的に実装）
    const cardCount = deck.cardCount || 0;

    div.innerHTML = `
        <h3 class="font-bold text-lg text-slate-700 break-words">${deck.name}</h3>
        <div class="flex justify-between items-center mt-4">
            <span class="text-sm text-slate-400">${cardCount}枚</span>
            <button data-deck-id="${deck.id}" data-deck-name="${deck.name}" class="delete-deck-button text-slate-400 hover:text-red-500 transition-colors z-10 p-1">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    return div;
};

/**
 * デッキ一覧を画面に描画します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {Array<object>} decks - 描画するデッキの配列
 */
const renderDecks = (ui, decks) => {
    ui.deck.list.innerHTML = '';
    if (decks.length === 0) {
        ui.deck.noDecksMessage.classList.remove('hidden');
    } else {
        ui.deck.noDecksMessage.classList.add('hidden');
        decks.forEach(deck => {
            ui.deck.list.appendChild(createDeckElement(deck));
        });
    }
};

/**
 * 新しいデッキをFirestoreに追加します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {string} userId - 現在のユーザーID
 */
const addDeck = async (ui, userId) => {
    const deckName = ui.modals.addDeck.nameInput.value.trim();
    if (!deckName) {
        alert('デッキ名を入力してください。');
        return;
    }

    const button = ui.modals.addDeck.confirmButton;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 作成中...';

    try {
        await addDoc(collection(db, 'decks'), {
            name: deckName,
            userId: userId,
            createdAt: serverTimestamp()
        });
        ui.modals.addDeck.nameInput.value = '';
        toggleModal('addDeck', false); // 成功したらモーダルを閉じる
    } catch (error) {
        console.error("Error adding deck: ", error);
        alert('デッキの追加に失敗しました。');
    } finally {
        button.disabled = false;
        button.innerHTML = '作成';
    }
};

/**
 * 指定されたデッキを削除します。
 * @param {string} deckId - 削除するデッキのID
 */
const deleteDeck = async (deckId) => {
    // TODO: 削除前に確認モーダルを表示する
    if (!confirm('このデッキを本当に削除しますか？\nデッキ内のすべてのカードも削除されます。')) {
        return;
    }
    try {
        // ここでサブコレクション内のカードも削除する必要があるが、
        // クライアント側での一括削除は非推奨。Cloud Functionsで実装するのが望ましい。
        // 今回はまずデッキのドキュメントのみ削除する。
        await deleteDoc(doc(db, 'decks', deckId));
    } catch (error) {
        console.error("Error deleting deck: ", error);
        alert('デッキの削除に失敗しました。');
    }
};


/**
 * デッキビューのイベントリスナーなどを初期化します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {string} userId - 現在のユーザーID
 * @param {object} callbacks - コールバック関数のオブジェクト { onDeckClick, onDeleteClick }
 * @returns {Function} クリーンアップ関数
 */
export const initDeckView = (ui, userId, { onDeckClick }) => {
    // ログインユーザーのデッキを新しい順に取得するクエリ
    const q = query(collection(db, 'decks'), where("userId", "==", userId), orderBy("createdAt", "desc"));

    // リアルタイムリスナーを設定
    const decksUnsubscribe = onSnapshot(q, (querySnapshot) => {
        const decks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderDecks(ui, decks);
    }, (error) => {
        console.error("Error fetching decks: ", error);
        alert('デッキの取得に失敗しました。');
    });
    
    // イベントリスナーのハンドラを定義
    const addDeckHandler = () => addDeck(ui, userId);
    const deckListClickHandler = (e) => {
        const deleteButton = e.target.closest('.delete-deck-button');
        if (deleteButton) {
            e.stopPropagation(); // 親要素へのイベント伝播を停止
            const { deckId } = deleteButton.dataset;
            deleteDeck(deckId);
            return;
        }

        const deckCard = e.target.closest('.deck-card');
        if (deckCard) {
            const { deckId, deckName } = deckCard.dataset;
            onDeckClick(deckId, deckName);
        }
    };

    // イベントリスナーを登録
    ui.modals.addDeck.confirmButton.addEventListener('click', addDeckHandler);
    ui.deck.list.addEventListener('click', deckListClickHandler);

    // クリーンアップ関数: このビューが不要になったときにイベントリスナーを削除する
    return () => {
        if (decksUnsubscribe) decksUnsubscribe();
        ui.modals.addDeck.confirmButton.removeEventListener('click', addDeckHandler);
        ui.deck.list.removeEventListener('click', deckListClickHandler);
    };
};
