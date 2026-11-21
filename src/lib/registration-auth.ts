import { createHmac, timingSafeEqual } from 'node:crypto';
import { verifySecret } from './registration-core';

export type StaffSession = { staffId: string; role: 'owner' | 'host'; expires: number };
const COOKIE_NAME = 'fde_staff_session';
export const OWNER_ID = 'owner';

export function configured(): boolean {
  const provider = process.env.FDE_EMAIL_PROVIDER;
  const emailReady = provider === 'resend' && !!process.env.RESEND_API_KEY
    || provider === 'postmark' && !!process.env.POSTMARK_SERVER_TOKEN;
  return !!(process.env.FDE_REGISTRATION_ENABLED === 'true'
    && process.env.FDE_REGISTRATION_DATABASE_URL
    && process.env.FDE_SESSION_SECRET && process.env.FDE_SESSION_SECRET.length >= 32
    && process.env.FDE_OWNER_PASSWORD_HASH
    && process.env.FDE_EMAIL_FROM && emailReady);
}
export function configurationError(): string {
  return 'Registration is not yet available. Please check the event calendar for updates.';
}
function key(): string { return process.env.FDE_SESSION_SECRET || ''; }
function hmac(value: string): string {
  return createHmac('sha256', key()).update(value).digest('base64url');
}
export function sessionCookie(staffId: string, role: 'owner' | 'host', now = Date.now()): string {
  if (!key()) throw new Error('Session security is not configured');
  const data = Buffer.from(JSON.stringify({ staffId, role, expires: now + 8 * 60 * 60 * 1000 })).toString('base64url');
  return data + '.' + hmac(data);
}
export function readSession(req: Request, now = Date.now()): StaffSession | null {
  if (!key()) return null;
  const token = (req.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE_NAME + '='))?.slice(COOKIE_NAME.length + 1);
  if (!token || token.length > 800 || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const provided = Buffer.from(parts[1], 'utf8'), expected = Buffer.from(hmac(parts[0]), 'utf8');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as StaffSession;
    if (!payload || typeof payload.staffId !== 'string' || !['owner','host'].includes(payload.role)
      || !Number.isFinite(payload.expires) || payload.expires <= now || payload.expires > now + 8 * 60 * 60 * 1000) return null;
    if ((payload.role === 'owner') !== (payload.staffId === OWNER_ID)) return null;
    return payload;
  } catch { return null; }
}
export function setSessionCookie(token: string): string {
  return COOKIE_NAME + '=' + token + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800';
}
export function clearSessionCookie(): string {
  return COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}
export function verifyOwnerPassword(password: string): boolean {
  const expected = process.env.FDE_OWNER_PASSWORD_HASH || '';
  return verifySecret(password, expected);
}
export function postFromSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  return !!origin && origin === new URL(req.url).origin;
}
export function privateHeaders(): HeadersInit {
  return { 'Cache-Control':'no-store, private', 'X-Robots-Tag':'noindex,nofollow', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff' };
}
