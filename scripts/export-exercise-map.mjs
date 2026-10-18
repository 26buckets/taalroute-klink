import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=new URL('../outputs/exercise-map-20261018/',import.meta.url);
const inventory=JSON.parse(readFileSync(new URL('../outputs/domain-fill-20261018/current-inventory.json',import.meta.url),'utf8'));
const live=await (await fetch('https://klink.taalroute.nl/release.json')).json();
assert.equal(live.sourceCommit,inventory.liveRelease.sourceCommit,'Refresh the audited inventory before updating this map');
const source=p=>execFileSync('git',['show',`${live.sourceCommit}:${p}`],{cwd:root,encoding:'utf8'});
const list=body=>[...body.matchAll(/'([^']+)'/g)].map(m=>m[1]);
const stageLabels=['Kijken','Herkennen','Namaken','Zelf maken','Gebruiken','Herhalen'];
const summaries=['Voorbeeld bekijken','Kiezen en koppelen','Met een voorbeeld','Zonder volledig voorbeeld','Zinnen en situaties','Bekende inhoud terughalen'];
const stages=[...source('lib/learner-route.ts').matchAll(/\{ id: '([^']+)', label: '[^']+', description: '[^']*', activities: \[([^\]]+)\] \}/g)].map((m,i)=>({id:m[1],label:stageLabels[i],summary:summaries[i],activities:list(m[2])}));
const chapters=[...source('lib/practice-chapters.ts').matchAll(/\{ id: '([^']+)', title: '([^']+)', icon: '[^']+', activities: \[([^\]]+)\] \}/g)].map(m=>({id:m[1],title:m[2],activities:list(m[3])}));
assert.equal(stages.length,6);assert.equal(chapters.length,12);assert.equal(inventory.activities.length,46);
const activities=inventory.activities.map(({id,label,levels})=>({id,label,levels}));
for(const a of activities){assert.equal(stages.filter(s=>s.activities.includes(a.id)).length,1,a.id);assert(chapters.some(c=>c.activities.includes(a.id)),a.id);}
assert(!activities.some(a=>a.levels.includes('alfa-c')||a.levels.includes('b1')));
const upcoming=[
  {label:'Sorteren',phase:'Herkennen',description:'Woorden groeperen; categorie en leerdoel bepalen de variant.'},
  {label:'Gericht aanwijzen in tekst',phase:'Herkennen / Gebruiken',description:'Exacte woorden en bewijsplaatsen selecteren.'},
  {label:'Betekenisvol aanvullen',phase:'Namaken / Zelf maken / Gebruiken',description:'Zinnen aanvullen met of zonder steun.'},
  {label:'Volgorde maken',phase:'Gebruiken',description:'Tekstregels, gespreksbeurten en geschikte beelden ordenen.'},
  {label:'Aanwijzen in een situatiebeeld',phase:'Gebruiken',description:'Een inhoudelijk passende plek kiezen.'},
  {label:'Kiezen en verdergaan',phase:'Gebruiken',description:'Een keuze met een passend vervolg in een praktijksituatie.'},
];
const data={schemaVersion:1,checkedAt:new Date().toISOString(),sourceCommit:live.sourceCommit,publication:'Live exercise inventory; new entrance labels local only; six extensions not published',stages,chapters,activities,upcoming};
mkdirSync(out,{recursive:true});
writeFileSync(new URL('exercise-map.json',out),JSON.stringify(data,null,2)+'\n');
const template=readFileSync(new URL('map.template.html',out),'utf8');
assert.equal(template.split('__KLINK_MAP_DATA__').length,2);
const fragment=template.replace('__KLINK_MAP_DATA__',JSON.stringify(data).replaceAll('<','\\u003c'));
const target='/Users/nicoknoester/.codex/visualizations/2026/09/03/01a06915-d095-7f61-85b7-6179f046ff90/klink-oefenkaart.html';
assert(Buffer.byteLength(fragment)<1024*1024);writeFileSync(target,fragment);
console.log(JSON.stringify({target,activities:activities.length,stages:stages.length,chapters:chapters.length,bytes:Buffer.byteLength(fragment),sourceCommit:live.sourceCommit}));
