import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];
const ADDED_DESTINATIONS = [
  ['rostov-on-don', 'Rostov-on-Don'],
  ['dagestan', 'Dagestan'],
  ['chechnya', 'Chechnya'],
  ['kabardino-balkaria', 'Kabardino-Balkaria'],
  ['arkhangelsk', 'Arkhangelsk'],
  ['murmansk', 'Murmansk'],
];

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
  const desktopNavBox = await page.locator('.nav').boundingBox();
  assert.ok(Math.abs(desktopNavBox.width - 1280 * 0.7) < 2, 'Desktop nav is 70% width');
  assert.ok(Math.abs(desktopNavBox.x - 1280 * 0.15) < 2, 'Desktop nav is centered');
  const soundToggle = page.locator('.sound-toggle--nav');
  await expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
  await soundToggle.click();
  await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');
  assert.equal(await page.evaluate(() => localStorage.getItem('russia-study-sound')), 'on');
  await soundToggle.click();
  await expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
  assert.equal(await page.evaluate(() => localStorage.getItem('russia-study-sound')), 'off');
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

  const earthDimensions = await page.evaluate(async () => {
    const sources = ['/images/earth-world.webp', '/images/earth-russia.webp'];
    return Promise.all(sources.map(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }));
  });
  assert.deepEqual(earthDimensions, [[4096, 2048], [4096, 2048]], 'Native 4K world and Russia Earth textures');
  assert.equal(await page.locator('.sphere-canvas').getAttribute('data-sphere-image'), '/images/earth-world.webp', 'Hero uses world globe instead of photos');

  const sphereImages = {
    vision: '/images/earth-world.webp',
    intelligence: '/images/earth-world.webp',
    possibilities: '/images/earth-world.webp',
    access: '/images/earth-russia.webp',
  };
  for (const id of ['vision', 'intelligence', 'possibilities', 'access']) {
    await page.evaluate((sectionId) => document.getElementById(sectionId).scrollIntoView(), id);
    await page.waitForTimeout(200);
    assert.equal(await page.locator(`#${id}`).count(), 1);
    assert.equal(await page.locator('.sphere-canvas').getAttribute('data-sphere-image'), sphereImages[id]);
  }

  assert.equal(await page.locator('.destination-motion-map, .destination-map').count(), 0);
  assert.equal(await page.locator('.destination-checklist').count(), 1);
  assert.equal(await page.locator('.destination-checklist__steps li').count(), 4);
  await page.locator('.destination-footer').scrollIntoViewIfNeeded();
  await expect(page.locator('.nav')).toHaveClass(/nav--map-hidden/);
  await expect(page.locator('.nav')).toHaveCSS('opacity', '0');
  await expect(page.locator('.globe-country-label')).toHaveText('RUSSIA');
  assert.equal(await page.locator('.globe-marker').count(), 9, 'All nine globe markers');
  assert.equal(await page.locator('.destination-checklist__cities button').count(), 9, 'All nine checklist choices');
  const kazanMarker = page.locator('.globe-marker[data-destination="kazan"]');
  await kazanMarker.waitFor({ state: 'visible', timeout: 15000 });
  await kazanMarker.click();
  await expect(kazanMarker).toHaveAttribute('aria-pressed', 'true');
  assert.equal(await page.evaluate(() => localStorage.getItem('russia-study-destination')), 'kazan');
  await expect(page.locator('#destination-checklist-title')).toHaveText('Kazan');
  for (const [id, name] of ADDED_DESTINATIONS) {
    await page.locator(`.globe-marker[data-destination="${id}"]`).click();
    await expect(page.locator('#destination-checklist-title')).toHaveText(name);
    assert.equal(await page.evaluate(() => localStorage.getItem('russia-study-destination')), id);
    if (id === 'kabardino-balkaria') {
      await expect(page.locator('.destination-checklist__destination small')).toHaveText('Map marker: Nalchik · administrative centre');
    }
  }
  await kazanMarker.click();
  await expect(page.locator('#destination-checklist-title')).toHaveText('Kazan');

  await page.locator('.destination-checklist__button').click();
  assert.equal(await page.locator('select[name="destination"]').inputValue(), 'kazan');
  assert.equal(await page.locator('select[name="destination"] option').count(), 10, 'Nine destinations plus undecided');
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
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(120);
  const desktopPanelEnd = await page.locator('.destination-checklist').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewport: innerHeight };
  });
  assert.ok(desktopPanelEnd.top >= 0 && desktopPanelEnd.bottom <= desktopPanelEnd.viewport + 1, 'Checklist stays fully visible at desktop page end');
  await expect(page.locator('.nav')).toHaveClass(/nav--map-hidden/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.nav')).not.toHaveClass(/nav--map-hidden/);
  await expect(page.locator('.nav')).toHaveCSS('opacity', '1');

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
  const mobileNavBox = await mobile.locator('.nav').boundingBox();
  assert.ok(Math.abs(mobileNavBox.width - 390 * 0.7) < 2, 'Mobile nav is 70% width');
  assert.ok(Math.abs(mobileNavBox.x - 390 * 0.15) < 2, 'Mobile nav is centered');
  assert.equal(await mobile.evaluate(() => document.body.scrollWidth <= innerWidth), true, 'Mobile horizontal overflow');
  await mobile.locator('.nav__toggle').click();
  await mobile.locator('.mobile-menu.is-open').waitFor({ state: 'visible' });
  await expect(mobile.locator('.sound-toggle--menu')).toBeVisible();
  await expect(mobile.locator('.sound-toggle--menu')).toHaveAttribute('aria-pressed', 'false');
  await mobile.locator('.mobile-menu a[href="#vision"]').click();
  await mobile.waitForTimeout(200);
  assert.equal(await mobile.locator('.mobile-menu').getAttribute('aria-hidden'), 'true');
  await mobile.locator('.destination-footer').scrollIntoViewIfNeeded();
  await expect(mobile.locator('.nav')).toHaveClass(/nav--map-hidden/);
  await expect(mobile.locator('.globe-country-label')).toHaveText('RUSSIA');
  const petersburgChoice = mobile.locator('.destination-checklist__cities button[data-destination="saint-petersburg"]');
  await petersburgChoice.waitFor({ state: 'visible', timeout: 15000 });
  await petersburgChoice.click();
  await expect(petersburgChoice).toHaveAttribute('aria-pressed', 'true');
  assert.equal(await mobile.evaluate(() => localStorage.getItem('russia-study-destination')), 'saint-petersburg');
  await expect(mobile.locator('#destination-checklist-title')).toHaveText('Saint Petersburg');
  await mobile.locator('.destination-checklist').scrollIntoViewIfNeeded();
  const mobileKazanChoice = mobile.locator('.destination-checklist__cities button').filter({ hasText: 'Kazan' });
  await mobileKazanChoice.click();
  await expect(mobileKazanChoice).toHaveAttribute('aria-pressed', 'true');
  await expect(mobile.locator('#destination-checklist-title')).toHaveText('Kazan');
  assert.equal(await mobile.evaluate(() => localStorage.getItem('russia-study-destination')), 'kazan');
  for (const [id, name] of ADDED_DESTINATIONS) {
    const choice = mobile.locator(`.destination-checklist__cities button[data-destination="${id}"]`);
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await expect(mobile.locator('#destination-checklist-title')).toHaveText(name);
    assert.equal(await mobile.evaluate(() => localStorage.getItem('russia-study-destination')), id);
  }
  assert.equal(await mobile.locator('.destination-map').count(), 0);
  assert.equal(await mobile.evaluate(() => document.body.scrollWidth <= innerWidth), true, 'Mobile globe horizontal overflow');
  await mobile.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await mobile.waitForTimeout(120);
  const mobilePanelEnd = await mobile.locator('.destination-checklist').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewport: innerHeight };
  });
  assert.ok(mobilePanelEnd.top >= 0 && mobilePanelEnd.bottom <= mobilePanelEnd.viewport + 1, 'Checklist stays fully visible at mobile page end');
  await expect(mobile.locator('.nav')).toHaveClass(/nav--map-hidden/);
  await mobile.close();

  const fallback = await browser.newPage({ viewport: { width: 1000, height: 750 }, reducedMotion: 'reduce' });
  fallback.on('pageerror', (error) => errors.push(error.message));
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await fallback.locator('.sphere-fallback__orb').waitFor({ state: 'visible', timeout: 15000 });
  assert.match(await fallback.locator('.sphere-fallback__orb').evaluate((node) => getComputedStyle(node).backgroundImage), /earth-world\.webp/, 'No-WebGL hero also uses world globe');
  await fallback.locator('.destination-footer').scrollIntoViewIfNeeded();
  await expect(fallback.locator('.globe-country-label--fallback')).toHaveText('RUSSIA');
  assert.equal(await fallback.locator('.globe-marker--fallback').count(), 9, 'All nine fallback controls');
  const fallbackRostov = fallback.locator('.globe-marker--fallback[data-destination="rostov-on-don"]');
  await fallbackRostov.waitFor({ state: 'visible', timeout: 15000 });
  await fallbackRostov.click();
  await expect(fallback.locator('#destination-checklist-title')).toHaveText('Rostov-on-Don');
  const fallbackMarker = fallback.locator('.globe-marker--fallback[data-destination="kazan"]');
  await fallbackMarker.waitFor({ state: 'visible', timeout: 15000 });
  await fallbackMarker.click();
  await expect(fallbackMarker).toHaveAttribute('aria-pressed', 'true');
  assert.equal(await fallback.evaluate(() => localStorage.getItem('russia-study-destination')), 'kazan');
  await expect(fallback.locator('#destination-checklist-title')).toHaveText('Kazan');
  await fallback.close();

  const animated = await browser.newPage({ viewport: { width: 1000, height: 750 }, reducedMotion: 'no-preference' });
  animated.on('pageerror', (error) => errors.push(error.message));
  animated.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await animated.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await animated.waitForTimeout(4200);
  await animated.locator('.destination-footer').scrollIntoViewIfNeeded();
  await expect(animated.locator('.nav')).toHaveClass(/nav--map-hidden/);
  await expect(animated.locator('.nav')).toHaveCSS('opacity', '0');
  await animated.evaluate(() => window.scrollTo(0, 0));
  await expect(animated.locator('.nav')).not.toHaveClass(/nav--map-hidden/);
  await expect(animated.locator('.nav')).toHaveCSS('opacity', '1');
  await animated.close();

  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  console.log('Smoke checks passed: 4K photo-free world globe in hero/content, Russia Earth destination map, nine globe/checklist/modal destinations, opt-in interface sounds, regional marker notes, side checklist, page-end visibility, centered navigation, mobile navigation, world/no-WebGL fallbacks, reduced motion, checklist CTA, and download.');
} finally {
  await browser.close();
}
