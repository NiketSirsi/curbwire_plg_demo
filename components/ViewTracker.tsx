'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ensureUid } from '@/lib/identity';

interface ViewTrackerProps {
  cardSlug?: string | null;
  userZip?: string;
}

export default function ViewTracker({ cardSlug = null, userZip = '' }: ViewTrackerProps) {
  const searchParams = useSearchParams();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    // 1. Ensure user has a cw_uid
    const uid = ensureUid();

    // 2. Read inbound ref and src
    const ref = searchParams.get('ref');
    const src = searchParams.get('src');

    // 3. If inbound ref exists, store in cw_ref cookie for 30 days
    if (ref) {
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `cw_ref=${encodeURIComponent(ref)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }

    // 4. Log view event to API
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardSlug,
        referrerId: ref || uid,
        sourceChannel: src || 'direct',
        userZip: userZip || undefined,
      }),
    }).catch(() => {
      // ignore transient view log failure
    });
  }, [cardSlug, userZip, searchParams]);

  return null;
}
