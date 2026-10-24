import assert from 'node:assert/strict';
import { build } from 'esbuild';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:5196';
const result = await build({ stdin: { contents: `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useIsMobile } from './hooks/use-mobile';
import { InputGroup, InputGroupAddon, InputGroupInput } from './components/ui/input-group';
import { ButtonGroup } from './components/ui/button-group';
import { Field } from './components/ui/field';
import { Label } from './components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './components/ui/carousel';
import { CompactLearnerApp } from './components/product/compact-learner-app';
function Widgets() {
 const mobile=useIsMobile();
 return <><output data-testid="mobile">{String(mobile)}</output>
 <Label htmlFor="maintenance-input">Voorbeeld</Label>
 <InputGroup><InputGroupAddon><span data-testid="addon">€</span><button type="button" data-testid="addon-button">Extra</button></InputGroupAddon><InputGroupInput id="maintenance-input" /></InputGroup>
 <ButtonGroup aria-label="Acties"><button type="button">Een</button><button type="button">Twee</button></ButtonGroup>
 <Field aria-label="Invoer"><input aria-label="Naam" /></Field>
 <Carousel aria-label="Voorbeelden" style={{width:200,margin:60}}><CarouselContent>{[1,2,3].map(n=><CarouselItem key={n} style={{flex:'0 0 100%',height:60}}>{n}</CarouselItem>)}</CarouselContent><CarouselPrevious/><CarouselNext/></Carousel>
 </>;
}
const root=createRoot(document.getElementById('maintenance-root'));
window.maintenanceWidgets=()=>root.render(<Widgets/>);
window.maintenancePlayer=()=>root.render(<CompactLearnerApp onExit={()=>root.render(<Widgets/>)}/>);
window.maintenanceWidgets();`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', alias: { '@': process.cwd(), 'next/image': process.cwd() + '/node_modules/vinext/dist/shims/image.js' }, define: { 'process.env': '{}', 'process.env.NODE_ENV': '"production"' } });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
 await page.goto(base); await page.waitForLoadState('networkidle');
 const styles = await page.locator('style').allTextContents();
 const stylesheets = await page.locator('link[rel=stylesheet]').evaluateAll(links => links.map(link => link.outerHTML).join(''));
 await page.route('**/maintenance-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html lang="nl"><head><title>Componentcontrole</title>'+stylesheets+'<style>'+styles.join('\n')+'</style></head><body><div id="maintenance-root"></div></body></html>' }));
 await page.goto(base + '/maintenance-fixture'); await page.waitForLoadState('networkidle');
 await page.addScriptTag({ content: result.outputFiles[0].text });
 await page.waitForFunction(() => document.querySelector('[data-testid="mobile"]')?.textContent === 'false');
 await page.setViewportSize({ width: 390, height: 900 });
 await page.waitForFunction(() => document.querySelector('[data-testid="mobile"]')?.textContent === 'true');
 await page.getByTestId('addon').click(); assert(await page.locator('#maintenance-input').evaluate(input => input === document.activeElement));
 await page.getByTestId('addon-button').focus(); await page.keyboard.press('Enter');
 assert(await page.getByTestId('addon-button').evaluate(button => button === document.activeElement));
 await page.getByText('Voorbeeld', { exact: true }).click(); assert(await page.locator('#maintenance-input').evaluate(input => input === document.activeElement));
 assert.equal(await page.locator('fieldset').count(), 6);
 await page.getByRole('button', { name: 'Next slide' }).click();
 await page.waitForFunction(() => !document.querySelector('[data-slot="carousel-previous"]')?.disabled);
 await page.getByRole('button', { name: 'Previous slide' }).click();
 await page.evaluate(() => window.maintenancePlayer());
 await page.locator('.compact-primary').waitFor();
 assert(await page.locator('.compact-actionbar').evaluate(element => element.classList.contains('idle')));
 await page.locator('.compact-primary').click();
 await page.waitForFunction(() => document.querySelector('.compact-actionbar')?.classList.contains('right'));
 await page.locator('.compact-primary').click();
 await page.waitForFunction(() => document.querySelector('.compact-actionbar')?.classList.contains('idle'));
 await page.locator('.compact-back').click();
 assert(await page.locator('.compact-actionbar').evaluate(element => element.classList.contains('idle')));
 await page.evaluate(() => window.maintenanceWidgets());
 await page.waitForFunction(() => document.querySelector('[data-testid="mobile"]')?.textContent === 'true');
 await page.setViewportSize({ width: 1024, height: 900 });
 await page.waitForFunction(() => document.querySelector('[data-testid="mobile"]')?.textContent === 'false');
 assert.deepEqual(errors, []);
 console.log('PASS component fixtures: responsive subscription, label/addon focus, keyboard button, native groups, carousel navigation/remount, legacy exercise reset');
} catch (error) { console.error({ browserErrors: errors, body: (await page.locator('body').innerText()).slice(0, 300) }); throw error; } finally { await browser.close(); }
