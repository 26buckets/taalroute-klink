import assert from 'node:assert/strict';

export async function answerActivity(page, exercise, { advance = true, checkFocus = true } = {}) {
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
  const feedback = page.locator('.cp-exercise-feedback');
  assert.equal(await feedback.locator('output').getAttribute('aria-live'), 'polite');
  if (checkFocus) assert(await page.locator('.cp-exercise-record-head h3').evaluate(element => element === document.activeElement));
  if (exercise.requiresAudio || (exercise.mode === 'model' && exercise.prompt.audio)) {
    assert(await feedback.locator('button').isDisabled());
    await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.cp-exercise-feedback output').textContent.includes('Tik op Luister'));
  }
  if (exercise.componentId === 'ALF-CMP-001') {
    if (exercise.prompt.image) await page.waitForFunction(() => document.querySelector('.cp-model-content img')?.naturalWidth > 0);
  } else if (exercise.componentId === 'ALF-CMP-002') {
    const answer = exercise.answer.correctOptionIds[0];
    const buttons = page.locator('.cp-choice-grid button');
    const before = await buttons.evaluateAll(items => items.map(item => item.innerHTML));
    await buttons.nth(exercise.options.findIndex(option => option.id !== answer)).click();
    assert((await feedback.innerText()).includes('Probeer opnieuw'));
    assert(await feedback.locator('button').isDisabled());
    assert.deepEqual(await buttons.evaluateAll(items => items.map(item => item.innerHTML)), before);
    await buttons.nth(exercise.options.findIndex(option => option.id === answer)).click();
    assert.equal(await page.getByRole('button', { name: 'Controleer', exact: true }).count(), 0);
  } else if (exercise.componentId === 'ALF-CMP-005') {
    const bank = page.locator('.cp-tile-bank button');
    await bank.first().click();
    await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
    for (const id of exercise.answer.targetTileIds) {
      const index = exercise.tiles.findIndex(tile => tile.id === id);
      await bank.nth(index).click();
    }
    await page.getByRole('button', { name: 'Blijf hier', exact: true }).click();
    await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
    assert(await feedback.locator('button').isDisabled());
    await bank.nth(exercise.tiles.findIndex(tile => tile.id === exercise.answer.targetTileIds.at(-1))).click();
  } else if (exercise.componentId === 'ALF-CMP-004') {
    const sources = page.locator('.cp-match-board > div').nth(0).locator('button');
    const targets = page.locator('.cp-match-board > div').nth(1).locator('button');
    const originalImages = await targets.locator('img').evaluateAll(images => images.map(image => image.src));
    await sources.first().click();
    await targets.nth(exercise.targets.findIndex(target => target.id !== exercise.answer.mapping[exercise.sources[0].id])).click();
    assert((await feedback.innerText()).includes('Probeer opnieuw'));
    assert.equal(await sources.first().getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await targets.locator('img').evaluateAll(images => images.map(image => image.src)), originalImages);
    for (let i = 0; i < exercise.sources.length; i++) {
      if (i > 0) await sources.nth(i).click();
      await targets.nth(exercise.targets.findIndex(target => target.id === exercise.answer.mapping[exercise.sources[i].id])).click();
      assert(await sources.nth(i).isDisabled());
    }
    assert.equal(await page.getByRole('button', { name: 'Controleer', exact: true }).count(), 0);
  } else if (exercise.componentId === 'ALF-CMP-006') {
    assert.equal(await page.locator('.cp-example-listen').count(), 0);
    const input = page.locator('.cp-text-entry input');
    await input.fill('fout');
    await input.press('Enter');
    assert((await feedback.innerText()).includes('Probeer opnieuw'));
    assert.equal(await input.inputValue(), 'fout');
    await input.fill(exercise.fields[0].acceptedAnswers[0]);
    await input.press('Enter');
  } else throw Error(`Untested guided component: ${exercise.componentId}/${exercise.mode}`);
  if (exercise.assessment === 'answer') assert((await feedback.innerText()).includes('Goed'));
  if (advance) {
    const pause = page.getByRole('button', { name: 'Blijf hier', exact: true });
    if (await pause.count()) await pause.click();
    await feedback.locator('button').click();
  }
}
