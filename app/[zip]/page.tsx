// app/[zip]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getMockIssue, getMockCards } from '@/lib/mock-data';
import { resolveLocation } from '@/lib/location';
import { getStore } from '@/lib/store';
import { LIVE_ZIPS } from '@/lib/config';
import { CardCategory } from '@/types';
import ViewTracker from '@/components/ViewTracker';
import ShareButton from '@/components/ShareButton';
import ShareStrip from '@/components/ShareStrip';
import GatedCardContent from '@/components/GatedCardContent';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    zip: string;
  };
}

const CATEGORY_LABELS: Record<CardCategory, string> = {
  COORDINATION: 'CIVIC COORDINATION',
  ABSURDITY: 'BUREAUCRATIC WHIMSY',
  EVENT: 'COMMUNITY EVENT',
  LOCAL_NEWS: 'LOCAL NEWS',
};

const CATEGORY_BADGE_COLORS: Record<CardCategory, string> = {
  COORDINATION: 'bg-cw-badge-coordination',
  ABSURDITY: 'bg-cw-badge-whimsy',
  EVENT: 'bg-cw-badge-event',
  LOCAL_NEWS: 'bg-cw-badge-news',
};

export default async function NewsletterIssuePage({ params }: PageProps) {
  const { zip } = params;

  if (!/^\d{5}$/.test(zip)) {
    notFound();
  }

  // Only LIVE_ZIPS (95014, 95015) have an issue; all other zips redirect to /unlock/[zip]
  if (!LIVE_ZIPS.includes(zip)) {
    redirect(`/unlock/${zip}`);
  }

  const location = resolveLocation();
  const issue = getMockIssue();
  const cards = getMockCards();

  const uid = cookies().get('cw_uid')?.value;
  const store = getStore();
  const knownEmail = uid ? await store.findSubscriberEmail(uid) : null;
  const hasVerdictAlert = uid ? await store.hasVerdictAlert(uid) : false;

  // Helper to format detail context lead-in: ^([^.:]{1,40}):\s
  function renderDetailContext(text?: string) {
    if (!text) return null;
    const match = text.match(/^([^.:]{1,40}):\s/);
    if (match) {
      const leadIn = match[1];
      const rest = text.slice(match[0].length);
      return (
        <p className="text-xs sm:text-sm cw-font-body text-cw-charcoal leading-relaxed p-3 rounded-lg bg-white/60 border border-cw-sand/60">
          <strong className="font-semibold text-cw-charcoal">{leadIn}: </strong>
          {rest}
        </p>
      );
    }
    return (
      <p className="text-xs sm:text-sm cw-font-body text-cw-charcoal leading-relaxed p-3 rounded-lg bg-white/60 border border-cw-sand/60">
        {text}
      </p>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <ViewTracker cardSlug={null} userZip={location.zip} />

        {/* Masthead */}
        <header className="space-y-3 border-b-2 border-cw-charcoal pb-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="text-4xl sm:text-5xl font-black cw-font-serif text-cw-charcoal tracking-tight">
              Hi, {zip}<span className="text-cw-rust">.</span>
            </h1>
            <span className="text-xs font-mono uppercase tracking-widest text-cw-bronze">
              {issue.cityName}, California
            </span>
          </div>

          {/* Sub-bar */}
          <div className="flex items-center justify-between text-xs font-mono text-cw-bronze pt-2 border-t border-cw-sand">
            <span>
              Curbwire Nº{issue.issueNumber} · {issue.formattedDate}
            </span>
            <Link href={`/${zip}`} className="text-cw-rust hover:underline">
              Read Online
            </Link>
          </div>
        </header>

        {/* Top Share Banner */}
        <div className="rounded-lg bg-cw-tint-rust border border-cw-rust/20 p-3 flex items-center justify-between transition hover:bg-cw-tint-rust/90">
          <ShareButton
            target={{
              type: 'issue',
              path: `/${zip}`,
              title: `Curbwire for ${zip}`,
              zip,
              cityName: issue.cityName,
            }}
            className="w-full flex items-center justify-between text-xs font-mono font-medium text-cw-charcoal group"
          >
            <span className="flex items-center gap-1.5">
              <span>Like Curbwire? Send To A Friend</span>
            </span>
            <span className="text-cw-rust group-hover:translate-x-0.5 transition-transform">→</span>
          </ShareButton>
        </div>

        {/* Card List */}
        <section className="space-y-8">
          {cards.map((card) => {
            const badgeColor = CATEGORY_BADGE_COLORS[card.category] ?? 'bg-cw-badge-coordination';
            const badgeLabel = CATEGORY_LABELS[card.category] ?? 'CIVIC UPDATE';

            return (
              <article
                key={card.id}
                className="p-5 sm:p-7 rounded-xl border border-cw-sand bg-white/70 shadow-xs space-y-4 transition hover:border-cw-stone/40"
              >
                {/* Category Badge */}
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-white ${badgeColor}`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold cw-font-serif text-cw-charcoal leading-snug">
                  <Link href={`/c/${card.slug}`} className="hover:text-cw-rust hover:underline transition">
                    {card.headline}
                  </Link>
                </h2>

                {/* Source Line */}
                <div className="text-xs font-mono text-cw-bronze">
                  <span>{card.sourceName}</span>
                  {card.actionMeta?.codeSection && (
                    <span> · {card.actionMeta.codeSection}</span>
                  )}
                </div>

                {/* Body + share strip: ABSURDITY cards stay blurred until shared */}
                <GatedCardContent card={card}>
                  <p className="text-sm sm:text-base cw-font-body text-cw-charcoal leading-relaxed">
                    {card.summary}
                  </p>

                  {card.detailContext && (
                    <div className="pt-2">
                      {renderDetailContext(card.detailContext)}
                    </div>
                  )}

                  {card.actionMeta?.meetingDateDisplay && (
                    <div className="text-xs font-mono font-medium text-cw-charcoal flex items-center gap-1.5 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cw-rust"></span>
                      <span>{card.actionMeta.meetingDateDisplay}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-cw-sand/50">
                    <ShareStrip
                      card={card}
                      knownEmail={knownEmail}
                      hasVerdictAlert={hasVerdictAlert}
                    />
                  </div>
                </GatedCardContent>
              </article>
            );
          })}
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-12 border-t border-cw-sand text-center text-xs font-mono text-cw-stone space-y-1.5">
          <p>© {new Date().getFullYear()} Curbwire Civic Intelligence. All rights reserved.</p>
          <p className="text-[11px] text-cw-stone/80">
            Published for residents of Cupertino (95014 / 95015).
          </p>
        </footer>
      </div>
    </main>
  );
}
