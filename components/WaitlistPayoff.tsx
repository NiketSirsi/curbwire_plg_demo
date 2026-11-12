'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { WaitlistStatus } from '@/types';
import ShareButton from './ShareButton';

interface WaitlistPayoffProps {
  status: WaitlistStatus;
}

export default function WaitlistPayoff({ status }: WaitlistPayoffProps) {
  const [copied, setCopied] = React.useState(false);

  const cleanCity = status.cityName ? status.cityName.split(',')[0].trim() : null;

  const positionText = status.cityName
    ? `You are #${status.waitlistPosition} of ${status.targetPledges} pledges in ${status.cityName} (${status.zip}) to unlock Curbwire.`
    : `You are #${status.waitlistPosition} of ${status.targetPledges} pledges in your area (${status.zip}) to unlock Curbwire.`;

  const nudgeText = cleanCity
    ? `Share your unique link with 2 ${cleanCity} neighbors to move up 5 spots:`
    : `Share your unique link with 2 neighbors to move up 5 spots:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(status.shareUrl);
      setCopied(true);
      toast('Share link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);

      // Log copy share
      fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardSlug: null,
          channel: 'copy',
        }),
      }).catch(() => {});
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-cw-sand bg-white shadow-sm space-y-4 text-cw-charcoal animate-in fade-in duration-300">
      {/* Position Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cw-badge-coordination/15 text-cw-badge-coordination">
          <span>✓ Pledge Confirmed</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug pt-1">
          {positionText}
        </h3>
      </div>

      {/* Progress Bar (Clamped to 100%) */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-cw-bronze">
          <span>Progress</span>
          <span className="font-semibold text-cw-charcoal">{status.progressPct}% to node launch</span>
        </div>
        <div className="w-full h-3 bg-cw-sand/40 rounded-full overflow-hidden p-0.5 border border-cw-sand">
          <div 
            className="h-full bg-cw-rust rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, status.progressPct))}%` }}
          />
        </div>
        <div className="text-[11px] font-mono text-cw-stone text-right">
          {status.pledgeCount} / {status.targetPledges} verified pledges
        </div>
      </div>

      {/* Re-Share Nudge Box */}
      <div className="p-4 rounded-lg bg-cw-tint-rust/70 border border-cw-rust/20 space-y-3">
        <p className="text-xs sm:text-sm font-semibold cw-font-body text-cw-charcoal">
          {nudgeText}
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={status.shareUrl}
            className="flex-1 px-3 py-1.5 border rounded-md bg-white border-cw-sand text-xs font-mono text-cw-charcoal select-all truncate focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-md bg-white border border-cw-sand text-xs font-mono font-medium hover:bg-cw-sand/20 transition flex items-center gap-1 shadow-2xs flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cw-badge-coordination" /> : <Copy className="w-3.5 h-3.5 text-cw-stone" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <ShareButton
            target={{
              type: 'waitlist',
              path: `/unlock/${status.zip}`,
              title: `Help bring Curbwire to ${cleanCity || 'our neighborhood'}`,
              zip: status.zip,
              cityName: status.cityName,
            }}
            className="px-3 py-1.5 rounded-md bg-cw-rust text-white text-xs font-mono font-medium hover:bg-cw-rust/90 transition shadow-2xs flex items-center gap-1 flex-shrink-0"
          >
            <span>Share</span>
          </ShareButton>
        </div>

        <p className="text-[11px] font-mono text-cw-bronze">
          Every 2 friends who pledge moves your spot up by 5 positions.
        </p>
      </div>
    </div>
  );
}
