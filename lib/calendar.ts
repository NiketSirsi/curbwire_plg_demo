// lib/calendar.ts
import { Card } from '@/types';

/** 20261120T023000Z (compact UTC), required by Google Calendar's `dates` param and by iCalendar. */
const toCompactUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function range(card: Card) {
  const start = new Date(card.actionMeta!.meetingDateIso!); // parses the Pacific-offset ISO string
  const end = new Date(start.getTime() + (card.actionMeta!.durationMinutes ?? 120) * 60_000);
  return { start, end };
}

export function googleCalendarUrl(card: Card): string {
  const { start, end } = range(card);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: card.actionMeta?.calendarTitle ?? card.headline,
    dates: `${toCompactUtc(start)}/${toCompactUtc(end)}`,
    details: card.actionMeta?.calendarDetails ?? card.summary,
    location: card.actionMeta?.calendarLocation ?? '',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildIcs(card: Card): string {
  const { start, end } = range(card);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Curbwire//PLG POC//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${card.slug}@curbwire-poc`,
    `DTSTAMP:${toCompactUtc(new Date())}`,
    `DTSTART:${toCompactUtc(start)}`,
    `DTEND:${toCompactUtc(end)}`,
    `SUMMARY:${esc(card.actionMeta?.calendarTitle ?? card.headline)}`,
    `LOCATION:${esc(card.actionMeta?.calendarLocation ?? '')}`,
    `DESCRIPTION:${esc(card.actionMeta?.calendarDetails ?? card.summary)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'; // CRLF line endings required by RFC 5545
}
