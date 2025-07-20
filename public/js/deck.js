import { db } from './firebase.js';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 単一のデッキ要素を作成する
const createDeckElement = (deck) => {
    const div = document.createElement('div');
    div.className = 'deck-card bg-white p-4 rounded-lg shadow cursor-pointer border border-gray-200 flex flex-col justify-between';
    div.dataset.deckId = deck.id;
    div.dataset.deckName = deck.name;

    div.innerHTML = `
        <h3 class="font-semibold text-lg text-gray-800">${deck.name}</h3>
        <div class="text-right mt-2">
            <button data-deck-id="${deck.id}" data-deck-name="${deck.name}" class="delete-deck-button text-gray-400 hover:text-red-500 transition text-sm">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
};

// デッキ一覧を画面に描画
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

// デッキを追加
const addDeck = async (ui, userId) => {
    const deckName = ui.deck.newDeckNameInput.value.trim();
    if (!deckName) {
        alert('デッキ名を入力してください。');
        return;
    }

    // ボタンを無効化し、ローディング表示に切り替えて二重送信を防ぐ
    const button = ui.deck.addDeckButton;
    const originalButtonContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        await addDoc(collection(db, 'decks'), {
            name: deckName,
            userId: userId,
            createdAt: serverTimestamp()
        });
        ui.deck.newDeckNameInput.value = '';
    } catch (error) {
        console.error("Error adding deck: ", error);
        alert('デッキの追加に失敗しました。');
    } finally {
        // 処理完了後、ボタンの状態を元に戻す
        button.disabled = false;
        button.innerHTML = originalButtonContent;
    }
};

// デッキ管理機能の初期化
export const initDeckView = (ui, userId, { onDeckClick, onDeleteClick }) => {
    // イベントリスナーのハンドラをこのスコープ内で定義
    const addDeckHandler = () => addDeck(ui, userId);
    const enterKeyHandler = (e) => {
        if (e.key === 'Enter') addDeck(ui, userId);
    };

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
    
    // イベントリスナーを登録
    ui.deck.addDeckButton.addEventListener('click', addDeckHandler);
    ui.deck.newDeckNameInput.addEventListener('keypress', enterKeyHandler);

    const deckListClickHandler = (e) => {
        // 削除ボタンがクリックされた場合
        const deleteButton = e.target.closest('.delete-deck-button');
        if (deleteButton) {
            e.stopPropagation(); // デッキを開くイベントの発生を防ぐ
            const { deckId, deckName } = deleteButton.dataset;
            // onDeleteClick(deckId, deckName); // TODO: デッキ削除機能を実装
            return;
        }

        // デッキカード本体がクリックされた場合
        const deckCard = e.target.closest('.deck-card');
        if (deckCard) {
            const { deckId, deckName } = deckCard.dataset;
            onDeckClick(deckId, deckName);
        }
    };
    ui.deck.list.addEventListener('click', deckListClickHandler);

    // クリーンアップ関数を返す
    return () => {
        if (decksUnsubscribe) decksUnsubscribe();
        // 登録したハンドラをクリーンアップ
        ui.deck.addDeckButton.removeEventListener('click', addDeckHandler);
        ui.deck.newDeckNameInput.removeEventListener('keypress', enterKeyHandler);
        ui.deck.list.removeEventListener('click', deckListClickHandler);
    };
};