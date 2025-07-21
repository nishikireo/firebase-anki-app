/**
 * swipe.js
 * * Tinder風のスワイプ学習機能のロジックを管理します。
 * カードの表示、スワイプ操作のハンドリング、学習結果の記録を行います。
 */
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let state = {};

export const initSwipeView = (ui, deckId, cards, userId) => {
    state = {
        ui,
        deckId,
        userId,
        cards: [...cards],
        currentCardIndex: 0,
        activeCardElement: null,
        startTime: null,
        isDragging: false,
        startX: 0,
        currentX: 0,
    };

    updateProgress();
    loadNextCard();

    const swipeForgotHandler = () => handleSwipe('left');
    const swipeRememberedHandler = () => handleSwipe('right');
    
    ui.swipe.forgotButton.addEventListener('click', swipeForgotHandler);
    ui.swipe.rememberedButton.addEventListener('click', swipeRememberedHandler);

    return () => {
        ui.swipe.container.innerHTML = '';
        ui.swipe.forgotButton.removeEventListener('click', swipeForgotHandler);
        ui.swipe.rememberedButton.removeEventListener('click', swipeRememberedHandler);
        if (state.activeCardElement) {
            removeDragListeners(state.activeCardElement);
        }
    };
};

function loadNextCard() {
    if (state.currentCardIndex >= state.cards.length) {
        showCompletionScreen();
        return;
    }

    const cardData = state.cards[state.currentCardIndex];
    const cardElement = createSwipeCardElement(cardData);
    state.activeCardElement = cardElement;
    
    state.ui.swipe.container.innerHTML = '';
    state.ui.swipe.container.appendChild(cardElement);

    addDragListeners(cardElement);

    state.startTime = Date.now();
}

const createCardFaceContent = (text, imageUrl) => {
    const textHtml = text ? `<p class="text-2xl md:text-3xl text-center break-words mt-2">${text}</p>` : '';
    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="max-h-64 max-w-full object-contain rounded-lg" alt="カード画像" loading="lazy">` : '';
    
    if (imageUrl && textHtml) {
        return `<div class="flex flex-col items-center justify-center h-full w-full p-4">${imageHtml}${textHtml}</div>`;
    }
    return imageHtml || textHtml;
};

function createSwipeCardElement(card) {
    const element = document.createElement('div');
    element.className = 'flip-card absolute w-full h-full cursor-grab active:cursor-grabbing';
    
    const frontContent = createCardFaceContent(card.frontText, card.frontImageURL);
    const backContent = createCardFaceContent(card.backText, card.backImageURL);

    element.innerHTML = `
        <div class="flip-card-inner w-full h-full rounded-xl shadow-xl transition-transform duration-300 ease-in-out">
            <div class="flip-card-front bg-white border border-slate-200 text-slate-800 p-4 flex items-center justify-center">
                ${frontContent || '<span class="text-slate-400">内容がありません</span>'}
            </div>
            <div class="flip-card-back bg-blue-600 text-white p-4 flex items-center justify-center">
                ${backContent || '<span class="text-slate-400">内容がありません</span>'}
            </div>
        </div>
    `;
    element.addEventListener('click', (e) => {
        if (Math.abs(state.currentX - state.startX) < 5) {
            element.classList.toggle('is-flipped');
        }
    });
    return element;
}

function addDragListeners(element) {
    element.addEventListener('mousedown', dragStart);
    element.addEventListener('touchstart', dragStart, { passive: true });
}

function removeDragListeners(element) {
    element.removeEventListener('mousedown', dragStart);
    element.removeEventListener('touchstart', dragStart);
}

function dragStart(e) {
    state.isDragging = true;
    state.startX = e.pageX ?? e.touches[0].pageX;
    state.currentX = state.startX;
    state.activeCardElement.firstElementChild.classList.remove('transition-transform', 'duration-300');

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: true });
    document.addEventListener('touchend', dragEnd);
}

function dragMove(e) {
    if (!state.isDragging) return;
    state.currentX = e.pageX ?? e.touches[0].pageX;
    const deltaX = state.currentX - state.startX;
    const rotation = deltaX / 20;

    state.activeCardElement.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
}

function dragEnd() {
    if (!state.isDragging) return;
    state.isDragging = false;

    const deltaX = state.currentX - state.startX;
    const swipeThreshold = window.innerWidth / 4;

    if (deltaX > swipeThreshold) {
        handleSwipe('right');
    } else if (deltaX < -swipeThreshold) {
        handleSwipe('left');
    } else {
        state.activeCardElement.firstElementChild.classList.add('transition-transform', 'duration-300');
        state.activeCardElement.style.transform = '';
    }

    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);
}

function handleSwipe(direction) {
    if (!state.activeCardElement) return;

    const cardElement = state.activeCardElement;
    const flyoutX = (direction === 'left' ? -1 : 1) * (window.innerWidth);
    const rotation = (direction === 'left' ? -1 : 1) * 45;
    
    cardElement.firstElementChild.classList.add('transition-transform', 'duration-300');
    cardElement.style.transform = `translateX(${flyoutX}px) rotate(${rotation}deg)`;

    const result = direction === 'right' ? 'remembered' : 'forgot';
    const duration = Date.now() - state.startTime;
    const cardId = state.cards[state.currentCardIndex].id;

    logSwipeResult(cardId, result, duration);
    
    state.currentCardIndex++;
    updateProgress();

    setTimeout(loadNextCard, 300);
}

async function logSwipeResult(cardId, result, duration) {
    try {
        const logCollectionRef = collection(db, 'decks', state.deckId, 'cards', cardId, 'logs');
        await addDoc(logCollectionRef, {
            userId: state.userId,
            result: result,
            viewDuration: duration,
            swipedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging swipe result: ", error);
    }
}

function updateProgress() {
    state.ui.swipe.progressCurrent.textContent = Math.min(state.currentCardIndex + 1, state.cards.length);
    state.ui.swipe.progressTotal.textContent = state.cards.length;
}

function showCompletionScreen() {
    state.ui.swipe.container.innerHTML = `
        <div class="text-center">
            <i class="fas fa-check-circle text-7xl text-green-500"></i>
            <h2 class="text-2xl font-bold text-slate-700 mt-6">お疲れ様でした！</h2>
            <p class="text-slate-500 mt-2">すべてのカードの学習が完了しました。</p>
        </div>
    `;
    state.ui.swipe.forgotButton.disabled = true;
    state.ui.swipe.rememberedButton.disabled = true;
}
