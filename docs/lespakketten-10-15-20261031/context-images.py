import pathlib,calendar
import pymupdf as fitz
from reportlab.pdfgen import canvas
R=pathlib.Path('/Users/nicoknoester/.cache/klink-docent-10-15-20261031/public/docent-werkbladen/lespakketten-10-15');R.mkdir(parents=True,exist_ok=True)
def finish(c,name):
 c.showPage();c.save();d=fitz.open(R/(name+'.pdf'));d[0].get_pixmap(matrix=fitz.Matrix(2,2)).save(R/(name+'.png'))
def base(name):
 c=canvas.Canvas(str(R/(name+'.pdf')),pagesize=(600,440));c.setTitle('Klink - '+name);c.setAuthor('Taalroute');c.setCreator('Taalroute');c.setLineWidth(2);c.rect(4,4,592,432);return c
c=base('maand-kalenders')
for month,label,x in [(4,'APRIL 2027 - NU',25),(5,'MEI 2027',315)]:
 c.setFont('Helvetica',19);c.drawCentredString(x+125,390,label);c.setFont('Helvetica',12)
 for j,n in enumerate(['ma','di','wo','do','vr','za','zo']):c.drawCentredString(x+19+j*35,350,n)
 for row,week in enumerate(calendar.monthcalendar(2027,month)):
  for col,day in enumerate(week):
   c.rect(x+col*35,295-row*43,35,43)
   if day:c.drawCentredString(x+17+col*35,311-row*43,str(day))
c.setFont('Helvetica',14);c.drawCentredString(300,30,'Oefensituatie: het is nu april 2027.')
finish(c,'maand-kalenders')
c=base('meer-soep')
for x,h,label in [(160,24,'EERST'),(440,90,'DAARNA')]:
 c.setFont('Helvetica',20);c.drawCentredString(x,380,label)
 # Same bowl in a simple side section; liquid remains level and supported.
 c.setFillColorRGB(1,.97,.90);p=c.beginPath();p.moveTo(x-105,270);p.lineTo(x-70,125);p.curveTo(x-30,112,x+30,112,x+70,125);p.lineTo(x+105,270);p.close();c.drawPath(p,fill=1,stroke=1)
 bottom=125;top=bottom+h;lower=70;upper=70+h*35/145
 c.setFillColorRGB(.92,.63,.25);p=c.beginPath();p.moveTo(x-lower,bottom);p.lineTo(x-upper,top);p.lineTo(x+upper,top);p.lineTo(x+lower,bottom);p.curveTo(x+30,112,x-30,112,x-lower,bottom);p.close();c.drawPath(p,fill=1,stroke=0)
 c.setFillColorRGB(0,0,0);c.setFont('Helvetica',15);c.drawCentredString(x,70,'bijna leeg'if h==24 else'meer soep')
finish(c,'meer-soep')
c=base('maak-kaart')
c.setFillColorRGB(1,.99,.95);c.rect(145,45,310,350,fill=1,stroke=1)
c.setFillColorRGB(.8,.9,.75);c.rect(297,135,6,115,fill=1,stroke=0)
for x,y in [(280,285),(320,285),(265,250),(335,250),(280,215),(320,215)]:
 c.setFillColorRGB(.95,.79,.8);c.circle(x,y,28,fill=1,stroke=1)
c.setFillColorRGB(1,.85,.3);c.circle(300,250,27,fill=1,stroke=1)
c.setFillColorRGB(0,0,0);c.setFont('Helvetica',22);c.drawCentredString(300,85,'Nora')
finish(c,'maak-kaart')
print('Three framed source-based context diagrams: calendars, soup quantity and a flower card.')
