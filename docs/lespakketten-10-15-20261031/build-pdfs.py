import hashlib,io,json,pathlib,re,sys
from html import escape
import pymupdf as fitz
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph,SimpleDocTemplate,Spacer,PageBreak

ROOT=pathlib.Path(__file__).resolve().parent
REPO=pathlib.Path('/Users/nicoknoester/.cache/klink-docent-10-15-20261031')
PUBLIC=REPO/'public'
OUT=PUBLIC/'docent-werkbladen/lespakketten-10-15'
OUT.mkdir(parents=True,exist_ok=True)
lessons=json.loads((ROOT/'repaired-lessons.json').read_text())
words={x['word']:next(w for w in x['matches']if w['id']=='klink-woord-'+x['word'])for x in json.loads((ROOT/'canonical-words.json').read_text())}
pdfmetrics.registerFont(TTFont('Arial','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
style=ParagraphStyle('body',fontName='Arial',fontSize=10.7,leading=13.2,textColor='#171717',spaceAfter=0)
title_style=ParagraphStyle('task',parent=style,fontName='ArialBold',fontSize=11.5,leading=14)
page_w,page_h=A4
logo_svg=(PUBLIC/'taalroute-menu/klink.svg').read_bytes()
logo_pdf=fitz.open(stream=logo_svg,filetype='svg').convert_to_pdf()
logo=fitz.open(stream=logo_pdf,filetype='pdf')
records=[];checks=[]

def para(c,text,x,y,width,sty=style):
    text=escape(text).replace('\n','<br/>')
    p=Paragraph(text,sty);_,h=p.wrap(width,1000);p.drawOn(c,x,y-h)
    return y-h

def header(c,lesson,label,page,total):
    c.setTitle(f'Klink+docent - {lesson["worksheet"]["title"]} - {label}')
    c.setAuthor('Taalroute');c.setCreator('Taalroute');c.setSubject('Onderwijsmateriaal bij de Klink-les; definitieve drukcontrole afzonderlijk uitvoeren.')
    c.setFont('ArialBold',9);c.drawRightString(page_w-37,page_h-43,label.upper())
    c.setLineWidth(1);c.line(37,page_h-65,page_w-37,page_h-65)
    c.setFont('ArialBold',18);c.drawString(37,page_h-93,lesson['display'].upper())
    c.setFont('Arial',9);c.drawRightString(page_w-37,page_h-110,'Naam: _______________________')
    if lesson.get('contextCaption'):c.drawString(37,page_h-110,lesson['contextCaption'])
    c.setStrokeColorRGB(.55,.55,.55);c.setLineWidth(.5);c.line(37,40,page_w-37,40)
    c.setFont('Arial',8);c.setFillColorRGB(.3,.3,.3);c.drawString(37,26,f'{lesson["worksheet"]["title"]} · {label}');c.drawRightString(page_w-37,26,f'{page} / {total}');c.setFillColorRGB(.09,.09,.09)

def source_picture(lesson,item,code):
    return lesson['id'] if item.get('visual')==lesson['id'] else None

def picture(c,name,x,y,width=82,height=72):
    lesson=next(l for l in lessons if l['id']==name)
    path=PUBLIC/lesson.get('boardImage',words[name]['image']).lstrip('/')
    if path.suffix=='.svg':
        doc=fitz.open(path); pix=doc[0].get_pixmap(matrix=fitz.Matrix(4,4));path=OUT/(name+'-source.png');pix.save(path)
    c.drawImage(str(path),x,y,width=width,height=height,preserveAspectRatio=True,anchor='c',mask='auto')
    c.setLineWidth(.6);c.rect(x,y,width,height)
    with Image.open(path)as im:assert min(im.width/(width/72),im.height/(height/72))>=300,(name,im.size)
    return None

def body_text(item):
    t=item['body']
    t=re.sub(r'\[(?:SCHEMATISCHE[^]]*|BED[^]]*|HUIS[^]]*|DAK[^]]*|TEKENVLAK)\]','',t)
    t=re.sub(r'_{8,}','____________________',t)
    t=t.replace('[TEKENVAK]', '').replace('[tekenvak]', '').replace('doelwoord', 'woord')
    t=t.replace('schets van de beroepskok','foto van de kok').replace('tekening van het dier','foto van het dier')
    t=re.sub(r'\[\s*\]','□',t)
    return t.strip()

def worksheet(lesson,code,answers=False):
    sheet=lesson['worksheet']['rounds'][code]
    path=PUBLIC/(sheet['answerPdf']if answers else sheet['pdf']).lstrip('/')
    c=canvas.Canvas(str(path),pagesize=A4,pageCompression=1)
    overlays=[]
    for side in range(2):
        header(c,lesson,sheet['title']+(' · Antwoorden'if answers else ''),side+1,2)
        top=page_h-125;bottom=52;row=(top-bottom)/5
        for offset,item in enumerate(sheet['answers'][side*5:side*5+5]):
            y=top-offset*row;low=y-row+8
            c.setLineWidth(.5);c.setStrokeColorRGB(.3,.3,.3);c.line(37,y,page_w-37,y)
            c.rect(37,y-25,18,18);c.setFont('Arial',10);c.drawCentredString(46,y-21,str(item['number']))
            title=item['title']
            ty=para(c,title,64,y-8,page_w-101,title_style)-8
            if answers:
                text='Antwoord: '+item['answer']
                if item['oral']:text+='\nVoorlezen: '+item['oral']
                elif 'luister'in item['title'].lower()and item['action']:text+='\nVoorlezen en hulp: '+item['action']
                if item['criteria']:text+='\nCriterium: '+item['criteria']
                end=para(c,text,64,ty,page_w-101)
                assert end>=low-1,(lesson['id'],code,item['number'],'answer overflow',end,low)
            else:
                pic=source_picture(lesson,item,code)
                width=page_w-101-(100 if pic else 0)
                text=body_text(item)
                choices=list(re.finditer(r'(?:Rij\s*)?(\d)\s*[:.]?\s*(?=□)',text,re.I))
                if item.get('searchRows'):
                    end=ty
                    for options in item['searchRows']:
                        cell=(page_w-105)/max(4,len(options))
                        for k,word in enumerate(options):
                            x=65+k*cell;c.rect(x,end-22,cell-10,25);c.setFont('Arial',10.7);c.drawCentredString(x+(cell-10)/2,end-12,word)
                        end-=33
                elif item.get('boxRows'):
                    end=ty
                    if re.search(r'zet|maak het woord',item['title'],re.I):end=para(c,re.sub(r'□|\[\s*\]','',text),64,ty,page_w-101)-5
                    for boxrow in item['boxRows']:
                        if boxrow['label']:c.setFont('Arial',10);c.drawString(68,end-17,boxrow['label'])
                        start=130 if boxrow['label']else 70
                        for k in range(boxrow['count']):c.rect(start+k*37,end-27,28,24)
                        end-=38
                elif len(choices)>=2:
                    row_y=ty-7
                    for k,m in enumerate(choices):
                        stop=choices[k+1].start()if k+1<len(choices)else len(text)
                        letters=re.findall(r'□\s*([^\s|;]+)',text[m.end():stop])
                        c.setFont('Arial',10.7);c.drawString(68,row_y,m.group(1))
                        for j,letter in enumerate(letters):
                            x=114+j*84;c.rect(x,row_y-1,8,8);c.drawString(x+15,row_y,letter.rstrip('.,;'))
                        row_y-=19
                    end=row_y
                elif item['layout']=='matching':
                    letters=item.get('matchUnits',list(lesson['id']));left=letters;right=letters[::-1]
                    for k,(a,b)in enumerate(zip(left,right)):
                        c.setFont('Arial',14);c.drawString(135,ty-13-k*18,a);c.drawString(360,ty-13-k*18,b)
                    end=ty-len(letters)*18-8
                elif item['layout']=='trace'or('trek'in item['title'].lower()and'over'in item['title'].lower())or('overtrek'in text.lower()):
                    c.setFont('Arial',25);c.setFillColorRGB(.72,.72,.72);c.drawString(70,ty-31,'   '.join(lesson['id']));c.setFillColorRGB(.09,.09,.09);end=ty-42
                    for k in range(2):c.line(70,end-14-k*20,page_w-142,end-14-k*20)
                    end-=35
                else:
                    end=para(c,text,64,ty,width)
                    layout=item['layout'].lower()
                    draw_task=re.search(r'^teken|tekenvak',item['title'],re.I)or'getekend'in text
                    if draw_task:
                        height=max(22,min(52,end-low-8));panels=item.get('drawingPanels',1);width=(page_w-105-(panels-1)*12)/panels
                        for k in range(panels):c.rect(65+k*(width+12),low+3,width,height)
                        end=low+3
                    elif not re.search(r'□|\(\s*\)',text)and end-low>22:
                        count=2 if 'twee'in text or 'write-two'in layout else 1
                        for k in range(count):c.line(65,end-16-k*18,page_w-(142 if pic else 37),end-16-k*18)
                        end-=count*18
                if pic:
                    h=min(72,y-low-34);ov=picture(c,pic,page_w-125,low+8,82,h)
                    if ov:overlays.append((side,ov))
                assert end>=low-1,(lesson['id'],code,item['number'],'student overflow',end,low)
            c.setStrokeColorRGB(.3,.3,.3)
        c.showPage()
    c.save()
    doc=fitz.open(path)
    for page in doc:page.show_pdf_page(fitz.Rect(37,24,128,57),logo,0)

    doc.saveIncr();assert len(doc)==2
    if not answers:
        for n,page in enumerate(doc,1):page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),alpha=False).save(PUBLIC/sheet['previews'][n-1].lstrip('/'))
    for p in doc:
        assert not re.search(r'\bAlfa\s*[ABC]\b|inhoudskandidaat|proefversie|KPD-|source_not|schema|importgarantie',p.get_text(),re.I)
    records.append(dict(path=str(path.relative_to(REPO)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),pages=2))

