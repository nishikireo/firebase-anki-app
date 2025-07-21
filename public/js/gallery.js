/**
 * gallery.js
 * * ギャラリービューの表示とインタラクションを管理します。
 */

let state = {};

export const initGalleryView = (ui, cards) => {
    state = {
        ui,
        cards,
        longPressTimer: null,
    };

    renderGallery();
    updateGridColumns(ui.gallery.zoomSlider.value);

    const zoomHandler = (e) => updateGridColumns(e.target.value);
    const gridClickHandler = (e) => handleGridClick(e);
    const gridPressHandler = (e) => handleGridPress(e);
    const modalClickHandler = () => hideEnlargedCard();

    ui.gallery.zoomSlider.addEventListener('input', zoomHandler);
    ui.gallery.grid.addEventListener('click', gridClickHandler);
    ui.gallery.grid.addEventListener('mousedown', gridPressHandler);
    ui.gallery.grid.addEventListener('mouseup', clearLongPressTimer);
    ui.gallery.grid.addEventListener('mouseleave', clearLongPressTimer);
    ui.gallery.grid.addEventListener('touchstart', gridPressHandler, { passive: true });
    ui.gallery.grid.addEventListener('touchend', clearLongPressTimer);
    
    ui.modals.gallery.modal.addEventListener('click', modalClickHandler);

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

function renderGallery() {
    state.ui.gallery.grid.innerHTML = '';
    state.cards.forEach(card => {
        const cardElement = createGalleryCardElement(card);
        state.ui.gallery.grid.appendChild(cardElement);
    });
}

const createGalleryFaceContent = (text, imageUrl, size = 'sm') => {
    const textSize = size === 'sm' ? 'text-sm' : 'text-3xl';
    const textHtml = text ? `<p class="${textSize} break-words mt-2">${text}</p>` : '';
    const imageHtml = imageUrl ? `<img src="${imageUrl}" class="max-h-full max-w-full object-contain rounded-md" alt="カード画像" loading="lazy">` : '';
    
    if (imageUrl && textHtml) {
        return `<div class="flex flex-col items-center justify-center h-full w-full p-1">${imageHtml}${textHtml}</div>`;
    }
    return imageHtml || (text ? `<p class="${textSize} break-words">${text}</p>` : '');
};

function createGalleryCardElement(card) {
    const div = document.createElement('div');
    div.className = 'flip-card aspect-[3/4]';
    div.dataset.cardId = card.id;

    const frontContent = createGalleryFaceContent(card.frontText, card.frontImageURL, 'sm');
    const backContent = createGalleryFaceContent(card.backText, card.backImageURL, 'sm');

    div.innerHTML = `
        <div class="flip-card-inner rounded-lg shadow-md">
            <div class="flip-card-front bg-white border border-slate-200 text-slate-700 text-center p-2 flex items-center justify-center">
                ${frontContent || '<span class="text-slate-400 text-xs">内容なし</span>'}
            </div>
            <div class="flip-card-back bg-slate-700 text-white text-center p-2 flex items-center justify-center">
                ${backContent || '<span class="text-slate-400 text-xs">内容なし</span>'}
            </div>
        </div>
    `;
    return div;
}

function updateGridColumns(count) {
    const grid = state.ui.gallery.grid;
    grid.className = grid.className.replace(/grid-cols-\d+/g, '');
    grid.classList.add(`grid-cols-${count}`);
}

function handleGridClick(e) {
    clearLongPressTimer();
    const cardElement = e.target.closest('.flip-card');
    if (cardElement) {
        cardElement.classList.toggle('is-flipped');
    }
}

function handleGridPress(e) {
    clearLongPressTimer();
    const cardElement = e.target.closest('.flip-card');
    if (cardElement) {
        state.longPressTimer = setTimeout(() => {
            e.preventDefault();
            showEnlargedCard(cardElement.dataset.cardId);
        }, 500);
    }
}

function clearLongPressTimer() {
    if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
    }
}

function showEnlargedCard(cardId) {
    const cardData = state.cards.find(c => c.id === cardId);
    if (!cardData) return;

    const modalContent = state.ui.modals.gallery.content;
    const frontContent = createGalleryFaceContent(cardData.frontText, cardData.frontImageURL, 'lg');
    const backContent = createGalleryFaceContent(cardData.backText, cardData.backImageURL, 'lg');

    modalContent.innerHTML = `
        <div class="flip-card aspect-[3/4]">
            <div class="flip-card-inner rounded-xl shadow-2xl">
                <div class="flip-card-front bg-white border-4 border-yellow-300 text-slate-800 p-4 flex items-center justify-center">
                    ${frontContent || '<span class="text-slate-400">内容がありません</span>'}
                </div>
                <div class="flip-card-back bg-blue-600 border-4 border-yellow-300 text-white p-4 flex items-center justify-center">
                    ${backContent || '<span class="text-slate-400">内容がありません</span>'}
                </div>
            </div>
        </div>
    `;
    
    state.ui.modals.gallery.modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideEnlargedCard() {
    const modal = state.ui.modals.gallery.modal;
    const modalContent = state.ui.modals.gallery.content;
    
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        modalContent.innerHTML = '';
    }, 300);
}
