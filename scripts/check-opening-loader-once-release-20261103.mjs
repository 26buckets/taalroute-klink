import {verifyGrammarReady16Release,readBeforeGrammarReady16} from './check-grammar-ready16-release.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const base = 'c53e3cdb045f9e42df3ad7c85a99d9bf15dc0fb4';
const root = 'docs/opening-loader-once-20261103/';
const approval = 'docs/appearance-floor-20261031/approved-updates/opening-loader-once-20261103.json';
const floor = 'docs/appearance-floor-20261031/floor.json';
const component = 'components/product/klink-opening-loader.tsx';
const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = value => createHash('sha256').update(value).digest('hex');
const lines = value => value.toString().trim().split('\n').filter(Boolean);
const sort = values => values.sort((a, b) => a.localeCompare(b));
export function verifyOpeningLoaderOnceContent(read = readFileSync) {
  const successor=verifyGrammarReady16Release(read),currentRead=read;read=file=>readBeforeGrammarReady16(file,successor,currentRead);
  const json = file => JSON.parse(read(file));
  const r = json('docs/klink-owner-release-opening-loader-once-20261103.json');
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(r.publicationApproved, true);
  assert.equal(r.userRequest, 'Prima, zet alleen deze loaderaanpassing nu live. De overige snelheidswijzigingen mogen blijven wachten tot de stagingvertraging is opgelost.');
  assert.equal(r.baselineSourceCommit, base);
  assert.equal(r.liveSourceCommit, 'b0763872c76c319e02d4464b57b7afcb02d21ed3');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, base);
  git('merge-base', '--is-ancestor', base, 'HEAD');
  const changed = sort([...new Set(lines(git('diff', '--name-only', base, successor.baselineSourceCommit, '--', ...roots)))]);
  assert.deepEqual(changed, r.changedFiles);
  assert.deepEqual(sort(Object.keys(r.files)), changed);
  for (const [file, hash] of Object.entries({ ...r.files, ...r.evidenceFiles })) assert.equal(sha(read(file)), hash, file);
  assert.deepEqual(changed.filter(file => /^(app|components|hooks|data|lib|public|db|drizzle)\//.test(file)), [component]);
  const oldFloor = JSON.parse(git('show', `${base}:${floor}`));
  assert.deepEqual(json(floor), { ...oldFloor, approvedUpdates: [...oldFloor.approvedUpdates, approval] });
  assert.equal(json(approval).publicationApproved, true);
  assert.equal(json(approval).publicationRequest, r.userRequest);
  for (const item of json(root + 'preservation.json')) assert.equal(sha(read(item.path)), item.sha256, item.path);
  const b = json(root + 'local/checks.json');
  assert.equal(b.checks.length, 16); assert.deepEqual(b.errors, []);
  assert(b.checks.every(item => item.finalFrameIdentical && item.completionPreserved && item.remounts === 2));
  const v = json(root + 'verification.json');
  assert(v.types && v.lint && v.normalBuild && v.runtimeScopeOnlyLoader && v.excludedPerformancePR10);
  const capacity = json(root + 'asset-capacity.json');
  assert(capacity.count <= 20000 && capacity.withinExistingFreeAssetCount && capacity.largestBytes <= 25 * 1024 * 1024);
  const integration = json(root + 'integration/checks.json');
  assert.equal(integration.checks.length, 32); assert.deepEqual(integration.errors, []);
  assert(integration.checks.every(item => item.minimumDuration && item.routeAndStoragePreserved && item.opens));
  const navigation = json(root + 'navigation/checks.json');
  assert.equal(navigation.checks.length, 8); assert.deepEqual(navigation.errors, []);
  assert(navigation.checks.every(item => item.finalFrameKept && item.opens && item.storagePreserved && item.delayedModuleRequests > 0));
  return { ...r, successor };
}
export function verifyOpeningLoaderOnceRelease(read = readFileSync) {
  const r = verifyOpeningLoaderOnceContent(read);
  const backup = JSON.parse(read(root + 'gate-backup.json'));
  assert(backup.driveId && backup.fullReadback && backup.zipIntegrity);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return r;
}
export function readBeforeOpeningLoaderOnce(file, r, read = readFileSync) {
  return r.changedFiles.includes(file) ? git('show', `${base}:${file}`) : readBeforeGrammarReady16(file,r.successor,read);
}
