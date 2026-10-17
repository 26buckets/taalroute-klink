import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sections from '../data/klink-sections.json' with {type:'json'};
import curriculum from '../data/klink-curriculum.json' with {type:'json'};
import media from '../data/klink-media.json' with {type:'json'};
import before from './fixtures/klink-sections-preserved.json' with {type:'json'};
import {taalroutePackages as packs, primaryWordCards} from '../lib/taalroute-packages.ts';
import {getPackage} from '../lib/package-content.ts';
import {parseProgress,nextLessonPosition} from '../lib/learner-progress.ts';
const hash=rows=>createHash('sha256').update(JSON.stringify(rows.sort((a,b)=>(a.id??a.exerciseId).localeCompare(b.id??b.exerciseId)))).digest('hex');
test('15 authoritative entrances preserve all 302 exact lessons and exercise payloads',()=>{
  assert.equal(packs.length,15);
  assert.equal(sections.release.curriculumInputHash,curriculum.release.inputHash);
  assert.deepEqual(sections.sections.flatMap(s=>s.wordIds).sort(),curriculum.words.map(w=>w.id).sort());
  assert.equal(hash(packs.flatMap(p=>p.lessons)),before.lessons);
  assert.equal(hash(packs.flatMap(p=>p.exercises)),before.exercises);
  assert.equal(packs.flatMap(p=>p.lessons).length,302);
  for(const [i,p] of packs.entries()) {
    const s=sections.sections[i];
    assert.equal(p.title,s.title);assert.equal(p.title.split(' · ').length,2);
    assert.deepEqual(p.lessons.map(l=>l.id),s.stepIds);
    assert.deepEqual(primaryWordCards.filter(w=>w.packageId===p.id).map(w=>w.id),s.wordIds);
    assert.equal(p.cover.image,media[p.cover.wordId].image);
    assert(p.title.split(' · ').includes(p.cover.label));
    assert(s.wordIds.includes(p.cover.wordId));assert(readFileSync('public'+p.cover.image).length);
  }
});
test('Former group 2 resumes at its actual exercise; first a steps remain small and consecutive',()=>{
  const pack=getPackage('groep-2');assert.equal(pack.id,'groep-1');
  assert.equal(pack.counts.coreWords,6);
  assert.deepEqual(pack.lessons.map(l=>l.newWords),[['klink-woord-mat'],['klink-woord-tas'],['klink-woord-map'],['klink-woord-man','klink-woord-pan'],['klink-woord-jas']]);
  const lesson=pack.lessons[2], exerciseId=lesson.guidedExerciseIds[1];
  const migrated=parseProgress(JSON.stringify({position:{packageId:'groep-2',lessonId:lesson.id,exerciseId},completed:[pack.lessons[0].id]}),packs);
  assert.deepEqual(migrated,{position:{packageId:pack.id,lessonId:lesson.id,exerciseId},completed:[pack.lessons[0].id]});
  assert.equal(nextLessonPosition(packs,'groep-2',lesson.id).lessonId,pack.lessons[3].id);
  for(const kind of ['texts','dialogues'])for(const item of pack[kind]) {
    assert.equal(pack[kind].filter(other=>other.id===item.id).length,1);
    const linked=[...new Set(pack.exercises.filter(e=>e.contextId===item.id).map(e=>e.lessonId))];
    assert.deepEqual([...item.lessonIds].sort(),linked.sort());
  }
});
