export default {
  fetch(request) {
    return new Response(new URL(request.url).pathname === '/__staging-ping' ? 'ok' : 'Temporary staging diagnostic', { headers: { 'Cache-Control': 'no-store', 'Server-Timing': 'ping;dur=0' } });
  },
};
