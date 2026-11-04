import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readProductionBank } from './read-production-bank.mjs';
const rows=JSON.parse(readFileSync('data/klink-production-index.json'));
test('Existing public banks and new server banks keep the same validation',()=>{
 const old=rows.find(r=>r.url.startsWith('/practice-content/'));
 assert.deepEqual(readProductionBank(old),JSON.parse(readFileSync('public'+old.url)));
 const server=rows.filter(r=>r.url.startsWith('/api/grammar-aa-assets/'));assert.equal(server.length,4);
 for(const row of server){assert.equal(readProductionBank(row).exercises.length,row.count);assert.throws(()=>readProductionBank({...row,count:row.count+1}));assert.throws(()=>readProductionBank({...row,id:'wrong-source'}));}
});
test('Unregistered or malformed server bank URLs fail closed',()=>{
 const row=rows.find(r=>r.url.startsWith('/api/grammar-aa-assets/'));
 for(const url of ['/api/grammar-aa-assets/../secret.json','/api/grammar-aa-assets/'+ '0'.repeat(64)+'.json','/api/grammar-aa-assets/not-a-hash.json','/private/data.json'])assert.throws(()=>readProductionBank({...row,url}));
});
