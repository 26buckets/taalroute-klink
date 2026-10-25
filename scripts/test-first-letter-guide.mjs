import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { hasFirstLetterGuide, isBeginnerLesson, exerciseHelp } from '../lib/lesson-plan.ts';
import { teacherPracticePlan } from '../lib/teacher-practice-plan.ts';
import { readFileSync } from 'node:fs';
import { groupExercises } from '../lib/group-practice.ts';

test('The beginner route through visje keeps letter guidance; later lessons and independent recall do not', () => {
  const all = packs.flatMap(pack => pack.lessons.flatMap(lesson => exercisesForLesson(pack, lesson)));
  const guided = all.filter(exercise => hasFirstLetterGuide(exercise, true));
  assert.deepEqual(guided.map(exercise => exercise.exampleWord), ['mat', 'tas', 'map', 'man', 'pan', 'jas', 'pen', 'pet', 'mes', 'kam', 'ik', 'kip', 'kin', 'pak', 'kat', 'in', 'en', 'is', 'kan', 'kast', 'mens', 'nek', 'kop', 'sok', 'bon', 'bot', 'bus', 'mus', 'kus', 'dak', 'dit', 'kok', 'op', 'bed', 'kind', 'mand', 'mond', 'munt', 'post', 'stad', 'stop', 'tand', 'maan', 'naam', 'raam', 'boom', 'boot', 'roos', 'teen', 'been', 'kaas', 'noot', 'peer', 'boon', 'bord', 'jurk', 'kaak', 'kook', 'koop', 'maak', 'maand', 'mee', 'meer', 'neem', 'oor', 'paard', 'rok', 'rood', 'rook', 'sport', 'spreek', 'staart', 'staat', 'start', 'storm', 'straat', 'strand', 'traan', 'riem', 'tien', 'kies', 'fit', 'boek', 'koek', 'soep', 'voet', 'muur', 'vuur', 'fiets', 'koe', 'doek', 'vis', 'biet', 'brief', 'broek', 'buur', 'dief', 'duur', 'feest', 'stoep', 'stuur', 'uur', 'vier', 'vies', 'voor', 'vork', 'lam', 'lip', 'kool', 'neus', 'deuk', 'buik', 'duim', 'muis', 'bel', 'les', 'tuin', 'duif', 'bloem', 'bloes', 'bruin', 'deur', 'film', 'fles', 'fruit', 'jeuk', 'keel', 'kleur', 'klok', 'laars', 'land', 'leer', 'leest', 'meel', 'melk', 'pil', 'slaap', 'speel', 'spel', 'vlees', 'vloer', 'hek', 'week', 'zon', 'zeep', 'zeef', 'ei', 'ijs', 'vijf', 'pijn', 'saus', 'hout', 'kous', 'zout', 'huis', 'zak', 'zes', 'touw', 'au', 'bij', 'blauw', 'bouw', 'eind', 'fout', 'haak', 'haan', 'haar', 'hand', 'heb', 'heeft', 'hij', 'hoed', 'huid', 'klein', 'koud', 'krijt', 'lijst', 'oud', 'plein', 'prijs', 'rijk', 'rijst', 'trein', 'want', 'warm', 'woord', 'worst', 'zaak', 'zand', 'zie', 'ziet', 'zit', 'zoon', 'gaan', 'geel', 'lach', 'gang', 'tong', 'bank', 'de', 'tong', 'bank', 'de', 'school', 'schoon', 'wang', 'een', 'winkel', 'acht', 'drink', 'goed', 'goud', 'licht', 'lucht', 'nacht', 'plank', 'rechts', 'rug', 'schaal', 'schaap', 'schep', 'schil', 'schip', 'schoen', 'vlieg', 'weeg', 'weg', 'sjaal', 'sjaal', 'jasje', 'cent', 'cola', 'taxi', 'cadeau', 'camera', 'centrum', 'chauffeur', 'chirurg', 'chocola', 'cijfer', 'circus', 'cirkel', 'citroen', 'doosje', 'examen', 'kilo', 'leeuw', 'lunch', 'machine', 'maximum', 'meeuw', 'mixer', 'nieuw', 'sneeuw', 'sneeuwman', 'textiel', 'visje']);
  for (const exercise of guided) {
    assert.equal(exercise.mode, 'word-build');
    assert(exercise.prompt.audio.src);
    const ids = exercise.answer.targetTileIds;
    const tokens = ids.map(id => exercise.tiles.find(tile => tile.id === id).token);
    assert.equal(tokens.join(''), exercise.exampleWord);
    assert.equal(tokens.length, String(exercise.exampleWord).match(/eeuw|ieuw|eau|ff|sj|aa|oo|ee|ie|oe|uu|eu|ui|ei|ij|au|ou|ch|ng|nk|./g).length, 'Each letter combination remains one selectable unit');
    assert.equal(new Set(ids).size, ids.length, 'Each guided position has its own selectable tile');
    assert.match(exerciseHelp(exercise, true), /voorbeeld/);
  }
  assert(all.every(exercise => !hasFirstLetterGuide(exercise, false)), 'Free practice stays unchanged');
  for (const activity of ['build-model', 'worksheet', 'build']) {
    assert(groupExercises(packs[0], activity).every(exercise => !hasFirstLetterGuide(exercise, true)), `${activity}: guided rounds are not the beginner lesson route`);
  }
  assert(all.filter(exercise => exercise.mode === 'recall-word').every(exercise => !hasFirstLetterGuide(exercise, true)), 'Recall must not leak the model');
  assert(!hasFirstLetterGuide({ ...guided[0], lessonId: 'woord-klink-woord-appelsap' }, true));
  assert(!hasFirstLetterGuide({ ...guided[0], exampleWord: undefined }, true));
  assert(!hasFirstLetterGuide({ ...guided[0], learningPathId: 'reading' }, true));
});

