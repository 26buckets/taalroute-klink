import {verifyDocentLessonsRelease,readBeforeDocentLessons} from './check-docent-lessons-release-20261031.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
export function verifyReviewEmptyRelease(read = readFileSync) {
 const successor=verifyDocentLessonsRelease(read),currentRead=read;read=file=>readBeforeDocentLessons(file,successor,currentRead);
 const r = JSON.parse(read('docs/klink-owner-release-review-empty-20261031.json'));
 assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true);
 assert.equal(r.baselineSourceCommit, 'ca209e707201e617196983352f3d7541c1be7b2c');
 assert.equal(r.liveSourceCommit, 'fb4d4cb94b9158c3406a735db91b41d8165980a2');
 git('merge-base', '--is-ancestor', r.liveSourceCommit, r.baselineSourceCommit);
 git('merge-base', '--is-ancestor', r.baselineSourceCommit, 'HEAD');
 const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'next.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
 const changed = lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', ...roots));
 const expected = ['components/product/learner-app.tsx', 'scripts/test-review-saved-words-browser.mjs', 'scripts/check-review-empty-release-20261031.mjs', 'scripts/check-automatic-images-release-20261031.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed, expected); assert.deepEqual(r.changedFiles, expected);
 for (const f of expected) assert.equal(sha(read(f)), r.files[f], f);
 const component = 'components/product/learner-app.tsx', before = git('show', r.baselineSourceCommit + ':' + component).toString();
 const after = before.replace('{items.length === 0 ? (pack.words.length >= 2 || hasScheduled ? null : <section className="honest-empty">', '{items.length === 0 ? <section className="honest-empty">').replace('Kies woorden<ArrowRight /></button></section>) : <section className="review-word-list">', 'Kies woorden<ArrowRight /></button></section> : <section className="review-word-list">');
 assert.notEqual(before, after); assert.equal(read(component).toString(), after);
 assert.equal(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', 'public', 'data', 'lib', 'hooks', 'app').length, 0, 'Content, media, storage and keyboard logic remain unchanged');
 const review = JSON.parse(read('docs/review-empty-20261031/review.json'));
 for (const key of ['emptyStates', 'saveLifecycle', 'scheduledReview', 'progress', 'audio', 'mobile', 'types', 'lint', 'build', 'localOnly']) assert.equal(review[key], true, key);
 const backup = JSON.parse(read('docs/review-empty-20261031/backup.json'));
 assert(backup.verified && backup.driveId && backup.sha256);
 for (const f of expected) assert.equal(backup.files[f], r.files[f], f);
 return {...r,successor};
}
export function readBeforeReviewEmpty(file, r, read = readFileSync) {
 return r.changedFiles.includes(file) ? git('show', r.baselineSourceCommit + ':' + file) : readBeforeDocentLessons(file,r.successor,read);
}
