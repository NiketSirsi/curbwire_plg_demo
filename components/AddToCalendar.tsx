'use client';

import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { Card } from '@/types';
import { googleCalendarUrl, buildIcs } from '@/lib/calendar';

interface AddToCalendarProps {
  card: Card;
}

export default function AddToCalendar({ card }: AddToCalendarProps) {
  if (!card.actionMeta?.meetingDateIso) return null;

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const icsContent = buildIcs(card);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curbwire-${card.slug}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const googleUrl = googleCalendarUrl(card);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-cw-sand text-cw-charcoal text-xs font-mono font-medium hover:bg-cw-sand/20 transition shadow-2xs"
      >
        <Calendar className="w-3.5 h-3.5 text-cw-badge-coordination" />
        <span>Google Calendar</span>
      </a>

      <button
        type="button"
        onClick={handleDownloadIcs}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-cw-sand text-cw-charcoal text-xs font-mono font-medium hover:bg-cw-sand/20 transition shadow-2xs"
        title="Download .ics calendar event"
      >
        <Download className="w-3.5 h-3.5 text-cw-stone" />
        <span>.ics</span>
      </button>
    </div>
  );
}
