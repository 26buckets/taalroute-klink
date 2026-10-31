'use client';

import Image from './compact-image';
import { Image as ImageIcon, Images, PanelsTopLeft, MessageCircleQuestion, FileImage } from 'lucide-react';
import { contentPackages } from '@/lib/package-content';
import { klinkContexts } from '@/lib/klink-context';
import { teacherPictureExamples } from '@/lib/teacher-picture-guide';

const icons = [ImageIcon, Images, PanelsTopLeft, MessageCircleQuestion, FileImage];
const pack = contentPackages.find(item => item.id === 'groep-1')!;
const map = pack.words.find(word => word.id === 'klink-woord-map')!;
const pan = pack.words.find(word => word.id === 'klink-woord-pan')!;
const scene = klinkContexts.find(item => item.id === 'situatie-map')!;

export function TeacherPictureGuide() {
  return <section className="cp-teacher-picture-guide" aria-labelledby="picture-guide-title" data-teacher-picture-guide>
    <h2 id="picture-guide-title">Van woordbeeld naar situatie</h2>
    <p>Vijf manieren om beelden te gebruiken. Het voorbeeld hieronder gaat steeds over <strong>de map mee naar de les nemen</strong>.</p>
    <nav className="cp-picture-growth" aria-label="Voorbeelden van beeldgebruik"><ol>{teacherPictureExamples.map((item, index) => {
      const Icon = icons[index];
      return <li key={item.id} data-picture-stage={item.id}><button type="button" onClick={() => { const target = document.getElementById(`picture-example-${item.id}`); target?.scrollIntoView({ block: 'start' }); target?.focus({ preventScroll: true }); }}><Icon aria-hidden="true" /><strong>{item.title}</strong><small>Bekijk voorbeeld</small></button></li>;
    })}</ol></nav>
    <p>Dit is uitleg voor de docent, geen nieuwe cursistreeks of vaste niveauladder. Kies één passend voorbeeld binnen het bestaande lesblok en boekdoel. Besteed er bijvoorbeeld twee minuten actieve lestijd aan; je hoeft niet alle vijf na elkaar te doen.</p>
    <div className="cp-picture-examples">{teacherPictureExamples.map((item, index) => <article key={item.id} id={`picture-example-${item.id}`} tabIndex={-1} data-picture-example={item.id}>
      <h3><span className="cp-example-number">{index + 1}</span>{item.title}</h3>
      <div className="cp-picture-example-body">
        <figure>
          {item.id === 'object' && <><Image src={map.image!} alt="Een blauwe map op een tafel" width={192} height={192} /><figcaption className="cp-example-word">{map.word}</figcaption></>}
          {item.id === 'contrast' && <><div className="cp-example-image-pair"><Image src={map.image!} alt="Een map" width={144} height={144} /><Image src={pan.image!} alt="Een pan" width={144} height={144} /></div><figcaption>Twee bekende woorden; geen nieuwe afleider.</figcaption></>}
          {['situation', 'question'].includes(item.id) && <><Image src={scene.image} alt={scene.imageAlt} width={240} height={240} /><figcaption>{item.id === 'question' ? 'Antwoord: op de tafel.' : 'Een tafel in het leslokaal.'}</figcaption></>}
          {item.id === 'practical' && <><div className="cp-example-note" aria-label="Voorbeeld van een meeneemlijstje"><strong>Voor de les</strong><ul><li>map</li><li>pen</li></ul></div><figcaption>Gemaakt voorbeeld van een praktisch lijstje.</figcaption></>}
        </figure>
        <div><p className="cp-example-prompt">{item.prompt}</p><p>{item.explanation}</p><dl><dt>Jij als docent</dt><dd>{item.action}</dd><dt>Waar let je op?</dt><dd>{item.observe}</dd><dt>Eerst voorbereiden</dt><dd>{item.preparation}</dd></dl></div>
      </div>
    </article>)}</div>
    <p>Een beeldvraag gaat over één beeld. Een beeldverhaal vraagt meerdere samenhangende beelden en is hiermee niet toegevoegd. Ook het praktische lijstje is alleen een docentvoorbeeld. Nieuwe audio blijft gepauzeerd.</p>
  </section>;
}
