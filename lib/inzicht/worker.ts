import app from 'vinext/server/fetch-handler';
import { processPending, type InzichtEnv } from './service';
// This entry point is exclusively for the separately authorized synthetic staging.
const worker = {
  async fetch(
    request: Request,
    env: InzichtEnv & { ASSETS: Fetcher },
    ctx: ExecutionContext,
  ) {
    const url = new URL(request.url);
    if (
      env.INZICHT_MODE !== 'synthetic-online' ||
      url.origin !== env.INZICHT_ORIGIN
    )
      return new Response('Niet beschikbaar.', { status: 404 });
    if (url.pathname === '/')
      return Response.redirect(`${url.origin}/inzicht`, 302);
    const application =
      url.pathname === '/inzicht' ||
      url.pathname.startsWith('/inzicht/') ||
      url.pathname.startsWith('/api/inzicht/');
    const response = application
      ? await app.fetch(request, env, ctx)
      : await env.ASSETS.fetch(request);
    const secured = new Response(response.body, response);
    secured.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    secured.headers.set('Referrer-Policy', 'no-referrer');
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    if (url.pathname.startsWith('/inzicht'))
      secured.headers.set('Cache-Control', 'no-store, private');
    return secured;
  },
  async scheduled(_event: ScheduledEvent, env: InzichtEnv) {
    if (env.INZICHT_MODE !== 'synthetic-online' || !env.INZICHT_DB)
      throw new Error('Invalid staging configuration');
    const result = await processPending(env.INZICHT_DB);
    if (result.failed_groups) throw new Error('inzicht.processing_degraded');
  },
};

export default worker;
