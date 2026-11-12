'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, ResolvedLocation, WaitlistStatus } from '@/types';
import { LIVE_ZIPS } from '@/lib/config';
import WaitlistPayoff from './WaitlistPayoff';
import ShareStrip from './ShareStrip';

interface GeoConversionBannerProps {
  location: ResolvedLocation;
  card: Card;
  isLocal: boolean;
}

export default function GeoConversionBanner({ location, card, isLocal }: GeoConversionBannerProps) {
  const router = useRouter();

  // Local state
  const [localEmail, setLocalEmail] = useState('');
  const [notifyVerdict, setNotifyVerdict] = useState(true);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Remote state
  const [remoteZip, setRemoteZip] = useState(location.zip || '80202');
  const [remoteEmail, setRemoteEmail] = useState('');
  const [remoteWaitlist, setRemoteWaitlist] = useState<WaitlistStatus | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);

  // Local Submit Handler
  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localEmail || !localEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLocalLoading(true);
    try {
      const intentType = notifyVerdict && card.actionType === 'VERDICT_TRACK' ? 'VERDICT_ALERT' : 'GENERAL_BRIEF';
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localEmail,
          zipCode: card.zipCode,
          cardSlug: card.slug,
          intentType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLocalSuccess(true);
        toast.success(data.alreadySubscribed ? 'Welcome back! Your preferences are updated.' : 'Subscribed to the Cupertino civic brief!');
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch {
      toast.error('Network error during subscription');
    } finally {
      setLocalLoading(false);
    }
  };

  // Remote Submit Handler
  const handleRemoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = remoteZip.trim();

    if (!cleanZip || !/^\d{5}$/.test(cleanZip)) {
      toast.error('Please enter a valid 5-digit zip code');
      return;
    }

    if (!remoteEmail || !remoteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if zip is already live
    if (LIVE_ZIPS.includes(cleanZip)) {
      toast('Curbwire is already live in this zip! Redirecting...');
      router.push(`/${cleanZip}`);
      return;
    }

    setRemoteLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: remoteEmail,
          zipCode: cleanZip,
          cardSlug: card.slug,
          intentType: 'MARKET_UNLOCK',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRemoteWaitlist({
          waitlistPosition: data.waitlistPosition,
          pledgeCount: data.pledgeCount,
          targetPledges: data.targetPledges,
          progressPct: data.progressPct,
          zip: data.zip,
          cityName: data.cityName,
          shareUrl: data.shareUrl,
        });
        toast.success('Pledge registered! You are on the unlock list.');
      } else {
        toast.error(data.error || 'Failed to submit pledge');
      }
    } catch {
      toast.error('Network error registering pledge');
    } finally {
      setRemoteLoading(false);
    }
  };

  // CASE A: LOCAL (Cupertino)
  if (isLocal) {
    if (localSuccess) {
      return (
        <div className="p-5 sm:p-6 rounded-xl border border-cw-badge-coordination/40 bg-white shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cw-badge-coordination/15 text-cw-badge-coordination">
              ✓ Subscribed
            </span>
            <h3 className="text-base font-bold cw-font-serif text-cw-charcoal pt-1">
              You're set for the Cupertino 2-minute calm civic briefing.
            </h3>
            {notifyVerdict && card.actionType === 'VERDICT_TRACK' && (
              <p className="text-xs cw-font-body text-cw-bronze">
                We'll email you immediately after the Planning Commission vote on this parcel.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-cw-sand/60 space-y-2">
            <span className="text-xs font-semibold cw-font-serif text-cw-charcoal block">
              Know a neighbor who should see this parcel?
            </span>
            <ShareStrip card={card} />
          </div>
        </div>
      );
    }

    return (
      <div className="p-5 sm:p-6 rounded-xl border border-cw-sand bg-white shadow-sm space-y-4 text-cw-charcoal">
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cw-rust">
            Civic Coordination · Local Briefing
          </span>
          <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug">
            Live in Cupertino? Get the 2-minute calm civic briefing.
          </h3>
          <p className="text-xs cw-font-body text-cw-stone">
            Zero noise, no outrage threads, just essential local decisions before they happen.
          </p>
        </div>

        <form onSubmit={handleLocalSubmit} className="space-y-3 pt-1">
          {card.actionType === 'VERDICT_TRACK' && (
            <label className="flex items-start gap-2.5 text-xs cw-font-body text-cw-charcoal cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyVerdict}
                onChange={(e) => setNotifyVerdict(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-cw-sand text-cw-rust focus:ring-cw-rust accent-cw-rust"
              />
              <span>
                Notify me when the Planning Commission issues a decision on this parcel.
              </span>
            </label>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="Your email address"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md bg-cw-parchment/40 border-cw-sand text-xs text-cw-charcoal placeholder-cw-stone/60 focus:outline-hidden focus:border-cw-rust"
            />
            <button
              type="submit"
              disabled={localLoading}
              className="px-4 py-2 rounded-md bg-cw-rust text-white text-xs font-mono font-medium hover:bg-cw-rust/90 transition shadow-xs flex-shrink-0"
            >
              {localLoading ? 'Subscribing...' : 'Get Cupertino Brief'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // CASE B: REMOTE (e.g. Denver 80202)
  if (remoteWaitlist) {
    return <WaitlistPayoff status={remoteWaitlist} />;
  }

  const cleanCity = location.cityName ? location.cityName.split(',')[0].trim() : null;
  const remoteHeader = cleanCity
    ? `This is from Cupertino, CA. Want calm civic briefs and weird local statutes in ${cleanCity}?`
    : `This is from Cupertino, CA. Want calm civic briefs and weird local statutes in your neighborhood?`;

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-cw-sand bg-white shadow-sm space-y-4 text-cw-charcoal">
      <div className="space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cw-rust">
          Inter-Community Expansion · Unlock Request
        </span>
        <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug">
          {remoteHeader}
        </h3>
        <p className="text-xs cw-font-body text-cw-stone">
          Pledge to bring Curbwire to your community. When 50 neighbors pledge, we launch your municipal node.
        </p>
      </div>

      <form onSubmit={handleRemoteSubmit} className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-32">
            <input
              type="text"
              required
              maxLength={5}
              placeholder="Zip Code"
              value={remoteZip}
              onChange={(e) => setRemoteZip(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-cw-parchment/40 border-cw-sand text-xs font-mono text-cw-charcoal placeholder-cw-stone/60 focus:outline-hidden focus:border-cw-rust"
            />
          </div>
          <div className="flex-1">
            <input
              type="email"
              required
              placeholder="Your email address"
              value={remoteEmail}
              onChange={(e) => setRemoteEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-cw-parchment/40 border-cw-sand text-xs text-cw-charcoal placeholder-cw-stone/60 focus:outline-hidden focus:border-cw-rust"
            />
          </div>
          <button
            type="submit"
            disabled={remoteLoading}
            className="px-4 py-2 rounded-md bg-cw-rust text-white text-xs font-mono font-medium hover:bg-cw-rust/90 transition shadow-xs flex-shrink-0"
          >
            {remoteLoading ? 'Pledging...' : 'Check My Neighborhood'}
          </button>
        </div>
      </form>
    </div>
  );
}
