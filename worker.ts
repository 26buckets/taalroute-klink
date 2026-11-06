import app from 'vinext/server/fetch-handler';
import { GET as assetResponse } from './app/api/grammar-aa-assets/[name]/route.ts';
import delivery from './data/klink-practice-delivery.json' with { type: 'json' };
import { practiceBundleResponse } from './lib/practice-bundle-response.ts';

const worker = {
  ...app,
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;
    // Immutable public files do not need the app's rendering or tracing pipeline.
    const asset = /^\/api\/grammar-aa-assets\/([a-f0-9]{64}\.(?:json|mp3|webp))$/.exec(path);
    if (asset && (request.method === 'GET' || request.method === 'HEAD')) {
      return assetResponse(request, { params: Promise.resolve({ name: asset[1] }) });
    }
    if (Object.hasOwn(delivery, path)) return practiceBundleResponse(request, env.ASSETS);
    return app.fetch(request, env, ctx);
  },
};

export default worker;
