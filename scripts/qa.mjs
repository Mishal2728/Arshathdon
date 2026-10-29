import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  assert.match(await page.title(), /Russia Guide/);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.evaluate(() => document.body.scrollWidth <= innerWidth), true, 'Desktop horizontal overflow');
  assert.equal(await page.locator('.intro-veil').evaluate((node) => getComputedStyle(node).display), 'none');
  assert.ok((await page.locator('.scene-video').evaluateAll((videos) => videos.map((video) => getComputedStyle(video).filter))).every((filter) => filter === 'none'));
  assert.equal(await page.locator('.scene-background__shade, .scene-background__vignette').count(), 0);
  assert.deepEqual(await page.locator('.scene-video').evaluateAll((videos) => videos.map((video) => ({
    src: video.getAttribute('src'),
    poster: video.getAttribute('poster'),
    paused: video.paused,
  }))), [
    { src: '/videos/russia-highlights.mp4', poster: '/images/russia-highlights.webp', paused: true },
    { src: '/videos/moscow-university.mp4', poster: '/images/moscow-university.webp', paused: true },
    { src: '/videos/saint-petersburg.mp4', poster: '/images/saint-petersburg.webp', paused: true },
  ]);

  const sphereImages = {
    vision: '/images/moscow-university.webp',
    intelligence: '/images/saint-petersburg.webp',
    possibilities: '/images/kazan-cathedral.webp',
    access: '/images/russia-map.webp',
  };
  for (const id of ['vision', 'intelligence', 'possibilities', 'access']) {
    await page.evaluate((sectionId) => document.getElementById(sectionId).scrollIntoView(), id);
    await page.waitForTimeout(200);
    assert.equal(await page.locator(`#${id}`).count(), 1);
    assert.equal(await page.locator('.sphere-canvas').getAttribute('data-sphere-image'), sphereImages[id]);
  }

  const kazanPin = page.locator('.destination-pin[data-destination="kazan"]');
  await kazanPin.click();
  assert.equal(await kazanPin.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.destination-map__preview img').getAttribute('src'), '/images/kazan-city.webp');
  assert.equal(await page.evaluate(() => localStorage.getItem('russia-study-destination')), 'kazan');
  assert.match(await page.locator('.destination-map__selection').innerText(), /Kazan/);

  await page.locator('.final__content button').click();
  assert.equal(await page.locator('select[name="destination"]').inputValue(), 'kazan');
  await page.locator('input[name="name"]').fill('Ada Lovelace');
  await page.locator('input[name="course"]').fill('Computer Science');
  await page.locator('.modal__submit').click();
  assert.equal(await page.locator('.modal__success').isVisible(), true);
  assert.match(await page.evaluate(() => localStorage.getItem('russia-study-checklist') || ''), /Computer Science/);
  assert.match(await page.evaluate(() => localStorage.getItem('russia-study-checklist') || ''), /kazan/);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.modal__success .modal__submit').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'russia-study-checklist.txt');
  const checklistText = await readFile(await download.path(), 'utf8');
  assert.match(checklistText, /Preferred destination: Kazan/);
  await page.locator('.modal__close').click();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  mobile.on('pageerror', (error) => errors.push(error.message));
  await mobile.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await mobile.waitForTimeout(1000);
  assert.equal(await mobile.evaluate(() => document.body.scrollWidth <= innerWidth), true, 'Mobile horizontal overflow');
  await mobile.locator('.nav__toggle').click();
  await mobile.locator('.mobile-menu.is-open').waitFor({ state: 'visible' });
  await mobile.locator('.mobile-menu a[href="#vision"]').click();
  await mobile.waitForTimeout(200);
  assert.equal(await mobile.locator('.mobile-menu').getAttribute('aria-hidden'), 'true');
  const petersburgChoice = mobile.locator('.destination-map__choices button').filter({ hasText: 'Saint Petersburg' });
  await petersburgChoice.click();
  assert.equal(await petersburgChoice.getAttribute('aria-pressed'), 'true');
  assert.equal(await mobile.locator('.destination-map__preview img').getAttribute('src'), '/images/saint-petersburg.webp');
  assert.equal(await mobile.locator('.destination-pin[data-destination="saint-petersburg"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await mobile.evaluate(() => document.body.scrollWidth <= innerWidth), true, 'Mobile map horizontal overflow');

  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  console.log('Smoke checks passed: natural Russia media, section sphere images, desktop/mobile map previews, reduced motion, navigation, checklist, and download content.');
} finally {
  await browser.close();
}
