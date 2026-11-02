import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyWritingInk,hasWritingInk,updateWritingInk,validateWritingInk} from '../lib/writing-ink.ts';
const first=[[[100,100],[120,200],[140,100]]],last=[[[200,100],[220,180]]];
test('Real ink requires a line; empty or isolated taps do not complete handwriting',()=>{
 assert(!hasWritingInk([]));assert(!hasWritingInk([[[20,20]]]));assert(!hasWritingInk([[[20,20],[21,21]]]));assert(hasWritingInk(first));
});
test('Draft, immutable first attempt and latest correction remain separate',()=>{
 const start=emptyWritingInk(),draft=updateWritingInk(start,first);assert.equal(start.draft.length,0);assert.equal(draft.first,undefined);
 const submitted=updateWritingInk(draft,first,true);assert.deepEqual(submitted.first,first);assert.equal(submitted.firstUsedModel,false);
 const corrected=updateWritingInk({...submitted,modelSeen:true},last,true);assert.deepEqual(corrected.first,first);assert.deepEqual(corrected.last,last);assert.equal(corrected.firstUsedModel,false);
 const cleared=updateWritingInk(corrected,[]);assert.deepEqual(cleared.draft,[]);assert.deepEqual(cleared.first,first);assert.deepEqual(cleared.last,last);
});
test('Early model use is retained separately from participation and later correction',()=>{
 const submitted=updateWritingInk({...emptyWritingInk(),modelSeen:true},first,true);assert.equal(submitted.firstUsedModel,true);
 assert.equal(updateWritingInk(submitted,last,true).firstUsedModel,true);assert(!('correct' in submitted));assert(!('recognizedText' in submitted));
});
test('Malformed or oversized persisted records fail without replacing original data',()=>{
 const bad=[null,{}, {version:2,draft:[]},{version:1,draft:[[]]},{version:1,draft:[[[Infinity,0]]]},{version:1,draft:[[[1001,0]]]},{version:1,draft:[[[0,451]]]},{version:1,draft:Array(1001).fill([[1,1]])},{version:1,draft:[Array(100001).fill([1,1])]},{version:1,draft:[],first},{version:1,draft:[],firstUsedModel:false},{version:1,draft:[],first,last}];
 for(const value of bad)assert.throws(()=>validateWritingInk(value));
 const original={version:1,draft:first},snapshot=JSON.stringify(original);assert.equal(validateWritingInk(original),original);assert.equal(JSON.stringify(original),snapshot);
});
