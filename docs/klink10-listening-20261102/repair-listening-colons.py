import json,hashlib
from pathlib import Path
T=Path(__file__).resolve().parent;R=T.parent.parent/'work/klink10-20261102';D=R/'docs/klink10-listening-20261102';S=T/'staging/listening';source={x['id']:x for x in json.load(open(D/'source.json'))};p=json.load(open(D/'voice-plan.json'));p['clips']=[];repairs=json.load(open(D/'repair-map.json'))
for eid in ['KLINK-LUI-P01-A2-understand-001','KLINK-LUI-P01-B1-text-question-001']:
 s=source[eid];text=s['promptAudioScript'];cid='k10l-full-source-'+hashlib.sha256(text.encode()).hexdigest()[:16];c={'id':cid,'text':text,'title':text,'role':'narrator','voiceId':p['roleVoices']['narrator'],'src':'/package-audio/klink10-listening-20261102/'+cid+'.mp3','textSha256':hashlib.sha256(text.encode()).hexdigest()};p['clips'].append(c)
 for f in S.glob('klink10-listening-*.json'):
  b=json.load(open(f));e=next((e for e in b['exercises']if e['exerciseId']==eid),None)
  if not e:continue
  old=e['sourceBlocks'][0]['audio']['audioId'];repairs[old]={'replacement':c,'reason':'Restore complete source sentence: narrative colon was incorrectly treated as a speaker separator during staging.'};e['sourceBlocks'][0].pop('speaker',None);e['sourceBlocks'][0]['text']=text;e['textBlocks']=e['sourceBlocks'];e['sourceText']=text;f.write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
p['characters']=sum(len(c['text'])for c in p['clips']);(D/'voice-plan-source-repair.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');(D/'repair-map.json').write_text(json.dumps(repairs,ensure_ascii=False,indent=2)+'\n');f=D/'generate-audio.mjs';s=f.read_text().replace("'word-final'].includes","'word-final','source-repair'].includes");f.write_text(s)
f=T/'prepare-listening.py';s=f.read_text().replace("dialogue=all(':' in line for line in lines)","dialogue=activity in ['dialogue-question','suitable-reply'] and all(':' in line for line in lines)");f.write_text(s)
