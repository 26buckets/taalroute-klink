import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTeacherWithRecovery} from '../components/product/teacher-module-recovery.ts';

const key='klink.docent.module-recovery.v1';
const missing=()=>new TypeError('Failed to fetch dynamically imported module: /old-teacher.js');
function browser({online=true,blocked=false}={}) {
 const saved=new Map([['klink.docent.les.v1','chosen lesson'],['klink.taalroute.route.v1','existing progress']]);
 let reloads=0;
 globalThis.window={sessionStorage:{getItem:k=>{if(blocked)throw Error('blocked');return saved.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');saved.set(k,v);},removeItem:k=>{if(blocked)throw Error('blocked');saved.delete(k);}},location:{hash:'#teacher/plus',reload:()=>{reloads++;}}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:online}});
 return {saved,reloads:()=>reloads};
}
async function pending(promise) {
 let settled=false;promise.then(()=>{settled=true;},()=>{settled=true;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);
}
void test('successful import returns the original module and resets only the recovery marker',async()=>{
 const b=browser();b.saved.set(key,'1');const loaded={TeacherClassroom:'original'};
 assert.equal(await loadTeacherWithRecovery(async()=>loaded),loaded);
 assert.equal(b.reloads(),0);assert.equal(b.saved.has(key),false);assert.equal(b.saved.size,2);
});
void test('missing old module reloads once, preserves the route and stored lesson/progress, and avoids an error flash',async()=>{
 const b=browser();const original=[...b.saved];
 await pending(loadTeacherWithRecovery(async()=>{throw missing();}));
 assert.equal(b.reloads(),1);assert.equal(window.location.hash,'#teacher/plus');
 for(const[k,v]of original)assert.equal(b.saved.get(k),v);
 await assert.rejects(loadTeacherWithRecovery(async()=>{throw missing();}),/Failed to fetch/);
 assert.equal(b.reloads(),1);
 await loadTeacherWithRecovery(async()=>({}));
 await pending(loadTeacherWithRecovery(async()=>{throw missing();}));assert.equal(b.reloads(),2);
});
for(const message of ['error loading dynamically imported module: /old.js','Importing a module script failed.','Unable to preload CSS for /old.css','Loading chunk teacher-12 failed.'])void test('recognises browser load failure: '+message,async()=>{
 const b=browser();await pending(loadTeacherWithRecovery(async()=>{throw new TypeError(message);}));assert.equal(b.reloads(),1);
});
for(const options of [{online:false},{blocked:true}])void test('does not reload with '+JSON.stringify(options),async()=>{
 const b=browser(options);const error=missing();await assert.rejects(loadTeacherWithRecovery(async()=>{throw error;}),e=>e===error);assert.equal(b.reloads(),0);assert.equal(b.saved.size,2);
 assert.deepEqual(await loadTeacherWithRecovery(async()=>({ok:true})),{ok:true});
});
void test('real application errors remain errors without reloading',async()=>{
 const b=browser();const error=new Error('Unexpected lesson state');await assert.rejects(loadTeacherWithRecovery(async()=>{throw error;}),e=>e===error);assert.equal(b.reloads(),0);assert.equal(b.saved.size,2);
});
void test('server failure remains an error without browser access',async()=>{
 delete globalThis.window;const error=missing();await assert.rejects(loadTeacherWithRecovery(async()=>{throw error;}),e=>e===error);
});