def plan(lesson):
    path=OUT/f'{lesson["id"]}-docentlesplan.pdf'
    title=ParagraphStyle('planTitle',parent=title_style,fontSize=16,leading=21,spaceAfter=12)
    body=ParagraphStyle('plan',parent=style,spaceAfter=7)
    flow=[Paragraph(escape(lesson['display'].capitalize())+' · Docentlesplan',title),Paragraph('Drie afzonderlijke lesrondes. Tijden zijn ontwerpvoorstellen voor actieve lestijd per ronde; pauze, papierverwerking en zelfstandige oefentijd staan apart. De les is gekoppeld aan het bestaande Klink-bronwoord. Deze uitwerking bewijst geen volledig taalniveau of praktijkvalidatie.',body)]
    for code,sheet in lesson['worksheet']['rounds'].items():
        r=lesson['routes'][code]
        if code!='a':flow.append(PageBreak())
        flow.extend([Paragraph(f'{sheet["title"]} · {sheet["level"]} · {sum(p["minutes"]for p in r["phases"])} minuten actieve bordtijd',title),Paragraph('Doel en voorbereiding: '+escape(r['goal'])+'. Controleer vooraf betekenis, klanken en alle woorden in de voorbeeldzin en tekst. Canonieke beschikbaarheid is geen bewijs van beheersing.',body)])
        for i,p in enumerate(r['phases'],1):
            flow.append(Paragraph(f'{i}. {escape(p["title"])} · {p["minutes"]} minuten',title_style))
            for key,label in [('prompt','Op het bord'),('visible','Zichtbare inhoud en benodigde opstelling'),('studentAction','Cursist'),('action','Docent'),('expected','Antwoord of criterium'),('hint','Hulp'),('feedback','Feedback'),('retry','Opnieuw'),('observe','Zichtbaar gedrag'),('materials','Materiaal'),('framework','Bestaande observatiepunten')]:
                if p.get(key):flow.append(Paragraph('<b>'+label+':</b> '+escape(str(p[key])).replace('\n','<br/>'),body))
            flow.append(Spacer(1,12))
        flow.append(PageBreak());flow.append(Paragraph('Werkblad '+sheet['title']+' · antwoorden en voorbereiding',title))
        for item in sheet['answers']:
            flow.append(Paragraph(f'{item["number"]}. {escape(item["title"])}',title_style))
            for key,label in [('body','Opdracht'),('answer','Antwoord'),('oral','Voorlezen'),('action','Voorbereiding en docenthandeling'),('criteria','Beoordeling')]:
                if item.get(key):flow.append(Paragraph('<b>'+label+':</b> '+escape(str(item[key])).replace('\n','<br/>'),body))
            flow.append(Spacer(1,8))
    flow.extend([PageBreak(),Paragraph('Vervolg en controle',title),Paragraph('Plan herhaling in een werkelijk ingeroosterde volgende bijeenkomst. Observeer betekenis, nazeggen, kopiëren, zelfstandig lezen en schrijven afzonderlijk. De lesduur en eventuele herhaling worden door de docent aan het echte rooster gekoppeld. Gebruik geen verplichte telefoon, camera of papierhandeling om in de bordles verder te gaan.',body),Paragraph('Bestaande woord- en klankopnamen worden hergebruikt; nieuwe zin- en tekstaudio is niet gemaakt. Lees de opgegeven zinnen zelf voor. Menselijke luisterbeoordeling, praktijktoetsing en fysieke proefdruk zijn niet als voltooid vastgelegd. Vergeet niet je afbeeldingen te boosten/controleren vóór het drukken.',body)])
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=44,title=f'Klink+docent - {lesson["worksheet"]["title"]} - Docentlesplan',author='Taalroute').build(flow)
    lesson['worksheet']['planPdf']='/'+str(path.relative_to(PUBLIC))
    records.append(dict(path=str(path.relative_to(REPO)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),pages=len(fitz.open(path))))

for lesson in lessons:
    for code in 'abc':worksheet(lesson,code);worksheet(lesson,code,True)
    plan(lesson)
    print(lesson['id'],'3 worksheets, 3 answer sheets, teacher plan built',flush=True)

    lesson['presentation']['ownPrompt']=lesson['routes']['c']['phases'][6]['prompt']
    lesson['presentation']['ownHint']=lesson['routes']['c']['phases'][6]['hint']
    lesson['presentation']['wordUse']=lesson['routes']['a']['phases'][5]['studentAction']
(REPO/'data/klink-docent-extra-lessons-10-15.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
(ROOT/'pdf-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
assert len(records)==140
print('Verified 60 two-page student PDFs, 60 matching two-page answer PDFs and 20 complete teacher plans.')
