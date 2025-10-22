document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    //  1. ПЛАВНАЯ ПРОКРУТКА К ЯКОРЯМ С УЧЕТОМ "ЛИПКОЙ" ШАПКИ
    // ===================================================================
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') {
                // Если ссылка - это просто #, плавно скроллим на самый верх
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } 
            else if (targetId.length > 1) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const header = document.querySelector('.main-header');
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = targetPosition - headerHeight - 40;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ===================================================================
    //  2. ЛОГИКА ДЛЯ ЛАЙТБОКСА (ПРОСМОТР СКРИНШОТОВ)
    // ===================================================================
    const lightbox = document.getElementById('lightbox');

    if (lightbox) {
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxClose = document.querySelector('.lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        
        let currentGallery = [];
        let currentIndex = 0;

        const showImage = (galleryIndex) => {
            if (galleryIndex < 0 || galleryIndex >= currentGallery.length) return;
            currentIndex = galleryIndex;
            const imageSrc = currentGallery[currentIndex].getAttribute('href');
            lightboxImage.setAttribute('src', imageSrc);
        };

        const openLightbox = (event) => {
            event.preventDefault();
            const clickedItem = event.currentTarget;
            
            // === ИЗМЕНЕНИЕ: Теперь мы обрабатываем оба случая ===
            const galleryContainer = clickedItem.closest('.knolling-gallery, .carousel-track');
            
            if (galleryContainer) {
                // СЛУЧАЙ 1: ЭТО ГАЛЕРЕЯ
                const allItemsInGallery = Array.from(galleryContainer.querySelectorAll('.screenshot-preview'));
                const galleryItemsForLightbox = allItemsInGallery.filter(item => !item.hasAttribute('aria-hidden'));
                
                currentGallery = galleryItemsForLightbox;
                const globalClickedIndex = allItemsInGallery.indexOf(clickedItem);
                const targetGalleryIndex = globalClickedIndex % galleryItemsForLightbox.length;
                
                showImage(targetGalleryIndex);

                // Показываем стрелки, если в галерее больше одного фото
                if (currentGallery.length > 1) {
                    lightboxPrev.style.display = 'block';
                    lightboxNext.style.display = 'block';
                } else {
                    lightboxPrev.style.display = 'none';
                    lightboxNext.style.display = 'none';
                }

            } else {
                // СЛУЧАЙ 2: ЭТО ОДИНОЧНЫЙ СКРИНШОТ
                currentGallery = [clickedItem]; // Галерея состоит из одного элемента
                currentIndex = 0;
                
                const imageSrc = clickedItem.getAttribute('href');
                lightboxImage.setAttribute('src', imageSrc);
                
                // Прячем стрелки навигации
                lightboxPrev.style.display = 'none';
                lightboxNext.style.display = 'none';
            }
            
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            lightboxImage.setAttribute('src', '');
            document.body.style.overflow = 'auto';
        };

        const showNextImage = () => {
            if (currentGallery.length <= 1) return; // Не делаем ничего, если фото одно
            const nextIndex = (currentIndex + 1) % currentGallery.length;
            showImage(nextIndex);
        };

        const showPrevImage = () => {
            if (currentGallery.length <= 1) return; // Не делаем ничего, если фото одно
            const prevIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
            showImage(prevIndex);
        };

        document.querySelectorAll('.screenshot-preview').forEach(link => {
            link.addEventListener('click', openLightbox);
        });

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxNext) lightboxNext.addEventListener('click', showNextImage);
        if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevImage);
        
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (event) => {
            if (lightbox.style.display !== 'flex') return;
            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowRight') showNextImage();
            if (event.key === 'ArrowLeft') showPrevImage();
        });
    }

    // ===================================================================
    //  3. ЛОГИКА ДЛЯ ИНТЕРАКТИВНОЙ ГАЛЕРЕИ ФИЧЕЙ
    // ===================================================================
    const featureVisuals = document.querySelectorAll('.feature-visual');

    if (featureVisuals.length > 0) {
        let currentPlayingCard = null;

        const resetToPreview = (card) => {
            const video = card.querySelector('.feature-video');
            const preview = card.querySelector('.feature-preview');
            
            video.pause();
            video.currentTime = 0;
            video.classList.add('hidden');
            preview.classList.remove('hidden');

            card.classList.remove('playing');
        };

        featureVisuals.forEach(card => {
            card.addEventListener('click', () => {
                const video = card.querySelector('.feature-video');
                const preview = card.querySelector('.feature-preview');

                if (currentPlayingCard && currentPlayingCard !== card) {
                    resetToPreview(currentPlayingCard);
                }

                if (video.classList.contains('hidden')) {
                    preview.classList.add('hidden');
                    video.classList.remove('hidden');

                    card.classList.add('playing');
                    
                    video.play();
                    currentPlayingCard = card;
                } else {
                    resetToPreview(card);
                    currentPlayingCard = null;
                }
            });
        });
    }

    // ===================================================================
    //  4. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ГОДА В КОПИРАЙТЕ
    // ===================================================================
    const copyrightYearSpan = document.getElementById('copyright-year');
    
    // Выполняем код, только если элемент для года есть на странице
    if (copyrightYearSpan) {
        const startYear = 2025; // Год запуска
        const currentYear = new Date().getFullYear();
        let yearText = startYear.toString();

        if (currentYear > startYear) {
            yearText = `${startYear}–${currentYear}`;
        }
        
        copyrightYearSpan.textContent = yearText;
    }

});

// ===================================================================
//  5. ЛОГИКА ДЛЯ МОДАЛЬНОГО ОКНА ОПЛАТЫ
// ===================================================================
const paymentModal = document.getElementById('payment-modal');

if (paymentModal) {
    const showModalButtons = document.querySelectorAll('.js-show-payment-modal');
    const modalCloseButton = paymentModal.querySelector('.modal-close');

    const openPaymentModal = (event) => {
        event.preventDefault();
        paymentModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    };

    const closePaymentModal = () => {
        paymentModal.classList.remove('visible');
        document.body.style.overflow = 'auto';
    };

    showModalButtons.forEach(button => {
        button.addEventListener('click', openPaymentModal);
    });

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closePaymentModal);
    }

    paymentModal.addEventListener('click', (event) => {
        // Закрываем по клику на фон (оверлей)
        if (event.target === paymentModal) {
            closePaymentModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && paymentModal.classList.contains('visible')) {
            closePaymentModal();
        }
    });
}