// All calendar boundaries use the business timezone, never the build server timezone.
export function easternToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function localIsoDateTime(date, time) {
  if (!time) return date;
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return date;
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  const clock = `${String(hour).padStart(2, '0')}:${match[2]}:00`;
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).format(new Date(`${date}T12:00:00Z`));
  const offset = zone.includes('GMT-4') ? '-04:00' : '-05:00';
  return `${date}T${clock}${offset}`;
}
