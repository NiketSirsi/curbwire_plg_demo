// app/c/[slug]/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { getCardBySlug } from '@/lib/mock-data';
import { resolveLocation, isLocalToCard } from '@/lib/location';
import { getStore } from '@/lib/store';
import { SITE_URL } from '@/lib/config';
import { CardCategory } from '@/types';
import ViewTracker from '@/components/ViewTracker';
import ShareStrip from '@/components/ShareStrip';
import GeoConversionBanner from '@/components/GeoConversionBanner';
import GatedCardContent from '@/components/GatedCardContent';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    slug: string;
  };
  searchParams: {
    ref?: string;
    src?: string;
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = getCardBySlug(params.slug);
  if (!card || card.editorialStatus !== 'PUBLISHED') {
    return {
      title: 'Card Not Found | Curbwire',
    };
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: `${card.headline} | Curbwire`,
    description: card.summary,
    openGraph: {
      title: card.headline,
      description: card.summary,
      url: `/c/${card.slug}`,
      siteName: 'Curbwire Ambient Civic Intelligence',
      images: [
        {
          url: `/api/og?slug=${card.slug}`,
          width: 1200,
          height: 630,
          alt: card.headline,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: card.headline,
      description: card.summary,
      images: [`/api/og?slug=${card.slug}`],
    },
  };
}

export default async function StandaloneCardPage({ params, searchParams }: PageProps) {
  const card = getCardBySlug(params.slug);

  if (!card || card.editorialStatus !== 'PUBLISHED') {
    notFound();
  }

  const location = resolveLocation();
  const isLocal = isLocalToCard(location, card);
  const isRecipient = Boolean(searchParams.ref?.trim());

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
        <div className="text-sm cw-font-body text-cw-charcoal leading-relaxed p-4 rounded-lg bg-cw-parchment/60 border border-cw-sand/60">
          <strong className="font-semibold text-cw-charcoal">{leadIn}: </strong>
          {rest}
        </div>
      );
    }
    return (
      <div className="text-sm cw-font-body text-cw-charcoal leading-relaxed p-4 rounded-lg bg-cw-parchment/60 border border-cw-sand/60">
        {text}
      </div>
    );
  }

  const badgeColor = CATEGORY_BADGE_COLORS[card.category] ?? 'bg-cw-badge-coordination';
  const badgeLabel = CATEGORY_LABELS[card.category] ?? 'CIVIC UPDATE';

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <ViewTracker cardSlug={card.slug} userZip={location.zip} />

        {/* Back navigation */}
        <div className="flex items-center justify-between text-xs font-mono text-cw-bronze">
          <Link
            href={`/${card.zipCode}`}
            className="inline-flex items-center gap-1.5 text-cw-rust hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Issue #{6} · Cupertino ({card.zipCode})</span>
          </Link>
          <span className="text-cw-stone">
            {isRecipient ? 'Shared with you' : 'Single Card Focus'}
          </span>
        </div>

        {/* The Isolated Card */}
        <article className="p-6 sm:p-8 rounded-2xl border border-cw-sand bg-white shadow-sm space-y-5">
          {/* Category Badge */}
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-white ${badgeColor}`}
            >
              {badgeLabel}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-bold cw-font-serif text-cw-charcoal leading-tight">
            {card.headline}
          </h1>

          {/* Source Attribution Link */}
          <div className="text-xs font-mono text-cw-bronze flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-cw-stone">Source:</span>
            <a
              href={card.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cw-rust hover:underline inline-flex items-center gap-1"
            >
              <span>{card.sourceName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {card.actionMeta?.codeSection && (
              <span> · {card.actionMeta.codeSection}</span>
            )}
          </div>

          {/* Body + share strip: ABSURDITY cards stay blurred until shared */}
          <GatedCardContent card={card} isRecipient={isRecipient}>
            <p className="text-base sm:text-lg cw-font-body text-cw-charcoal leading-relaxed font-normal">
              {card.summary}
            </p>

            {card.detailContext && (
              <div className="pt-2">
                {renderDetailContext(card.detailContext)}
              </div>
            )}

            {card.actionMeta?.meetingDateDisplay && (
              <div className="p-3 rounded-lg bg-cw-sand/20 border border-cw-sand/50 text-xs font-mono text-cw-charcoal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cw-rust"></span>
                <span className="font-semibold">Meeting Schedule:</span>
                <span>{card.actionMeta.meetingDateDisplay}</span>
              </div>
            )}

            <div className="pt-3 border-t border-cw-sand/60">
              <ShareStrip
                card={card}
                knownEmail={knownEmail}
                hasVerdictAlert={hasVerdictAlert}
              />
            </div>
          </GatedCardContent>
        </article>

        {/* Geo-Adaptive Conversion Banner */}
        <section className="pt-2">
          <Suspense fallback={null}>
            <GeoConversionBanner
              location={location}
              card={card}
              isLocal={isLocal}
              isRecipient={isRecipient}
              knownEmail={knownEmail}
              hasVerdictAlert={hasVerdictAlert}
            />
          </Suspense>
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-12 border-t border-cw-sand text-center text-xs font-mono text-cw-stone space-y-1">
          <p>© {new Date().getFullYear()} Curbwire. Calm civic intelligence for local communities.</p>
        </footer>
      </div>
    </main>
  );
}
