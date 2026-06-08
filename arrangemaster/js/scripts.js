document.addEventListener('DOMContentLoaded', () => {

// ===================================================================
//  1. SMOOTH SCROLLING TO ANCHORS WITH A STICKY HEADER
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
//  2. LIGHTBOX LOGIC (SCREENSHOTS VIEWING)
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
//  3. LOGIC FOR AN INTERACTIVE FEATURE GALLERY
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
//  4. AUTOMATIC UPDATE OF THE YEAR IN COPYRIGHT
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
//  5. LOGIC FOR A MODAL PAYMENT WINDOW
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

// ===================================================================
//  6. DYNAMIC INFINITE CAROUSEL FOR LOGOS
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.querySelector('.logo-carousel-viewport');
    
    // Only run if the viewport exists
    if (viewport) {
        // --- Find all tracks instead of just the first one ---
        const tracks = viewport.querySelectorAll('.logo-carousel-track');
        if (!tracks.length) return;

        tracks.forEach((track, index) => {
            const logos = Array.from(track.children);
            
            // 1. Duplicate logos to create the seamless loop effect
            logos.forEach(logo => {
                const clone = logo.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                track.appendChild(clone);
            });

            // 2. Calculate the total width of the original logos
            let totalWidth = 0;
            logos.forEach(logo => {
                const style = window.getComputedStyle(logo);
                const marginRight = parseInt(style.marginRight, 10);
                const marginLeft = parseInt(style.marginLeft, 10);
                totalWidth += logo.offsetWidth + marginLeft + marginRight;
            });

            // 3. Set the dynamic animation based on the calculated width
            const speed = 40; // pixels per second. Adjust for faster/slower scroll.
            const duration = totalWidth / speed;

            track.style.width = `${totalWidth * 2}px`;

            const isReverse = track.classList.contains('reverse');
            const animationName = `scrollLogosDynamic_${index}`;
            const styleSheet = document.createElement('style');
            
            // --- Directional Animation Logic ---
            // Standard: from 0 to -totalWidth (scrolls Right to Left)
            // Reverse: from -totalWidth to 0 (scrolls Left to Right)
            if (isReverse) {
                styleSheet.innerHTML = `
                    @keyframes ${animationName} {
                        from { transform: translateX(-${totalWidth}px); }
                        to { transform: translateX(0); }
                    }
                `;
            } else {
                styleSheet.innerHTML = `
                    @keyframes ${animationName} {
                        from { transform: translateX(0); }
                        to { transform: translateX(-${totalWidth}px); }
                    }
                `;
            }
            
            document.head.appendChild(styleSheet);

            track.style.animation = `${animationName} ${duration}s linear infinite`;
        });
    }
});

// ===================================================================
//  7. COOKIE CONSENT (NATIVE IMPLEMENTATION)
// ===================================================================
(function() {
    // Проверяем, давал ли пользователь согласие ранее
    if (localStorage.getItem('am_cookies_accepted')) return;

    // Создаем стили для окна (используем переменные из вашего styles.css)
    const style = document.createElement('style');
    style.innerHTML = `
        .am-cookie-banner {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            width: 90%;
            max-width: 600px;
            background-color: var(--glass-bg);
            backdrop-filter: var(--glass-blur);
            -webkit-backdrop-filter: var(--glass-blur);
            border: 1px solid var(--surface-border);
            border-radius: 20px;
            padding: 20px 25px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            z-index: 99999;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
            opacity: 0;
        }
        .am-cookie-banner.visible {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        .am-cookie-text {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin: 0;
            line-height: 1.4;
        }
        .am-cookie-text a {
            color: var(--primary-accent);
            text-decoration: underline;
        }
        .am-cookie-btn {
            white-space: nowrap;
            padding: 10px 24px !important;
            font-size: 0.85rem !important;
        }
        @media (max-width: 600px) {
            .am-cookie-banner {
                flex-direction: column;
                text-align: center;
                bottom: 20px;
                border-radius: 24px;
            }
            .am-cookie-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);

    // Создаем HTML структуру
    const banner = document.createElement('div');
    banner.className = 'am-cookie-banner';
    banner.innerHTML = `
        <p class="am-cookie-text">
            This website uses cookies to ensure you get the best experience and to analyze traffic. 
            <a href="https://andrewr.online/privacy.html">Learn more</a>
        </p>
        <button class="cta-button primary am-cookie-btn" id="accept-cookies">Got it!</button>
    `;

    document.body.appendChild(banner);

    // Показываем окно с небольшой задержкой
    setTimeout(() => {
        banner.classList.add('visible');
    }, 1000);

    // Логика кнопки
    document.getElementById('accept-cookies').addEventListener('click', function() {
        localStorage.setItem('am_cookies_accepted', 'true');
        banner.classList.remove('visible');
        setTimeout(() => {
            banner.remove();
        }, 600);
    });
})();

// ===================================================================
//  8. DYNAMIC IMAGE GLOW EFFECT
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Target specific containers safely, explicitly excluding all carousels
    const glowTargets = document.querySelectorAll(`
        .features-grid .feature-card, 
        .use-cases-gallery .use-case-card, 
        .knolling-gallery .gallery-item,
        .doc-page .screenshot-wrapper
    `);
    
    glowTargets.forEach(target => {
        const img = target.querySelector('img');
        if (img && img.src) {
            if (target.classList.contains('gallery-item')) {
                if (!img.parentElement.classList.contains('gallery-img-wrap')) {
                    const wrap = document.createElement('div');
                    wrap.className = 'gallery-img-wrap';
                    target.insertBefore(wrap, img);
                    wrap.appendChild(img);
                }
            }

            // Apply the background image to the CSS variable
            target.style.setProperty('--glow-bg', `url(${img.src})`);
            // Activate the CSS styles
            target.classList.add('has-dynamic-glow');
        }
    });
});

// ===================================================================
//  9. DYNAMIC WHAT-IS-ITEM HOVER COLORS
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    const whatIsItems = document.querySelectorAll('.what-is-item');
    
    // Array of your requested vibrant colors
    const hoverColors =[
        '#2680EB', // Bright Blue
        '#3FBBFF', // Light Blue
        '#6254A9', // Purple
        '#E69358'  // Orange
    ];

    whatIsItems.forEach(item => {
        // Trigger calculation exactly when the mouse enters the card
        item.addEventListener('mouseenter', () => {
            // Pick a random color from the array
            const randomColor = hoverColors[Math.floor(Math.random() * hoverColors.length)];
            
            // Inject the selected color into the CSS variable of this specific card
            item.style.setProperty('--hover-color', randomColor);
        });
    });
});