/* Arrange Master website interactions · Revision 6 · October 16, 2026.
   Shared navigation, independent tab groups, galleries and license selection. */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
    const menu = document.querySelector('#site-nav');
    const menuButton = document.querySelector('.nav-toggle');
    function closeMenu() {
        menu?.classList.remove('open');
        menuButton?.setAttribute('aria-expanded', 'false');
    }
    function positionMenu() {
        if (!menu || !menuButton) return;
        const parent = menu.parentElement.getBoundingClientRect();
        const button = menuButton.getBoundingClientRect();
        menu.style.setProperty(
            '--menu-left',
            Math.max(0, Math.min(button.left - parent.left, parent.width - 220)) + 'px'
        );
    }
    menuButton?.addEventListener('click', () => {
        positionMenu();
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('open', open);
    });
    document.addEventListener('click', (event) => {
        if (!menu?.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
    });
    menu?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
            menuButton.focus();
        }
    });
    window.addEventListener('resize', positionMenu);

    const panelDeck = document.querySelector('[data-panel-deck]');
    if (panelDeck) {
        const cards = [...panelDeck.querySelectorAll('.hero-panel-card')];
        const motion = matchMedia('(prefers-reduced-motion: reduce)');
        const slots = [
            { x: 0, y: 0, scale: 1 },
            { x: 28, y: 2.8, scale: 0.95 },
            { x: 52, y: 4.6, scale: 0.9 },
            { x: 74, y: 6, scale: 0.85 }
        ];
        const pose = (rank, dx = 0, dy = 0) => {
            const slot = slots[rank];
            return `translate(${slot.x + dx}%, ${slot.y + dy}%) scale(${slot.scale})`;
        };
        let deckAnimations = [];
        let generation = 0;
        let inView = true;

        function syncDeckPlayback() {
            const paused = document.hidden || !inView;
            deckAnimations.forEach((animation) => (paused ? animation.pause() : animation.play()));
        }

        async function startDeck() {
            const current = ++generation;
            deckAnimations.forEach((animation) => animation.cancel());
            deckAnimations = [];
            panelDeck.dataset.phase = 'still';
            if (motion.matches || typeof cards[0]?.animate !== 'function') return;
            panelDeck.dataset.phase = 'loading';
            await Promise.all(cards.map((card) => card.decode().catch(() => {})));
            if (current !== generation) return;
            if (cards.some((card) => !card.naturalWidth)) {
                panelDeck.dataset.phase = 'still';
                return;
            }

            panelDeck.dataset.phase = 'entering';
            const deckLeft = panelDeck.getBoundingClientRect().left;
            // Reveal the back cards first, then place the first method at the front.
            deckAnimations = cards.map((card, index) => {
                // Start the whole screenshot beyond the viewport, not just beyond the stack.
                const offscreenX = innerWidth - deckLeft - card.offsetLeft + 80;
                return card.animate(
                    [
                        {
                            transform: `translate(${offscreenX}px, ${slots[index].y}%) scale(${slots[index].scale})`
                        },
                        { transform: pose(index) }
                    ],
                    {
                        duration: 1000,
                        delay: (cards.length - 1 - index) * 650,
                        easing: 'cubic-bezier(.2,.7,.2,1)',
                        fill: 'both'
                    }
                );
            });
            syncDeckPlayback();
            await Promise.all(
                deckAnimations.map((animation) => animation.finished.catch(() => {}))
            );
            if (current !== generation) return;
            const entryAnimations = deckAnimations;

            deckAnimations = cards.flatMap((card, index) => {
                const frames = [];
                const layers = [];
                for (let step = 0; step < cards.length; step++) {
                    const rank = (index - step + cards.length) % cards.length;
                    const nextRank = (rank + cards.length - 1) % cards.length;
                    const frame = (progress, transform) =>
                        frames.push({
                            offset: (step + progress) / cards.length,
                            transform,
                            easing: 'cubic-bezier(.4,0,.2,1)'
                        });
                    frame(0, pose(rank));
                    frame(0.52, pose(rank));
                    if (rank === 0) {
                        // The farthest resting edge is at 74% + 85% = 159%.
                        // Keep a full gap before changing layers; never change z-index in overlap.
                        const outside = 'translate(176%, -1%) scale(1)';
                        frame(0.7, outside);
                        frame(0.84, outside);
                    } else {
                        frame(0.7, pose(rank));
                        frame(0.84, pose(nextRank));
                    }
                    frame(1, pose(nextRank));
                    const layer = (progress, rank) =>
                        layers.push({
                            offset: (step + progress) / cards.length,
                            zIndex: cards.length - rank,
                            easing: 'steps(1, end)'
                        });
                    layer(0, rank);
                    layer(0.715, nextRank);
                    layer(1, nextRank);
                }
                const timing = { duration: 26000, iterations: Infinity, fill: 'both' };
                return [card.animate(frames, timing), card.animate(layers, timing)];
            });
            entryAnimations.forEach((animation) => animation.cancel());
            panelDeck.dataset.phase = 'cycling';
            syncDeckPlayback();
        }

        document.addEventListener('visibilitychange', syncDeckPlayback);
        motion.addEventListener('change', startDeck);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(
                ([entry]) => {
                    inView = entry.isIntersecting;
                    syncDeckPlayback();
                },
                { threshold: 0.08 }
            ).observe(panelDeck);
        }
        startDeck();
    }

    document.querySelectorAll('[data-tab-group]').forEach((group) => {
        const buttons = [...group.querySelectorAll('[role="tab"]')];
        const panels = buttons.map((button) =>
            document.getElementById(button.getAttribute('aria-controls'))
        );
        const host = document.createElement('div');
        host.className = 'tab-panels';
        // Contain panel margins so the temporary height includes the whole panel.
        host.style.display = 'flow-root';
        group.after(host);
        panels.forEach((panel) => host.append(panel));

        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        let selected = buttons.find((button) => button.getAttribute('aria-selected') === 'true');
        let displayed = panels[buttons.indexOf(selected)];
        let revision = 0;
        let animations = [];

        function stopAnimations() {
            animations.forEach((animation) => animation.cancel());
            animations = [];
        }
        function show(panel) {
            panels.forEach((item) => {
                item.hidden = item !== panel;
            });
            displayed = panel;
        }
        function releaseHeight() {
            host.style.removeProperty('height');
            host.style.removeProperty('overflow');
            host.classList.remove('is-switching');
            host.inert = false;
            host.removeAttribute('aria-busy');
        }
        async function select(button, focus) {
            if (focus) button.focus({ preventScroll: true });
            if (button === selected) return;
            selected = button;
            buttons.forEach((item) => {
                const active = item === button;
                item.setAttribute('aria-selected', String(active));
                item.tabIndex = active ? 0 : -1;
            });
            const next = panels[buttons.indexOf(button)];
            const currentRevision = ++revision;
            const samePanel = displayed === next;
            const opacity = getComputedStyle(displayed).opacity;
            const height = host.getBoundingClientRect().height;
            stopAnimations();

            if (reducedMotion.matches || typeof displayed.animate !== 'function') {
                show(next);
                releaseHeight();
                return;
            }

            host.style.height = height + 'px';
            host.style.overflow = 'clip';
            host.classList.add('is-switching');
            host.inert = true;
            host.setAttribute('aria-busy', 'true');
            try {
                if (!samePanel) {
                    const fadeOut = displayed.animate([{ opacity }, { opacity: 0 }], {
                        duration: 110,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });
                    animations = [fadeOut];
                    await fadeOut.finished;
                    if (currentRevision !== revision) return;
                    show(next);
                    fadeOut.cancel();
                }

                host.style.height = 'auto';
                const nextHeight = host.getBoundingClientRect().height;
                host.style.height = height + 'px';
                const fadeIn = next.animate(
                    [{ opacity: samePanel ? opacity : 0 }, { opacity: 1 }],
                    { duration: 170, easing: 'ease-in', fill: 'both' }
                );
                const resize = host.animate(
                    [{ height: height + 'px' }, { height: nextHeight + 'px' }],
                    { duration: 170, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
                );
                animations = [fadeIn, resize];
                await Promise.all(animations.map((animation) => animation.finished));
                if (currentRevision !== revision) return;
                stopAnimations();
                releaseHeight();
            } catch {
                // A newer selection owns cleanup after cancelling this transition.
                if (currentRevision !== revision) return;
                stopAnimations();
                show(next);
                releaseHeight();
            }
        }
        buttons.forEach((button, index) => {
            button.addEventListener('click', () => select(button, false));
            button.addEventListener('keydown', (event) => {
                let next;
                if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
                if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = buttons.length - 1;
                if (next !== undefined) {
                    event.preventDefault();
                    select(buttons[next], true);
                }
            });
        });
    });

    // Independent galleries retain their selected example when the audience changes.
    // There is no autoplay: the reader controls how long a comparison stays visible.
    document.querySelectorAll('[data-gallery]').forEach((gallery) => {
        const slides = [...gallery.querySelectorAll('.comparison-slide')];
        const counter = gallery.querySelector('.gallery-position');
        let index = 0;
        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach((slide, number) => {
                slide.hidden = number !== index;
            });
            counter.textContent = index + 1 + ' / ' + slides.length;
        }
        gallery
            .querySelector('[data-gallery-previous]')
            .addEventListener('click', () => show(index - 1));
        gallery
            .querySelector('[data-gallery-next]')
            .addEventListener('click', () => show(index + 1));
        gallery.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                show(index + (event.key === 'ArrowRight' ? 1 : -1));
            }
        });
        let startX, startY;
        gallery.addEventListener(
            'touchstart',
            (event) => {
                startX = event.changedTouches[0].clientX;
                startY = event.changedTouches[0].clientY;
            },
            { passive: true }
        );
        gallery.addEventListener(
            'touchend',
            (event) => {
                const deltaX = event.changedTouches[0].clientX - startX;
                const deltaY = event.changedTouches[0].clientY - startY;
                if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5)
                    show(index + (deltaX < 0 ? 1 : -1));
            },
            { passive: true }
        );
    });

    const contentsToggle = document.querySelector('.doc-toc-toggle');
    contentsToggle?.addEventListener('click', () =>
        contentsToggle.setAttribute(
            'aria-expanded',
            String(contentsToggle.getAttribute('aria-expanded') !== 'true')
        )
    );
    document.querySelectorAll('a[href]').forEach((link) =>
        link.addEventListener('click', (event) => {
            const targetUrl = new URL(link.href, location.href);
            const currentPath = location.pathname.replace(/index\.html$/, '');
            if (
                targetUrl.origin !== location.origin ||
                targetUrl.pathname.replace(/index\.html$/, '') !== currentPath ||
                !targetUrl.hash
            )
                return;
            const target = document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)));
            if (!target) return;
            event.preventDefault();
            closeMenu();
            if (link.closest('.doc-toc')) contentsToggle?.setAttribute('aria-expanded', 'false');
            target.scrollIntoView({
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'instant'
                    : 'smooth'
            });
            history.replaceState(null, '', targetUrl.hash);
        })
    );

    // Restore the original purchase entry point in the header, hero and all tiers.
    const payment = document.getElementById('payment-modal');
    let purchaseTrigger;
    document.querySelectorAll('[data-open-payment]').forEach((button) => {
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', 'payment-modal');
        button.addEventListener('click', () => {
            purchaseTrigger = button;
            closeMenu();
            payment.showModal();
            payment.querySelector('#payment-title').focus({ preventScroll: true });
        });
    });
    payment?.querySelector('.modal-close').addEventListener('click', () => payment.close());
    payment?.addEventListener('click', (event) => {
        if (event.target === payment) payment.close();
    });
    payment?.addEventListener('close', () => purchaseTrigger?.focus({ preventScroll: true }));

    const galleryDialog = document.getElementById('image-dialog');
    const galleryImage = document.getElementById('dialog-image');
    const galleryCaption = document.getElementById('dialog-caption');
    const previous = galleryDialog?.querySelector('.dialog-previous');
    const next = galleryDialog?.querySelector('.dialog-next');
    let gallery = [],
        galleryIndex = 0,
        galleryTrigger;
    function showImage(index) {
        galleryIndex = (index + gallery.length) % gallery.length;
        const link = gallery[galleryIndex],
            image = link.querySelector('img');
        galleryImage.src = link.href;
        galleryImage.alt = image?.alt || '';
        const captionNode = link.closest('figure')?.querySelector('figcaption');
        const caption = captionNode?.children.length
            ? [...captionNode.children].map((x) => x.textContent.trim()).join(' · ')
            : captionNode?.textContent || image?.alt || '';
        galleryCaption.textContent =
            caption +
            (gallery.length > 1 ? ' · ' + (galleryIndex + 1) + ' / ' + gallery.length : '');
        previous.hidden = next.hidden = gallery.length < 2;
    }
    document.querySelectorAll('.screenshot-preview').forEach((link) =>
        link.addEventListener('click', (event) => {
            if (!galleryDialog) return;
            event.preventDefault();
            galleryTrigger = link;
            const group = link.closest('[data-gallery],.inspiration-grid');
            gallery = group ? [...group.querySelectorAll('.screenshot-preview')] : [link];
            showImage(gallery.indexOf(link));
            galleryDialog.showModal();
        })
    );
    galleryDialog
        ?.querySelector('.dialog-close')
        .addEventListener('click', () => galleryDialog.close());
    previous?.addEventListener('click', () => showImage(galleryIndex - 1));
    next?.addEventListener('click', () => showImage(galleryIndex + 1));
    galleryDialog?.addEventListener('keydown', (event) => {
        if (gallery.length < 2) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            showImage(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });
    galleryDialog?.addEventListener('click', (event) => {
        if (event.target === galleryDialog || event.target.classList.contains('dialog-figure'))
            galleryDialog.close();
    });
    galleryDialog?.addEventListener('close', () => galleryTrigger?.focus({ preventScroll: true }));

    const sections = [...document.querySelectorAll('.doc-toc a[href^="#"]')]
        .map((link) => ({ link, target: document.getElementById(link.hash.slice(1)) }))
        .filter((item) => item.target);
    let scheduled = false;
    function updateContents() {
        scheduled = false;
        const anchorOffset = sections.length
            ? parseFloat(getComputedStyle(sections[0].target).scrollMarginTop) || 0
            : 0;
        const boundary =
            Math.max(
                (document.querySelector('.main-header')?.getBoundingClientRect().bottom || 80) + 32,
                anchorOffset
            ) + 1;
        let active;
        sections.forEach((item) => {
            if (item.target.getBoundingClientRect().top <= boundary) active = item;
        });
        if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2)
            active = sections.at(-1);
        sections.forEach((item) => {
            if (item === active) item.link.setAttribute('aria-current', 'location');
            else item.link.removeAttribute('aria-current');
        });
    }
    if (sections.length) {
        updateContents();
        window.addEventListener(
            'scroll',
            () => {
                if (!scheduled) {
                    scheduled = true;
                    requestAnimationFrame(updateContents);
                }
            },
            { passive: true }
        );
        window.addEventListener('resize', updateContents);
    }
});
