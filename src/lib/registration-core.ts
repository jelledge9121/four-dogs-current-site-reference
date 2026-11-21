import { createHmac, randomInt, scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';
import { Temporal } from '@js-temporal/polyfill';
import type { Event } from './event-system';
import type { Venue } from '../data/venues';
import { isPublic, localDateTime, needsTicket } from './event-system';

export type RewardKind = 'appetizer' | 'raffle' | 'none';
export type Policy = {
  event_id: string;
  enabled: boolean;
  reward_kind: RewardKind;
  reward_enabled: boolean;
  registration_closes_at: string | Date | null;
  reward_closes_at: string | Date | null;
};
export type RegistrationInput = {
  name: string; email: string; groupSize: number; teamName: string | null; eventId: string;
};
export const APPETIZER_TEXT = 'Your group is registered! Show your confirmation code to your Four Dogs host when you arrive. Once your registration is verified, your host will give you a physical coupon for one complimentary appetizer from Charter 803.\n\nOne appetizer per registered group. Your confirmation email is not an appetizer coupon.';
export const RAFFLE_TEXT = 'You’re registered! Show your confirmation code to your Four Dogs host when you arrive to receive one extra raffle ticket for tonight’s giveaway.';
export const NO_REWARD_TEXT = 'You’re registered for this event. Check in with your Four Dogs host when you arrive. No complimentary reward applies to this registration.';
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function secureCode(): string {
  return 'FDE-' + Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
export function validateRegistration(value: unknown): RegistrationInput {
  if (!value || typeof value !== 'object') throw new Error('Enter your registration details.');
  const input = value as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof input.email === 'string' ? normalizeEmail(input.email) : '';
  const groupSize = typeof input.groupSize === 'number' ? input.groupSize : Number(input.groupSize);
  const eventId = typeof input.eventId === 'string' ? input.eventId.trim() : '';
  const teamName = typeof input.teamName === 'string' && input.teamName.trim() ? input.teamName.trim().replace(/\s+/g, ' ') : null;
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001F\u007F]/.test(name)) throw new Error('Enter your name (2 to 100 characters).');
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 50) throw new Error('Group size must be between 1 and 50.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,119}$/.test(eventId)) throw new Error('Choose an event from the calendar.');
  if (teamName && (teamName.length > 80 || /[\u0000-\u001F\u007F]/.test(teamName))) throw new Error('Team name is too long.');
  return { name, email, groupSize, teamName, eventId };
}

export function defaultReward(event: Event, venue: Venue): RewardKind {
  const wed = Temporal.PlainDate.from(event.date).dayOfWeek === 3;
  return venue.id === 'charter-803' && wed && (event.eventType === 'Trivia' || event.eventType === 'Music Bingo')
    ? 'appetizer' : 'raffle';
}
export function defaultDeadline(event: Event, venue: Venue): Date {
  const cutoff = defaultReward(event, venue) === 'appetizer' ? '4:00 PM' : event.startTime!;
  return new Date(localDateTime(event.date, cutoff).epochMilliseconds);
}
export function eligibleEvent(event: Event | undefined, venue: Venue | undefined, now = new Date()): boolean {
  if (!event || !venue || !venue.active || !isPublic(event) || !event.startTime || event.timeTba) return false;
  if (!event.admission?.verified || event.admission.kind !== 'free' || needsTicket(event)) return false;
  if (!['scheduled', 'rescheduled'].includes(event.status)) return false;
  return new Date(localDateTime(event.date, event.startTime).epochMilliseconds) > now;
}
export function resolvePolicy(event: Event, venue: Venue, saved?: Partial<Policy> | null): Policy {
  return {
    event_id: event.id,
    enabled: saved?.enabled ?? true,
    reward_kind: saved?.reward_kind ?? defaultReward(event, venue),
    reward_enabled: saved?.reward_enabled ?? true,
    registration_closes_at: saved?.registration_closes_at ?? null,
    reward_closes_at: saved?.reward_closes_at ?? null,
  };
}
export function registrationCutoff(event: Event, venue: Venue, policy: Policy): Date {
  return policy.registration_closes_at ? new Date(policy.registration_closes_at) : defaultDeadline(event, venue);
}
export function rewardFor(event: Event, venue: Venue, policy: Policy, registeredAt: Date): RewardKind {
  if (!policy.reward_enabled || policy.reward_kind === 'none') return 'none';
  if (policy.reward_closes_at && registeredAt >= new Date(policy.reward_closes_at)) return 'none';
  // The Charter appetizer promotion never qualifies after 4 PM Wednesday Eastern,
  // even if an owner permits registration after the standard registration deadline.
  if (policy.reward_kind === 'appetizer' && venue.id === 'charter-803'
    && Temporal.PlainDate.from(event.date).dayOfWeek === 3
    && registeredAt >= new Date(localDateTime(event.date, '4:00 PM').epochMilliseconds)) return 'none';
  return policy.reward_kind;
}
export function rewardMessage(kind: RewardKind): string {
  return kind === 'appetizer' ? APPETIZER_TEXT : kind === 'raffle' ? RAFFLE_TEXT : NO_REWARD_TEXT;
}
export function easternTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short'
  }).format(new Date(date));
}
export function eventDateLabel(event: Event): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(new Date(event.date + 'T12:00:00Z'));
}
export function emailKey(eventId: string, normalizedEmail: string, secret: string): string {
  return createHmac('sha256', secret).update(eventId + '\0' + normalizedEmail).digest('hex');
}
export function secretHash(password: string, salt = randomBytes(16).toString('hex')): string {
  if (password.length < 12 || password.length > 256) throw new Error('Password must contain at least 12 characters.');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return 'scrypt$' + salt + '$' + hash;
}
export function verifySecret(password: string, stored: string): boolean {
  if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored)) return false;
  const [, salt, hex] = stored.split('$');
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, expected);
}
export function safeCSV(value: unknown): string {
  let text = String(value ?? '').replace(/[\r\n]+/g, ' ');
  if (/^\s*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function safeHTML(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] as string));
}
