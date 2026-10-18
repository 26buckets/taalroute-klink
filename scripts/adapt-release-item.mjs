import {createHash} from 'node:crypto';

const list = value => Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : typeof value === 'string' && value.trim() ? [value] : [];
const unique = values => [...new Set(values)];
function responseReference(value) {
  if(typeof value==='string'){try{return responseReference(JSON.parse(value));}catch{return value;}}
  if(!value||typeof value!=='object')return String(value??'');
  return unique(['targetText','expected','correctText','correctTextExample','evidence','acceptedMeaningVariants','acceptedVariants','primaryVsSecondary','observationLimit','oralAlternatives'].flatMap(key=>list(value[key]))).join('\n')||prose(value);
}
function prose(value) {
  if (typeof value === 'string') {
    try { const parsed=JSON.parse(value);return parsed&&typeof parsed==='object'?prose(parsed):value; } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(prose).filter(Boolean).join('\n');
  if (value && typeof value === 'object') return prose(value.expected ?? value.correctText ?? value.correctTextExample ?? value.text ?? value.targetText ?? value.answer ?? Object.values(value).filter(item => typeof item === 'string'));
  return '';
}
const phase = (id,label,learnerText,instruction,response='oral',extra={}) => ({id,label,learnerText:list(learnerText),instruction,response,fields:[],...extra});
const labels = {model:'Voorbeeld',guided:'Met een beetje hulp',response:'Zelf proberen',final:'Zelf proberen',use:'In de situatie','later-recall':'Later terughalen',semantic:'Laat de betekenis zien'};

// These explicit projections preserve the producers' learner/teacher boundary.
// Unknown delivery shapes remain excluded instead of becoming a generic completion button.
export function adaptReleaseItem(raw,domain) {
  const issues=[];
  const item=structuredClone(raw);
  if (raw.audioRequired !== false || raw.releaseMode === 'blocked') return {item,issues};
  const rawHash=createHash('sha256').update(JSON.stringify(raw)).digest('hex');
  if(domain==='teksten')item.prerequisites=raw.prerequisites.map(text=>text.startsWith('Gebruik de exacte vindplaatsen en bewaarde broncontracten in release-preparation.json')?'Controleer de genoemde vormen op hun exacte plek in deze tekst en in de opdracht, keuzes en hulp. Bekende spelling bewijst nog geen begrip van de context.':text);
  if(domain==='gesprekken')item.prerequisites=raw.prerequisites.map(text=>text.includes('reading-preparation.json')?'Bereid alle exacte woorden, hoofdletters en lettergroepen van dit gesprek, de vraag, antwoordkeuzes en hulp vooraf voor. Controleer de betekenis in de eigen zin.':text);
  if(domain==='gesprekken'&&raw.preparation?.exactForms?.length)item.prerequisites.push(`Exacte aangeboden woordvormen: ${raw.preparation.exactForms.join(', ')}.`);
  if(domain==='schrijven'&&raw.preparationInventory){
    const scopeNames={stimulus:'Bron',instruction:'Opdracht',fieldLabels:'Veldnamen',modelAfterAttempt:'Voorbeeld na de eigen poging',feedbackAfterAttempt:'Bespreking na de eigen poging'};
    item.prerequisites=item.prerequisites.map(text=>text.includes('preparationInventory')?'Bereid de hieronder genoemde exacte vormen per onderdeel voor. Hoofdletters, accenten, cijfers en leestekens vragen een aparte controle.':text);
    for(const [key,scope] of Object.entries(raw.preparationInventory))if(scope.forms?.length)item.prerequisites.push(`${scopeNames[key]??'Onderdeel'} — vormen: ${scope.forms.join(', ')}. Tekens: ${(scope.characters??[]).join(' ')}. Leestekens: ${(scope.punctuation??[]).join(' ')||'geen'}.`);
    if(raw.originalPrerequisites?.requiredWords?.length)item.prerequisites.push(`Ook in de bron en docenthandeling voorbereiden: ${raw.originalPrerequisites.requiredWords.join(', ')}.`);
  }
  if(raw.displayPolicy?.mode==='teacher-mediated-choice')delete item.displayPolicy;
  if(raw.renderingContract){
    if(raw.renderingContract.sourceAudioAutoplay!==false||raw.renderingContract.optionIdsVisible!==false)issues.push('Onbekend gespreksweergavecontract.');
    else delete item.renderingContract;
  }
  const flow={kind:domain,phases:[],materials:[],criteria:[],expected:'',help:raw.feedback?.retry??'',targetWordIds:[],sourceLessonIds:[],countCategory:raw.countCategory??'source-task',sourceHash:rawHash};
  if(domain==='woordpakketten'&&raw.integrationVisibility) {
    const old=raw.legacyOriginal??{};
    const surface=raw.learnerSurface??old.learnerSurface;
    const steps=raw.phases??old.phases;
    flow.kind=raw.queueCellId?.includes('model-fade')?'model-fade':raw.queueCellId?.includes('functional')?'functional-use':'precise-response';
    flow.targetWordIds=list(raw.targetWordId);
    flow.sourceLessonIds=unique([...list(raw.teacherPlan?.sourceLessonId),...list(raw.teacherPlan?.sourceLesson?.stepId),...list(raw.teacherPlan?.sourceLesson?.afterStepId),...list(raw.teacherPlan?.reviewedExampleLesson),...list(old.teacherPlan?.sourceLessonIds)]).filter(id=>!id.startsWith('groep-'));
    flow.materials=unique([...list(raw.teacherPlan?.materials),...list(old.teacherPlan?.materials),...list(surface?.materials),...list(surface?.description)]);
    flow.expected=responseReference(raw.expectedResponse||old.answer);
    flow.criteria=[flow.expected,'Beoordeel de betekenis apart van lezen, spellen, motoriek en gebruikte hulp.'];
    if(Array.isArray(steps)&&steps.length) {
      for(const step of steps) {
        const visible=step.learnerSurface??[...list(step.visibleWords),...list(step.visibleGraphemes)];
        const instruction=unique([step.teacherAction,step.prompt,step.assessment,...(!step.teacherAction&&!step.prompt?[raw.prompt]:[])].filter(Boolean)).join('\n');
        const responseInstruction=/op papier of mondeling/.test(step.assessment??'')?raw.prompt:instruction;
        const writing=/schrij|papier|typen|write|spell|in een bericht/i.test(`${step.responseMode??''} ${responseInstruction}`) && !/oral-response/.test(step.responseMode??'');
        flow.phases.push(phase(step.id,labels[step.id]??'Zelf proberen',visible,instruction,writing?'paper':'oral',{interlude:step.id==='later-recall'||step.id==='final'&&Boolean(old.transition)}));
        if(step.id==='use'&&raw.semanticFollowup)flow.phases.push(phase('semantic',labels.semantic,[],raw.semanticFollowup,'oral'));
      }
    } else if(surface&&typeof surface==='object') {
      const visible=Array.isArray(surface)?surface:surface.text??[...list(surface.words),...list(surface.graphemes)];
      const tiles=list(surface.tiles);
      flow.phases=[phase('response','Zelf proberen',visible,raw.prompt,/handwriting|keyboard/.test(surface.input??'')?'paper':tiles.length?'tiles':'oral',tiles.length?{tiles}:{})];
    } else issues.push('Geen expliciete cursistweergave in woordpakket.');
    if(old.transition)flow.materials.push(prose(old.transition));
    if(old.repeat||old.followup)flow.materials.push(prose(old.repeat??old.followup));
    item.title=flow.kind==='model-fade'?'Met minder hulp':flow.kind==='functional-use'?'Gebruik het woord':'Lees en vertel';
  } else if(domain==='schrijven'&&raw.presentationPolicy) {
    const task=raw.taskDefinition;
    const settings=task?.settings??{};
    const policy=settings.modelPolicy??settings.modelVisibility;
    flow.kind='writing';flow.materials=unique([...list(task?.materials),'Papier en pen voor schrijfopdrachten op papier.',...Object.values(raw.sourceTextForTeacher??{}).filter(text=>typeof text==='string'&&text.trim()).map(text=>`Bron voor de docent; bied deze uitsluitend aan volgens het modelbeleid van de opdracht:\n${text}`)]);
    flow.expected=prose(raw.modelAnswer??task?.answer);
    flow.criteria=list(raw.criteria);
    flow.targetWordIds=unique([...list(task?.wordIds),...list(task?.itemIds).filter(id=>id.startsWith('klink-woord-'))]);
    flow.sourceLessonIds=unique((Array.isArray(task?.sourceEvidence)?task.sourceEvidence:task?.sourceEvidence?[task.sourceEvidence]:[]).flatMap(row=>list(row.lessonId)));
    const modes=list(settings.inputModes);
    let visible;
    if(Array.isArray(task?.learnerVisibleText))visible=task.learnerVisibleText;
    else if(policy==='visible'||!task)visible=[raw.stimulus];
    else if(policy==='after-first-attempt')visible=[];
    else {issues.push('Onbekend schrijfmodelbeleid; niet automatisch bron of model tonen.');visible=[];}
    if(policy==='hidden'||policy==='after-first-attempt')visible=[];
    const fields=list(raw.fields);
    const response=fields.length?'fields':policy==='letter-tiles'?'tiles':modes.includes('keyboard')?'text':'paper';
    const instruction=prose(task?.teacherProcedure)||raw.prompt;
    const correction=task?.response?.correctionState;
    flow.phases=[phase('response','Schrijf je antwoord',policy==='letter-tiles'?[]:visible,instruction,response,{fields,...(policy==='letter-tiles'?{tiles:list(visible)}:{}),...(correction?.oldMarkedInvalid&&correction?.oldRemainsLegible?{correction:{oldValue:correction.oldValue,activeValue:correction.activeValue}}:{})})];
    if(/andere.{0,35}(handeling|activiteit)|niet-talige handeling/.test(instruction))flow.phases[0].interlude=true;
    flow.help=prose(task?.help)||raw.feedback.retry;
    item.title='Schrijf en bespreek';
  } else if(domain==='spelling'&&raw.mode==='teacher'&&raw.teacherExpected) {
    flow.kind='spelling';flow.expected=prose(raw.teacherExpected);
    flow.criteria=unique([flow.expected,...list(raw.teacherExpected?.correctControlForms).map(text=>`Behoud de al juiste schrijfwijze: ${text}.`),'Bespreek de schrijfkeuze; beoordeel betekenis, spelling en hulp afzonderlijk.']);
    flow.phases=[phase('response','Controleer en schrijf',[raw.stimulus],raw.prompt,'text')];
    flow.materials=['Voorbereide schrijfregels en volledige tekst; geef de regel niet vóór de eigen poging.'];
    item.title='Controleer de spelling';
  } else if(domain==='grammatica'&&raw.mode==='teacher') {
    if(raw.displayPolicy?.mode!=='teacher-card'||!Array.isArray(raw.displayPolicy?.learnerVisibleText))issues.push('Grammaticakaart mist expliciete cursistweergave.');
    flow.kind='grammar';flow.expected=raw.teacherGuidance;
    flow.criteria=Array.isArray(raw.assessmentCriteria)?raw.assessmentCriteria.map(prose):list(prose(raw.assessmentCriteria));
    flow.phases=[phase('response','Maak de opdracht',raw.displayPolicy?.learnerVisibleText,raw.prompt,raw.axis==='literacy'?'paper':'text')];
    flow.materials=['Bereid de genoemde situaties, partnerkaarten en geschreven vormen samen voor.'];
    item.title='Zinnen maken en bespreken';
  } else return {item,issues};
  if(raw.mode!=='teacher')issues.push('Deze specifieke werkvorm vereist docentbeoordeling.');
  if(!flow.expected.trim()||!flow.criteria.length||flow.criteria.some(text=>!text.trim()))issues.push('Concrete beoordelingsgrond ontbreekt.');
  if(!flow.phases.length)issues.push('Geen uitvoerbare fasen.');
  flow.materials=flow.materials.filter(Boolean);
  // Saved attempts belong to the exact source AND delivery policy, including model visibility.
  flow.sourceHash=createHash('sha256').update(JSON.stringify({rawHash,kind:flow.kind,phases:flow.phases,materials:flow.materials,criteria:flow.criteria,expected:flow.expected,help:flow.help})).digest('hex');
  item.teacherWorkflow=flow;
  // Their information has been projected above, while the raw version and hash remain in the review dossier.
  for(const key of ['presentationPolicy','taskDefinition','designDetail','stimulusDelivery','fields','displayPolicy','integrationVisibility','phases','legacyOriginal','learnerSurface','teacherExpected'])delete item[key];
  if(Array.isArray(item.dependsOnItemIds)&&!item.dependsOnItemIds.length)delete item.dependsOnItemIds;
  return {item,issues};
}
