import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { api } from '../../components/inzicht/client.ts';
import { checkStaging } from './deploy-staging.mjs';

test('reads have a deadline; writes retain their idempotency key without cancellation', async () => {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return Response.json({ ok: true });
  };
  try {
    await api('me', 'school-a');
    await api('observations', 'school-a', { outcome: 'yes' }, 'same-write');
    assert(requests[0].init.signal instanceof AbortSignal);
    assert.equal(requests[0].init.cache, 'no-store');
    assert.equal(requests[1].init.signal, undefined);
    assert.equal(requests[1].init.headers['Idempotency-Key'], 'same-write');
    assert.equal(requests[1].init.method, 'POST');
  } finally {
    globalThis.fetch = original;
  }
});
test('read timeout is actionable, while expired sessions remain distinguishable', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new DOMException('deadline', 'TimeoutError');
    };
    await assert.rejects(() => api('me', ''), /Ophalen duurt te lang/);
    globalThis.fetch = async () =>
      Response.json({ error: 'Meld je aan.' }, { status: 401 });
    await assert.rejects(
      () => api('me', ''),
      (e) => e.status === 401 && e.message === 'Meld je aan.',
    );
  } finally {
    globalThis.fetch = original;
  }
});

test('WebKit generic abort after our deadline still gives the same recovery message', async () => {
  const original = globalThis.fetch,
    timeout = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');
  try {
    AbortSignal.timeout = () => AbortSignal.abort();
    globalThis.fetch = async () => {
      throw new DOMException('Fetch is aborted', 'AbortError');
    };
    await assert.rejects(() => api('me', ''), /Ophalen duurt te lang/);
  } finally {
    globalThis.fetch = original;
    Object.defineProperty(AbortSignal, 'timeout', timeout);
  }
});

const compiled = await build({
  stdin: {
    contents: readFileSync('lib/inzicht/worker.ts', 'utf8'),
    resolveDir: `${process.cwd()}/lib/inzicht`,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  plugins: [
    {
      name: 'page-renderer-only',
      setup(b) {
        b.onResolve({ filter: /^vinext\/server\/fetch-handler$/ }, () => ({
          path: 'renderer',
          namespace: 'test',
        }));
        b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({
          contents:
            "export default {fetch: async () => new Response('rendered page', {headers:{'X-Test-Renderer':'yes'}})}",
        }));
      },
    },
  ],
});
const { default: worker } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const origin = 'https://klink-inzicht-pr8-staging.nico-554.workers.dev';
const env = {
  INZICHT_MODE: 'synthetic-online',
  INZICHT_ORIGIN: origin,
  INZICHT_DB: {},
  ASSETS: { fetch: async () => new Response('asset') },
};
test('the optional test domain keeps exact host, CSRF and no-store boundaries', async () => {
  const second = 'https://inzicht-staging.taalroute.nl';
  const dual = { ...env, INZICHT_STAGING_ORIGIN: second };
  assert.equal(
    (await worker.fetch(new Request(second + '/api/inzicht/me'), env, {}))
      .status,
    404,
  );
  for (const host of [origin, second]) {
    const r = await worker.fetch(
      new Request(host + '/api/inzicht/me'),
      dual,
      {},
    );
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(
      await (
        await worker.fetch(new Request(host + '/inzicht'), dual, {})
      ).text(),
      'rendered page',
    );
    for (const from of [origin, second, 'https://inzicht.taalroute.nl']) {
      const write = await worker.fetch(
        new Request(host + '/api/inzicht/observations', {
          method: 'POST',
          headers: { origin: from, 'content-type': 'application/json' },
          body: '{}',
        }),
        dual,
        {},
      );
      assert.equal(write.status, from === host ? 401 : 403);
    }
  }
  for (const host of [
    'https://inzicht.taalroute.nl',
    'https://klink.taalroute.nl',
    'https://inzicht-staging.taalroute.nl.evil.invalid',
  ]) {
    assert.equal(
      (await worker.fetch(new Request(host + '/api/inzicht/me'), dual, {}))
        .status,
      404,
    );
  }
});
test('the deploy guard admits only the separate staging domain and existing EU database', () => {
  const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
  config.assets = {
    binding: 'ASSETS',
    run_worker_first: ['/', '/inzicht', '/inzicht/*', '/api/*'],
  };
  checkStaging(config);
  for (const change of [
    (c) => {
      c.vars.INZICHT_STAGING_ORIGIN = 'https://inzicht.taalroute.nl';
    },
    (c) => {
      c.routes[0].pattern = 'klink.taalroute.nl';
    },
    (c) => {
      c.routes.push({ pattern: '*.taalroute.nl/*' });
    },
    (c) => {
      c.d1_databases[0].database_id = 'production';
    },
  ]) {
    const c = structuredClone(config);
    change(c);
    assert.throws(() => checkStaging(c));
  }
});
test('staging API calls the real security handler without the page renderer', async () => {
  const r = await worker.fetch(
    new Request(`${origin}/api/inzicht/me`),
    env,
    {},
  );
  assert.equal(r.status, 401);
  assert.equal(r.headers.get('X-Test-Renderer'), null);
  assert.equal(r.headers.get('Cache-Control'), 'no-store, private');
  assert.match(r.headers.get('Server-Timing'), /^inzicht;dur=\d/);
  assert.match(
    r.headers.get('Content-Security-Policy'),
    /frame-ancestors 'none'/,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request(`${origin}/api/inzicht/me`, { method: 'DELETE' }),
        env,
        {},
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request(`${origin}/api/inzicht/login`, {
          method: 'POST',
          headers: {
            origin: 'https://invalid.example',
            'content-type': 'application/json',
          },
          body: '{}',
        }),
        env,
        {},
      )
    ).status,
    403,
  );
});
test('page renderer and assets stay separate, with exact staging origin/mode guards', async () => {
  const page = await worker.fetch(new Request(`${origin}/inzicht`), env, {});
  assert.equal(await page.text(), 'rendered page');
  assert.equal(page.headers.get('Cache-Control'), 'no-store, private');
  assert.equal(
    await (
      await worker.fetch(new Request(`${origin}/favicon.svg`), env, {})
    ).text(),
    'asset',
  );
  assert.equal(
    (
      await worker.fetch(
        new Request('https://inzicht.taalroute.nl/api/inzicht/me'),
        env,
        {},
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request(`${origin}/api/inzicht/me`),
        { ...env, INZICHT_MODE: 'production' },
        {},
      )
    ).status,
    404,
  );
});
