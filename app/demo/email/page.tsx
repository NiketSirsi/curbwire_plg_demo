'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { getCardBySlug } from '@/lib/mock-data';
import { buildShareLink, ensureUid } from '@/lib/identity';
import { getShareEmailCopy } from '@/lib/share-copy';
import { SITE_URL } from '@/lib/config';

const DEFAULT_SLUG = 'apple-park-horse-commute-ordinance';

function DemoEmailInbox() {
  const searchParams = useSearchParams();

  const slug = searchParams.get('slug') || DEFAULT_SLUG;
  const name = searchParams.get('name') || 'A neighbor';
  const srcParam = searchParams.get('src');
  const channel: 'native' | 'email' | 'copy' =
    srcParam === 'native' || srcParam === 'copy' ? srcParam : 'email';
  const refParam = searchParams.get('ref');

  const [ref, setRef] = useState(refParam || 'usr_demo');

  useEffect(() => {
    if (refParam) {
      setRef(refParam);
      return;
    }
    setRef(ensureUid());
  }, [refParam]);

  const card = getCardBySlug(slug);
  const path = `/c/${slug}`;
  const title = card?.headline || 'Curbwire civic update';
  const shareUrl = buildShareLink(path, channel, ref, SITE_URL);
  const landingHref = `/c/${slug}?src=${channel}&ref=${encodeURIComponent(ref)}`;
  const { subject, body, displayName } = getShareEmailCopy(
    { type: 'card', title, zip: card?.zipCode },
    shareUrl,
    name
  );

  const linkIndex = body.lastIndexOf(shareUrl);
  const bodyBefore = linkIndex >= 0 ? body.slice(0, linkIndex) : body;
  const bodyAfter = linkIndex >= 0 ? body.slice(linkIndex + shareUrl.length) : '';

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 flex justify-center bg-cw-parchment">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-cw-bronze">
          <Link
            href="/95014?demo=1"
            className="inline-flex items-center gap-1.5 text-cw-rust hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to newsletter
          </Link>
          <span className="text-cw-stone">Demo · Recipient inbox</span>
        </div>

        <header className="space-y-1">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-cw-rust">
            Founder demo · What they receive
          </p>
          <h1 className="text-2xl font-bold cw-font-serif text-cw-charcoal">
            Inbox preview
          </h1>
          <p className="text-sm cw-font-body text-cw-stone">
            Simulated email a friend gets after an engaged Cupertino reader shares a microcard.
            Click the link to land as the recipient.
          </p>
        </header>

        <article className="rounded-xl border border-cw-sand bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cw-sand bg-cw-sand/20 text-xs font-mono text-cw-bronze">
            <Mail className="w-3.5 h-3.5 text-cw-rust" />
            <span>Inbox</span>
            <span className="text-cw-stone/70">·</span>
            <span className="text-cw-stone">1 unread</span>
          </div>

          <div className="px-5 py-4 space-y-3 border-b border-cw-sand/60 text-xs font-mono">
            <div className="flex gap-2">
              <span className="w-14 text-cw-stone shrink-0">From</span>
              <span className="text-cw-charcoal font-medium">{displayName} via Curbwire</span>
            </div>
            <div className="flex gap-2">
              <span className="w-14 text-cw-stone shrink-0">To</span>
              <span className="text-cw-charcoal">you@example.com</span>
            </div>
            <div className="flex gap-2">
              <span className="w-14 text-cw-stone shrink-0">Subject</span>
              <span className="text-cw-charcoal font-semibold cw-font-serif text-sm leading-snug">
                {subject}
              </span>
            </div>
          </div>

          <div className="px-5 py-6 space-y-5">
            <p className="text-sm cw-font-body text-cw-charcoal leading-relaxed">
              {bodyBefore}
              <Link href={landingHref} className="text-cw-rust underline break-all font-medium">
                {shareUrl}
              </Link>
              {bodyAfter}
            </p>

            <Link
              href={landingHref}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-md bg-cw-rust text-white text-xs font-mono font-semibold hover:bg-cw-rust/90 transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open shared microcard
            </Link>

            <p className="text-[11px] font-mono text-cw-stone">
              Tip: set the Founder Dock to{' '}
              <span className="text-cw-charcoal font-medium">Remote: Denver (80202)</span> before
              opening so the recipient signup hits the waitlist payoff.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

export default function DemoEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-cw-parchment text-xs font-mono text-cw-stone">
          Loading inbox preview…
        </main>
      }
    >
      <DemoEmailInbox />
    </Suspense>
  );
}
