import {Miniflare} from 'miniflare';
import {globSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
if (!process.env.KLINK_INZICHT_SOURCE) throw new Error('Set KLINK_INZICHT_SOURCE to the locally built PR8 checkout');
const root=resolve(process.env.KLINK_INZICHT_SOURCE);
const {fixtures}=await import(pathToFileURL(root+'/scripts/inzicht/fixtures.mjs'));

const m=new Miniflare({modules:['index.js',...globSync('**/*.js',{cwd:root+'/dist/server'}).filter(p=>p!=='index.js')].map(path=>({type:'ESModule',path,contents:readFileSync(root+'/dist/server/'+path,'utf8')})),modulesRoot:'/',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],assets:{directory:root+'/dist/client',routerConfig:{has_user_worker:true}},d1Databases:['INZICHT_DB'],bindings:{INZICHT_MODE:'synthetic-local'},host:'127.0.0.1',port:19130});
await m.ready;
const db=await m.getD1Database('INZICHT_DB');
for(const path of globSync('*.sql',{cwd:root+'/db/migrations/inzicht'}).sort())for(const sql of readFileSync(root+'/db/migrations/inzicht/'+path,'utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
const f=await fixtures();
for(const sql of f.sql.trim().split('\n'))await db.prepare(sql).run();
mkdirSync('work',{recursive:true});
writeFileSync('work/inzicht-perf-session.json',JSON.stringify({token:f.credentials.docent}),{mode:0o600});
console.log('Synthetic local Inzicht fixture ready on 19130');
