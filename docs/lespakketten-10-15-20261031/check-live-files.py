import concurrent.futures,hashlib,json,pathlib,subprocess,sys,urllib.request
root=pathlib.Path(sys.argv[1]);expected=sys.argv[2];base='https://klink.taalroute.nl';work=pathlib.Path(__file__).resolve().parent/'live-files';work.mkdir(exist_ok=True)
release=json.loads(subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','30',base+'/release.json']));assert release['sourceCommit']==expected and release['branch']=='main' and release['sourceClean']is True,release
assets=json.loads((root/'docs/lespakketten-10-15-20261031/sources.json').read_text())['files'];audio=json.loads((root/'docs/lespakketten-10-15-20261031/audio-all-clips.json').read_text())['checks']
previousAssets=json.loads((root/'docs/lespakketten-1-9-20261031/sources.json').read_text())['files']
previousAudio=json.loads((root/'docs/lespakketten-1-9-20261031/audio-all-clips.json').read_text())['checks']
readingAudio=json.loads((root/'docs/leesrondes-audio-20261031/recordings.json').read_text())['recordings']
items=[dict(src='/'+a['path'].removeprefix('public/'),sha256=a['sha256'],type='asset')for a in assets+previousAssets]+[dict(src=a['src'],sha256=a['sha256'],type='audio')for a in audio+previousAudio+readingAudio]
items=list({row['src']:row for row in items}.values())
oldRelease=json.loads((root/'docs/leesrondes-audio-20261031/online/live-check.json').read_text())['release']
fingerprints=['curriculumEdition','lexiconExportSha256','sectionsSha256','sectionPhotosSha256','contentSha256']
for k in fingerprints:assert release[k]==oldRelease[k],k
def check(row):
    for attempt in range(3):
        try:
            data=subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','45',base+row['src']])
            assert hashlib.sha256(data).hexdigest()==row['sha256'],row['src'];break
        except Exception:
            if attempt==2:raise
    result=dict(row,bytes=len(data),byteIdentical=True)
    if row['type']=='audio':
        file=work/(hashlib.sha256(row['src'].encode()).hexdigest()+pathlib.Path(row['src']).suffix);file.write_bytes(data)
        tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(file)]))['format']['tags'];tags={k.lower():v for k,v in tags.items()}
        assert tags.get('artist')=='Taalroute' and tags.get('album_artist')=='Taalroute' and tags.get('publisher')=='Taalroute';assert 'Taalroute'in tags.get('album','')or tags.get('album','').startswith('Klink');result['embeddedBrandVerified']=True;result['tags']=tags
    return result
records=list(concurrent.futures.ThreadPoolExecutor(6).map(check,items))
result=dict(release=release,assetFiles=len(assets),reusedAudioFiles=len(audio),allByteIdentical=True,embeddedBrandVerified=True,previousPackageAssets=len(previousAssets),previousTeacherAudio=len(previousAudio),preservedReadingRecordings=len(readingAudio),contentFingerprintsPreserved=len(fingerprints),files=records)
(root/'docs/lespakketten-10-15-20261031/live-files.json').write_text(json.dumps(result,indent=2)+'\n')
print('PASS latest live commit,',len(assets),'new assets and',len(audio),'word/phoneme files; plus all prior package assets/audio and six reading recordings; exact bytes and embedded Taalroute brand retained')
