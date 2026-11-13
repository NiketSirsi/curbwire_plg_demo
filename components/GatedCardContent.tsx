'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/types';
import { ensureUid } from '@/lib/identity';
import ShareButton from './ShareButton';

interface GatedCardContentProps {
  card: Card;
  children: React.ReactNode;
  enabled?: boolean;
  /** Inbound share recipient (?ref= on /c/[slug]). Skips gate for this load only. */
  isRecipient?: boolean;
}

export default function GatedCardContent({
  card,
  children,
  enabled = true,
  isRecipient = false,
}: GatedCardContentProps) {
  const shouldGate = enabled && card.category === 'ABSURDITY';

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewHref, setPreviewHref] = useState(
    `/demo/email?slug=${encodeURIComponent(card.slug)}&ref=usr_demo&src=email`
  );

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`cw_unlocked_${card.slug}`);
      if (stored === '1') {
        setIsUnlocked(true);
      }
      const uid = ensureUid();
      setPreviewHref(
        `/demo/email?slug=${encodeURIComponent(card.slug)}&ref=${encodeURIComponent(uid)}&src=email`
      );
    }
  }, [card.slug]);

  useEffect(() => {
    function handleGlobalUnlock(e: Event) {
      const customEvent = e as CustomEvent<{ slug?: string }>;
      if (!customEvent.detail?.slug || customEvent.detail.slug === card.slug) {
        setIsUnlocked(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`cw_unlocked_${card.slug}`, '1');
        }
      }
    }

    function handleReset() {
      setIsUnlocked(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cw_unlocked_${card.slug}`);
      }
    }

    window.addEventListener('cw_card_unlocked', handleGlobalUnlock);
    window.addEventListener('cw_demo_reset', handleReset);
    return () => {
      window.removeEventListener('cw_card_unlocked', handleGlobalUnlock);
      window.removeEventListener('cw_demo_reset', handleReset);
    };
  }, [card.slug]);

  const handleUnlock = () => {
    setIsUnlocked(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cw_unlocked_${card.slug}`, '1');
    }
    toast.success('Unlocked — thanks for sharing.');
    window.dispatchEvent(
      new CustomEvent('cw_card_unlocked', { detail: { slug: card.slug } })
    );
  };

  if (!shouldGate) {
    return <>{children}</>;
  }

  // Recipient via ?ref= sees content; sharer unlock persists in localStorage
  const locked = !isRecipient && (!mounted || !isUnlocked);
  const showRecipientPreview = mounted && isUnlocked && !isRecipient;

  return (
    <div className={`relative ${locked ? 'min-h-[220px]' : ''}`}>
      <div
        className={`space-y-3 transition-all duration-500 ease-out ${
          locked
            ? 'blur-[6px] select-none pointer-events-none opacity-40 max-h-48 overflow-hidden'
            : 'blur-0 opacity-100'
        }`}
        aria-hidden={locked}
      >
        {children}
      </div>

      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-3">
          <div className="w-full max-w-xs rounded-lg border border-cw-sand bg-cw-parchment px-5 py-5 text-center shadow-md space-y-4">
            <p className="text-base font-bold cw-font-serif text-cw-charcoal leading-snug">
              Want to read more? Share with a friend!
            </p>

            <ShareButton
              target={{
                type: 'card',
                path: `/c/${card.slug}`,
                title: card.headline,
                cardSlug: card.slug,
                zip: card.zipCode,
              }}
              onShareSuccess={handleUnlock}
              className="w-full py-2.5 px-4 rounded-md bg-cw-rust hover:bg-cw-rust/90 text-white text-xs font-mono font-semibold transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to unlock</span>
            </ShareButton>
          </div>
        </div>
      )}

      {showRecipientPreview && (
        <div className="mt-3">
          <Link
            href={previewHref}
            className="text-xs font-mono text-cw-rust hover:underline"
          >
            See what they get →
          </Link>
        </div>
      )}
    </div>
  );
}
