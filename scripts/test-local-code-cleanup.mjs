import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import ts from 'typescript';
import {verifyCodeCleanup,readBeforeCodeCleanup,cleanupFile} from './check-local-code-cleanup.mjs';

void test('Local cleanup retains every registered test and its name',()=>{
 const proof=verifyCodeCleanup();let checked=0;
 function names(file,text){
  const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true),result=[];
  function walk(node){if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='test')result.push(node.arguments[0].getText(source));ts.forEachChild(node,walk);}
  walk(source);return result;
 }
 for(const[file,record]of Object.entries(proof.files)){
  if(!record.before||!file.startsWith('scripts/test-')||file==='scripts/test-local-code-cleanup.mjs')continue;
  const before=readBeforeCodeCleanup(file,proof).toString(),after=readFileSync(file,'utf8');
  assert.deepEqual(names(file,after),names(file,before),file);checked++;
 }
 assert(checked>=109);
});
void test('Explicit void still reports synchronous and asynchronous test failures',()=>{
 for(const body of ["throw Error('deliberate failure')","await Promise.reject(Error('deliberate failure'))"]){
  const result=spawnSync(process.execPath,['--input-type=module','-e',`import test from 'node:test'; void test('failure probe',async()=>{${body}});`],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stdout+result.stderr,/deliberate failure/);
 }
});
void test('The only app changes replace deprecated image priority while retaining early loading',()=>{
 const proof=verifyCodeCleanup();
 for(const file of ['components/product/shared.tsx','components/product/entry-design.tsx','components/product/compact-learner-app.tsx']){
  assert.equal(readFileSync(file,'utf8').replaceAll(' preload loading="eager" fetchPriority="high" ',' priority '),readBeforeCodeCleanup(file,proof).toString());
 }
 assert.equal(execFileSync('git',['diff','--name-only',proof.baselineSourceCommit,'--','data','public','app','hooks','lib','.github','.oxlintrc.json','package.json','package-lock.json']).length,0);
});
void test('Cleanup cannot authorize publication, alter media or rewrite historical approvals',()=>{
 const proof=verifyCodeCleanup();assert.equal(proof.publicationApproved,false);assert.equal(proof.productionBatch,false);
 for(const file of [cleanupFile,'components/product/shared.tsx','scripts/check-instruction-candidate.mjs','docs/opening-loader-20261101/compare-screens.cjs']){
  assert.throws(()=>verifyCodeCleanup(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('unreviewed')]):readFileSync(path)));
 }
 assert.deepEqual(readFileSync('docs/grammar-live-integration-20261101/scope.json'),execFileSync('git',['show',proof.baselineSourceCommit+':docs/grammar-live-integration-20261101/scope.json'],{maxBuffer:128e6}));
});
