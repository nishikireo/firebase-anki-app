/**
 * swipe.js
 * * Tinder風のスワイプ学習機能のロジックを管理します。
 * カードの表示、スワイプ操作のハンドリング、学習結果の記録を行います。
 */
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- State Management ---
let state = {};

/**
 * スワイプ学習ビューを初期化します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {string} deckId - 現在のデッキID
 * @param {Array<object>} cards - 学習対象のカード配列
 * @param {string} userId - 現在のユーザーID
 * @returns {Function} クリーンアップ関数
 */
export const initSwipeView = (ui, deckId, cards, userId) => {
    // stateを初期化
    state = {
        ui,
        deckId,
        userId,
        cards: [...cards], // cards配列のコピーを作成
        currentCardIndex: 0,
        activeCardElement: null,
        startTime: null,
        isDragging: false,
        startX: 0,
        currentX: 0,
    };

    // 初期表示
    updateProgress();
    loadNextCard();

    // イベントリスナーをセットアップ
    const swipeForgotHandler = () => handleSwipe('left');
    const swipeRememberedHandler = () => handleSwipe('right');
    
    ui.swipe.forgotButton.addEventListener('click', swipeForgotHandler);
    ui.swipe.rememberedButton.addEventListener('click', swipeRememberedHandler);

    // クリーンアップ関数
    return () => {
        ui.swipe.container.innerHTML = ''; // カードをクリア
        ui.swipe.forgotButton.removeEventListener('click', swipeForgotHandler);
        ui.swipe.rememberedButton.removeEventListener('click', swipeRememberedHandler);
        // activeCardElementに残っている可能性のあるリスナーも削除
        if (state.activeCardElement) {
            removeDragListeners(state.activeCardElement);
        }
    };
};

/**
 * 次のカードを画面に読み込みます。
 */
function loadNextCard() {
    if (state.currentCardIndex >= state.cards.length) {
        showCompletionScreen();
        return;
    }

    const cardData = state.cards[state.currentCardIndex];
    const cardElement = createSwipeCardElement(cardData);
    state.activeCardElement = cardElement;
    
    state.ui.swipe.container.innerHTML = ''; // 前のカードをクリア
    state.ui.swipe.container.appendChild(cardElement);

    addDragListeners(cardElement);

    state.startTime = Date.now(); // カード表示時刻を記録
}

/**
 * スワイプカードのHTML要素を生成します。
 * @param {object} card - カードデータ
 * @returns {HTMLElement}
 */
function createSwipeCardElement(card) {
    const element = document.createElement('div');
    element.className = 'flip-card absolute w-full h-full cursor-grab active:cursor-grabbing';
    element.innerHTML = `
        <div class="flip-card-inner w-full h-full rounded-xl shadow-xl transition-transform duration-300 ease-in-out">
            <div class="flip-card-front bg-white border border-slate-200 text-slate-800">
                <p class="text-2xl md:text-3xl text-center">${card.front}</p>
            </div>
            <div class="flip-card-back bg-blue-600 text-white">
                <p class="text-2xl md:text-3xl font-semibold text-center">${card.back}</p>
            </div>
        </div>
    `;
    // タップでめくる機能
    element.addEventListener('click', (e) => {
        // ドラッグ中はめくらないようにする
        if (Math.abs(state.currentX - state.startX) < 5) {
            element.classList.toggle('is-flipped');
        }
    });
    return element;
}

// --- Drag/Swipe Logic ---

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
    state.activeCardElement.classList.remove('transition-transform', 'duration-300');

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: true });
    document.addEventListener('touchend', dragEnd);
}

function dragMove(e) {
    if (!state.isDragging) return;
    state.currentX = e.pageX ?? e.touches[0].pageX;
    const deltaX = state.currentX - state.startX;
    const rotation = deltaX / 20; // ドラッグ距離に応じてカードを傾ける

    // カードを動かす
    state.activeCardElement.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
}

function dragEnd() {
    if (!state.isDragging) return;
    state.isDragging = false;

    const deltaX = state.currentX - state.startX;
    const swipeThreshold = window.innerWidth / 4; // 画面幅の1/4をスワイプのしきい値とする

    if (deltaX > swipeThreshold) {
        handleSwipe('right');
    } else if (deltaX < -swipeThreshold) {
        handleSwipe('left');
    } else {
        // カードを元の位置に戻す
        state.activeCardElement.classList.add('transition-transform', 'duration-300');
        state.activeCardElement.style.transform = '';
    }

    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);
}

// --- Action Handling ---

/**
 * スワイプ処理（左右）を実行します。
 * @param {'left' | 'right'} direction - スワイプ方向
 */
function handleSwipe(direction) {
    if (!state.activeCardElement) return;

    const cardElement = state.activeCardElement;
    const flyoutX = (direction === 'left' ? -1 : 1) * (window.innerWidth);
    const rotation = (direction === 'left' ? -1 : 1) * 45;
    
    cardElement.classList.add('transition-transform', 'duration-300');
    cardElement.style.transform = `translateX(${flyoutX}px) rotate(${rotation}deg)`;

    const result = direction === 'right' ? 'remembered' : 'forgot';
    const duration = Date.now() - state.startTime;
    const cardId = state.cards[state.currentCardIndex].id;

    logSwipeResult(cardId, result, duration);
    
    state.currentCardIndex++;
    updateProgress();

    // アニメーションが終わってから次のカードをロード
    setTimeout(loadNextCard, 300);
}

/**
 * 学習結果をFirestoreに記録します。
 * @param {string} cardId - カードID
 * @param {'remembered' | 'forgot'} result - 学習結果
 * @param {number} duration - 表示時間（ミリ秒）
 */
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
        // ユーザーにエラーを通知しても良い
    }
}

// --- UI Updates ---

/**
 * 進捗表示（例: 3/10）を更新します。
 */
function updateProgress() {
    state.ui.swipe.progressCurrent.textContent = Math.min(state.currentCardIndex + 1, state.cards.length);
    state.ui.swipe.progressTotal.textContent = state.cards.length;
}

/**
 * 全カード学習完了画面を表示します。
 */
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
