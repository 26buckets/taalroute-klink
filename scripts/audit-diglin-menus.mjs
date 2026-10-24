// Read only visible menu metadata from the user's logged-in Chrome tab.
// No exercise responses, account data, lesson texts, images or audio are collected.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';

const out = 'outputs/diglin-comparison-20261017';
mkdirSync(out, { recursive: true });
const tabId = Number(execFileSync('osascript', ['-e', `tell application "Google Chrome"
repeat with w in windows
repeat with t in tabs of w
if URL of t is "https://app.diglinplus.nl/" then
if (execute t javascript "Array.from(document.querySelectorAll('button.accordion-button')).some(b=>/^Lijst 1\\\\s/.test(b.innerText))") is true then return id of t
end if
end repeat
end repeat
end tell`], {encoding:'utf8'}).trim());
assert(Number.isInteger(tabId) && tabId > 0, 'ABC menu tab not found');
const script = (js) => `tell application "Google Chrome"
set stableWindowIds to get id of every window
repeat with wid in stableWindowIds
set stableWindowId to wid as integer
set stableTabIds to get id of every tab of window id stableWindowId
repeat with tid in stableTabIds
if (tid as integer) is ${tabId} then
set t to tab id ${tabId} of window id stableWindowId
set resultText to execute t javascript ${JSON.stringify(js)}
if resultText is not "" then return resultText
end if
end repeat
end repeat
end tell`;
const run = (js) => {
  new Script(`(${js})`); // Validate the read expression before sending it to Chrome.
  const wrapped = `(()=>{try{return ${js}}catch(e){return JSON.stringify({auditError:String(e)})}})()`;
  const value = execFileSync('osascript', ['-e', script(wrapped)], { encoding: 'utf8' }).trim();
  if (!value) throw new Error('Intended logged-in menu tab unavailable');
  if(value==='missing value')throw new Error(`Browser did not return menu data for: ${js}`);
  const parsed = JSON.parse(value);
  if(parsed?.auditError)throw new Error(parsed.auditError);
  return parsed;
};
const pause = () => new Promise((resolve) => setTimeout(resolve, 500));
const guard = '';
const readMenu = (title) => run(`(()=>{const b=Array.from(document.querySelectorAll('button.accordion-button')).find(b=>b.innerText.trim()===${JSON.stringify(title)});if(!b)return JSON.stringify(null);const item=b.closest('.accordion-item');return JSON.stringify({title:b.innerText.trim(),entries:Array.from(item.querySelectorAll('a')).filter(a=>a.title.includes('/applications/')).map(a=>({label:a.textContent.trim(),application:a.title.split('/')[2]})),otherLinks:Array.from(item.querySelectorAll('a')).filter(a=>!a.title.includes('/applications/')).map(a=>({label:a.textContent.trim(),destination:a.getAttribute('href')})),childGroups:Array.from(item.querySelectorAll('button.accordion-button')).filter(x=>x!==b).map(x=>x.innerText.trim())});})()`);
async function collect() {
  const headers = run(`(()=>{${guard}return JSON.stringify(Array.from(document.querySelectorAll('button.accordion-button')).map(b=>b.innerText.trim()))})()`);
  const items = [];
  for (let i = 0; i < headers.length; i++) {
    run(`(()=>{${guard}const b=Array.from(document.querySelectorAll('button.accordion-button')).find(b=>b.innerText.trim()===${JSON.stringify(headers[i])});if(!b.closest('.accordion-item').querySelector('.accordion-collapse').classList.contains('show'))b.click();return JSON.stringify(true)})()`);
    let item;
    for(let attempt=0;attempt<8;attempt++) {
      await pause(); item = readMenu(headers[i]);
      if(item?.entries.length || item?.otherLinks.length || item?.childGroups.length)break;
    }
    assert.equal(item?.title, headers[i], 'Menu changed while inspecting');
    items.push(item);
    writeFileSync(`${out}/last-category-checkpoint.json`, JSON.stringify({headers, items, complete:false},null,2)+'\n');
    item.inspection = item.entries.length ? 'exercise-menu-read' : item.otherLinks.length ? 'other-links-read' : item.childGroups.length ? 'nested-menu-needs-inspection' : 'empty-result-not-proof-of-absence';
  }
  return items;
}
const categoryNames = ['ABC','Junior','Schrijven','Lezen','Klanken','Luisteren','Spreken',"Thema's",'Woorden','Regels','Grammatica','Extra'];
const categories = run(`(()=>{${guard}return JSON.stringify(Array.from(document.querySelectorAll('a.nav-link')).map(a=>a.textContent.trim()).filter(t=>${JSON.stringify(categoryNames)}.includes(t)))})()`);
assert(categories.includes('ABC') && categories.includes('Extra'));
const results = { observedAt: new Date().toISOString(), method: 'Logged-in visible menus; not exercise completion or mastery validation', categories: [] };
try {
  for(const category of categories) {
    run(`(()=>{${guard}const a=Array.from(document.querySelectorAll('a.nav-link')).find(a=>a.textContent.trim()===${JSON.stringify(category)});a.click();return JSON.stringify(true)})()`);
    await pause(); await pause();
    const items = await collect();
    results.categories.push({ category, items });
    writeFileSync(`${out}/diglin-menu-evidence.json`, JSON.stringify(results, null, 2)+'\n');
    console.log(`${category}: ${items.length} menu groups, ${items.reduce((n,i)=>n+i.entries.length,0)} exercise links; empty groups: ${items.filter(i=>!i.entries.length).length}`);
  }
  const lists = results.categories.find(c=>c.category==='ABC').items.filter(i=>/^Lijst (\d+)\b/.test(i.title));
  assert.equal(lists.length,16);
  assert(lists.every(i=>i.entries.length>0));
  console.log('Verified 16 ABC menu inventories. No answers submitted.');
} finally {
  run(`(()=>{${guard}Array.from(document.querySelectorAll('a.nav-link')).find(a=>a.textContent.trim()==='ABC')?.click();return JSON.stringify(true)})()`);
}