test('Teacher preparation follows the new interaction and keeps sound preparation explicit', () => {
  for (const pack of packs) for (const lesson of pack.lessons.filter(item => /^(?:klink-leesstap-(?:0[1-9]|1[0-9]|2[0-9]|3[0-9]|40)|klink-uitbreiding-(?:[1-9]|1[0-9]|2[0-3])|woord-klink-woord-(?:en|is|kan|kast|mens|nek|kind|mand|mond|munt|post|stad|stop|tand|boon|bord|jurk|kaak|kook|koop|maak|maand|mee|meer|neem|oor|paard|rok|rood|rook|sport|spreek|staart|staat|start|storm|straat|strand|traan|biet|brief|broek|buur|dief|duur|feest|stoep|stuur|uur|vier|vies|voor|vork|bloem|bloes|bruin|deur|film|fles|fruit|jeuk|keel|kleur|klok|laars|land|leer|leest|meel|melk|pil|slaap|speel|spel|vlees|vloer|au|bij|blauw|bouw|eind|fout|haak|haan|haar|hand|heb|heeft|hij|hoed|huid|klein|koud|krijt|lijst|oud|plein|prijs|rijk|rijst|trein|want|warm|woord|worst|zaak|zand|zie|ziet|zit|zoon|acht|drink|goed|goud|licht|lucht|nacht|plank|rechts|rug|schaal|schaap|schep|schil|schip|schoen|vlieg|weeg|weg|cadeau|camera|centrum|chauffeur|chirurg|chocola|cijfer|circus|cirkel|citroen|doosje|examen|kilo|leeuw|lunch|machine|maximum|meeuw|mixer|nieuw|sneeuw|sneeuwman|textiel|visje))$/.test(item.id))) {
    const plan = teacherPracticePlan(pack, lesson);
    assert.match(plan.blocks[1].action, /Nu jij/);
    assert.match(plan.blocks[1].action, /klankvoorbeeld/);
    assert.match(plan.blocks[1].action, /iedere volgende letter/);
    assert.match(plan.blocks[2].action, /iedere opdracht zelf Verder/);
    assert.equal(plan.blocks.reduce((total, block) => total + block.minutes, 0), 15);
  }
  assert.doesNotMatch(teacherPracticePlan(packs[9], packs[9].lessons[0]).blocks[1].action, /Nu jij/);
  for (const path of ['docs/KLINK-DOCENTHANDLEIDING.md', 'data/klink-teacher-manual.json']) {
    const text = readFileSync(path, 'utf8');
    assert.match(text, /Nu jij/);
    assert.match(text, /sjaal · taxi \(tot en met visje\)/);
    assert.match(text, /Kijk nog eens/);
    assert.match(text, /volgende letter en het bijbehorende lege vak/);
    assert.doesNotMatch(text, /Ik kies de eerste letter/);
  }
});


