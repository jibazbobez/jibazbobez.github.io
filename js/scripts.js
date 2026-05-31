// ===================================================================
//  1. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ГОДА В КОПИРАЙТЕ
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- Dynamic Year Update ---
    const copyrightYearSpan = document.getElementById('copyright-year');
    
    if (copyrightYearSpan) {
        const startYear = 2025;
        const currentYear = new Date().getFullYear();
        let yearText = startYear.toString();

        if (currentYear > startYear) {
            yearText = `${startYear}–${currentYear}`;
        }
        
        copyrightYearSpan.textContent = yearText;
    }

    // --- Parallax Effect ---
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    let ticking = false;

    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;
                
                parallaxLayers.forEach(layer => {
                    const speed = parseFloat(layer.dataset.speed);
                    const yOffset = scrollY * speed;
                    layer.style.transform = `translateX(-50%) translateY(${yOffset}px)`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // --- Header Background on Scroll ---
    const header = document.querySelector('.main-header');
    const heroSection = document.querySelector('.hero-section');

    const observerOptions = {
        root: null,
        threshold: 0,
        rootMargin: '-80px 0px 0px 0px'
    };

    const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }, observerOptions);

    if (heroSection) {
        headerObserver.observe(heroSection);
    }
});


// ===================================================================
//  2. COOKIE CONSENT (NATIVE IMPLEMENTATION)
// ===================================================================
(function() {
if (localStorage.getItem('andrewr_tools_cookies_accepted')) return;

const style = document.createElement('style');
style.innerHTML = `
    .am-cookie-banner {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        width: 95%;
        max-width: 580px;
        background-color: var(--glass-bg);
        backdrop-filter: var(--glass-blur);
        -webkit-backdrop-filter: var(--glass-blur);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-md);
        padding: 20px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        z-index: 10000;
        box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        opacity: 0;
    }
    .am-cookie-banner.visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    .am-cookie-text {
        font-size: 0.95rem;
        color: var(--text-primary);
        margin: 0;
        line-height: 1.5;
        font-family: var(--font-family);
    }
    .am-cookie-text a {
        color: var(--primary-accent);
        text-decoration: underline;
        font-weight: 500;
    }
    .am-cookie-btn {
        white-space: nowrap;
        padding: 10px 24px !important;
        font-size: 0.9rem !important;
        flex-shrink: 0;
    }
    @media (max-width: 650px) {
        .am-cookie-banner {
            flex-direction: column;
            text-align: center;
            bottom: 15px;
            padding: 25px;
        }
        .am-cookie-btn {
            width: 100%;
        }
    }
`;
document.head.appendChild(style);

const banner = document.createElement('div');
banner.className = 'am-cookie-banner';
banner.innerHTML = `
    <p class="am-cookie-text">
        This website uses cookies to ensure you get the best experience and to analyze traffic. 
        <a href="https://andrewr.online/privacy.html">Privacy Policy</a>
    </p>
    <button class="cta-button primary am-cookie-btn" id="accept-global-cookies">Got it!</button>
`;

document.body.appendChild(banner);

setTimeout(() => {
    banner.classList.add('visible');
}, 1500);

document.getElementById('accept-global-cookies').addEventListener('click', function() {
    localStorage.setItem('andrewr_tools_cookies_accepted', 'true');
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 600);
});
})();

// ===================================================================
//  3. DYNAMIC IMAGE GLOW EFFECT (PRODUCT SHOWCASE & FEATURED)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Target the product showcase cards and the main featured visual
    const glowTargets = document.querySelectorAll('.project-card, .featured-visual');
    
    glowTargets.forEach(target => {
        const img = target.querySelector('img');
        if (img && img.src) {
            
            // SPECIAL FIX FOR PROJECT CARDS: 
            // To allow the background image to scale (zoom effect) without spilling out of the rounded corners,
            // and simultaneously allow the parent card to emit a glow (overflow: visible),
            // we safely wrap the background image in a clipping div without touching your source HTML.
            if (target.classList.contains('project-card')) {
                if (!img.parentElement.classList.contains('card-img-wrap')) {
                    const wrap = document.createElement('div');
                    wrap.className = 'card-img-wrap';
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