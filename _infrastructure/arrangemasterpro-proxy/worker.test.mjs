import test from 'node:test';
import assert from 'node:assert/strict';
import { proxyRequest, toUpstreamUrl, publicLocation, PUBLIC_ORIGIN } from './worker.mjs';

test('maps public pages and query strings into the GitHub directory', async () => {
    let sent;
    const response = await proxyRequest(new Request(PUBLIC_ORIGIN + '/trial/?utm_source=email', {
        headers: { cookie: 'private=value', authorization: 'private', accept: 'text/html' }
    }), async request => {
        sent = request;
        return new Response('<html>PRO</html>', { headers: { 'content-type': 'text/html', 'set-cookie': 'origin=value' } });
    });
    assert.equal(sent.url, 'https://andrewr.online/arrangemasterpro/trial/?utm_source=email');
    assert.equal(sent.headers.get('cookie'), null);
    assert.equal(sent.headers.get('authorization'), null);
    assert.equal(sent.headers.get('accept'), 'text/html');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<html>PRO</html>');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('link'), `<${PUBLIC_ORIGIN}/trial/>; rel="canonical"`);
    assert.match(response.headers.get('cache-control'), /must-revalidate/);
});

test('forwards video ranges and streams an actual 206 response', async () => {
    const bytes = new Uint8Array([8, 9, 10, 11]);
    const response = await proxyRequest(new Request(PUBLIC_ORIGIN + '/assets/demo.mp4', {
        headers: { Range: 'bytes=8-11', 'If-Range': '"video-v1"' }
    }), async request => {
        assert.equal(request.url, 'https://andrewr.online/arrangemasterpro/assets/demo.mp4');
        assert.equal(request.headers.get('range'), 'bytes=8-11');
        assert.equal(request.headers.get('if-range'), '"video-v1"');
        return new Response(bytes, { status: 206, headers: {
            'content-type': 'video/mp4', 'content-range': 'bytes 8-11/100',
            'content-length': '4', 'accept-ranges': 'bytes', etag: '"video-v1"'
        } });
    });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), 'bytes 8-11/100');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test('rewrites directory redirects to the public hostname', async () => {
    const response = await proxyRequest(new Request(PUBLIC_ORIGIN + '/trial'), async () => new Response(null, {
        status: 301, headers: { location: '/arrangemasterpro/trial/?from=demo#form' }
    }));
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), PUBLIC_ORIGIN + '/trial/?from=demo#form');
    assert.equal(publicLocation('https://app.lava.top/products/example', 'https://andrewr.online/arrangemasterpro/'), 'https://app.lava.top/products/example');
    assert.equal(publicLocation('https://andrewr.online/privacy.html', 'https://andrewr.online/arrangemasterpro/'), 'https://andrewr.online/privacy.html');
});

test('keeps HEAD, 404 and conditional 304 semantics', async () => {
    const head = await proxyRequest(new Request(PUBLIC_ORIGIN + '/assets/logo.svg', { method: 'HEAD' }), async request => {
        assert.equal(request.method, 'HEAD');
        return new Response(null, { headers: { 'content-length': '123' } });
    });
    assert.equal(await head.text(), '');
    assert.equal(head.headers.get('content-length'), '123');
    const missing = await proxyRequest(new Request(PUBLIC_ORIGIN + '/missing'), async () => new Response('Missing', { status: 404 }));
    assert.equal(missing.status, 404);
    const cached = await proxyRequest(new Request(PUBLIC_ORIGIN + '/css/pro.css', { headers: { 'if-none-match': '"v2"' } }), async request => {
        assert.equal(request.headers.get('if-none-match'), '"v2"');
        return new Response(null, { status: 304, headers: { etag: '"v2"' } });
    });
    assert.equal(cached.status, 304);
});

test('serves robots, sitemap and llms from the same GitHub directory', async () => {
    for (const file of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
        const response = await proxyRequest(new Request(PUBLIC_ORIGIN + '/' + file), async request => {
            assert.equal(request.url, 'https://andrewr.online/arrangemasterpro/' + file);
            return new Response(PUBLIC_ORIGIN);
        });
        assert.equal(await response.text(), PUBLIC_ORIGIN);
        assert.match(response.headers.get('cache-control'), /must-revalidate/);
    }
});

test('normalizes public URLs and rejects unintended methods/paths', async () => {
    const noFetch = async () => { throw Error('Must not fetch'); };
    const https = await proxyRequest(new Request('http://arrangemasterpro.andrewr.online/trial/?a=1'), noFetch);
    assert.equal(https.status, 308);
    assert.equal(https.headers.get('location'), PUBLIC_ORIGIN + '/trial/?a=1');
    const index = await proxyRequest(new Request(PUBLIC_ORIGIN + '/trial/index.html?a=1'), noFetch);
    assert.equal(index.headers.get('location'), PUBLIC_ORIGIN + '/trial/?a=1');
    const post = await proxyRequest(new Request(PUBLIC_ORIGIN + '/trial/', { method: 'POST' }), noFetch);
    assert.equal(post.status, 405);
    const foreign = await proxyRequest(new Request('https://example.com/'), noFetch);
    assert.equal(foreign.status, 404);
    assert.equal(toUpstreamUrl(PUBLIC_ORIGIN + '/assets/%2f..%2fsecret'), null);
    assert.equal(toUpstreamUrl(PUBLIC_ORIGIN + '/bad%zz'), null);
});

test('origin failures remain errors and are not cached as successful pages', async () => {
    const response = await proxyRequest(new Request(PUBLIC_ORIGIN + '/'), async () => { throw Error('upstream down'); });
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('cache-control'), 'no-store');
});
