'use client';

import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/types';

interface NotifyVerdictButtonProps {
  card: Card;
  knownEmail: string;
  initiallyOnList?: boolean;
}

export default function NotifyVerdictButton({
  card,
  knownEmail,
  initiallyOnList = false,
}: NotifyVerdictButtonProps) {
  const [onList, setOnList] = useState(initiallyOnList);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (onList || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: knownEmail,
          zipCode: card.zipCode,
          cardSlug: card.slug,
          intentType: 'VERDICT_ALERT',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOnList(true);
        toast.success(
          data.alreadySubscribed
            ? "You're already on the verdict list."
            : "You're on the list — we'll notify you when the Commission decides."
        );
      } else {
        toast.error(data.error || 'Could not enable verdict alerts');
      }
    } catch {
      toast.error('Network error enabling verdict alerts');
    } finally {
      setLoading(false);
    }
  };

  if (onList) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cw-badge-coordination/15 border border-cw-badge-coordination/30 text-cw-badge-coordination text-xs font-mono font-medium">
        <Check className="w-3.5 h-3.5" />
        <span>On the verdict list</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-cw-sand text-cw-charcoal text-xs font-mono font-medium hover:bg-cw-sand/20 transition shadow-2xs disabled:opacity-60"
    >
      <Bell className="w-3.5 h-3.5 text-cw-rust" />
      <span>{loading ? 'Saving…' : 'Notify me of the verdict'}</span>
    </button>
  );
}
