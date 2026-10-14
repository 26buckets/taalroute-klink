import { mkdir, writeFile } from 'node:fs/promises';

const debugPort = process.env.KLINK_CHROME_DEBUG_PORT ?? '9228';
const appUrl = process.env.KLINK_APP_URL ?? 'http://127.0.0.1:8791';
const outputDir =
  process.env.KLINK_SCREENSHOT_DIR ?? '/tmp/klink-browser-smoke';

const pages = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(
  (response) => response.json(),
);
const page = pages.find((item) => item.type === 'page');
if (!page) throw new Error('Geen Chrome-pagina gevonden.');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const browserErrors = [];

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const command = pending.get(message.id);
    if (!command) return;
    pending.delete(message.id);
    if (message.error) command.reject(new Error(message.error.message));
    else command.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    browserErrors.push(message.params.exceptionDetails.text);
  }
  if (
    message.method === 'Log.entryAdded' &&
    message.params.entry.level === 'error'
  ) {
    browserErrors.push(
      `${message.params.entry.text} ${message.params.entry.url ?? ''}`.trim(),
    );
  }
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Browsercommand timed out: ${method}`));
    }, 15000);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
  });
}

async function evaluate(expression, { userGesture = false } = {}) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout: ${expression}`);
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  await writeFile(
    `${outputDir}/${name}.png`,
    Buffer.from(result.data, 'base64'),
  );
}

await mkdir(outputDir, { recursive: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: `${appUrl}?smoke=learner` });
await waitFor("Boolean(document.querySelector('.role-choice-primary'))");
await new Promise((resolve) => setTimeout(resolve, 1500));
for (const [width, height, name] of [[1440, 1000, 'desktop'], [1366, 768, 'laptop'], [390, 844, 'mobile']]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (await evaluate('document.documentElement.scrollWidth > innerWidth + 1'))
    throw new Error(`Entree loopt horizontaal over: ${name}`);
  if (!(await evaluate("[...document.querySelectorAll('.role-choice')].every(button => {const r=button.getBoundingClientRect(); return Math.abs(r.width-r.height)<2 && r.left>=0 && r.right<=innerWidth+1})")))
    throw new Error(`Boekknoppen zijn niet vierkant of vallen buiten beeld: ${name}`);
  await screenshot(`00-entree-${name}`);
}
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
if (!(await evaluate("document.querySelector('link[rel=icon]')?.getAttribute('href') === '/favicon.svg?v=2'")))
  throw new Error('Klink-tabicoon mist de nieuwe versie.');
await evaluate("document.querySelector('.role-choice-primary').click()");
await waitFor("Boolean(document.querySelector('.learner-login'))");
await evaluate(
  "document.querySelector('.learner-login button[type=submit]').click()",
);
await waitFor("Boolean(document.querySelector('.learner-nav'))");
await evaluate(
  "[...document.querySelectorAll('.learner-nav button')].find((button) => button.textContent.includes('Lessen')).click()",
);
await waitFor("Boolean(document.querySelector('.package-library-page'))");
await screenshot('01-pakketbibliotheek-desktop');

if (await evaluate("document.querySelectorAll('.cp-package-grid > button').length") !== 2)
  throw new Error('CP001 en CP002 zijn niet allebei zichtbaar.');

await evaluate("document.querySelector('.cp-package-grid > button').click()");
await waitFor("Boolean(document.querySelector('.cp-player'))");
if (await evaluate("document.querySelectorAll('.cp-player-bar .brand').length") !== 0)
  throw new Error('De pakketkop toont het Klink-logo dubbel.');
await waitFor("document.querySelectorAll('.cp-start-lesson').length >= 2");
await evaluate("document.querySelectorAll('.cp-start-lesson')[1].click()");
await waitFor("Boolean(document.querySelector('.cp-lesson-player .cp-task-card'))");
if (!(await evaluate("Boolean(document.querySelector('.cp-task-prompt button'))")))
  throw new Error('De geopende les heeft geen afspeelbare audio.');
const audioRequestsBefore = await evaluate("performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/package-audio/')).length");
await evaluate("document.querySelector('.cp-task-prompt button').click()", { userGesture: true });
await waitFor(`performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/package-audio/')).length > ${audioRequestsBefore}`);
await new Promise((resolve) => setTimeout(resolve, 250));
if (await evaluate("document.querySelector('.toast-message')?.textContent.includes('kon niet worden afgespeeld')"))
  throw new Error('De audio kon in de browser niet worden afgespeeld.');
await screenshot('02-werkende-les-desktop');
if (await evaluate('document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1'))
  throw new Error('De geopende desktoples veroorzaakt pagina-overloop.');
await evaluate("document.querySelector('.cp-lesson-player > .text-back').click()");
await evaluate(
  "[...document.querySelectorAll('.cp-tabs button')].find((button) => button.textContent.includes('Oefeningen')).click()",
);
await waitFor("Boolean(document.querySelector('.cp-exercise-browser'))");
if (await evaluate("document.querySelectorAll('.cp-exercise-workspace > aside button').length") !== 18)
  throw new Error('De bronspeler toont niet alle 18 componentfamilies.');

for (let index = 0; index < 18; index += 1) {
  await evaluate(`document.querySelectorAll('.cp-exercise-workspace > aside button')[${index}].click()`);
  await waitFor("Boolean(document.querySelector('.cp-task-card'))");
  const title = await evaluate("document.querySelector('.cp-exercise-record-head strong')?.textContent");
  if (!title) throw new Error(`Componentfamilie ${index + 1} heeft geen oefening.`);
}
await evaluate("document.querySelector('.cp-exercise-browser').scrollIntoView({block:'start'})");
await new Promise((resolve) => setTimeout(resolve, 120));
await screenshot('03-bronspeler-18-families-desktop');

