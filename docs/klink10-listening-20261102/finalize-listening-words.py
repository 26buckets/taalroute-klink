import json,hashlib,subprocess
from pathlib import Path
R=Path(__file__).resolve().parent.parent.parent/'work/klink10-20261102';D=R/'docs/klink10-listening-20261102'
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def packets(p):
 r=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_data_hash','sha256','-of','json',str(p)]))
 return [x['data_hash']for x in r['packets']]
p=json.loads((D/'voice-plan-word-sources.json').read_text());c=p['clips'][0];source=R/('public'+c['src']);old=json.loads((D/'recordings'/(c['id']+'.json')).read_text());assert sha(source.read_bytes())==old['sha256']
asr=json.loads((D/'diagnostics/word-cuts-asr.json').read_text());assert asr[0]['recognized'].strip().lower()=='tasje.'
id='k10l-tasje-context-extract-20261102';src='/package-audio/klink10-listening-20261102/'+id+'.mp3';out=R/('public'+src)
metadata={'artist':'Taalroute','album_artist':'Taalroute','publisher':'Taalroute','album':'Klink - Taalroute','title':'tasje','copyright':'Taalroute'}
subprocess.run(['ffmpeg','-v','error','-y','-ss','1.36','-i',str(source),'-map_metadata','-1','-c:a','copy',*[v for k,val in metadata.items()for v in ['-metadata',k+'='+val]],'-metadata','encoder=',str(out)],check=True)
a,b=packets(source),packets(out);assert any(a[i:i+len(b)]==b for i in range(len(a)))
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(out)]));assert all(probe['format']['tags'][k]==v for k,v in metadata.items());subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
clip={**c,'id':id,'text':'tasje','title':'tasje','src':src,'textSha256':sha(b'tasje')};record={**clip,'status':'generated-and-verified','sha256':sha(out.read_bytes()),'metadata':probe['format']['tags'],'duration':float(probe['format']['duration']),'metadataVerified':True,'fullDecodeVerified':True,'audioPacketsUnchanged':True,'audioPacketsScope':'All extracted MP3 packets form one contiguous unmodified subset of source packets; no re-encoding.','derivedFrom':c['id'],'sourceSha256':old['sha256'],'extractionStartSeconds':1.36,'verifiedSilenceBoundary':[1.216213,1.529864],'humanListeningReview':False};save(D/'recordings'/(id+'.json'),record)
repairs=json.loads((D/'repair-map.json').read_text());orig=json.loads((D/'voice-plan-words.json').read_text())['clips'];tasje=next(x for x in orig if x['word']=='tasje');af=next(x for x in orig if x['word']=='afmeldt');repairs[tasje['id']]={'replacement':clip,'reason':'Complete final word extracted at verified silence boundary, unmodified audio packets; isolated and contextual ASR both exact.'};repairs.pop(af['id'],None);save(D/'repair-map.json',repairs)
save(D/'audio-transcription-word-extraction.json',{'clips':[{'id':id,'expected':'tasje','recognized':asr[0]['recognized'],'normalizedExact':True,'basis':'identical extracted audio packets to diagnostics/tasje-cut.mp3','humanListening':False}]})
assert packets(out)==packets(D/'diagnostics/tasje-cut.mp3')
save(D/'phonetic-review.json',[{'id':af['id'],'technicalAccepted':True,'humanListeningPerformed':False,'expected':'afmeldt','recognized':'Afmeld','reason':'Dutch final devoicing makes written final d and dt here the same spoken /t/. Both independent recognitions retain the complete afmeld stem. This is a spelling-only ambiguity; no substitution or missing spoken segment is required. No general d/t normalization is applied.','scope':'Only this isolated target-word recording; learner text remains afmeldt.'}])
print('Extracted tasje without re-encoding; afmeldt orthographic ambiguity recorded separately.')
