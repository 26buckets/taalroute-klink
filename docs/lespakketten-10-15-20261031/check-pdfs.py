import pathlib,json,re,hashlib,io
import pymupdf as fitz
from PIL import Image,ImageDraw
R=pathlib.Path('/Users/nicoknoester/.cache/klink-docent-10-15-20261031');W=pathlib.Path(__file__).resolve().parent
D=R/'docs/lespakketten-10-15-20261031';D.mkdir(parents=True,exist_ok=True)
V=W/'pdf-review';V.mkdir(exist_ok=True)
ls=json.loads((R/'data/klink-docent-extra-lessons-10-15.json').read_text());records=[];ppis=[]
for l in ls:
 tiles=[]
 for c,s in l['worksheet']['rounds'].items():
  for kind in ['pdf','answerPdf']:
   path=R/'public'/s[kind].lstrip('/');doc=fitz.open(path);assert len(doc)==2
   for n,page in enumerate(doc):
    assert abs(page.rect.width-595.276)<1 and abs(page.rect.height-841.89)<1
    assert not re.search(r'\bAlfa\s*[ABC]\b|KPD-|proefversie|inhoudskandidaat|schema|importgarantie|\[TEKENVAK\]',page.get_text(),re.I),(path,n)
    for b in page.get_text('blocks'):assert b[0]>=0 and b[1]>=0 and b[2]<=page.rect.width+.1 and b[3]<=page.rect.height+.1,(path,n,b[:4])
    for im in page.get_image_info():
     b=fitz.Rect(im['bbox']);ppi=min(im['width']*72/b.width,im['height']*72/b.height);assert ppi>=299,(path,ppi);ppis.append(ppi)
    pix=page.get_pixmap(matrix=fitz.Matrix(.56,.56));im=Image.open(io.BytesIO(pix.tobytes('png')));tiles.append((c+' '+kind+' '+str(n+1),im))
   records.append(dict(lesson=l['id'],round=c,kind=kind,pages=2,path=str(path.relative_to(R)),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
  # Exact word/sentence kernels occur on the intended source sheet.
  if c=='c':
   text='\n'.join(p.get_text()for p in fitz.open(R/'public'/s['pdf'].lstrip('/')))
   for source in l['source']['text']:
    assert re.sub(r'\s+','',source)in re.sub(r'\s+','',text),(l['id'],source)
 p=R/'public'/l['worksheet']['planPdf'].lstrip('/');doc=fitz.open(p)
 for page in doc:
  for b in page.get_text('blocks'):assert b[0]>=0 and b[1]>=0 and b[2]<=page.rect.width+.1 and b[3]<=page.rect.height+.1,(p,b[:4])
 contact=Image.new('RGB',(1360,1530),'#ddd');draw=ImageDraw.Draw(contact)
 for i,(label,im)in enumerate(tiles):
  x=i%4*340;y=i//4*510;contact.paste(im,(x,y+25));draw.text((x+8,y+7),l['id']+' '+label,fill='black')
 contact.save(V/(l['id']+'.png'))
result=dict(checkedPdfs=len(records),checkedPages=len(records)*2,teacherPlans=20,studentFiles=60,answerFiles=60,minEffectivePpi=min(ppis),originalRasterSufficientAtPlacedSize=True,kreaEnhancementProven=False,physicalPrint=False,allPagesRendered=True,records=records)
(D/'pdf-checks.json').write_text(json.dumps(result,indent=2)+'\n')
for word in ['maand','tand','kook','meer']:
 l=next(l for l in ls if l['id']==word);p=R/'public'/l['worksheet']['rounds']['a']['pdf'].lstrip('/');d=fitz.open(p);d[0].get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(V/(word+'-detail.png'))
print('PASS',len(records),'two-page PDFs,',len(records)*2,'pages, 20 full plans; minimum',round(min(ppis),1),'ppi')
