// Public settings only; no licensing or email service secrets belong here.
const TRIAL_INI = Object.freeze({
    endpoint: 'https://arrange-master-licensing-v160.jibazbobez.workers.dev/trial',
    siteKey: '0x4AAAAAAFXECqYswy8OBHYn',
    registrationEnabled: true,
    requestTimeoutMs: 15000
});
const form = document.getElementById('trial-form'),
    fields = document.getElementById('trial-fields'),
    button = document.getElementById('trial-submit'),
    message = document.getElementById('trial-message');
let inFlight = false,
    accepted = false,
    token = '',
    widgetId;

// No widget or requests run while the release is closed.
window.addEventListener('load', function () {
    if (!TRIAL_INI.registrationEnabled) return;
    if (!window.turnstile) {
        message.textContent = 'Verification could not load. Please reload this page.';
        return;
    }
    fields.disabled = false;
    fields.hidden = false;
    button.textContent = 'Request trial key';
    message.textContent = 'Complete the verification to continue.';
    widgetId = window.turnstile.render('#turnstile-container', {
        sitekey: TRIAL_INI.siteKey,
        action: 'am160-trial',
        theme: 'dark',
        size: 'flexible',
        callback: function (value) {
            token = typeof value === 'string' ? value : '';
            button.disabled = !token || inFlight || accepted;
        },
        'expired-callback': function () {
            token = '';
            button.disabled = true;
        },
        'error-callback': function () {
            token = '';
            button.disabled = true;
            if (!inFlight && !accepted)
                message.textContent = 'Verification failed. Please reload this page.';
        }
    });
});

form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!TRIAL_INI.registrationEnabled || inFlight || accepted) return;
    if (!form.reportValidity()) return;
    if (!token) {
        message.textContent = 'Complete the verification to continue.';
        return;
    }
    const data = new FormData(form),
        controller = new AbortController();
    inFlight = true;
    button.disabled = true;
    button.textContent = 'Submitting…';
    message.textContent = 'Sending your request…';
    const timer = setTimeout(function () {
        controller.abort();
    }, TRIAL_INI.requestTimeoutMs);
    try {
        const response = await fetch(TRIAL_INI.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            redirect: 'error',
            referrerPolicy: 'no-referrer',
            cache: 'no-store',
            signal: controller.signal,
            body: JSON.stringify({
                consent: true,
                name: String(data.get('name') || '').trim(),
                company: String(data.get('company') || '').trim(),
                email: String(data.get('email') || '').trim(),
                turnstileToken: token
            })
        });
        if (!response.ok) {
            // Show only known public errors, never arbitrary server payloads.
            let errorCode = '';
            try {
                const failure = await response.json();
                errorCode = failure && failure.error;
            } catch (error) {
                // Keep the generic message for unavailable or malformed responses.
            }
            message.textContent =
                errorCode === 'INVALID_EMAIL'
                    ? 'Enter a valid email address.'
                    : errorCode === 'INVALID_FORM'
                      ? 'Check the required fields and complete verification again.'
                      : response.status === 503
                        ? 'Trial registration is temporarily unavailable. Please try again later.'
                        : response.status === 429
                          ? 'Too many requests. Please wait before trying again.'
                          : 'Could not submit the request. Verify your details and try again.';
            return;
        }
        const result = await response.json();
        if (!result || result.accepted !== true) throw Error('Invalid response');
        accepted = true;
        fields.disabled = true;
        message.textContent =
            'Request received. If eligible, your trial key will arrive by email. Check your spam folder too.';
    } catch (error) {
        // Never show provider payloads or private data in an error.
        message.textContent = 'The request could not be confirmed. Please try again later.';
    } finally {
        clearTimeout(timer);
        inFlight = false;
        token = '';
        button.disabled = true;
        button.textContent = accepted ? 'Request received' : 'Request trial key';
        if (!accepted && window.turnstile && widgetId !== undefined)
            window.turnstile.reset(widgetId);
    }
});
