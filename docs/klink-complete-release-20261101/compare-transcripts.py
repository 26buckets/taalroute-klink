from pathlib import Path
import difflib, hashlib, json, re, unicodedata

folder = Path(__file__).resolve().parent
plans = [json.loads((folder / f).read_text()) for f in ['voice-plan.json','voice-plan-b1.json','voice-plan-existing-sentences.json', 'voice-plan-reused-audio.json']]
basic = ['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen','tien','elf','twaalf','dertien','veertien','vijftien','zestien','zeventien','achttien','negentien']
tens = {20:'twintig',30:'dertig',40:'veertig',50:'vijftig',60:'zestig',70:'zeventig',80:'tachtig',90:'negentig'}
def number(n):
    if n < 20: return basic[n]
    if n < 100: return (basic[n%10]+'en' if n%10 else '')+tens[n//10*10]
    if n < 1000: return (basic[n//100] if n>=200 else '')+'honderd'+(number(n%100) if n%100 else '')
    if n < 10000: return (number(n//1000) if n>=2000 else '')+'duizend'+(number(n%1000) if n%1000 else '')
    return str(n)
def normalize(text):
    text = ''.join(c for c in unicodedata.normalize('NFKD',text.lower()) if not unicodedata.combining(c))
    text = re.sub(r'\d+',lambda m:number(int(m.group())),text)
    text = re.sub(r'\bauw\b','au',text)
    return re.sub(r'[^a-z0-9]','',text)

records=[]
for clip in [c for plan in plans for c in plan['clips']]:
    transcript=json.loads((folder/'transcripts'/(clip['id']+'.json')).read_text())
    audio=folder.parents[1]/('public'+clip['src'])
    assert transcript['expectedTextProvided'] is False
    assert hashlib.sha256(audio.read_bytes()).hexdigest()==transcript['sha256']
    expected,heard=normalize(clip['text']),normalize(transcript['text'])
    records.append({'id':clip['id'],'source':clip['text'],'heard':transcript['text'],
                    'equalAfterSpellingNumberNormalization':expected==heard,
                    'ratio':round(difflib.SequenceMatcher(None,expected,heard,autojunk=False).ratio(),5),
                    'audioSha256':transcript['sha256']})
result={'checked':len(records),'exactOrNumberSpellingEqual':sum(r['equalAfterSpellingNumberNormalization'] for r in records),
        'records':records,'differences':[r for r in records if not r['equalAfterSpellingNumberNormalization']],
        'normalization':'case, punctuation, spacing, accents, Dutch number spelling and au/auw only; no source prompt supplied',
        'humanListeningReview':False}
(folder/'transcript-comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checked':result['checked'],'exactOrNumberSpellingEqual':result['exactOrNumberSpellingEqual'],
                  'differences':len(result['differences'])}))
