import json,pathlib,re,unicodedata
import mlx_whisper
p=pathlib.Path('docs/content-repair-20261030');a=json.loads((p/'audio-review.json').read_text())
# An appropriate Klink album need not repeat the artist's brand in its title.
for r in a:
 tags={k.lower():v for k,v in r['tags'].items()};r['metadataPassed']=all(tags.get(k)=='Taalroute' for k in ['artist','album_artist','publisher']) and tags.get('album','').startswith('Klink') and not re.search('suno|elevenlabs|openai|generator',json.dumps(tags),re.I)
(p/'audio-review.json').write_text(json.dumps(a,ensure_ascii=False,indent=2))
model=str(next(pathlib.Path('/Users/nicoknoester/.cache/huggingface/hub/models--mlx-community--whisper-large-v3-mlx/snapshots').iterdir()))
ids=['97dcb1260f4ed75b863f','f4b61d04f5a277c2da13','ad2020f5858c061686be','cd98dabc451a0e0a2be6','c7e014cdd5741a907a5e','40a1735ef1a2fda063fc','klink-woord-bij.wav'];out=[]
for r in a:
 if any(id in r['src'] for id in ids):
  res=mlx_whisper.transcribe('public'+r['src'],path_or_hf_repo=model,language='nl',condition_on_previous_text=False,temperature=0,verbose=None)
  out.append({'src':r['src'],'expected':r['text'],'first':r['transcription'],'second':res['text'].strip()});(p/'audio-second-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(len(out),flush=True)
