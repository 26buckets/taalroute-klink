import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
const harness = {
  env: { INZICHT_MODE: 'synthetic-online', INZICHT_DB: {} },
  hasSession: false,
  cookieReads: 0,
};
globalThis.__inzichtPageTest = harness;
try {
  const compiled = await build({
    stdin: {
      contents: readFileSync('app/inzicht/[[...path]]/page.tsx', 'utf8'),
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    jsx: 'automatic',
    alias: { '@': process.cwd() },
    plugins: [
      {
        name: 'request-context',
        setup(b) {
          b.onResolve(
            {
              filter:
                /^(cloudflare:workers|next\/headers|next\/navigation|@\/components\/inzicht\/app)$/,
            },
            (args) => ({ path: args.path, namespace: 'request-context' }),
          );
          b.onLoad(
            { filter: /.*/, namespace: 'request-context' },
            ({ path }) => ({
              contents: {
                'cloudflare:workers':
                  'export const env=globalThis.__inzichtPageTest.env;',
                'next/headers':
                  'export async function cookies(){globalThis.__inzichtPageTest.cookieReads++;return {has:name=>name==="__Host-inzicht_session" && globalThis.__inzichtPageTest.hasSession}}',
                'next/navigation':
                  'export function notFound(){throw new Error("not-found")}',
                '@/components/inzicht/app':
                  'export function InzichtApp(){return null}',
              }[path],
            }),
          );
        },
      },
    ],
  });
  const { default: Page } = await import(
    `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
  );
  assert.equal((await Page()).props.children.props.initialAnonymous, true);
  harness.hasSession = true;
  assert.equal((await Page()).props.children.props.initialAnonymous, false);
  harness.env.INZICHT_MODE = 'production';
  await assert.rejects(Page, /not-found/);
  harness.env.INZICHT_MODE = 'synthetic-local';
  const reads = harness.cookieReads;
  assert.equal((await Page()).props.children.props.initialAnonymous, false);
  assert.equal(harness.cookieReads, reads);
  console.log(
    'PASS anonymous, existing-cookie, disabled and local server-page boundaries',
  );
} finally {
  delete globalThis.__inzichtPageTest;
}
