import assert from 'node:assert/strict';
import * as attempts from '../app/api/attempts/route.ts';
import * as reviewItems from '../app/api/review-items/route.ts';

for (const [path, handlers] of Object.entries({ attempts, 'review-items': reviewItems })) {
  for (const method of ['GET', 'POST']) {
    const request = new Request(`https://klink.taalroute.nl/api/${path}`, {
      method,
      ...(method === 'POST' ? { body: JSON.stringify({ word: 'PRIVATE_SENTINEL', answer: 'PRIVATE_SENTINEL' }) } : {}),
    });
    const response = await handlers[method](request);
    assert.equal(response.status, 410);
    const body = await response.json();
    assert.deepEqual(Object.keys(body), ['error']);
    assert.equal(typeof body.error, 'string');
    assert(!JSON.stringify(body).includes('PRIVATE_SENTINEL'));
    assert(!JSON.stringify(body).includes('fatima'));
    console.log(`PASS ${method} /api/${path}: retired without storage access`);
  }
  const malformed = new Request(`https://klink.taalroute.nl/api/${path}`, { method: 'POST', body: '{invalid' });
  assert.equal(handlers.POST(malformed).status, 410);
}
