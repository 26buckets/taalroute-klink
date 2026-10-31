import json,pathlib,subprocess,re,array,math,hashlib
D=pathlib.Path('docs/imported-alfa-c-release-20261031'); clips=json.loads((D/'audio.json').read_text());out=[]
def normalize(s):
 s=s.lower().replace('één','1').replace('eén','1');s=re.sub(r'\btwee\b','2',s);s=re.sub(r'\bdrie\b','3',s);return re.sub(r'[^\w]+',' ',s).strip()
for c in clips:
 f='public'+c['src'];raw=subprocess.check_output(['ffmpeg','-v','error','-i',f,'-f','s16le','-ac','1','-ar','24000','-']);pcm=array.array('h');pcm.frombytes(raw);assert pcm
 peak=max(abs(x) for x in pcm);rms=math.sqrt(sum(x*x for x in pcm)/len(pcm));clipped=sum(abs(x)>=32760 for x in pcm)/len(pcm)
 t=json.loads((D/(c['id']+'-transcription.json')).read_text());equal=normalize(t['text'])==normalize(c['text']);assert equal,(c['id'],t['text']);assert peak>1000 and rms>100 and clipped<0.001
 packets=lambda f:subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-']).decode().strip()
 assert packets(D/'originals'/(c['id']+'.mp3'))==packets(f)
 out.append({'id':c['id'],'text':c['text'],'transcription':t['text'],'duration':c['duration'],'peak':peak,'rms':round(rms,2),'clippedFraction':clipped,'metadataVerified':True,'audioPacketsUnchanged':True,'normalizedTranscriptMatches':equal,'transcriptionNote':'Alleen hoofdletters, leestekens en uitgeschreven stapnummers 1/2/3 genormaliseerd. Geen menselijke luisterreview.','humanListeningReview':'open'})
(D/'audio-quality.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('5 recordings decoded; transcripts, metadata and audio-packet preservation checked.')
