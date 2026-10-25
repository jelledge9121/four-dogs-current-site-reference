import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const home = file('src/pages/index.astro');
const layout = file('src/layouts/Base.astro');
const css = file('src/styles/premium-motion.css');
const motion = file('src/scripts/premium-motion.ts');
const eventCard = file('src/components/EventCard.astro');
const footer = file('src/components/Footer.astro');

test('booking and public-event actions remain distinct', () => {
  assert.match(home, /class="button fd-booking-button" href="\/booking\/"/);
  assert.match(home, /class="button secondary" href="\/events\/"/);
  assert.match(home, /alt="Friends at Four Dogs Survey Showdown/);
  assert.match(eventCard, /Event details:/);
});

test('progressive effects keep content visible without browser support', () => {
  assert.match(layout, /premium-motion\.css/);
  assert.match(layout, /premium-motion\.ts/);
  assert.match(motion, /'IntersectionObserver' in window/);
  assert.match(motion, /getBoundingClientRect\(\)\.top/);
  assert.match(motion, /activeObserver\.unobserve\(element\)/);
  assert.match(eventCard, /data-fd-reveal/);
});

test('reduced-motion and touch preferences are respected', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /hover:\s*hover/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /reduceMotion\.addEventListener\('change'/);
});

test('regional service area and structured-data hooks remain intact', () => {
  assert.match(home, /South Carolina, North Carolina, and Georgia/);
  assert.match(footer, /Serving South Carolina, North Carolina & Georgia/);
  assert.match(eventCard, /data-event-id=\{event\.id\}/);
  assert.match(eventCard, /startIso\(event\)/);
  assert.match(layout, /application\/ld\+json/);
});
