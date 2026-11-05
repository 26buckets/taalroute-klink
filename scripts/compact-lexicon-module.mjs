import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Keep the approved JSON as source; only factor the repeated word-building recipe in the build.
export function compactLexiconModule(source) {
  const bank = JSON.parse(source);
  const template = bank.packs?.flatMap(pack => pack.exercises)[0];
  if (!template) return `export default ${source};`;
  const fields = {
    exerciseId: '`lexicon:${id}:word-build`', wordId: 'id', lessonId: 'lesson',
    tiles: 'tiles.map(([i,token])=>({id:`${id}:tile-${i}`,token}))',
    slots: 'tiles.map((_,i)=>({id:`${id}:slot-${i}`}))',
    answer: '{targetTileIds:tiles.map((_,i)=>`${id}:tile-${i}`)}',
    exampleWord: 'word', vocabularyLevels: 'levels', vocabularyCollections: 'collections',
  };
  const factory = `function exercise(id,lesson,word,tiles,levels,collections){return {${Object.entries(template).map(([key, value]) => `${JSON.stringify(key)}:${fields[key] ?? JSON.stringify(value)}`).join(',')}}}`;
  const reconstruct = runInNewContext(`${factory};exercise`, {}, { timeout: 1000 });
  function emitExercise(item) {
    const original = JSON.stringify(item);
    if (typeof item.wordId !== 'string' || typeof item.lessonId !== 'string' || typeof item.exampleWord !== 'string'
      || !Array.isArray(item.vocabularyLevels) || !Array.isArray(item.vocabularyCollections) || !Array.isArray(item.tiles)) return original;
    const prefix = `${item.wordId}:tile-`;
    if (!item.tiles.every(tile => typeof tile.id === 'string' && tile.id.startsWith(prefix) && /^\d+$/.test(tile.id.slice(prefix.length)) && typeof tile.token === 'string')) return original;
    const args = [item.wordId, item.lessonId, item.exampleWord, item.tiles.map(tile => [Number(tile.id.slice(prefix.length)), tile.token]), item.vocabularyLevels, item.vocabularyCollections];
    // Future or exceptional tasks retain their full source, including field order and extra fields.
    if (JSON.stringify(reconstruct(...args)) !== original) return original;
    return `exercise(${args.map(value => JSON.stringify(value)).join(',')})`;
  }
  const packs = `[${bank.packs.map(pack => `{${Object.entries(pack).map(([key, value]) => `${JSON.stringify(key)}:${key === 'exercises' ? `[${value.map(emitExercise).join(',')}]` : JSON.stringify(value)}`).join(',')}}`).join(',')}]`;
  const value = `{${Object.entries(bank).map(([key, item]) => `${JSON.stringify(key)}:${key === 'packs' ? packs : JSON.stringify(item)}`).join(',')}}`;
  return `${factory}\nexport default ${value};`;
}

/** @returns {import('vite').Plugin} */
export function compactLexiconPlugin() {
  return {
    name: 'klink-compact-lexicon', apply: 'build', enforce: 'post',
    transform(_code, id) {
      if (!id.endsWith('/data/klink-lexicon-wordbuild-rest.json')) return;
      return { code: compactLexiconModule(readFileSync(id, 'utf8')), map: null };
    },
  };
}
