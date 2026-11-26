import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('venue page uses recurring-programming language and an inquiry-first CTA', () => {
  const page = read('../src/pages/for-venues.astro');
  assert.match(page, /A reason to put your place on next week’s calendar/);
  assert.match(page, /weekly venue night/);
  assert.match(page, /data-event-action="venue_partnership_cta"/);
  assert.match(page, /VenueProof venues=\{venues\} events=\{publicEvents\}/);
  assert.doesNotMatch(page, /Talk about a test night|Email Four Dogs/);
});

test('venue case-study examples use existing venue records and authentic media', () => {
  const component = read('../src/components/VenueProof.astro');
  const venues = JSON.parse(read('../src/data/venues.json')).venues;
  const venueIds = [...component.matchAll(/venueId: '([^']+)'/g)].map((match) => match[1]);
  assert.ok(venueIds.length >= 4);
  for (const id of venueIds) assert.ok(venues.some((venue) => venue.id === id), `known venue ${id}`);
  const images = [...component.matchAll(/photo: '(\/images\/[^']+)'/g)].map((match) => match[1]);
  assert.equal(images.length, venueIds.length);
  for (const image of images) assert.ok(fs.existsSync(path.resolve('public', `.${image}`)), `authentic source image ${image}`);
  assert.match(component, /36 to 64 players per night/);
  assert.match(component, /November 3, 10, 17 and 24, 2026/);
});

test('only the existing Charter 803 owner review is used as venue-owner proof', () => {
  const component = read('../src/pages/for-venues.astro');
  const reviews = read('../src/data/reviews.ts');
  assert.match(component, /venueOwnerReview\?\.approved/);
  assert.match(component, /showFull=\{true\}/);
  assert.match(reviews, /Owner, Charter 803 Bar & Grill/);
});

test('venue calculator has no published default fee and does not submit estimates', () => {
  const calculator = read('../src/pages/venue-calculator.astro');
  assert.match(calculator, /name="fee" min="0" step="\.01" placeholder="Enter your quote"/);
  assert.doesNotMatch(calculator, /name="fee"[^>]*value=/);
  assert.match(calculator, /nothing is saved or sent/);
  assert.match(calculator, /Discuss a weekly partnership/);
});

test('venue inquiries collect preferred night, existing program, and business goal', () => {
  const form = read('../src/components/BookingForm.astro');
  const tracking = read('../src/scripts/action-tracking.ts');
  for (const field of ['preferred-weeknight', 'existing-programming', 'venue-business-goal']) {
    assert.match(form, new RegExp(`name="${field}"`));
  }
  assert.match(form, /data-venue-partnership hidden disabled/);
  assert.match(form, /venueFields\.disabled = !venue/);
  assert.match(tracking, /venue_partnership_inquiry_attempt/);
  assert.match(read('../src/pages/for-venues.astro'), /data-event-action="venue_partnership_cta"/);
});
