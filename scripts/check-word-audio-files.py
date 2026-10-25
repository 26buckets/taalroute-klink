import concurrent.futures, hashlib, json, subprocess
from pathlib import Path

evidence=Path('docs/klink-wordaudio-publication-20261025')
manifest_file=evidence/'audio-manifest.json'
manifest=json.loads(manifest_file.read_text())
assert len(manifest)==4790 and len({row['id'] for row in manifest})==4790
def check(row):
    file=Path('public'+row['src']);data=file.read_bytes()
    assert hashlib.sha256(data).hexdigest()==row['sha256'],row['id']
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)]))
    tags=probe['format']['tags']
    for field in ['artist','album_artist','publisher']:assert tags[field]=='Taalroute',row['id']
    assert tags['album']=='Klink - Taalroute' and tags['title']==row['text'] and not tags.get('encoder'),row['id']
    assert tags==row['metadata'],row['id']
    assert probe['streams'][0]['codec_name']=='mp3' and int(probe['streams'][0]['sample_rate'])==44100,row['id']
    subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True,capture_output=True)
    return {'id':row['id'],'sha256':row['sha256'],'metadataPassed':True,'decodedToEnd':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(check,manifest))
report={'checked':len(results),'failed':0,'manifestSha256':hashlib.sha256(manifest_file.read_bytes()).hexdigest(),'allMetadataAndDecodingPassed':True,'files':results}
(evidence/'audio-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='files'}),flush=True)
