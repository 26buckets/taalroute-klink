import assert from 'node:assert/strict';import{readFileSync as read}from'node:fs';import{verifyCollectionGridRelease}from'./check-collection-grid-release-20261031.mjs';
verifyCollectionGridRelease();
for(const[file,key,value]of[['docs/klink-owner-release-collection-grid-20261031.json','appearanceChangeApproved',false],['docs/klink-owner-release-collection-grid-20261031.json','liveSourceCommit','HEAD'],['docs/collection-grid-20261031/review.json','progress',false],['docs/collection-grid-20261031/backup.json','verified',false]])assert.throws(()=>verifyCollectionGridRelease(p=>p===file?Buffer.from(JSON.stringify({...JSON.parse(read(p)),[key]:value})):read(p)),key);
assert.throws(()=>verifyCollectionGridRelease(p=>p==='app/learner-ui.css'?Buffer.concat([read(p),Buffer.from('\nbody{display:none}')]):read(p)));
console.log('5 rejected mutations: appearance approval, live base, progress evidence, backup and extra CSS');
