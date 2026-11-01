import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sqlite } from './sqlite.mjs';
import { handleInzicht } from '../../lib/inzicht/service.ts';
import { hash, canonical, ROUTES } from '../../lib/inzicht/rules.ts';
import { sourceMaterials, sourceMarks, sourceCriteria } from '../../lib/inzicht/source-observation.ts';

const schema = readdirSync('db/migrations/inzicht').filter((x) => x.endsWith('.sql')).sort()
  .map((x) => readFileSync(`db/migrations/inzicht/${x}`, 'utf8')).join('\n');
async function setup() {
  const db = sqlite(); db.exec(schema);
  const token = 'a'.repeat(64);
  const t = new Date().toISOString();
  const q = (sql, ...args) => db.connection.prepare(sql).run(...args);
  q('INSERT INTO users VALUES (?,?,?)','teacher','synthetic:teacher','active');
  q('INSERT INTO inzicht_sessions VALUES (?,?,?,?)',await hash(token),'teacher',new Date(Date.now()+3600000).toISOString(),0);
  for (const org of ['school-a','school-b']) {
    const teacher = `${org}:teacher`;
    q('INSERT INTO organizations VALUES (?,?,?,?,?)',org,'Fictieve school','active',canonical(ROUTES),1);
    q('INSERT INTO memberships VALUES (?,?,?,?,?,?)',teacher,org,'teacher','active','teacher',1);
    const gid = `${org}:class`;
    q('INSERT INTO groups VALUES (?,?,?,?,?,?,?,?)',gid,org,'Oefenklas','Alfa A','','active',1,t);
    q('INSERT INTO group_teachers VALUES (?,?,?)',org,gid,teacher);
    for(const id of ['student-1','student-2']) {
      const lid=`${org}:${id}`;
      q('INSERT INTO school_learners VALUES (?,?,?,?,?)',lid,org,`Test ${id}`,teacher,t);
      q('INSERT INTO group_memberships VALUES (?,?,?,?,?,?)',org,gid,lid,'active',t,null);
    }
  }
  q('DELETE FROM group_teachers WHERE organization_id=?','school-b');
  async function call(path, body, options={}) {
    const req = new Request(`http://localhost/api/inzicht/${path}${path.includes('?')?'&':'?'}school=${options.org??'school-a'}`,
      { method: body === undefined ? 'GET' : 'POST', headers:{
          cookie:`inzicht_session=${token}`,
          ...(body===undefined?{}:{origin:'http://localhost','Content-Type':'application/json','Idempotency-Key':options.key??crypto.randomUUID()})
        },body:body===undefined?undefined:JSON.stringify(body)});
    const response=await handleInzicht(req,{INZICHT_DB:db,INZICHT_MODE:'synthetic-local'});
    return {status:response.status, data:await response.json()};
  }
  return {db,call};
}
function draft(overrides={}) {
 return {id:crypto.randomUUID(), class_id:'school-a:class',learner_id:'school-a:student-1',
   material_id:'mat',mode:'word',values:[0,1,2,null,null,null],note:'Toont mat bij de deur',next:'Andere woorden lezen',
   observed_at:new Date().toISOString(),expected_revision:0,...overrides};
}
test('original contents and meanings are preserved',()=>{
  assert.deepEqual(sourceMaterials.map(x=>x.id),['mat','tas','map','man','pan','jas','pen','pet']);
  for (const mode of ['word','sentence','text']) for(const material of sourceMaterials)
    assert.equal(sourceCriteria(mode,material.id).length,6);
  assert.deepEqual(sourceMarks.map(x=>x.label),['Zonder directe hulp','Met hulp of model','Niet waargenomen']);
  assert.deepEqual(sourceMarks.map(x=>x.symbol),['✓','△','—']);
});
test('server persists exact 0/1/2/null and revisions without generating mastery evidence',async()=>{
  const {call,db}=await setup(); const body=draft();
  const create=await call('source-observations',body);assert.equal(create.status,201,JSON.stringify(create.data));
  assert.equal(create.data.revision,1);
  let list=await call('source-observations?class=school-a:class&learner=school-a:student-1');
  assert.equal(list.status,200);assert.equal(list.data.length,1);
  assert.deepEqual(list.data[0].payload.values, [0,1,2,null,null,null]);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM evidence_events').get().n,0);
  const revise=await call('source-observations',{...body,values:[2,null,0,1,0,2],expected_revision:1});
  assert.equal(revise.status,201,JSON.stringify(revise.data));assert.equal(revise.data.revision,2);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM source_observation_revisions').get().n,2);
  list=await call('source-observations?class=school-a:class&learner=school-a:student-1');
  assert.deepEqual(list.data[0].payload.values,[2,null,0,1,0,2]);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM evidence_events').get().n,0);
  const old=await call('source-observations',{...body,expected_revision:1});assert.equal(old.status,409);
});
test('reject invalid marks, unauthorized school access, and student crossover',async()=>{
  const {call}=await setup();
  const invalid=await call('source-observations',draft({values:[0,1,2,3,null,null]}));
  assert.equal(invalid.status,400);
  const wrongClass=await call('source-observations',draft({learner_id:'school-b:student-1'}));
  assert.notEqual(wrongClass.status,201);
  const cross=await call('source-observations?class=school-b:class&learner=school-b:student-1',{...draft(), class_id:'school-b:class',learner_id:'school-b:student-1'},{org:'school-b'});
  assert.notEqual(cross.status,201);
  const initial=draft();assert.equal((await call('source-observations',initial)).status,201);
  const other=await call('source-observations?class=school-a:class&learner=school-a:student-2');
  assert.deepEqual(other.data,[]);
});
test('idempotency repeat returns same revision without duplicate rows',async()=>{
  const {call,db}=await setup();const body=draft();const key=crypto.randomUUID();
  const first=await call('source-observations',body,{key});const second=await call('source-observations',body,{key});
  assert.equal(first.status,201);assert.equal(second.status,201);
  assert.deepEqual(second.data,first.data);
  assert.equal(db.connection.prepare('SELECT COUNT(*) n FROM source_observation_revisions').get().n,1);
});
test('separate dated observations for the same source item keep full revision history', async () => {
  const {call,db}=await setup();
  const a=draft({values:[0,null,null,null,null,null]});
  const b=draft({values:[2,null,null,null,null,null]});
  assert.equal((await call('source-observations',a)).status,201);
  assert.equal((await call('source-observations',b)).status,201);
  const list=await call('source-observations?class=school-a:class&learner=school-a:student-1');
  assert.equal(list.data.length,2);
  assert.equal(new Set(list.data.map(x=>x.id)).size,2);
  assert.equal(db.connection.prepare('SELECT COUNT(*) n FROM source_observation_revisions').get().n,2);
});
test('another assigned teacher may read but may not rewrite another author\'s observation',async () => {
  const {db,call}=await setup();const a=draft();
  assert.equal((await call('source-observations',a)).status,201);
  const q=(sql,...args)=>db.connection.prepare(sql).run(...args);
  const hash2=await hash('b'.repeat(64));
  q('INSERT INTO users VALUES (?,?,?)','colleague','synthetic:colleague','active');
  q('INSERT INTO inzicht_sessions VALUES (?,?,?,?)',hash2,'colleague',new Date(Date.now()+3600000).toISOString(),0);
  q('INSERT INTO memberships VALUES (?,?,?,?,?,?)','school-a:colleague','school-a','colleague','active','teacher',0);
  q('INSERT INTO group_teachers VALUES (?,?,?)','school-a','school-a:class','school-a:colleague');
  async function asColleague(path,body) {
    const req=new Request(`http://localhost/api/inzicht/${path}${path.includes('?')?'&':'?'}school=school-a`,{
      method:body===undefined?'GET':'POST', headers:{cookie:'inzicht_session='+ 'b'.repeat(64),
      ...(body===undefined?{}:{origin:'http://localhost','Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()})},
      body:body===undefined?undefined:JSON.stringify(body)});
    const res=await handleInzicht(req,{INZICHT_DB:db,INZICHT_MODE:'synthetic-local'});
    return {status:res.status,data:await res.json()};
  }
  const read=await asColleague('source-observations?class=school-a:class&learner=school-a:student-1');
  assert.equal(read.status,200);assert.equal(read.data[0].editable,false);
  const revise=await asColleague('source-observations',{...a,expected_revision:1,note:'Wijziging andere docent'});
  assert.equal(revise.status,403);
});

test('all 24 original item/modality pairs persist their six source-bound values', async () => {
  const {call,db} = await setup();
  for(const material of sourceMaterials) for(const mode of ['word','sentence','text']) {
    const input=draft({material_id:material.id,mode,values:[null,0,1,2,2,null]});
    const saved=await call('source-observations', input);
    assert.equal(saved.status,201,JSON.stringify({material:material.id,mode,error:saved.data}));
  }
  const list=await call('source-observations?class=school-a:class&learner=school-a:student-1');
  assert.equal(list.data.length,24);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM source_observations').get().n,24);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM evidence_events').get().n,0);
  for (const row of list.data) {
    assert.deepEqual(row.payload.values,[null,0,1,2,2,null]);
    assert.equal(row.payload.source,'KLINK_OBSERVATIE_HTML_20261031');
    assert.equal(row.payload.source_version,2);
  }
});

test('validation rejects future/past dates, empty identifiers and invalid lengths', async () => {
  const {call,db}=await setup();
  const cases=[
    draft({values:[]}),draft({values:[0,1,2,null,null,'2']}),
    draft({mode:'speaking'}),draft({material_id:'unknown'}),
    draft({observed_at:new Date(Date.now()+3600000).toISOString()}),
    draft({observed_at:new Date(Date.now()-400*86400000).toISOString()}),
    draft({id:'not-a-uuid'}),draft({expected_revision:-1}),
    draft({expected_revision:'0'}),draft({note:'a'.repeat(1001)}),
    draft({next:'b'.repeat(1001)}),
  ];
  for(const payload of cases){
    const result=await call('source-observations',payload);
    assert.equal(result.status,400,JSON.stringify({payload: {...payload,note:'omitted',next:'omitted'},result}));
  }
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM source_observations').get().n,0);
});

test('no write without authenticated session, and school-class cross-border access is denied', async () => {
  const {db,call}=await setup();
  const body=draft();
  const saved=await call('source-observations',body);
  assert.equal(saved.status,201);
  const responses=[];
  for (const {path,post} of [
    {path:'source-observations?class=school-a:class&learner=school-a:student-1'},
    {path:'source-observations',post:body},
  ]) {
    const request=new Request(`http://localhost/api/inzicht/${path}${path.includes('?')?'&':'?'}school=school-a`,{
      method:post?'POST':'GET',headers:post?{'Content-Type':'application/json',origin:'http://localhost','Idempotency-Key':crypto.randomUUID()}:{},
      body:post?JSON.stringify(post):undefined,
    });
    responses.push(await handleInzicht(request,{INZICHT_DB:db,INZICHT_MODE:'synthetic-local'}));
  }
  assert(responses.every(x=>x.status===401));
  for (const input of [
    draft({class_id:'school-b:class'}),
    draft({learner_id:'school-a:student-2',id:body.id,expected_revision:1}),
    draft({class_id:'school-a:class',learner_id:'school-b:student-1'}),
  ]) {
    const result=await call('source-observations',input);
    assert.notEqual(result.status,201);
  }
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM source_observations').get().n,1);
});

test('corrections remain immutable revisions, including reversal to not-observed and null', async()=>{
  const {call,db}=await setup();
  const input=draft({values:[0,0,0,0,0,0]});
  assert.equal((await call('source-observations',input)).status,201);
  assert.equal((await call('source-observations',{...input,expected_revision:1,values:[2,null,2,null,1,0]})).status,201);
  const saved=db.connection.prepare('SELECT revision,payload FROM source_observation_revisions WHERE observation_id=? ORDER BY revision').all(input.id);
  assert.deepEqual(saved.map(r=>r.revision),[1,2]);
  assert.deepEqual(JSON.parse(saved[0].payload).values,[0,0,0,0,0,0]);
  assert.deepEqual(JSON.parse(saved[1].payload).values,[2,null,2,null,1,0]);
  assert.equal(db.connection.prepare('SELECT COUNT(*) AS n FROM evidence_events').get().n,0);
});

test('concurrent corrections cannot silently overwrite each other',async()=>{
  const {call,db}=await setup();
  const body=draft({note:'Oorspronkelijke waarneming'});
  assert.equal((await call('source-observations',body)).status,201);
  const [a,b] = await Promise.all([
    call('source-observations',{...body,expected_revision:1,note:'Docentcorrectie A'}),
    call('source-observations',{...body,expected_revision:1,note:'Docentcorrectie B'}),
  ]);
  assert.equal([a,b].filter(x=>x.status===201).length,1,JSON.stringify([a,b]));
  assert.equal([a,b].filter(x=>x.status!==201)[0].status,409,'Conflicterende revisie moet HTTP 409 zijn');
  assert.equal(db.connection.prepare('SELECT COUNT(*) n FROM source_observation_revisions').get().n,2);
  const list=await call('source-observations?class=school-a:class&learner=school-a:student-1');
  assert.equal(list.data[0].current_revision,2);
  assert(['Docentcorrectie A','Docentcorrectie B'].includes(list.data[0].payload.note));
});
