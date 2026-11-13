// app/unlock/[zip]/page.tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getWaitlistStatusForUser, getWaitlistStatus } from '@/lib/waitlist';
import { getStore } from '@/lib/store';
import { resolveLocation } from '@/lib/location';
import { MOCK_ZIP_DIRECTORY } from '@/lib/mock-data';
import { LIVE_ZIPS, WAITLIST_SEED_COUNT, WAITLIST_TARGET } from '@/lib/config';
import ViewTracker from '@/components/ViewTracker';
import WaitlistPayoff from '@/components/WaitlistPayoff';
import UnlockFormClient from './UnlockFormClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    zip: string;
  };
}

export default async function RemoteUnlockPage({ params }: PageProps) {
  const { zip } = params;

  if (!/^\d{5}$/.test(zip)) {
    notFound();
  }

  // A waitlist page must never say Curbwire isn't in Cupertino
  if (LIVE_ZIPS.includes(zip)) {
    redirect(`/${zip}`);
  }

  const location = resolveLocation();
  const uid = cookies().get('cw_uid')?.value;

  // Check if returning subscriber
  const existingStatus = await getWaitlistStatusForUser(zip, uid);

  // If new visitor, compute current live count for display
  const store = getStore();
  const rawCount = await store.countMarketUnlock(zip);
  const currentPledges = WAITLIST_SEED_COUNT + rawCount;
  const progressPct = Math.min(100, Math.round((currentPledges / WAITLIST_TARGET) * 100));

  const cityName = MOCK_ZIP_DIRECTORY[zip] ?? null;
  const cleanCity = cityName ? cityName.split(',')[0].trim() : null;

  const headerTitle = cleanCity
    ? `Curbwire isn't in ${cleanCity} yet.`
    : `Curbwire isn't in your area (${zip}) yet.`;

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-xl space-y-8">
        <ViewTracker cardSlug={null} userZip={zip} />

        {/* Back Link */}
        <div>
          <Link
            href="/95014"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cw-rust hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>See live Cupertino demo issue</span>
          </Link>
        </div>

        {/* Hero Header */}
        <header className="space-y-2 border-b border-cw-sand pb-5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cw-rust block">
            Community Node Unlock · Zip {zip}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold cw-font-serif text-cw-charcoal leading-tight">
            {headerTitle}
          </h1>
          <p className="text-sm cw-font-body text-cw-bronze leading-relaxed">
            We expand one zip code at a time when enough local residents pledge interest. When 50 neighbors join, we launch your municipal intelligence node.
          </p>
        </header>

        {/* Main Content Area: Returning Subscriber vs First-Time Visitor */}
        {existingStatus ? (
          <div className="space-y-4">
            <div className="p-3 bg-cw-tint-rust/60 rounded-lg border border-cw-rust/20 text-xs font-mono text-cw-charcoal">
              Welcome back! Here is your active referral and pledge standing for {cityName || zip}:
            </div>
            <WaitlistPayoff status={existingStatus} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Snapshot */}
            <div className="p-5 rounded-xl border border-cw-sand bg-white shadow-xs space-y-2">
              <div className="flex justify-between text-xs font-mono text-cw-bronze">
                <span>Pledges Accumulated</span>
                <span className="font-semibold text-cw-charcoal">{currentPledges} / {WAITLIST_TARGET}</span>
              </div>
              <div className="w-full h-2.5 bg-cw-sand/40 rounded-full overflow-hidden p-0.5 border border-cw-sand">
                <div 
                  className="h-full bg-cw-rust rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-cw-stone text-right">
                {WAITLIST_TARGET - currentPledges} more pledges needed to launch
              </div>
            </div>

            {/* Client Form */}
            <Suspense fallback={null}>
              <UnlockFormClient zip={zip} cityName={cityName} />
            </Suspense>
          </div>
        )}

        {/* What to expect section */}
        <section className="p-5 rounded-xl border border-cw-sand/80 bg-white/60 text-xs cw-font-body text-cw-charcoal space-y-2.5">
          <h4 className="font-bold cw-font-serif text-sm text-cw-charcoal">
            What is a Curbwire Municipal Node?
          </h4>
          <p className="text-cw-stone leading-relaxed">
            A calm, twice-monthly briefing summarizing city council decisions, planning commission variances, local code quirks, and public hearings in your immediate neighborhood. No algorithms, no advertisements, no outrage.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-6 pb-12 border-t border-cw-sand text-center text-xs font-mono text-cw-stone">
          <p>© {new Date().getFullYear()} Curbwire. Product-Led Civic Growth.</p>
        </footer>
      </div>
    </main>
  );
}
