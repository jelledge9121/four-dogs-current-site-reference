import type { Event } from './event-system';
import type { Venue } from '../data/venues';
import { configured } from './registration-auth';
import { query } from './registration-db';
import { eligibleEvent, resolvePolicy, registrationCutoff, type Policy } from './registration-core';

export type PolicyMap = Record<string, Partial<Policy>>;

/** null means registration is unavailable, not "no policy overrides". */
export async function loadRegistrationPolicies(): Promise<PolicyMap | null> {
  if (!configured()) return null;
  try {
    const rows = await query<Policy>('SELECT * FROM fde_registration.event_policies');
    return Object.fromEntries(rows.map(row => [row.event_id, row]));
  } catch (error) {
    console.error('Registration availability could not be checked:', String(error));
    return null;
  }
}
export function canRegisterFor(event: Event, venue: Venue, policies: PolicyMap | null, now = new Date()): boolean {
  if (!policies || !eligibleEvent(event, venue, now)) return false;
  const policy = resolvePolicy(event, venue, policies[event.id]);
  return policy.enabled && now < registrationCutoff(event, venue, policy);
}
