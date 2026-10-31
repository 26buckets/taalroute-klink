import React from 'react';
import {createRoot} from 'react-dom/client';
import {PackageExerciseBrowser} from '../components/product/package-exercise-browser';
import type {PackageDefinition,PackageExercise} from '../lib/package-content';
const host=document.createElement('div');host.id='keyboard-audit';document.body.replaceChildren(host);const root=createRoot(host);let revision=0;
Object.assign(window,{keyboardMount:(pack:PackageDefinition,exercise:PackageExercise,previous=false)=>{
 const next={...exercise,exerciseId:exercise.exerciseId+':keyboard-test-sentinel'};
 const audit={plays:[] as (string|undefined)[],attempts:[] as unknown[]};Object.assign(window,{keyboardAudit:audit});
 root.render(<PackageExerciseBrowser key={++revision} pack={pack} exercises={previous?[next,exercise]:[exercise,next]} initialExerciseId={exercise.exerciseId} guided practiceRound onAudio={async source=>{audit.plays.push(source);await new Promise(resolve=>setTimeout(resolve,5));return true;}} onAttempt={attempt=>audit.attempts.push(attempt)} />);
}});
