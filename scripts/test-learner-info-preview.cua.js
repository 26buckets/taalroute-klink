export async function checkLearnerInfo(tab) {
  const root = tab.playwright.locator('[data-exercise-id]');
  const id = await root.getAttribute('data-exercise-id');
  const trigger = tab.playwright.getByRole('button', {name:'Over deze oefening',exact:true});
  const theme = await trigger.evaluate(e => getComputedStyle(e).getPropertyValue('--paper').trim());
  await trigger.click();
  await tab.getAXState();
  const dialog = tab.playwright.getByRole('dialog');
  const actual = await dialog.evaluate(e => {
    const r = e.getBoundingClientRect();
    return {width:innerWidth,height:innerHeight,panelFits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,
      noScrolling:e.scrollHeight<=e.clientHeight+1,
      paper:getComputedStyle(e).getPropertyValue('--paper').trim(),
      buttons:[...e.querySelectorAll('button')].every(b=>{const q=b.getBoundingClientRect();return q.width>=44&&q.height>=44&&q.top>=0&&q.bottom<=innerHeight;}),
      fontSize:getComputedStyle(e).fontSize};
  });
  if(!actual.panelFits||!actual.noScrolling||!actual.buttons||Number.parseFloat(actual.fontSize)<16||actual.paper!==theme)throw Error('Learner info does not fit or preserve its theme: '+JSON.stringify(actual));
  await tab.playwright.getByRole('button',{name:'Uitleg sluiten',exact:true}).press('Tab');
  if(!await dialog.evaluate(e=>e.contains(document.activeElement)))throw Error('Tab escaped the dialog');
  await tab.playwright.getByRole('button',{name:'Uitleg sluiten',exact:true}).press('ArrowRight');
  if(await root.getAttribute('data-exercise-id')!==id)throw Error('Dialog skipped an exercise');
  await tab.playwright.getByRole('button',{name:'Uitleg sluiten',exact:true}).press('Escape');
  await tab.getAXState();
  await dialog.waitFor({state:'hidden'});
  if(await root.getAttribute('data-exercise-id')!==id)throw Error('Closing changed the exercise');
  if(!await trigger.evaluate(e=>e===document.activeElement))throw Error('Focus did not return to the info button');
  if(await tab.playwright.getByRole('button',{name:'Hulp met je docent',exact:true}).count())throw Error('Old learner help button remains');
  return {...actual,themeMatches:true,keyboardContained:true,escapeAndFocusRestore:true,exercisePreserved:true,oldButtonRemoved:true};
}
