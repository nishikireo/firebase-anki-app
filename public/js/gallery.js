/**
 * gallery.js
 * * ギャラリービューの表示とインタラクションを管理します。
 */

// --- State Management ---
let state = {};

/**
 * ギャラリービューを初期化します。
 * @param {object} ui - UI要素のオブジェクト
 * @param {Array<object>} cards - 表示するカードの配列
 * @returns {Function} クリーンアップ関数
 */
export const initGalleryView = (ui, cards) => {
    state = {
        ui,
        cards,
        longPressTimer: null,
    };

    renderGallery();
    updateGridColumns(ui.gallery.zoomSlider.value);

    // --- Event Listeners ---
    const zoomHandler = (e) => updateGridColumns(e.target.value);
    const gridClickHandler = (e) => handleGridClick(e);
    const gridPressHandler = (e) => handleGridPress(e);
    const modalClickHandler = () => hideEnlargedCard();

    ui.gallery.zoomSlider.addEventListener('input', zoomHandler);
    ui.gallery.grid.addEventListener('click', gridClickHandler);
    // Mouse and Touch events for long-press
    ui.gallery.grid.addEventListener('mousedown', gridPressHandler);
    ui.gallery.grid.addEventListener('mouseup', clearLongPressTimer);
    ui.gallery.grid.addEventListener('mouseleave', clearLongPressTimer);
    ui.gallery.grid.addEventListener('touchstart', gridPressHandler, { passive: true });
    ui.gallery.grid.addEventListener('touchend', clearLongPressTimer);
    
    ui.modals.gallery.modal.addEventListener('click', modalClickHandler);


    // クリーンアップ関数
    return () => {
        ui.gallery.zoomSlider.removeEventListener('input', zoomHandler);
        ui.gallery.grid.removeEventListener('click', gridClickHandler);
        ui.gallery.grid.removeEventListener('mousedown', gridPressHandler);
        ui.gallery.grid.removeEventListener('mouseup', clearLongPressTimer);
        ui.gallery.grid.removeEventListener('mouseleave', clearLongPressTimer);
        ui.gallery.grid.removeEventListener('touchstart', gridPressHandler);
        ui.gallery.grid.removeEventListener('touchend', clearLongPressTimer);
        ui.modals.gallery.modal.removeEventListener('click', modalClickHandler);
    };
};

/**
 * ギャラリーにカードを描画します。
 */
function renderGallery() {
    state.ui.gallery.grid.innerHTML = '';
    state.cards.forEach(card => {
        const cardElement = createGalleryCardElement(card);
        state.ui.gallery.grid.appendChild(cardElement);
    });
}

/**
 * ギャラリー表示用のカード要素を生成します。
 * @param {object} card - カードデータ
 * @returns {HTMLElement}
 */
function createGalleryCardElement(card) {
    const div = document.createElement('div');
    div.className = 'flip-card aspect-[3/4]'; // 縦長のカード比率
    div.dataset.cardId = card.id;
    div.innerHTML = `
        <div class="flip-card-inner rounded-lg shadow-md">
            <div class="flip-card-front bg-white border border-slate-200 text-slate-700 text-center p-2">
                <p class="text-sm md:text-base">${card.front}</p>
            </div>
            <div class="flip-card-back bg-slate-700 text-white text-center p-2">
                <p class="text-sm md:text-base font-semibold">${card.back}</p>
            </div>
        </div>
    `;
    return div;
}

/**
 * グリッドの列数を更新します。
 * @param {string | number} count - 列数
 */
function updateGridColumns(count) {
    const grid = state.ui.gallery.grid;
    // 既存のgrid-cols-*クラスをすべて削除
    grid.className = grid.className.replace(/grid-cols-\d+/g, '');
    grid.classList.add(`grid-cols-${count}`);
}

/**
 * カードのクリックイベント（フリップ）を処理します。
 * @param {Event} e 
 */
function handleGridClick(e) {
    clearLongPressTimer(); // 長押し判定をキャンセル
    const cardElement = e.target.closest('.flip-card');
    if (cardElement) {
        cardElement.classList.toggle('is-flipped');
    }
}

/**
 * カードの長押しイベントを処理します。
 * @param {Event} e 
 */
function handleGridPress(e) {
    clearLongPressTimer(); // 既存のタイマーをクリア
    const cardElement = e.target.closest('.flip-card');
    if (cardElement) {
        state.longPressTimer = setTimeout(() => {
            e.preventDefault(); // クリックイベントの発火を防ぐ
            showEnlargedCard(cardElement.dataset.cardId);
        }, 500); // 500msで長押しと判定
    }
}

function clearLongPressTimer() {
    if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
    }
}

/**
 * 拡大カードをモーダルに表示します。
 * @param {string} cardId 
 */
function showEnlargedCard(cardId) {
    const cardData = state.cards.find(c => c.id === cardId);
    if (!cardData) return;

    const modalContent = state.ui.modals.gallery.content;
    modalContent.innerHTML = `
        <div class="flip-card aspect-[3/4]">
            <div class="flip-card-inner rounded-xl shadow-2xl">
                <div class="flip-card-front bg-white border-4 border-yellow-300 text-slate-800">
                    <p class="text-3xl p-8">${cardData.front}</p>
                </div>
                <div class="flip-card-back bg-blue-600 border-4 border-yellow-300 text-white">
                    <p class="text-3xl font-bold p-8">${cardData.back}</p>
                </div>
            </div>
        </div>
    `;
    
    state.ui.modals.gallery.modal.classList.remove('hidden');
    // 表示アニメーション
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

/**
 * 拡大カードモーダルを非表示にします。
 */
function hideEnlargedCard() {
    const modal = state.ui.modals.gallery.modal;
    const modalContent = state.ui.modals.gallery.content;
    
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    // トランジションが終わってから非表示にする
    setTimeout(() => {
        modal.classList.add('hidden');
        modalContent.innerHTML = '';
    }, 300);
}
