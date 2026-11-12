// lib/dates.ts
export const CW_TZ = 'America/Los_Angeles';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Calendar date + weekday of an instant, as seen in Pacific time. */
function pacificYmdw(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: CW_TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  return { y: +p.year, m: +p.month, d: +p.day, dow: WEEKDAYS.indexOf(p.weekday) };
}

/** Pacific UTC offset in minutes at a given instant (e.g., -480 for PST, -420 for PDT). */
function pacificOffsetMinutes(instant: Date): number {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: CW_TZ, timeZoneName: 'longOffset' })
    .formatToParts(instant).find((x) => x.type === 'timeZoneName')?.value ?? 'GMT';
  const m = label.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

/** The real instant for a Pacific wall-clock time (handles DST). */
export function pacificWallTimeToDate(y: number, m: number, d: number, hour: number, minute: number): Date {
  const naiveUtc = Date.UTC(y, m - 1, d, hour, minute);
  const off1 = pacificOffsetMinutes(new Date(naiveUtc));
  let result = naiveUtc - off1 * 60_000;
  const off2 = pacificOffsetMinutes(new Date(result)); // re-check across a DST boundary
  if (off2 !== off1) result = naiveUtc - off2 * 60_000;
  return new Date(result);
}

/** Next occurrence (never today) of a weekday at a Pacific wall-clock time. 0 = Sun ... 6 = Sat. */
export function getUpcomingPacificDate(targetDow: number, hour: number, minute: number, now: Date = new Date()): Date {
  const { y, m, d, dow } = pacificYmdw(now);
  const diff = (targetDow + 7 - dow) % 7 || 7;
  const t = new Date(Date.UTC(y, m - 1, d + diff)); // calendar arithmetic only
  return pacificWallTimeToDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), hour, minute);
}

/** Always formats in Pacific time, on server and client alike. */
export function formatPacific(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: CW_TZ, ...opts }).format(d);
}

/** ISO 8601 with explicit Pacific offset, e.g. 2026-11-19T18:30:00-08:00 */
export function toPacificIso(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: CW_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  const off = pacificOffsetMinutes(d);
  const abs = Math.abs(off);
  const sign = off < 0 ? '-' : '+';
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sign}${hh}:${mm}`;
}
