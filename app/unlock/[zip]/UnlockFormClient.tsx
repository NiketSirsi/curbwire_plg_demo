'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { WaitlistStatus } from '@/types';
import { getInboundReferrerId } from '@/lib/share-copy';
import WaitlistPayoff from '@/components/WaitlistPayoff';

interface UnlockFormClientProps {
  zip: string;
  cityName: string | null;
}

export default function UnlockFormClient({ zip, cityName }: UnlockFormClientProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<WaitlistStatus | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          zipCode: zip,
          cardSlug: null,
          intentType: 'MARKET_UNLOCK',
          referrerId: getInboundReferrerId(searchParams.get('ref')),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          waitlistPosition: data.waitlistPosition,
          pledgeCount: data.pledgeCount,
          targetPledges: data.targetPledges,
          progressPct: data.progressPct,
          zip: data.zip,
          cityName: data.cityName,
          shareUrl: data.shareUrl,
        });
        toast.success(data.alreadySubscribed ? 'Welcome back! Here is your standing.' : 'Pledge registered!');
      } else {
        toast.error(data.error || 'Failed to submit pledge');
      }
    } catch {
      toast.error('Network error registering pledge');
    } finally {
      setLoading(false);
    }
  };

  if (status) {
    return <WaitlistPayoff status={status} />;
  }

  return (
    <div className="p-6 rounded-xl border border-cw-sand bg-white shadow-sm space-y-4 text-cw-charcoal">
      <div className="space-y-1">
        <h3 className="text-base font-bold cw-font-serif text-cw-charcoal">
          Pledge your interest in {cityName ? `${cityName} (${zip})` : zip}
        </h3>
        <p className="text-xs cw-font-body text-cw-stone">
          Enter your email to add your vote. You'll receive your live waitlist rank and referral link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-28">
            <input
              type="text"
              readOnly
              value={zip}
              className="w-full px-3 py-2 border rounded-md bg-cw-sand/20 border-cw-sand text-xs font-mono text-cw-bronze text-center cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <input
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-cw-parchment/40 border-cw-sand text-xs text-cw-charcoal placeholder-cw-stone/60 focus:outline-hidden focus:border-cw-rust"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-cw-rust text-white text-xs font-mono font-medium hover:bg-cw-rust/90 transition shadow-xs flex-shrink-0"
          >
            {loading ? 'Submitting...' : 'Pledge to Unlock'}
          </button>
        </div>
      </form>
    </div>
  );
}