await evaluate("document.querySelectorAll('.cp-exercise-workspace > aside button')[14].click()");
await waitFor("Boolean(document.querySelector('.cp-memory-grid'))");
const gameModes = [];
for (let index = 0; index < 5; index += 1) {
  gameModes.push(await evaluate("document.querySelector('.cp-task-card')?.innerText"));
  if (index < 4) {
    await evaluate("document.querySelector('.cp-exercise-record-head nav button:last-child').click()");
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
}
if (new Set(gameModes).size !== 5) throw new Error('Niet alle vijf spelvormen hebben een eigen oefening.');

await evaluate("document.querySelector('.cp-player-bar > button').click()");
await waitFor("Boolean(document.querySelector('.package-library-page'))");
await evaluate("document.querySelectorAll('.cp-package-grid > button')[1].click()");
await waitFor("document.querySelectorAll('.cp-start-lesson').length === 4");
await evaluate("document.querySelectorAll('.cp-start-lesson')[1].click()");
await waitFor("Boolean(document.querySelector('.cp-lesson-player .cp-task-card'))");
const cp002LessonSteps = await evaluate("document.querySelectorAll('.cp-exercise-workspace > aside button').length");
if (cp002LessonSteps < 8 || cp002LessonSteps > 16)
  throw new Error(`CP002-les heeft ${cp002LessonSteps} stappen; verwacht 8 tot en met 16.`);
const firstProgress = await evaluate("document.querySelector('.cp-exercise-record-head nav b').textContent");
await evaluate("document.querySelector('.cp-exercise-feedback .secondary-button').click()");
await waitFor(`document.querySelector('.cp-exercise-record-head nav b').textContent !== ${JSON.stringify(firstProgress)}`);
if (!(await evaluate("Boolean(document.querySelector('.cp-task-prompt button'))")))
  throw new Error('De CP002-les heeft geen afspeelbare audio.');
await evaluate("document.querySelector('.cp-task-prompt button').click()", { userGesture: true });
await new Promise((resolve) => setTimeout(resolve, 250));
if (await evaluate("document.querySelector('.toast-message')?.textContent.includes('kon niet worden afgespeeld')"))
  throw new Error('De CP002-audio kon in de browser niet worden afgespeeld.');

await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await new Promise((resolve) => setTimeout(resolve, 250));
if (!(await evaluate("document.querySelector('.cp-lesson-player')?.clientWidth <= window.innerWidth")))
  throw new Error('De lesweergave past niet op mobiel.');
if (await evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'))
  throw new Error('De lesweergave veroorzaakt horizontale pagina-overloop op mobiel.');
if (await evaluate('document.documentElement.scrollHeight > window.innerHeight + 1'))
  throw new Error('De lesweergave veroorzaakt verticale pagina-overloop op mobiel.');
if (!(await evaluate("[document.querySelector('.cp-exercise-feedback > button'), ...document.querySelectorAll('.cp-exercise-record-head nav button')].every(el => {const r=el.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight+1 && r.right<=innerWidth+1})")))
  throw new Error('Een vaste lesbedieningsknop valt buiten beeld op mobiel.');
await new Promise((resolve) => setTimeout(resolve, 120));
await screenshot('04-cp002-les-mobiel');

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: `${appUrl}?smoke=teacher` });
await waitFor("document.querySelectorAll('.role-choice').length === 2");
await new Promise((resolve) => setTimeout(resolve, 1500));
await evaluate("document.querySelectorAll('.role-choice')[1].click()");
await waitFor("Boolean(document.querySelector('.staff-app'))");
await evaluate(
  "[...document.querySelectorAll('.staff-nav button')].find((button) => button.textContent.includes('Oefenkaart')).click()",
);
await waitFor("Boolean(document.querySelector('.cp-opportunity-atlas'))");
if (await evaluate("document.querySelectorAll('.cp-opportunity-atlas article').length") !== 52)
  throw new Error('De makerskaart bevat niet alle 52 opdrachtvarianten.');
if (await evaluate("document.querySelectorAll('.cp-opportunity-summary article').length") !== 6)
  throw new Error('De samenvatting van de oefenkaart is onvolledig.');
await screenshot('05-makerskaart-overzicht-desktop');
await evaluate("document.querySelector('.cp-opportunity-atlas').scrollIntoView({block:'start'})");
await new Promise((resolve) => setTimeout(resolve, 120));
await screenshot('06-makerskaart-52-opdrachten-desktop');

await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await new Promise((resolve) => setTimeout(resolve, 250));
if (await evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'))
  throw new Error('De makerskaart veroorzaakt horizontale pagina-overloop op mobiel.');
await evaluate("document.querySelector('.cp-opportunity-atlas').scrollIntoView({block:'start'})");
await new Promise((resolve) => setTimeout(resolve, 120));
await screenshot('07-makerskaart-mobiel');

const visibleText = await evaluate('document.body.innerText');
if (visibleText.includes('Pakket kon niet open'))
  throw new Error('Pakketspeler toont een laadfout.');
if (browserErrors.length)
  throw new Error(`Browserfouten: ${browserErrors.join(' | ')}`);

console.log(
  JSON.stringify({
    ok: true,
    screenshots: outputDir,
    checkedFamilies: 18,
    checkedOpportunities: 52,
    title: await evaluate('document.title'),
  }),
);
socket.close();
