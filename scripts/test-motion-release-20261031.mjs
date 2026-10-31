import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyMotionRelease} from './check-motion-release-20261031.mjs';
verifyMotionRelease();
for(const [file,key,value]of [
 ['docs/klink-owner-release-motion-20261031.json','appearanceChangeApproved',false],
 ['docs/klink-owner-release-motion-20261031.json','publicationApproved',false],
 ['docs/klink-owner-release-motion-20261031.json','liveSourceCommit','old-source'],
 ['docs/motion-20261031/review.json','audioPreserved',false],
 ['docs/motion-20261031/review.json','progressPreserved',false],
 ['docs/motion-20261031/review.json','reducedMotion',false],
 ['docs/motion-20261031/backup.json','fullReadback',false],
])assert.throws(()=>verifyMotionRelease(path=>path===file?JSON.stringify({...JSON.parse(readFileSync(path)),[key]:value}):readFileSync(path)));
for(const file of ['app/motion.css','lib/media-player.ts'])assert.throws(()=>verifyMotionRelease(path=>path===file?readFileSync(path).toString()+'\n/* Unapproved change */':readFileSync(path)));
console.log('PASS approved scope; nine rejected changes: consent, live base, audio/progress/reduced motion, backup and runtime changes');
