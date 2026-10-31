import assert from 'node:assert/strict';
const origin = 'https://andrewr.online/arrangemasterpro/';
const publicOrigin = 'https://arrangemasterpro.andrewr.online/';
const checks = [];
for (const page of ['', 'documentation.html', 'trial/']) {
    const response = await fetch(origin + page, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `${origin + page} is not published yet: HTTP ${response.status}`);
    assert(response.url.startsWith(origin), 'GitHub origin must serve the page without redirecting back to the public subdomain');
    const html = await response.text();
    assert(html.includes('Arrange Master PRO'), `Unexpected page at ${response.url}`);
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    assert.equal(canonical, publicOrigin + page, 'Canonical must retain the public PRO hostname');
    for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) JSON.parse(script[1]);
    checks.push({ path: page || '/', status: response.status, canonical });
}
for (const file of ['robots.txt', 'sitemap.xml', 'llms.txt', 'css/base.css', 'css/pro.css', 'js/site.js', 'assets/hero-vinyl-wide-v1.webp']) {
    const response = await fetch(origin + file, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `Missing GitHub asset: ${file}`);
    if (['robots.txt', 'sitemap.xml', 'llms.txt'].includes(file)) {
        const text = await response.text();
        assert(text.includes(publicOrigin), `${file} must refer to the public hostname`);
    } else await response.body?.cancel();
    checks.push({ path: file, status: response.status });
}
const video = await fetch(origin + 'assets/arrange-master-pro-live.mp4', {
    headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(20000)
});
assert.equal(video.status, 206, 'GitHub video origin must support byte ranges');
assert.match(video.headers.get('content-range') || '', /^bytes 0-1023\/\d+$/);
await video.body?.cancel();
console.log(JSON.stringify({ readyForProxyDeployment: true, checks, videoRangeStatus: video.status }, null, 2));
