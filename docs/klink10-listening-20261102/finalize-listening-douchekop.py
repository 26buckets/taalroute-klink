import json,hashlib,subprocess
from pathlib import Path
R=Path(__file__).resolve().parent.parent.parent/'work/klink10-20261102';D=R/'docs/klink10-listening-20261102'
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def packets(p):
 r=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_data_hash','sha256','-of','json',str(p)]))
 return [x['data_hash']for x in r['packets']]
c=json.loads((D/'diagnostics/douchekop-option.json').read_text());source=R/('public'+c['src']);old=json.loads((D/'recordings'/(c['id']+'.json')).read_text());assert sha(source.read_bytes())==old['sha256']
asr=json.loads((D/'diagnostics/douchekop-option-cut-asr.json').read_text());assert asr['text'].strip().lower()=='douchekop?'
id='k10l-douchekop-option-extract-20261102';src='/package-audio/klink10-listening-20261102/'+id+'.mp3';out=R/('public'+src)
metadata={'artist':'Taalroute','album_artist':'Taalroute','publisher':'Taalroute','album':'Klink - Taalroute','title':'douchekop','copyright':'Taalroute'}
subprocess.run(['ffmpeg','-v','error','-y','-ss','0.17','-i',str(source),'-map_metadata','-1','-c:a','copy',*[v for k,val in metadata.items()for v in ['-metadata',k+'='+val]],'-metadata','encoder=',str(out)],check=True)
a,b=packets(source),packets(out);assert any(a[i:i+len(b)]==b for i in range(len(a)))
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(out)]));assert all(probe['format']['tags'][k]==v for k,v in metadata.items());subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
clip={**c,'id':id,'text':'douchekop','title':'douchekop','src':src,'textSha256':sha(b'douchekop')};record={**clip,'status':'generated-and-verified','sha256':sha(out.read_bytes()),'metadata':probe['format']['tags'],'duration':float(probe['format']['duration']),'metadataVerified':True,'fullDecodeVerified':True,'audioPacketsUnchanged':True,'audioPacketsScope':'All extracted MP3 packets form one contiguous unmodified subset of source packets; no re-encoding.','derivedFrom':c['id'],'sourceSha256':old['sha256'],'extractionStartSeconds':0.17,'verifiedSilenceBoundary':[0.158639,0.198503],'humanListeningReview':False};save(D/'recordings'/(id+'.json'),record)
repairs=json.loads((D/'repair-map.json').read_text());orig=json.loads((D/'voice-plan-words.json').read_text())['clips'];target=next(x for x in orig if x['word']=='douchekop');repairs[target['id']]={'replacement':clip,'reason':'Complete word extracted from approved option recording at inter-word silence; isolated and contextual ASR exact. All extracted MP3 packets unchanged.'};save(D/'repair-map.json',repairs)
assert packets(out)==packets(D/'diagnostics/douchekop-option-cut.mp3')
save(D/'audio-transcription-douchekop-extraction.json',{'clips':[{'id':id,'expected':'douchekop','recognized':asr['text'],'normalizedExact':True,'basis':'identical extracted audio packets to diagnostics/douchekop-option-cut.mp3','humanListening':False}]})
print('Complete douchekop extracted and independently recognized.')
