'use client';

import React from 'react';
import { Card } from '@/types';
import ShareButton from './ShareButton';
import AddToCalendar from './AddToCalendar';
import NotifyVerdictButton from './NotifyVerdictButton';

interface ShareStripProps {
  card: Card;
  className?: string;
  /** Engaged reader email from cw_uid lookup; enables on-card verdict notify. */
  knownEmail?: string | null;
  hasVerdictAlert?: boolean;
}

export default function ShareStrip({
  card,
  className,
  knownEmail = null,
  hasVerdictAlert = false,
}: ShareStripProps) {
  const showNotify = card.actionType === 'VERDICT_TRACK' && Boolean(knownEmail);

  return (
    <div
      className={
        className ??
        'p-2.5 rounded-lg bg-cw-tint-rust/80 border border-cw-rust/20 flex items-center justify-between gap-2 flex-wrap'
      }
    >
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

        {card.actionMeta?.meetingDateIso && <AddToCalendar card={card} />}

        {showNotify && knownEmail && (
          <NotifyVerdictButton
            card={card}
            knownEmail={knownEmail}
            initiallyOnList={hasVerdictAlert}
          />
        )}
      </div>

      <span className="text-[11px] font-mono text-cw-bronze hidden sm:inline">
        Civic Share
      </span>
    </div>
  );
}
