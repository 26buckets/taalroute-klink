import{practiceBusy}from'../hooks/use-practice-keyboard.ts';
import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyWritingKeyboardNextRelease}from'./check-writing-keyboard-next-release-20261101.mjs';
void test('approved writing keyboard and next-during-audio release has complete proof',()=>assert.equal(verifyWritingKeyboardNextRelease().approvedBy,'Nico'));
for(const[file,edit]of[['app/learner-layout.css',s=>s+'\nbutton{height:70px}'],['hooks/use-practice-keyboard.ts',s=>s.replace('allowAudioNext = false','allowAudioNext = true')],['components/product/package-exercise-browser.tsx',s=>s.replace('playback.current?.abort();\n    stopMedia();\n    if (guided)','stopMedia();\n    if (guided)')],['docs/writing-keyboard-next-20261101/checks.json',s=>s.replace('"recordingProtected": true','"recordingProtected": false')],['docs/writing-keyboard-next-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')]])void test('rejects altered '+file,()=>assert.throws(()=>verifyWritingKeyboardNextRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));

void test('audio may be stopped only for confirmed navigation; recordings and video remain protected',()=>{
 const root=(tagName,recording=false)=>({querySelector:()=>recording?{}:null,querySelectorAll:()=>[{tagName,paused:false,ended:false}]});
 assert(practiceBusy(root('AUDIO')));assert(!practiceBusy(root('AUDIO'),true));assert(practiceBusy(root('VIDEO'),true));assert(practiceBusy(root('AUDIO',true),true));
});
