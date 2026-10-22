document.addEventListener('DOMContentLoaded', () => {
    // Hero video loads only after the visitor opens it.
    const videoDialog = document.getElementById('video-dialog');
    const videoTrigger = document.querySelector('.hero-video-trigger');
    const demoVideo = document.getElementById('demo-video');
    if (videoDialog && videoTrigger && demoVideo) {
        const playButton = videoDialog.querySelector('.player-toggle');
        const seek = videoDialog.querySelector('.player-seek');
        const time = videoDialog.querySelector('.player-time');
        const status = videoDialog.querySelector('.video-status');
        const player = videoDialog.querySelector('.video-player');
        const fullscreenButton = videoDialog.querySelector('.player-fullscreen');
        let dragging = false;
        let fullscreenWasActive = false;
        function isFullscreen() {
            return document.fullscreenElement === player;
        }
        function updateFullscreen() {
            const expanded = isFullscreen();
            const label = expanded ? 'Exit fullscreen' : 'Enter fullscreen';
            fullscreenButton.setAttribute('aria-label', label);
            fullscreenButton.title = label;
            fullscreenButton
                .querySelector('.player-expand-icon')
                .toggleAttribute('hidden', expanded);
            fullscreenButton
                .querySelector('.player-collapse-icon')
                .toggleAttribute('hidden', !expanded);
            if (fullscreenWasActive && !videoDialog.open && !expanded)
                videoTrigger.focus({ preventScroll: true });
            fullscreenWasActive = expanded;
        }
        fullscreenButton.addEventListener('click', () => {
            const operation = isFullscreen()
                ? document.exitFullscreen?.()
                : player.requestFullscreen?.();
            if (!operation) {
                showStatus('Fullscreen is unavailable in this browser.');
                return;
            }
            operation.catch(() => showStatus('Fullscreen is unavailable in this browser.'));
        });
        document.addEventListener('fullscreenchange', updateFullscreen);
        const formatTime = (value) => {
            const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
            return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
        };
        function updatePlayback() {
            const duration = demoVideo.duration;
            const ready = Number.isFinite(duration) && duration > 0;
            const playing = !demoVideo.paused && !demoVideo.ended;
            const label = playing ? 'Pause video' : 'Play video';
            playButton.setAttribute('aria-label', label);
            playButton.title = label;
            playButton.querySelector('.player-play-icon').toggleAttribute('hidden', playing);
            playButton.querySelector('.player-pause-icon').toggleAttribute('hidden', !playing);
            seek.disabled = !ready;
            if (!dragging)
                seek.value = ready ? Math.round((demoVideo.currentTime / duration) * 1000) : 0;
            seek.style.setProperty('--progress', `${Number(seek.value) / 10}%`);
            seek.setAttribute(
                'aria-valuetext',
                `${formatTime(demoVideo.currentTime)} of ${formatTime(duration)}`
            );
            time.textContent = `${formatTime(demoVideo.currentTime)} / ${formatTime(duration)}`;
        }
        function showStatus(message) {
            status.textContent = message;
            status.hidden = !message;
        }
        function playDemo() {
            if (demoVideo.ended) demoVideo.currentTime = 0;
            demoVideo
                .play()
                .then(() => {
                    if (!videoDialog.open) demoVideo.pause();
                })
                .catch((error) => {
                    if (!videoDialog.open || error.name === 'AbortError') return;
                    showStatus(
                        demoVideo.error
                            ? 'The live video is not available yet.'
                            : 'Press Play to start the video.'
                    );
                    updatePlayback();
                });
        }
        function togglePlayback() {
            if (demoVideo.paused || demoVideo.ended) playDemo();
            else demoVideo.pause();
        }
        videoTrigger.addEventListener('click', () => {
            if (videoDialog.open) return;
            demoVideo.muted = demoVideo.defaultMuted = true;
            demoVideo.volume = 0;
            showStatus('');
            videoDialog.showModal();
            if (!demoVideo.getAttribute('src')) demoVideo.src = videoTrigger.dataset.videoSrc;
            else if (demoVideo.error) demoVideo.load();
            else if (demoVideo.readyState > 0) demoVideo.currentTime = 0;
            document.querySelector('.hero-video-bg video')?.pause();
            updatePlayback();
            playDemo();
        });
        playButton.addEventListener('click', togglePlayback);
        demoVideo.addEventListener('click', togglePlayback);
        [
            'loadedmetadata',
            'durationchange',
            'timeupdate',
            'play',
            'pause',
            'ended',
            'emptied'
        ].forEach((event) => demoVideo.addEventListener(event, updatePlayback));
        demoVideo.addEventListener('playing', () => showStatus(''));
        demoVideo.addEventListener('error', () => {
            showStatus('The live video is not available yet.');
            updatePlayback();
        });
        seek.addEventListener('pointerdown', () => {
            dragging = true;
        });
        window.addEventListener('pointerup', () => {
            dragging = false;
            updatePlayback();
        });
        seek.addEventListener('input', () => {
            if (Number.isFinite(demoVideo.duration) && demoVideo.duration > 0) {
                demoVideo.currentTime = (Number(seek.value) / 1000) * demoVideo.duration;
                updatePlayback();
            }
        });
        seek.addEventListener('change', () => {
            dragging = false;
            updatePlayback();
        });
        videoDialog.addEventListener('keydown', (event) => {
            if (
                event.key === ' ' &&
                event.target !== seek &&
                event.target !== playButton &&
                event.target !== fullscreenButton &&
                event.target !== videoDialog.querySelector('.dialog-close')
            ) {
                event.preventDefault();
                togglePlayback();
            }
        });
        function closeVideo() {
            demoVideo.pause();
            if (isFullscreen()) document.exitFullscreen().catch(() => {});
            videoDialog.close();
        }
        videoDialog.querySelector('.dialog-close').addEventListener('click', closeVideo);
        videoDialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            if (isFullscreen()) document.exitFullscreen().catch(() => {});
            else closeVideo();
        });
        videoDialog.addEventListener('click', (event) => {
            if (
                event.target === videoDialog ||
                event.target.classList.contains('video-dialog-content')
            )
                closeVideo();
        });
        videoDialog.addEventListener('close', () => {
            demoVideo.pause();
            if (isFullscreen()) document.exitFullscreen().catch(() => {});
            dragging = false;
            videoTrigger.focus({ preventScroll: true });
            const backdropVideo = document.querySelector('.hero-video-bg video');
            if (
                backdropVideo &&
                !document.hidden &&
                !matchMedia('(prefers-reduced-motion: reduce)').matches &&
                backdropVideo.getBoundingClientRect().bottom > 0
            )
                backdropVideo.play().catch(() => {});
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && videoDialog.open) demoVideo.pause();
        });
        updatePlayback();
        updateFullscreen();
    }
});
