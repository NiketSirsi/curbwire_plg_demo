'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, ResolvedLocation, WaitlistStatus } from '@/types';
import { LIVE_ZIPS } from '@/lib/config';
import { getInboundReferrerId } from '@/lib/share-copy';
import WaitlistPayoff from './WaitlistPayoff';
import ShareStrip from './ShareStrip';

interface GeoConversionBannerProps {
  location: ResolvedLocation;
  card: Card;
  isLocal: boolean;
  isRecipient?: boolean;
  /** Engaged reader: email already on file for this cw_uid. */
  knownEmail?: string | null;
  hasVerdictAlert?: boolean;
}

export default function GeoConversionBanner({
  location,
  card,
  isLocal,
  isRecipient = false,
  knownEmail = null,
  hasVerdictAlert = false,
}: GeoConversionBannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localEmail, setLocalEmail] = useState('');
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [verdictOnList, setVerdictOnList] = useState(hasVerdictAlert);
  const [verdictLoading, setVerdictLoading] = useState(false);

  const [remoteZip, setRemoteZip] = useState(location.zip || '80202');
  const [remoteEmail, setRemoteEmail] = useState('');
  const [remoteWaitlist, setRemoteWaitlist] = useState<WaitlistStatus | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const referrerId = getInboundReferrerId(searchParams.get('ref'));
  const isEngaged = Boolean(knownEmail);
  const emailForAddon = subscribedEmail || knownEmail;

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localEmail || !localEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLocalLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localEmail,
          zipCode: card.zipCode,
          cardSlug: card.slug,
          intentType: 'GENERAL_BRIEF',
          referrerId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribedEmail(localEmail.trim().toLowerCase());
        toast.success(
          data.alreadySubscribed
            ? 'Welcome back! Your preferences are updated.'
            : 'Subscribed to the Cupertino civic brief!'
        );
        // Refresh so on-card Notify appears for engaged readers
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to subscribe');
      }
    } catch {
      toast.error('Network error during subscription');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerdictAddon = async () => {
    if (!emailForAddon || verdictOnList || verdictLoading) return;

    setVerdictLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailForAddon,
          zipCode: card.zipCode,
          cardSlug: card.slug,
          intentType: 'VERDICT_ALERT',
          referrerId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerdictOnList(true);
        toast.success(
          data.alreadySubscribed
            ? "You're already on the verdict list."
            : "You're on the list — we'll notify you when the Commission decides."
        );
        router.refresh();
      } else {
        toast.error(data.error || 'Could not enable verdict alerts');
      }
    } catch {
      toast.error('Network error enabling verdict alerts');
    } finally {
      setVerdictLoading(false);
    }
  };

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
          referrerId,
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

  const recipientLead = (
    <p className="text-sm cw-font-body text-cw-charcoal font-medium leading-snug">
      Get your own local Curbwire Newsletter by signing up here.
    </p>
  );

  const verdictAddon = card.actionType === 'VERDICT_TRACK' && emailForAddon && (
    <div className="pt-2 border-t border-cw-sand/60 space-y-2">
      {verdictOnList ? (
        <p className="text-xs font-mono text-cw-badge-coordination flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          You&apos;re on the list for this hearing&apos;s verdict.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleVerdictAddon}
          disabled={verdictLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-cw-sand text-cw-charcoal text-xs font-mono font-medium hover:bg-cw-sand/20 transition disabled:opacity-60"
        >
          <Bell className="w-3.5 h-3.5 text-cw-rust" />
          <span>
            {verdictLoading ? 'Saving…' : 'Also notify me about this hearing'}
          </span>
        </button>
      )}
    </div>
  );

  if (isLocal) {
    // Engaged: no email form; verdict is on-card only
    if (isEngaged && !subscribedEmail) {
      return (
        <div className="p-5 sm:p-6 rounded-xl border border-cw-badge-coordination/40 bg-white shadow-sm space-y-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cw-badge-coordination/15 text-cw-badge-coordination">
              ✓ Subscribed
            </span>
            <h3 className="text-base font-bold cw-font-serif text-cw-charcoal pt-1">
              You&apos;re subscribed to the Cupertino brief.
            </h3>
            {card.actionType === 'VERDICT_TRACK' && (
              <p className="text-xs cw-font-body text-cw-bronze">
                Use <span className="font-medium text-cw-charcoal">Notify me of the verdict</span> on
                the card above for a one-tap alert on this hearing.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-cw-sand/60 space-y-2">
            <span className="text-xs font-semibold cw-font-serif text-cw-charcoal block">
              Know a neighbor who should see this parcel?
            </span>
            {/* Notify stays on the card only — do not duplicate it in this share nudge */}
            <ShareStrip card={card} />
          </div>
        </div>
      );
    }

    // Just signed up this session (cold or recipient) → success + optional verdict add-on
    if (subscribedEmail) {
      return (
        <div className="p-5 sm:p-6 rounded-xl border border-cw-badge-coordination/40 bg-white shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cw-badge-coordination/15 text-cw-badge-coordination">
              ✓ Subscribed
            </span>
            <h3 className="text-base font-bold cw-font-serif text-cw-charcoal pt-1">
              You&apos;re set for the Cupertino 2-minute calm civic briefing.
            </h3>
          </div>

          {verdictAddon}

          <div className="pt-2 border-t border-cw-sand/60 space-y-2">
            <span className="text-xs font-semibold cw-font-serif text-cw-charcoal block">
              Know a neighbor who should see this parcel?
            </span>
            <ShareStrip
              card={card}
              knownEmail={subscribedEmail}
              hasVerdictAlert={verdictOnList}
            />
          </div>
        </div>
      );
    }

    // Cold local or recipient: email first (no notify checkbox)
    return (
      <div className="p-5 sm:p-6 rounded-xl border border-cw-sand bg-white shadow-sm space-y-4 text-cw-charcoal">
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cw-rust">
            {isRecipient ? 'Shared with you · Local signup' : 'Civic Coordination · Local Briefing'}
          </span>
          {isRecipient ? (
            <>
              {recipientLead}
              <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug">
                Live in Cupertino? Get the 2-minute calm civic briefing.
              </h3>
            </>
          ) : (
            <>
              <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug">
                Live in Cupertino? Get the 2-minute calm civic briefing.
              </h3>
              <p className="text-xs cw-font-body text-cw-stone">
                Zero noise, no outrage threads, just essential local decisions before they happen.
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleLocalSubmit} className="space-y-3 pt-1">
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
          {isRecipient ? 'Shared with you · Unlock your city' : 'Inter-Community Expansion · Unlock Request'}
        </span>
        {isRecipient && recipientLead}
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
