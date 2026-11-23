import { createHmac, randomInt, scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';
import { Temporal } from '@js-temporal/polyfill';
import type { Event } from './event-system';
import type { Venue } from '../data/venues';
import { isPublic, localDateTime } from './event-system';

export type RewardKind = 'appetizer' | 'raffle' | 'none';
export type Policy = {
  event_id: string;
  enabled: boolean;
  reward_kind: RewardKind;
  redemption_deadline?: Date | string | null;
  reward_enabled: boolean;
  registration_closes_at: string | Date | null;
  reward_closes_at: string | Date | null;
};
export type RegistrationInput = {
  name: string; groupSize: number; teamName: string | null; eventId: string;
};
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function secureCode(): string {
  return 'FDE-' + Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

export function validateRegistration(value: unknown): RegistrationInput {
  if (!value || typeof value !== 'object') throw new Error('Enter your registration details.');
  const input = value as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  const groupSize = typeof input.groupSize === 'number' ? input.groupSize : Number(input.groupSize);
  const eventId = typeof input.eventId === 'string' ? input.eventId.trim() : '';
  const teamName = typeof input.teamName === 'string' && input.teamName.trim() ? input.teamName.trim().replace(/\s+/g, ' ') : null;
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001F\u007F]/.test(name)) throw new Error('Enter your name (2 to 100 characters).');
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 50) throw new Error('Group size must be between 1 and 50.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,119}$/.test(eventId)) throw new Error('Choose an event from the calendar.');
  if (teamName && (teamName.length > 80 || /[\u0000-\u001F\u007F]/.test(teamName))) throw new Error('Team name is too long.');
  return { name, groupSize, teamName, eventId };
}

export function defaultReward(event: Event, venue: Venue): RewardKind {
  const wed = Temporal.PlainDate.from(event.date).dayOfWeek === 3;
  return event.date >= '2026-12-02' && event.venueId === venue.id && venue.id === 'charter-803' && wed && (event.eventType === 'Trivia' || event.eventType === 'Music Bingo')
    ? 'appetizer' : 'none';
}
export function defaultDeadline(event: Event, venue: Venue): Date {
  const cutoff = event.startTime || '12:00 AM';
  return new Date(localDateTime(event.date, cutoff).epochMilliseconds);
}
export function eligibleEvent(event: Event | undefined, venue: Venue | undefined, now = new Date()): boolean {
  if (!event || !venue || !venue.active || !isPublic(event)) return false;

  if (!['scheduled', 'rescheduled'].includes(event.status)) return false;
  return new Date(defaultDeadline(event,venue).getTime()) > now;
}
export function resolvePolicy(event: Event, venue: Venue, saved?: Partial<Policy> | null): Policy {
  return {
    event_id: event.id,
    redemption_deadline: saved?.redemption_deadline,
    enabled: saved?.enabled ?? true,
    reward_kind: saved?.reward_kind ?? defaultReward(event, venue),
    reward_enabled: saved?.reward_enabled ?? true,
    registration_closes_at: saved?.registration_closes_at ?? null,
    reward_closes_at: saved?.reward_closes_at ?? null,
  };
}
export function registrationCutoff(event: Event, venue: Venue, policy: Policy): Date {
  const start = defaultDeadline(event,venue);
  return policy.registration_closes_at ? new Date(Math.min(+new Date(policy.registration_closes_at),+start)) : start;
}
export function rewardFor(event: Event, venue: Venue, policy: Policy, registeredAt: Date): RewardKind {
  if (defaultReward(event,venue) !== 'appetizer' || policy.reward_kind !== 'appetizer' || !policy.redemption_deadline || new Date(policy.redemption_deadline) <= registeredAt) return 'none';
  if (!policy.reward_enabled) return 'none';
  if (policy.reward_closes_at && registeredAt >= new Date(policy.reward_closes_at)) return 'none';
  // The Charter appetizer promotion never qualifies after 4 PM Wednesday Eastern,
  // even if an owner permits registration after the standard registration deadline.
  if (policy.reward_kind === 'appetizer' && venue.id === 'charter-803'
    && Temporal.PlainDate.from(event.date).dayOfWeek === 3
    && registeredAt >= new Date(localDateTime(event.date, '4:00 PM').epochMilliseconds)) return 'none';
  return policy.reward_kind;
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
  if (/^[\t\r\n]/.test(String(value ?? '')) || /^\s*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function safeHTML(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] as string));
}
