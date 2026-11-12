'use client';

import React from 'react';
import { Card } from '@/types';
import ShareButton from './ShareButton';
import AddToCalendar from './AddToCalendar';

interface ShareStripProps {
  card: Card;
  className?: string;
}

export default function ShareStrip({ card, className }: ShareStripProps) {
  return (
    <div className={className ?? 'p-2.5 rounded-lg bg-cw-tint-rust/80 border border-cw-rust/20 flex items-center justify-between gap-2 flex-wrap'}>
      <div className="flex items-center gap-2 flex-wrap">
        <ShareButton
          target={{
            type: 'card',
            path: `/c/${card.slug}`,
            title: card.headline,
            cardSlug: card.slug,
            zip: card.zipCode,
          }}
        />

        {card.actionMeta?.meetingDateIso && (
          <AddToCalendar card={card} />
        )}
      </div>

      <span className="text-[11px] font-mono text-cw-bronze hidden sm:inline">
        Civic Share
      </span>
    </div>
  );
}
