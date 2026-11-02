import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
import { imageWordRectangle } from '../lib/image-word-listening.ts';
import { wordRecordingKey } from '../lib/word-listening.ts';

const base = process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:19073';
const out = process.env.KLINK_WORD_LISTENING_OUTPUT ?? 'work/word-listening/browser';
const recordings = JSON.parse(readFileSync('data/klink-word-listening.json'));
const inventory = JSON.parse(readFileSync('outputs/goal-audit-20261101/inventory.json'));
mkdirSync(out, { recursive: true });
const checks = [], errors = [];

async function clickWord(page, locator, word) {
  await locator.scrollIntoViewIfNeeded();
  const point = await locator.evaluate((element, word) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent.indexOf(word);
      if (at < 0) continue;
      const range = document.createRange(); range.setStart(node, at); range.setEnd(node, at + word.length);
      const rect = range.getClientRects()[0];
      if (rect?.width) return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    throw Error('Visible word not found: ' + word);
  }, word);
  if (page.viewportSize().width < 700) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.__wordAudioPlayed = [];
      HTMLMediaElement.prototype.play = function () {
        window.__wordAudioPlayed.push(this.dataset.klinkSource || this.getAttribute('src'));
        setTimeout(() => this.dispatchEvent(new Event('ended')), 25);
        return Promise.resolve();
      };
      localStorage.setItem('klink.word-listening.retention', 'kept');
    });
    page.on('pageerror', error => errors.push({ engine, kind: 'page', message: error.message }));
    await page.goto(base + '/#learner/chapters/sentences/sentences/klink-zinnen-zelf-a1-20261031-r1?level=a1&help=practice');
    const sentence = page.getByText('De kok werkt in de keuken.', { exact: true });
    await sentence.waitFor();
    const attemptBefore = await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1'));
    const styleBefore = await sentence.evaluate(element => ({ html: element.outerHTML, border: getComputedStyle(element).border, outline: getComputedStyle(element).outline }));
    for (const word of ['kok', 'keuken']) {
      await clickWord(page, sentence, word);
      await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings[word][0]));
      checks.push({ engine, check: 'individual sentence word', word });
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), attemptBefore);
    await page.waitForFunction(()=>!document.querySelector('[data-word-state="playing"]'));
    assert.deepEqual(await sentence.evaluate(element => ({ html: element.outerHTML, border: getComputedStyle(element).border, outline: getComputedStyle(element).outline })), styleBefore);
    checks.push({ engine, check: 'listening leaves text markup, appearance and attempts unchanged' });
    await clickWord(page, sentence, 'werkt');
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings.werkt[0]));
    assert.notEqual(await page.evaluate(() => window.__wordAudioPlayed.at(-1)), recordings.werken?.[0]);
    checks.push({ engine, check: 'an inflected word plays its exact packed model rather than the infinitive' });
    const inlineWord = page.locator('button.cp-inline-word').first();
    const inlineText = await inlineWord.getAttribute('data-word-audio');
    for(const method of ['tap','Enter']) {
      const before = await page.evaluate(()=>window.__wordAudioPlayed.length);
      if(method==='tap') await inlineWord.tap(); else { await inlineWord.focus();await page.keyboard.press('Enter'); }
      await page.waitForFunction(({before,source})=>window.__wordAudioPlayed.length===before+1&&window.__wordAudioPlayed.at(-1)===source,{before,source:wordRecordingKey(recordings[inlineText][0])});
    }
    checks.push({engine,check:'published inline word buttons share one playback for touch and native Enter'});
    const answer = page.getByRole('button', { name: 'In de keuken', exact: true });
    await clickWord(page, answer, 'keuken');
    assert.equal(await answer.getAttribute('aria-pressed'), 'true');
    assert(await page.getByRole('button', { name: /^Verder/ }).isEnabled());
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings.keuken[0]));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1).helpUsed), true);
    checks.push({ engine, check: 'answer selection and individual word audio both work; listening is recorded as support' });
    await page.getByRole('button', { name: /^Verder/ }).focus();
    await page.keyboard.press('Alt+w');
    let found = false;
    for (let at = 0; at < 100; at++) {
      if (await page.evaluate(() => getSelection()?.toString()) === 'kok') { found = true; break; }
      await page.keyboard.press('ArrowRight');
    }
    assert(found, 'Keyboard can reach each word');
    await page.keyboard.press('Space');
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings.kok[0]));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => getSelection()?.toString()), '');
    checks.push({ engine, check: 'keyboard word browsing and audio preserve the exercise' });
    await sentence.evaluate(element => {
      const paragraph = document.createElement('p'); paragraph.dataset.wordListeningFixture = 'true';
      paragraph.innerHTML = 'keu<strong>ken</strong>';
      element.after(paragraph);
    });
    await clickWord(page, page.locator('[data-word-listening-fixture]'), 'ken');
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings.keuken[0]));
    checks.push({ engine, check: 'an inline emphasis never turns one word into two audio fragments' });
    await page.locator('[data-word-listening-fixture]').evaluate(element => element.remove());
    await sentence.evaluate(element => {
      const paragraph = document.createElement('p'); paragraph.id = 'joined-word-fixture';
      paragraph.textContent = 'Ditismijnleesboek.'; element.after(paragraph);
    });
    for (const word of ['Dit', 'is', 'mijn', 'leesboek']) {
      await clickWord(page, page.locator('#joined-word-fixture'), word);
      await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings[word.toLowerCase()][0]));
    }
    checks.push({engine,check:'the source exercise without spaces retains four individually audible words'});
    await page.locator('#joined-word-fixture').evaluate(element => {
      element.textContent = '';
      const button = document.createElement('button'); button.textContent = 'keuken';
      button.onclick = event => { event.stopPropagation(); button.setAttribute('aria-pressed','true'); };
      element.append(button);
    });
    const stopped = page.locator('#joined-word-fixture button'), stoppedBefore = await page.evaluate(() => window.__wordAudioPlayed.length);
    await clickWord(page, stopped, 'keuken');
    await page.waitForFunction(count => window.__wordAudioPlayed.length === count + 1, stoppedBefore);
    assert.equal(await stopped.getAttribute('aria-pressed'), 'true');
    checks.push({engine,check:'a control that stops click bubbling still selects and plays exactly once'});
    await page.locator('#joined-word-fixture').evaluate(element => {
      const recorder = document.createElement('div'); recorder.className = 'cp-recorder';
      recorder.innerHTML = '<button class="recording">Stop</button>'; element.append(recorder);
    });
    const recordingBefore = await page.evaluate(() => window.__wordAudioPlayed.length);
    await clickWord(page, sentence, 'kok');
    assert.equal(await page.evaluate(() => window.__wordAudioPlayed.length), recordingBefore);
    await page.getByText('Stop eerst je opname om een woord te beluisteren.',{exact:true}).waitFor();
    checks.push({engine,check:'word audio respects an active recording and leaves its controls intact'});
    await page.locator('#joined-word-fixture').evaluate(element => element.remove());
    const packedWords = Object.keys(recordings).filter(word => typeof recordings[word][0] === 'object' && /^[a-z]{5,15}$/.test(word)).slice(0,2);
    await sentence.evaluate((element, words) => {
      const paragraph = document.createElement('p'); paragraph.id = 'packed-race-fixture';
      paragraph.textContent = words.join(' '); element.after(paragraph);
    }, packedWords);
    await page.route('**/package-audio/word-listening-20261101/*.bin', async route => {
      await new Promise(resolve => setTimeout(resolve, 350));
      await route.continue().catch(() => {});
    });
    const beforeRapid = await page.evaluate(() => window.__wordAudioPlayed.length);
    await clickWord(page, page.locator('#packed-race-fixture'), packedWords[0]);
    await clickWord(page, page.locator('#packed-race-fixture'), packedWords[1]);
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings[packedWords[1]][0]));
    assert.equal(await page.evaluate(() => window.__wordAudioPlayed.length), beforeRapid + 1);
    checks.push({engine,check:'a rapid second word cancels the pending first download without stale playback'});
    const beforeNavigation = await page.evaluate(() => window.__wordAudioPlayed.length);
    await clickWord(page, page.locator('#packed-race-fixture'), packedWords[0]);
    await page.evaluate(() => { location.hash = '#learner/home'; });
    await page.locator('.cp-home').waitFor();
    await page.waitForTimeout(450);
    assert.equal(await page.evaluate(() => window.__wordAudioPlayed.length), beforeNavigation);
    assert.equal(await page.locator('.toast-message').count(), 0);
    checks.push({engine,check:'navigation cancels slow word downloads and preserves the destination'});
    await page.unroute('**/package-audio/word-listening-20261101/*.bin');
    const model = inventory.cases.find(item => item.exercise.mode === 'model');
    await page.goto(base + model.route);
    const modelText = page.locator('button.cp-model-content > strong');
    await modelText.waitFor();
    const text = (await modelText.innerText()).trim().split(/\s/)[0];
    const modelBefore = await page.evaluate(() => window.__wordAudioPlayed.length);
    await clickWord(page, modelText, text);
    await page.waitForFunction(count => window.__wordAudioPlayed.length > count, modelBefore);
    await page.waitForTimeout(70);
    assert.equal(await page.evaluate(() => window.__wordAudioPlayed.length), modelBefore + 1, JSON.stringify(await page.evaluate(before => window.__wordAudioPlayed.slice(before),modelBefore)));
    checks.push({engine,check:'a native word card and global word listening share one playback'});
    const mark = inventory.cases.find(item => item.exercise.standardTask?.kind === 'mark');
    await page.goto(base + mark.route);
    await page.locator('[data-word-token]').first().waitFor();
    const target = mark.exercise.standardTask.tokens.find(token => recordings[token.text.toLocaleLowerCase('nl').replace(/[.!?,;:]$/, '')]);
    const token = page.locator(`[data-word-token="${target.id}"]`), targetSource = wordRecordingKey(recordings[target.text.toLocaleLowerCase('nl').replace(/[.!?,;:]$/, '')][0]);
    await clickWord(page, token, target.text.replace(/[.!?,;:]$/, ''));
    assert.equal(await token.getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, targetSource);
    await clickWord(page, token, target.text.replace(/[.!?,;:]$/, ''));
    assert.equal(await token.getAttribute('aria-pressed'), 'false');
    checks.push({ engine, check: 'marking a grammatical or evidence word still toggles its selection' });
    for (const id of mark.exercise.standardTask.acceptedSelections[0]) await page.locator(`[data-word-token="${id}"]`).click();
    await page.getByRole('button', { name: /^Controleer/ }).click();
    assert(await token.isDisabled());
    const attemptsAfter = await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1'));
    const beforeDisabled = await page.evaluate(() => window.__wordAudioPlayed.length);
    await clickWord(page, token, target.text.replace(/[.!?,;:]$/, ''));
    await page.waitForFunction(count => window.__wordAudioPlayed.length > count, beforeDisabled);
    assert.equal(await page.evaluate(() => window.__wordAudioPlayed.at(-1)), targetSource);
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), attemptsAfter);
    checks.push({ engine, check: 'completed answer words remain audible without changing the answer' });
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.word-listening.retention')), 'kept');
    await page.screenshot({ path: out + '/' + engine + '-sentence.png', fullPage: true });
    const block = functionalBlocks.find(block => block.steps.some(step => step.handwriting));
    const at = block.steps.findIndex(step => step.handwriting);
    await page.evaluate(({ key, id, at }) => localStorage.setItem(key, JSON.stringify({ version: 1, positions: { [id]: at }, records: {} })), { key: functionalStorageKey, id: block.id, at });
    await page.goto(base + '/#learner/chapters/alfa-c-paper/sequence/' + block.id + '?level=alfa-c&help=practice');
    const note = page.locator('img[alt="De les begint om 10.00. Neem je map mee."]');
    await note.waitFor();
    await note.scrollIntoViewIfNeeded();
    await note.evaluate(image => image.decode());
    const geometry = await note.evaluate(image => ({ rect: image.getBoundingClientRect().toJSON(), width: image.naturalWidth, height: image.naturalHeight, fit: getComputedStyle(image).objectFit }));
    const source = JSON.parse(readFileSync('data/klink-image-word-listening.json'))['/alfa-c/handschrift/lesbriefje.png'];
    const map = source.words.find(word => word.text === 'map');
    const box = imageWordRectangle(geometry.rect, geometry.width, geometry.height, geometry.fit, map.box);
    const beforeNote = await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1'));
    await page.touchscreen.tap((box.left + box.right) / 2, (box.top + box.bottom) / 2);
    await page.waitForFunction(source => window.__wordAudioPlayed.at(-1) === source, wordRecordingKey(recordings.map[0]));
    assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), beforeNote);
    checks.push({ engine, check: 'a handwritten source word plays at its true image position, including contained-image margins' });
    await page.close();
    const native = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await native.addInitScript(() => {
      window.__nativeWords = [];
      window.addEventListener('klink-audio-source', event => {
        const audio = event.detail, result = { source: audio.dataset.klinkSource || audio.getAttribute('src'), started: false, ended: false };
        window.__nativeWords.push(result);
        audio.addEventListener('playing', () => { result.started = true; }, { once: true });
        audio.addEventListener('ended', () => { result.ended = true; result.duration = audio.duration; }, { once: true });
      });
    });
    await native.goto(base + '/#learner/chapters/sentences/sentences/klink-zinnen-zelf-a1-20261031-r1?level=a1&help=practice');
    const nativeSentence = native.getByText('De kok werkt in de keuken.', { exact: true });
    await nativeSentence.waitFor();
    const packedWord = Object.keys(recordings).find(word => typeof recordings[word][0] === 'object' && /^[a-z]{5,15}$/.test(word));
    await nativeSentence.evaluate((element, word) => {
      const paragraph=document.createElement('p');paragraph.id='native-packed-word';paragraph.textContent=word;element.after(paragraph);
    },packedWord);
    assert.equal(await native.evaluate(() => window.__nativeWords.length), 0, 'First word tap has no prior model playback');
    for (const word of [packedWord, packedWord, 'kok', 'keuken']) {
      const before = await native.evaluate(() => window.__nativeWords.length);
      await clickWord(native, word===packedWord?native.locator('#native-packed-word'):nativeSentence, word);
      await native.waitForFunction(({source,before}) => window.__nativeWords.length === before + 1 && window.__nativeWords.at(-1).source === source && window.__nativeWords.at(-1).started && window.__nativeWords.at(-1).ended && window.__nativeWords.at(-1).duration > 0, {source:wordRecordingKey(recordings[word][0]),before});
      const recording = recordings[word][0];
      const source = typeof recording === 'string' ? recording : recording.src;
      const response = await native.request.get(base + source, typeof recording === 'string' ? {} : {headers:{Range:`bytes=${recording.offset}-${recording.offset+recording.length-1}`}});
      assert(response.ok());
      const original = readFileSync('public' + source);
      const body = await response.body();
      if (typeof recording === 'object' && response.status() === 206) {
        assert.equal(response.headers()['content-range'], `bytes ${recording.offset}-${recording.offset+recording.length-1}/${original.length}`);
        assert(body.equals(original.subarray(recording.offset,recording.offset+recording.length)), 'The exact word range remains unchanged');
      } else {
        assert.equal(response.status(), 200);
        assert(body.equals(original), 'The original recording or complete bundle fallback remains unchanged');
      }
      checks.push({ engine, check: 'native audio reaches ended after a real mobile gesture, original bytes preserved', word });
    }
    const inlineNative=native.locator('button.cp-inline-word').first();
    const nativeBefore=await native.evaluate(()=>window.__nativeWords.length);
    await inlineNative.tap();
    await native.waitForFunction(before=>window.__nativeWords.length===before+1&&window.__nativeWords.at(-1).started,nativeBefore);
    assert.equal(await inlineNative.getAttribute('data-audio-active'),null);
    assert.equal(await inlineNative.evaluate(element=>getComputedStyle(element).outlineStyle),'none');
    await native.waitForFunction(()=>window.__nativeWords.at(-1).ended);
    checks.push({engine,check:'real inline word playback has no listening or focus outline; answer borders are separate'});
    await native.close();
  } catch (error) { errors.push({ engine, kind: 'check', message: error.stack }); }
  finally { await browser.close(); writeFileSync(out + '/checks.json', JSON.stringify({ base, checks, errors }, null, 2) + '\n'); }
}
console.log(JSON.stringify({ checks: checks.length, errors: errors.length }));
assert.deepEqual(errors, []);
