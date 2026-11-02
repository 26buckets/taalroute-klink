import re,unicodedata
NUMBERS=['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen','tien','elf','twaalf','dertien','veertien','vijftien','zestien','zeventien','achttien','negentien','twintig','eenentwintig','tweeentwintig','drieentwintig','vierentwintig']
def normalize(text):
 text=''.join(c for c in unicodedata.normalize('NFD',text.lower()) if unicodedata.category(c)!='Mn')
 text=re.sub(r'\b\d+\b',lambda m:NUMBERS[int(m[0])] if int(m[0])<len(NUMBERS) else m[0],text)
 text=re.sub(r'\bsarah\b','sara',text);text=re.sub(r'\brashid\b','rachid',text)
 return ''.join(re.findall(r'\w+',text))
