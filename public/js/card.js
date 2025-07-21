/**
 * card.js
 * * カードの作成、表示、削除、学習ステータスの更新などのロジックを管理します。
 */
import { db, storage } from './firebase.js';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { toggleModal } from './ui.js';

/**
 * カードの表面または裏面のコンテンツ（テキストや画像）を生成します。
 * @param {string} text - テキストコンテンツ
 * @param {string} imageUrl - 画像のURL
 * @returns {string} - コンテンツのHTML文字列
 */
const createCardFaceContent = (text, imageUrl) => {
    const textHtml = text ? `<p class="text-xl break-words">${text}</p>` : '';
    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="max-h-32 max-w-full object-contain rounded-md my-2" alt="カード画像" loading="lazy">` : '';

    if (imageUrl && textHtml) {
        return `<div class="flex flex-col items-center justify-center h-full w-full">${imageHtml}${textHtml}</div>`;
    }
    return imageHtml || textHtml;
};

/**
 * 単一のカード要素（フリップ機能付き）を生成します。
 * @param {object} card - カードのデータ
 * @returns {HTMLElement} 生成されたカードのHTML要素
 */
const createCardElement = (card) => {
    const div = document.createElement('div');
    div.className = 'flip-card h-48';
    div.dataset.cardId = card.id;

    const frontContent = createCardFaceContent(card.frontText, card.frontImageURL);
    const backContent = createCardFaceContent(card.backText, card.backImageURL);

    div.innerHTML = `
        <div class="flip-card-inner rounded-xl shadow-md">
            <div class="flip-card-front bg-white border border-slate-200 text-slate-800 p-4 flex items-center justify-center">
                ${frontContent || '<span class="text-slate-400">内容がありません</span>'}
            </div>
            <div class="flip-card-back bg-blue-600 text-white p-4 flex items-center justify-center">
                ${backContent || '<span class="text-slate-400">内容がありません</span>'}
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
 * 画像ファイルをFirebase Storageにアップロードします。
 * @param {File} file - アップロードする画像ファイル
 * @param {string} deckId - カードが所属するデッキのID
 * @returns {Promise<string|null>} アップロードされた画像のURL、またはファイルがない場合はnull
 */
const uploadImage = async (file, deckId) => {
    if (!file) return null;
    const filePath = `cards/${deckId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

/**
 * 新しいカードをFirestoreに追加します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {string} deckId - カードを追加するデッキのID
 */
const addCard = async (ui, deckId) => {
    const frontText = ui.modals.addCard.frontInput.value.trim();
    const backText = ui.modals.addCard.backInput.value.trim();
    const frontImageFile = ui.modals.addCard.frontImageInput.files[0];
    const backImageFile = ui.modals.addCard.backImageInput.files[0];

    if (!frontText && !frontImageFile) {
        alert('カードのおもてには、テキストか画像のどちらかが必要です。');
        return;
    }

    const button = ui.modals.addCard.confirmButton;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 追加中...';

    try {
        const frontImageURL = await uploadImage(frontImageFile, deckId);
        const backImageURL = await uploadImage(backImageFile, deckId);

        const newCardData = {
            frontText: frontText || '',
            backText: backText || '',
            frontImageURL: frontImageURL || null,
            backImageURL: backImageURL || null,
            createdAt: serverTimestamp()
        };

        const cardCollectionRef = collection(db, 'decks', deckId, 'cards');
        await addDoc(cardCollectionRef, newCardData);
        
        toggleModal('addCard', false);
    } catch (error) {
        console.error("Error adding card: ", error);
        alert('カードの追加に失敗しました。');
    } finally {
        button.disabled = false;
        button.innerHTML = '追加';
    }
};

/**
 * URLを指定してFirebase Storageから画像を削除します。
 * @param {string} imageUrl - 削除する画像のURL
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting image: ", error);
        }
    }
};

/**
 * 指定されたカードと、それに関連する画像を削除します。
 * @param {string} deckId - カードが所属するデッキのID
 * @param {string} cardId - 削除するカードのID
 */
const deleteCard = async (deckId, cardId) => {
    if (!confirm('このカードを本当に削除しますか？')) return;
    try {
        const cardRef = doc(db, 'decks', deckId, 'cards', cardId);
        const cardSnap = await getDoc(cardRef);
        
        if (cardSnap.exists()) {
            const cardData = cardSnap.data();
            await Promise.all([
                deleteImage(cardData.frontImageURL),
                deleteImage(cardData.backImageURL)
            ]);
        }
        await deleteDoc(cardRef);
    } catch (error) {
        console.error("Error deleting card: ", error);
        alert('カードの削除に失敗しました。');
    }
};

/**
 * モーダル内で選択された画像のプレビューを表示します。
 * @param {Event} e - file inputのchangeイベント
 * @param {HTMLElement} previewElement - プレビューを表示する要素
 */
const showImagePreview = (e, previewElement) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewElement.innerHTML = `<img src="${event.target.result}" class="h-20 w-auto object-contain rounded-md">`;
            previewElement.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        previewElement.innerHTML = '';
        previewElement.classList.add('hidden');
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
    const showGalleryHandler = () => onShowGallery(currentCards);

    const frontPreviewHandler = (e) => showImagePreview(e, ui.modals.addCard.frontImagePreview);
    const backPreviewHandler = (e) => showImagePreview(e, ui.modals.addCard.backImagePreview);

    ui.modals.addCard.confirmButton.addEventListener('click', addCardHandler);
    ui.card.list.addEventListener('click', cardListClickHandler);
    ui.card.startSwipeButton.addEventListener('click', startSwipeHandler);
    ui.card.toggleGalleryButton.addEventListener('click', showGalleryHandler);
    ui.modals.addCard.frontImageInput.addEventListener('change', frontPreviewHandler);
    ui.modals.addCard.backImageInput.addEventListener('change', backPreviewHandler);

    return () => {
        if (cardsUnsubscribe) cardsUnsubscribe();
        ui.modals.addCard.confirmButton.removeEventListener('click', addCardHandler);
        ui.card.list.removeEventListener('click', cardListClickHandler);
        ui.card.startSwipeButton.removeEventListener('click', startSwipeHandler);
        ui.card.toggleGalleryButton.removeEventListener('click', showGalleryHandler);
        ui.modals.addCard.frontImageInput.removeEventListener('change', frontPreviewHandler);
        ui.modals.addCard.backImageInput.removeEventListener('change', backPreviewHandler);
    };
};
