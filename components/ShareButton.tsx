'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ensureUid, buildShareLink } from '@/lib/identity';
import { SITE_URL } from '@/lib/config';
import ShareEmailDialog, { ShareTarget } from './ShareEmailDialog';

interface ShareButtonProps {
  target: ShareTarget;
  className?: string;
  children?: React.ReactNode;
  onShareSuccess?: () => void;
}

export default function ShareButton({ target, className, children, onShareSuccess }: ShareButtonProps) {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [computedUrl, setComputedUrl] = useState('');

  const logShare = (channel: 'native' | 'email' | 'copy') => {
    const uid = ensureUid();
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardSlug: target.cardSlug || null,
        channel,
        referrerId: uid,
      }),
    }).catch(() => {});

    onShareSuccess?.();
    if (target.cardSlug && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cw_card_unlocked', { detail: { slug: target.cardSlug } })
      );
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const uid = ensureUid();
    // Device check: must have navigator.share AND touch/coarse pointer
    const isMobile = 
      typeof navigator !== 'undefined' && 
      typeof navigator.share === 'function' && 
      window.matchMedia('(pointer: coarse)').matches;

    if (!isMobile) {
      const emailLink = buildShareLink(target.path, 'email', uid, SITE_URL);
      setComputedUrl(emailLink);
      setIsEmailOpen(true);
      return;
    }

    // Mobile path
    const nativeLink = buildShareLink(target.path, 'native', uid, SITE_URL);
    try {
      await navigator.share({
        title: target.title,
        text: target.title,
        url: nativeLink,
      });
      logShare('native');
    } catch (err: any) {
      // AbortError is user cancelling sheet - do not log or fallback
      if (err?.name !== 'AbortError') {
        const fallbackLink = buildShareLink(target.path, 'email', uid, SITE_URL);
        setComputedUrl(fallbackLink);
        setIsEmailOpen(true);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShareClick}
        className={
          className ??
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-cw-sand text-cw-charcoal text-xs font-mono font-medium hover:bg-cw-sand/20 transition shadow-2xs'
        }
      >
        {children ?? (
          <>
            <Share2 className="w-3.5 h-3.5 text-cw-rust" />
            <span>Share</span>
          </>
        )}
      </button>

      {isEmailOpen && (
        <ShareEmailDialog
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          target={target}
          shareUrl={computedUrl}
          onLogShare={logShare}
        />
      )}
    </>
  );
}