test('All 1279 beginner through visje steps use manual pace, without changing later lessons or practice rounds', () => {
  const all = packs.flatMap(pack => pack.lessons.flatMap(lesson => exercisesForLesson(pack, lesson)));
  const beginners = all.filter(exercise => isBeginnerLesson(exercise, true));
  assert.equal(beginners.length, 1279);
  assert.deepEqual([...new Set(beginners.map(exercise => exercise.lessonId))], ['klink-leesstap-01', 'klink-leesstap-02', 'klink-leesstap-03', 'klink-leesstap-04', 'klink-leesstap-05', 'klink-leesstap-06', 'klink-leesstap-07', 'klink-leesstap-08', 'klink-uitbreiding-1', 'klink-uitbreiding-2', 'woord-klink-woord-en', 'woord-klink-woord-is', 'woord-klink-woord-kan', 'woord-klink-woord-kast', 'woord-klink-woord-mens', 'woord-klink-woord-nek', 'klink-leesstap-09', 'klink-leesstap-10', 'klink-leesstap-11', 'klink-leesstap-12', 'klink-uitbreiding-3', 'klink-uitbreiding-4', 'woord-klink-woord-kind', 'woord-klink-woord-mand', 'woord-klink-woord-mond', 'woord-klink-woord-munt', 'woord-klink-woord-post', 'woord-klink-woord-stad', 'woord-klink-woord-stop', 'woord-klink-woord-tand', 'klink-leesstap-13', 'klink-leesstap-14', 'klink-leesstap-15', 'klink-leesstap-16', 'klink-uitbreiding-5', 'klink-uitbreiding-6', 'klink-uitbreiding-7', 'woord-klink-woord-boon', 'woord-klink-woord-bord', 'woord-klink-woord-jurk', 'woord-klink-woord-kaak', 'woord-klink-woord-kook', 'woord-klink-woord-koop', 'woord-klink-woord-maak', 'woord-klink-woord-maand', 'woord-klink-woord-mee', 'woord-klink-woord-meer', 'woord-klink-woord-neem', 'woord-klink-woord-oor', 'woord-klink-woord-paard', 'woord-klink-woord-rok', 'woord-klink-woord-rood', 'woord-klink-woord-rook', 'woord-klink-woord-sport', 'woord-klink-woord-spreek', 'woord-klink-woord-staart', 'woord-klink-woord-staat', 'woord-klink-woord-start', 'woord-klink-woord-storm', 'woord-klink-woord-straat', 'woord-klink-woord-strand', 'woord-klink-woord-traan', 'klink-leesstap-17', 'klink-leesstap-18', 'klink-leesstap-19', 'klink-leesstap-20', 'klink-leesstap-21', 'klink-uitbreiding-8', 'klink-uitbreiding-9', 'klink-uitbreiding-10', 'woord-klink-woord-biet', 'woord-klink-woord-brief', 'woord-klink-woord-broek', 'woord-klink-woord-buur', 'woord-klink-woord-dief', 'woord-klink-woord-duur', 'woord-klink-woord-feest', 'woord-klink-woord-stoep', 'woord-klink-woord-stuur', 'woord-klink-woord-uur', 'woord-klink-woord-vier', 'woord-klink-woord-vies', 'woord-klink-woord-voor', 'woord-klink-woord-vork', 'klink-leesstap-22', 'klink-leesstap-23', 'klink-leesstap-24', 'klink-uitbreiding-11', 'klink-uitbreiding-12', 'woord-klink-woord-bloem', 'woord-klink-woord-bloes', 'woord-klink-woord-bruin', 'woord-klink-woord-deur', 'woord-klink-woord-film', 'woord-klink-woord-fles', 'woord-klink-woord-fruit', 'woord-klink-woord-jeuk', 'woord-klink-woord-keel', 'woord-klink-woord-kleur', 'woord-klink-woord-klok', 'woord-klink-woord-laars', 'woord-klink-woord-land', 'woord-klink-woord-leer', 'woord-klink-woord-leest', 'woord-klink-woord-meel', 'woord-klink-woord-melk', 'woord-klink-woord-pil', 'woord-klink-woord-slaap', 'woord-klink-woord-speel', 'woord-klink-woord-spel', 'woord-klink-woord-vlees', 'woord-klink-woord-vloer', 'klink-leesstap-25', 'klink-leesstap-26', 'klink-leesstap-27', 'klink-leesstap-28', 'klink-leesstap-29', 'klink-leesstap-30', 'klink-leesstap-31', 'klink-uitbreiding-13', 'klink-uitbreiding-14', 'klink-uitbreiding-15', 'woord-klink-woord-au', 'woord-klink-woord-bij', 'woord-klink-woord-blauw', 'woord-klink-woord-bouw', 'woord-klink-woord-eind', 'woord-klink-woord-fout', 'woord-klink-woord-haak', 'woord-klink-woord-haan', 'woord-klink-woord-haar', 'woord-klink-woord-hand', 'woord-klink-woord-heb', 'woord-klink-woord-heeft', 'woord-klink-woord-hij', 'woord-klink-woord-hoed', 'woord-klink-woord-huid', 'woord-klink-woord-klein', 'woord-klink-woord-koud', 'woord-klink-woord-krijt', 'woord-klink-woord-lijst', 'woord-klink-woord-oud', 'woord-klink-woord-plein', 'woord-klink-woord-prijs', 'woord-klink-woord-rijk', 'woord-klink-woord-rijst', 'woord-klink-woord-trein', 'woord-klink-woord-want', 'woord-klink-woord-warm', 'woord-klink-woord-woord', 'woord-klink-woord-worst', 'woord-klink-woord-zaak', 'woord-klink-woord-zand', 'woord-klink-woord-zie', 'woord-klink-woord-ziet', 'woord-klink-woord-zit', 'woord-klink-woord-zoon', 'klink-leesstap-32', 'klink-leesstap-33', 'klink-leesstap-34', 'klink-leesstap-35', 'klink-leesstap-36', 'klink-leesstap-38', 'klink-leesstap-39', 'klink-uitbreiding-16', 'klink-uitbreiding-17', 'klink-uitbreiding-18', 'klink-uitbreiding-19', 'woord-klink-woord-acht', 'woord-klink-woord-drink', 'woord-klink-woord-goed', 'woord-klink-woord-goud', 'woord-klink-woord-licht', 'woord-klink-woord-lucht', 'woord-klink-woord-nacht', 'woord-klink-woord-plank', 'woord-klink-woord-rechts', 'woord-klink-woord-rug', 'woord-klink-woord-schaal', 'woord-klink-woord-schaap', 'woord-klink-woord-schep', 'woord-klink-woord-schil', 'woord-klink-woord-schip', 'woord-klink-woord-schoen', 'woord-klink-woord-vlieg', 'woord-klink-woord-weeg', 'woord-klink-woord-weg', 'klink-leesstap-37', 'klink-leesstap-40', 'klink-uitbreiding-20', 'klink-uitbreiding-21', 'klink-uitbreiding-22', 'klink-uitbreiding-23', 'woord-klink-woord-cadeau', 'woord-klink-woord-camera', 'woord-klink-woord-centrum', 'woord-klink-woord-chauffeur', 'woord-klink-woord-chirurg', 'woord-klink-woord-chocola', 'woord-klink-woord-cijfer', 'woord-klink-woord-circus', 'woord-klink-woord-cirkel', 'woord-klink-woord-citroen', 'woord-klink-woord-doosje', 'woord-klink-woord-examen', 'woord-klink-woord-kilo', 'woord-klink-woord-leeuw', 'woord-klink-woord-lunch', 'woord-klink-woord-machine', 'woord-klink-woord-maximum', 'woord-klink-woord-meeuw', 'woord-klink-woord-mixer', 'woord-klink-woord-nieuw', 'woord-klink-woord-sneeuw', 'woord-klink-woord-sneeuwman', 'woord-klink-woord-textiel', 'woord-klink-woord-visje']);
  assert(beginners.some(exercise => exercise.mode === 'recall-word'));
  assert(beginners.some(exercise => exercise.mode === 'word-image-match'));
  assert(all.every(exercise => !isBeginnerLesson(exercise, false)));
  for (const activity of ['build-model', 'worksheet', 'build']) {
    assert(groupExercises(packs[0], activity).every(exercise => !isBeginnerLesson(exercise, true)));
  }
  assert(!isBeginnerLesson({ ...beginners[0], lessonId: 'woord-klink-woord-appelsap' }, true));
  assert(!isBeginnerLesson({ ...beginners[0], learningPathId: 'reading' }, true));
  assert(!isBeginnerLesson({ ...beginners[0], lessonId: undefined }, true));
  assert(beginners.every(exercise => !['read-series', 'paper-dictation'].includes(exercise.mode)), 'No separate timed reading player in these lessons');
});
