'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The scrollable explanation needs keyboard access while the close buttons stay visible. */
import {useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {Info,X} from 'lucide-react';
import {Dialog,DialogClose,DialogContent,DialogTitle,DialogTrigger} from '@/components/ui/dialog';
import {learningGoalFor} from '@/lib/learning-goals';
import type {PackageExercise} from '@/lib/package-content';
import type {ContentTask} from '@/lib/imported-practice-contract';

export function LearnerExerciseInfo({exercise,onHelp,showTrigger=true,children}:{exercise:PackageExercise;onHelp:()=>void;showTrigger?:boolean;children?:ReactNode}) {
  const [open,setOpen]=useState(false),[style,setStyle]=useState<CSSProperties>({});
  const trigger=useRef<HTMLButtonElement>(null),close=useRef<HTMLButtonElement>(null);
  const goal=learningGoalFor(exercise),task=exercise.contentTask as ContentTask|undefined;
  const steps=task&&!task.teacherWorkflow ? [task.stimulus?'Lees de vraag en de tekst.':'Lees de vraag rustig.',task.mode==='choice'?task.correctOptionIds.length>1?'Kies alle passende antwoorden.':'Kies één antwoord dat past.':task.mode==='text'?'Schrijf je antwoord in het invulvak.':'Geef je antwoord. Je mag het zeggen of opschrijven.',task.mode==='teacher'?'Bespreek je antwoord. Kies daarna Gedaan en besproken.':'Klik op Controleer. Daarna kies je Verder.'] : [exercise.title||'Bekijk de opdracht.','Voer de opdracht op het scherm uit. Neem rustig je tijd.','Gebruik de knop onder de opdracht om verder te gaan.'];
  const tip=task ? task.mode==='teacher'?'Oefen samen en bespreek wat je al kunt.':task.mode==='choice'&&task.stimulus?'Lees de zin ervoor en erna. Welke keuze past bij de situatie?':'Lees de vraag nog eens en probeer opnieuw.' : exercise.requiresAudio?'Luister nog een keer. Vergelijk met het voorbeeld als dat beschikbaar is.':'Bekijk de opdracht nog eens. Probeer rustig opnieuw.';
  const button=showTrigger&&<DialogTrigger ref={trigger} className="secondary-button cp-content-info-button" aria-label="Over deze oefening" title="Over deze oefening"><Info aria-hidden="true"/></DialogTrigger>;
  return <Dialog open={open} onOpenChange={next=>{
    if(next){
      if(trigger.current){const theme=getComputedStyle(trigger.current),dark=Boolean(trigger.current.closest('[data-theme="dark"],.dark')),colors=goal?.colors[dark?'dark':'light'];
        setStyle({...Object.fromEntries(['--ink','--muted','--primary','--primary-dark','--paper','--canvas','--line-strong','--focus','--radius'].map(name=>[name,theme.getPropertyValue(name)])),fontFamily:theme.fontFamily,colorScheme:dark?'dark':'light',...(colors?{'--goal-background':colors.background,'--goal-foreground':colors.foreground}:{})} as CSSProperties);
      }
      onHelp();
    }
    setOpen(next);
  }}>
    {children?<div className="cp-content-question">{children}{button}</div>:button}
    {open&&<DialogContent className="cp-learner-info" style={style} showCloseButton={false} initialFocus={close} aria-describedby={undefined}>
      <header><DialogTitle>Over deze oefening</DialogTitle><DialogClose ref={close} className="secondary-button" aria-label="Uitleg sluiten"><X aria-hidden="true"/></DialogClose></header>
      <section className="cp-learner-info-body" aria-label="Uitleg bij deze oefening" tabIndex={0}>
        {goal&&<section className="cp-learner-goal" data-learning-goal={goal.id} data-goal-family={goal.family}><h3>Wat oefen je?</h3><div className="cp-learning-goal-labels">{goal.displayLabels.map(label=><span key={label}>{label}</span>)}</div><p>{goal.learnerText}</p></section>}
        <section><h3>Zo oefen je</h3><ol>{steps.map((step,index)=><li key={index}>{step}</li>)}</ol></section>
        <section className="cp-learner-info-tip"><h3>Als je twijfelt</h3><p>{tip}</p></section>
      </section>
      <DialogClose className="secondary-button cp-learner-info-return">Terug naar de oefening</DialogClose>
    </DialogContent>}
  </Dialog>;
}
