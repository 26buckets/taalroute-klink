export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/__staging-ping') return new Response('ok', { headers: { 'Cache-Control': 'no-store', 'Server-Timing': 'ping;dur=0' } });
    const start = performance.now();
    const { default: app } = await import('./index.js');
    const loaded = performance.now();
    const response = await app.fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    headers.set('Server-Timing', `appImport;dur=${(loaded - start).toFixed(2)}, appHandler;dur=${(performance.now() - loaded).toFixed(2)}`);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
