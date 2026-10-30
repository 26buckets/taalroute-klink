'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Check,Eye,EyeOff} from 'lucide-react';
import type {ContentTask} from '@/lib/imported-practice-contract';

type Reply={phaseId:string; answer:string; fields:Record<string,string>; tileOrder:number[]; performed:boolean; interlude:string; interval:string; exposure:string; completedAt:number; helpUsed:boolean};
type State={previousVersion?:unknown;sourceHash:string; prepared:boolean; index:number; replies:Reply[]; note:string; fields:Record<string,string>; tiles:number[]; performed:boolean; interlude:string; interval:string; exposure:string; observations:Record<string,string>; helpUsed:boolean};
type Props={id:string;task:ContentTask;locked:boolean;onFinish:(answer:string,correct:boolean,feedback?:string)=>void;onHelp:()=>void};
const judgments=['Gezien zonder extra hulp','Gezien met hulp','Nog oefenen','Niet waargenomen'];
export function TeacherPreparation({task,locked,onBegin}:{task:ContentTask;locked:boolean;onBegin:()=>void}){
 const [privateView,setPrivateView]=useState(false);
 const flow=task.teacherWorkflow,phase=flow?.phases[0];
 return <section className="cp-task-card cp-teacher-workflow cp-guided-start" data-teacher-workflow={flow?.kind} data-content-player={!flow?task.mode:undefined} data-workflow-phase="prepare">
  <h3>Voor de docent</h3>
  <div className="cp-guided-steps">
   <section><h4>1. Ga erbij zitten</h4><p>Gebruik samen de laptop. Controleer of de cursist de woorden en de opdracht begrijpt.</p></section>
   <section><h4>2. Laat zelf proberen</h4><p>{phase?.response==='paper'?'De cursist vult het antwoord op het scherm in. Papier is een extra.':phase?.response==='oral'?'De cursist antwoordt of wijst aan.':'De cursist bedient de laptop en maakt de opdracht.'} Geef het antwoord nog niet.</p></section>
   <section><h4>3. Bekijk het samen</h4><p>Bespreek het gemaakte werk. Geef hulp waar nodig en noteer daarna wat je hebt gezien.</p></section>
  </div>
  <details className="cp-guided-details"><summary>Opdracht en voorbereiding</summary>
   <p>Voor de docent. Deze uitleg kan voorbeelden en antwoorden bevatten.</p>
   {!privateView?<button className="secondary-button" onClick={()=>setPrivateView(true)}>De cursist kijkt niet mee</button>:<>
    <h4>De opdracht</h4><p>{phase?.instruction??task.prompt}</p>
    <h4>Vooraf controleren</h4><ul>{task.prerequisites.map((text,index)=><li key={index}>{text}</li>)}</ul>
    {Boolean(flow?.materials.length)&&<><h4>Benodigd</h4><ul>{flow!.materials.map((text,index)=><li key={index}>{text}</li>)}</ul></>}
    <details><summary>Bron en context</summary><p className="cp-content-stimulus">{task.stimulus}</p></details>
   </>}
  </details>
  <button className="primary-button" disabled={locked} onClick={onBegin}>Begin samen<ArrowRight/></button>
 </section>;
}
export function ImportedTeacherWorkflow({id,task,locked,onFinish,onHelp}:Props){
 const flow=task.teacherWorkflow!;
 const storageKey=`klink.taalroute.content-workflow.v1:${id}`;
 const fresh:State={sourceHash:flow.sourceHash,prepared:false,index:0,replies:[],note:'',fields:{},tiles:[],performed:false,interlude:'',interval:'',exposure:'',observations:{},helpUsed:false};
 // Retain prior answers inside the saved record when a corrected task starts a new version.
 const [state,setState]=useState<State>(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)??'null');if(saved&&typeof saved.sourceHash==='string'&&saved.sourceHash!==flow.sourceHash)return {...fresh,previousVersion:saved};if(saved?.sourceHash===flow.sourceHash&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=flow.phases.length&&Array.isArray(saved.replies)&&saved.replies.length===saved.index&&typeof saved.prepared==='boolean'&&typeof saved.note==='string'&&saved.fields&&Array.isArray(saved.tiles)&&typeof saved.performed==='boolean'&&typeof saved.interlude==='string'&&saved.observations&&typeof saved.helpUsed==='boolean'&&typeof saved.interval==='string'&&typeof saved.exposure==='string'&&Object.values(saved.fields).every(value=>typeof value==='string')&&Object.values(saved.observations).every(value=>judgments.includes(String(value)))&&new Set(saved.tiles).size===saved.tiles.length&&saved.tiles.every((index:number)=>Number.isInteger(index)&&index>=0&&index<(flow.phases[saved.index]?.tiles?.length??0))&&saved.replies.every((reply:Reply,index:number)=>reply?.phaseId===flow.phases[index].id&&typeof reply.answer==='string'&&reply.fields&&Object.values(reply.fields).every(value=>typeof value==='string')&&Array.isArray(reply.tileOrder)))return saved;}catch{/* Storage is optional. */}return fresh;});
 const [teacher,setTeacher]=useState(true);
 const [privateView,setPrivateView]=useState(false);
 const phase=flow.phases[state.index];
 const reviewing=!phase;
 const needsNote=Boolean(phase&&['text','oral','paper'].includes(phase.response)&&!['model','guided'].includes(phase.id));
 const responseReady=Boolean(phase&&state.performed&&(!phase.interlude||(state.interlude.trim()&&state.interval?.trim()&&state.exposure?.trim()))&&(!needsNote||state.note.trim())&&(phase.response!=='fields'||Object.values(state.fields).some(value=>value.trim()))&&(phase.response!=='tiles'||state.tiles.length===phase.tiles?.length));
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{/* Continue when browser storage is unavailable. */}},[state,storageKey]);
 function help(){onHelp();setState(current=>({...current,helpUsed:true}));}
 function advance(){
  if(locked||!phase||!state.prepared||!responseReady)return;
  const reply:Reply={phaseId:phase.id,answer:state.note,fields:state.fields,tileOrder:state.tiles,performed:state.performed,interlude:state.interlude,interval:state.interval,exposure:state.exposure,completedAt:Date.now(),helpUsed:state.helpUsed};
  setState(current=>({...current,index:current.index+1,replies:[...current.replies,reply],note:'',fields:{},tiles:[],performed:false,interlude:'',interval:'',exposure:''}));
  setTeacher(true);setPrivateView(false);
 }
 const complete=reviewing&&flow.criteria.every((_,index)=>judgments.includes(state.observations[String(index)]));
 function finish(){if(!complete||locked)return;onFinish(JSON.stringify({workflow:flow.kind,sourceHash:flow.sourceHash,prepared:state.prepared,replies:state.replies,observations:state.observations,helpUsed:state.helpUsed}),true,'Geoefend en besproken. De docent heeft de waarnemingen apart vastgelegd.');}
 if(!state.prepared)return <TeacherPreparation task={task} locked={locked} onBegin={()=>{setState(current=>({...current,prepared:true}));setTeacher(false);setPrivateView(false);}}/>;
 if(reviewing&&flow.kind==='spelling')return <section className="cp-task-card cp-teacher-workflow cp-guided-review" data-teacher-workflow={flow.kind} data-workflow-phase="review">
  <h3>Bekijk het samen</h3>
  <div className="cp-guided-answers"><section><h4>Het eerste antwoord</h4>{state.replies.map(reply=><p className="cp-content-stimulus" key={reply.phaseId}>{reply.answer||Object.values(reply.fields).join(' · ')}</p>)}</section>
  <section><details><summary>Voorbeeld bekijken</summary><p className="cp-content-stimulus">{flow.expected.split('\n').filter(line=>line!=='teacher-only-after-attempt').join('\n')}</p></details></section></div>
  <p>Wat gaat goed? Wat wil je nog oefenen?</p>
  <details className="cp-guided-details"><summary>Voor de docent: afronden</summary><p>{task.teacherGuidance}</p>
   {flow.criteria.map((criterion,index)=><label className="cp-observation" key={index}><span>{criterion}</span><select disabled={locked} value={state.observations[String(index)]??''} onChange={event=>setState(current=>({...current,observations:{...current.observations,[index]:event.target.value}}))}><option value="">Kies je waarneming</option>{judgments.map(value=><option key={value}>{value}</option>)}</select></label>)}
   <p>Afronden betekent dat jullie geoefend hebben. Het is geen beheersingsscore.</p><button className="primary-button" disabled={locked||!complete} onClick={finish}>Waarnemingen vastleggen<Check/></button>
  </details>
 </section>;
 return <section className="cp-task-card cp-teacher-workflow" data-teacher-workflow={flow.kind} data-workflow-phase={phase?.id??'review'}>
  <div className="cp-workflow-controls"><button className="secondary-button" aria-pressed={teacher} onClick={()=>{setTeacher(value=>!value);setPrivateView(false);if(state.prepared&&!reviewing)help();}}>{teacher?<><Eye/>Terug naar de opdracht</>:<><EyeOff/>Voor de docent</>}</button><span>{phase?.label??'Samen bekijken'}</span></div>
  {teacher ? <div className="cp-workflow-teacher">
   {!privateView?<><p>Laat de cursist tijdens deze docentweergave niet meekijken. Hier kunnen voorbeelden en antwoorden staan.</p><button className="secondary-button" onClick={()=>setPrivateView(true)}>De cursist kijkt niet mee</button></>:<>
    <><h4>{reviewing?'Bespreek het gemaakte werk':'Docenthandeling'}</h4><p className="cp-content-stimulus">{reviewing?task.teacherGuidance:phase.instruction}</p>
     {!reviewing&&<><button className="secondary-button" onClick={()=>{setTeacher(false);setPrivateView(false);}}>Begin deze stap<ArrowRight/></button><details onToggle={event=>{if(event.currentTarget.open)help();}}><summary>Extra hulp bekijken en registreren</summary><p className="cp-content-stimulus">{flow.help}</p></details></>}
     {reviewing&&<><h4>Beoordelingsreferentie</h4><p className="cp-content-stimulus">{flow.expected}</p><details><summary>Gemaakte antwoorden</summary>{state.replies.map(reply=><div key={reply.phaseId}><p><strong>{flow.phases.find(item=>item.id===reply.phaseId)?.label}</strong></p>{reply.answer&&<p className="cp-content-stimulus">{reply.answer}</p>}{Object.entries(reply.fields).map(([label,value])=><p key={label}>{label}: {value||'Niet ingevuld'}</p>)}{reply.tileOrder.length>0&&<p>{reply.tileOrder.map(index=>flow.phases.find(item=>item.id===reply.phaseId)?.tiles?.[index]).join(' · ')}</p>}{reply.interlude&&<p>Tussendoor: {reply.interlude}<br/>Werkelijke tussenpoos: {reply.interval}<br/>Opnieuw aangeboden: {reply.exposure}</p>}<p>{reply.helpUsed?'Hulp geregistreerd.':'Geen extra hulp geregistreerd; dit bewijst geen zelfstandige beheersing.'}</p></div>)}</details>
      {flow.criteria.map((criterion,index)=><label className="cp-observation" key={index}><span>{criterion}</span><select disabled={locked} value={state.observations[String(index)]??''} onChange={event=>setState(current=>({...current,observations:{...current.observations,[index]:event.target.value}}))}><option value="">Kies je waarneming</option>{judgments.map(value=><option key={value}>{value}</option>)}</select></label>)}
      <p>Beoordeel alleen wat je werkelijk hebt gezien. Afronden geeft geen automatische beheersingsscore.</p><button className="primary-button" disabled={locked||!complete} onClick={finish}>Waarnemingen vastleggen<Check/></button></>}
    </>
   </>}
  </div>:!state.prepared?<p>Bereid de opdracht eerst samen met je docent voor.</p>:reviewing?<p>Bespreek je antwoorden samen met je docent.</p>:<>
   {flow.kind==='spelling'&&<ol className="cp-guided-instructions">{phase.instruction.replaceAll('op papier', 'in het invulvak').split(/(?<=[.!?])\s+/).map((instruction,index)=><li key={index}>{instruction}</li>)}</ol>}
   {phase.learnerText.length>0&&<div className="cp-workflow-source">{phase.learnerText.map((text,index)=><p className="cp-content-stimulus" key={index}>{phase.correction?.oldValue===text?<del aria-label={`Oud, niet geldig: ${text}`}>{text}</del>:text}</p>)}</div>}
   {phase.interlude&&<>{([['interlude','Welke andere voorbereide activiteit is tussendoor gedaan?'],['interval','Hoeveel tijd zat er werkelijk tussen?'],['exposure','Welke woorden, voorbeelden of hints zijn tussendoor opnieuw aangeboden? Noteer ook als er geen waren.']] as const).map(([key,label])=><label className="cp-text-entry" key={key}><span>{label} Laat je docent dit invullen.</span><input disabled={locked} value={state[key]??''} onChange={event=>setState(current=>({...current,[key]:event.target.value}))}/></label>)}</>}
   {phase.response==='fields'&&phase.fields.map(label=><label className="cp-text-entry" key={label}><span>{label}</span><input disabled={locked} autoComplete="off" value={state.fields[label]??''} onChange={event=>setState(current=>({...current,fields:{...current.fields,[label]:event.target.value}}))}/></label>)}
   {['text','paper'].includes(phase.response)&&<label className="cp-text-entry"><span>Je antwoord</span><textarea rows={5} disabled={locked} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={state.note} onChange={event=>setState(current=>({...current,note:event.target.value}))}/></label>}
   {phase.response==='tiles'&&<><div className="cp-choice-grid">{phase.tiles!.map((tile,index)=><button key={index} className="secondary-button" disabled={locked||state.tiles.includes(index)} onClick={()=>setState(current=>({...current,tiles:[...current.tiles,index]}))}>{tile}</button>)}</div><p className="cp-content-stimulus" aria-live="polite">{state.tiles.map(index=>phase.tiles![index]).join(' ')}</p><button className="secondary-button" disabled={locked||!state.tiles.length} onClick={()=>setState(current=>({...current,tiles:current.tiles.slice(0,-1)}))}>Eén terug</button></>}
   {phase.response==='paper'&&<p>Vul je antwoord hierboven in. Papier is een extra. Je antwoord blijft bewaard voor de bespreking.</p>}
   {phase.response==='oral'&&<p>Voer de opdracht samen met je docent uit. Je mag antwoorden of aanwijzen zoals afgesproken.</p>}
   {needsNote&&!['text','paper'].includes(phase.response)&&<label className="cp-text-entry"><span>Docentnotitie: wat was het eerste antwoord of resultaat?</span><textarea rows={2} disabled={locked} value={state.note} onChange={event=>setState(current=>({...current,note:event.target.value}))}/></label>}
   <button className="secondary-button" aria-pressed={state.performed} disabled={locked} onClick={()=>setState(current=>({...current,performed:!current.performed}))}>{state.performed?'Deze stap is uitgevoerd':'Ik heb deze stap uitgevoerd'}</button>
   <button className="primary-button" disabled={locked||!responseReady} onClick={advance}>{state.index+1===flow.phases.length?'Samen bekijken':'Volgende stap'}<ArrowRight/></button>
  </>}
 </section>;
}
