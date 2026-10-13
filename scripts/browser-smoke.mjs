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
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
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
await send('Page.navigate', { url: appUrl });
await waitFor("Boolean(document.querySelector('.role-choice-primary'))");
await evaluate("document.querySelector('.role-choice-primary').click()");
await waitFor("Boolean(document.querySelector('.learner-login'))");
await evaluate(
  "document.querySelector('.learner-login button[type=submit]').click()",
);
await waitFor("Boolean(document.querySelector('.learner-nav'))");
await evaluate(
  "[...document.querySelectorAll('.learner-nav button')].find((button) => button.textContent.includes('Pakketten')).click()",
);
await waitFor("Boolean(document.querySelector('.package-library-page'))");
await screenshot('01-pakketbibliotheek-desktop');

await evaluate(
  "document.querySelector('.package-switcher button:nth-child(2)').click()",
);
await evaluate(
  "[...document.querySelectorAll('.package-levels button')].find((button) => button.textContent.includes('A2')).click()",
);
await waitFor(
  "document.querySelectorAll('.package-text-grid button').length === 4",
);
await new Promise((resolve) => setTimeout(resolve, 250));
await screenshot('02-pakket-2-a2-desktop');

await evaluate("document.querySelector('.package-text-grid button').click()");
await waitFor("Boolean(document.querySelector('.package-player'))");
await waitFor(
  "document.querySelector('.package-story-copy')?.textContent.includes('boek')",
);
await screenshot('03-tekstspeler-desktop');
await evaluate(
  "document.querySelector('.package-player-footer .primary-button').click()",
);
await waitFor(
  "document.querySelector('.package-player-footer')?.classList.contains('right')",
);
await screenshot('04-feedback-desktop');

await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await new Promise((resolve) => setTimeout(resolve, 250));
await screenshot('05-tekstspeler-mobiel');

const visibleText = await evaluate('document.body.innerText');
if (visibleText.includes('Pakket kon niet open'))
  throw new Error('Pakketspeler toont een laadfout.');
if (browserErrors.length)
  throw new Error(`Browserfouten: ${browserErrors.join(' | ')}`);

console.log(
  JSON.stringify({
    ok: true,
    screenshots: outputDir,
    title: await evaluate('document.title'),
  }),
);
socket.close();
