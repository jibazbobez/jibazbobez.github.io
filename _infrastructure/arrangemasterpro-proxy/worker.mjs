// Website hosting only. Licensing, activation and engine endpoints are not changed.
export const PUBLIC_ORIGIN = 'https://arrangemasterpro.andrewr.online';
export const UPSTREAM_ORIGIN = 'https://andrewr.online';
export const UPSTREAM_PREFIX = '/arrangemasterpro';

export function toUpstreamUrl(publicUrl) {
    const url = new URL(publicUrl);
    let decoded;
    try { decoded = decodeURIComponent(url.pathname); } catch { return null; }
    if (decoded.includes('\\') || decoded.split('/').includes('..')) return null;
    const upstream = new URL(UPSTREAM_ORIGIN);
    upstream.pathname = UPSTREAM_PREFIX + url.pathname;
    upstream.search = url.search;
    if (!upstream.pathname.startsWith(UPSTREAM_PREFIX + '/')) return null;
    return upstream;
}

export function publicLocation(location, upstreamUrl) {
    const target = new URL(location, upstreamUrl);
    if (target.origin !== UPSTREAM_ORIGIN) return target.href;
    if (target.pathname !== UPSTREAM_PREFIX && !target.pathname.startsWith(UPSTREAM_PREFIX + '/')) return target.href;
    const publicUrl = new URL(PUBLIC_ORIGIN);
    publicUrl.pathname = target.pathname.slice(UPSTREAM_PREFIX.length) || '/';
    publicUrl.search = target.search;
    publicUrl.hash = target.hash;
    return publicUrl.href;
}

export async function proxyRequest(request, upstreamFetch = globalThis.fetch) {
    const url = new URL(request.url);
    if (url.hostname !== new URL(PUBLIC_ORIGIN).hostname) return new Response('Not found', { status: 404 });
    if (url.protocol !== 'https:') {
        url.protocol = 'https:';
        return Response.redirect(url.href, 308);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    // One canonical URL per page; the GitHub directory layout stays invisible.
    if (url.pathname.endsWith('/index.html')) {
        url.pathname = url.pathname.slice(0, -10);
        return Response.redirect(url.href, 308);
    }
    const upstreamUrl = toUpstreamUrl(url);
    if (!upstreamUrl) return new Response('Invalid path', { status: 400 });
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('host');
    requestHeaders.delete('cookie');
    requestHeaders.delete('authorization');
    try {
        // Forward Range and conditional request headers; stream videos without buffering.
        const upstream = await upstreamFetch(new Request(upstreamUrl, {
            method: request.method,
            headers: requestHeaders,
            redirect: 'manual'
        }));
        const headers = new Headers(upstream.headers);
        headers.delete('set-cookie');
        const location = headers.get('location');
        if (location) headers.set('location', publicLocation(location, upstreamUrl));
        const html = (headers.get('content-type') || '').includes('text/html');
        if (html && upstream.status === 200) {
            headers.append('link', `<${PUBLIC_ORIGIN + url.pathname}>; rel="canonical"`);
        }
        if (html || ['/robots.txt', '/sitemap.xml', '/llms.txt'].includes(url.pathname)) {
            headers.set('cache-control', 'public, max-age=0, must-revalidate');
        }
        return new Response(request.method === 'HEAD' ? null : upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers
        });
    } catch {
        return new Response('The website origin is temporarily unavailable.', {
            status: 502,
            headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
        });
    }
}

export default {
    fetch(request) { return proxyRequest(request); }
};
