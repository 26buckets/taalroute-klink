import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyNextTeacherPackagesRelease} from './check-teacher-packages-10-15-release-20261031.mjs';
test('twenty lessons pass their bounded source, preservation and backup checks',()=>{const r=verifyNextTeacherPackagesRelease();assert(r.changedFiles.includes('data/klink-docent-extra-lessons-10-15.json'));});
for(const [name,file,change]of[
 ['unapproved design','components/product/teacher-classroom.css',s=>s+'\n.kpd-brand{color:red}\n'],
 ['changed lesson','data/klink-docent-extra-lessons-10-15.json',s=>s.replace('De sok ligt op de stoel.','De sok ligt op de grond.')],
 ['missing backup','docs/lespakketten-10-15-20261031/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
 ['no narrow-screen approval','docs/lespakketten-10-15-20261031/month-appearance-approval.json',s=>s.replace('Ja, voer dit gerichte herstel uit','Nee')],
])test('publication rejects '+name,()=>assert.throws(()=>verifyNextTeacherPackagesRelease(f=>{const b=readFileSync(f);return f===file?Buffer.from(change(b.toString())):b;})));
