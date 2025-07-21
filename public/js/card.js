/**
 * card.js
 * * カードの作成、表示、削除、学習ステータスの更新などのロジックを管理します。
 */
import { db, storage } from './firebase.js';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { toggleModal } from './ui.js';

const createCardFaceContent = (text, imageUrl) => {
    const textHtml = text ? `<p class="text-xl break-words">${text}</p>` : '';
    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="max-h-32 max-w-full object-contain rounded-md my-2" alt="カード画像" loading="lazy">` : '';

    if (imageUrl && textHtml) {
        return `<div class="flex flex-col items-center justify-center h-full w-full">${imageHtml}${textHtml}</div>`;
    }
    return imageHtml || textHtml;
};

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

const uploadImage = async (file, deckId) => {
    if (!file) return null;
    const filePath = `cards/${deckId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

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
    let allCards = [];
    let filteredCards = [];

    const cardsCollectionRef = collection(db, 'decks', deckId, 'cards');
    const q = query(cardsCollectionRef, orderBy("createdAt", "desc"));

    const cardsUnsubscribe = onSnapshot(q, (querySnapshot) => {
        allCards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const searchTerm = ui.card.searchInput.value.toLowerCase();
        filterAndRender(searchTerm);
    }, (error) => {
        console.error("Error fetching cards: ", error);
        alert('カードの取得に失敗しました。');
    });

    const filterAndRender = (searchTerm) => {
        if (!searchTerm) {
            filteredCards = [...allCards];
        } else {
            filteredCards = allCards.filter(card => {
                const front = card.frontText?.toLowerCase() || '';
                const back = card.backText?.toLowerCase() || '';
                return front.includes(searchTerm) || back.includes(searchTerm);
            });
        }
        renderCards(ui, filteredCards);
    };

    const searchHandler = (e) => {
        filterAndRender(e.target.value.toLowerCase());
    };

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
    
    const startSwipeHandler = () => onStartSwipe(filteredCards);
    const showGalleryHandler = () => onShowGallery(filteredCards);

    const frontPreviewHandler = (e) => showImagePreview(e, ui.modals.addCard.frontImagePreview);
    const backPreviewHandler = (e) => showImagePreview(e, ui.modals.addCard.backImagePreview);

    ui.card.searchInput.addEventListener('input', searchHandler);
    ui.modals.addCard.confirmButton.addEventListener('click', addCardHandler);
    ui.card.list.addEventListener('click', cardListClickHandler);
    ui.card.startSwipeButton.addEventListener('click', startSwipeHandler);
    ui.card.toggleGalleryButton.addEventListener('click', showGalleryHandler);
    ui.modals.addCard.frontImageInput.addEventListener('change', frontPreviewHandler);
    ui.modals.addCard.backImageInput.addEventListener('change', backPreviewHandler);

    return () => {
        if (cardsUnsubscribe) cardsUnsubscribe();
        ui.card.searchInput.removeEventListener('input', searchHandler);
        ui.modals.addCard.confirmButton.removeEventListener('click', addCardHandler);
        ui.card.list.removeEventListener('click', cardListClickHandler);
        ui.card.startSwipeButton.removeEventListener('click', startSwipeHandler);
        ui.card.toggleGalleryButton.removeEventListener('click', showGalleryHandler);
        ui.modals.addCard.frontImageInput.removeEventListener('change', frontPreviewHandler);
        ui.modals.addCard.backImageInput.removeEventListener('change', backPreviewHandler);
    };
};
