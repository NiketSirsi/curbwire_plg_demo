// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getCardBySlug } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  COORDINATION: 'CIVIC COORDINATION',
  ABSURDITY: 'BUREAUCRATIC WHIMSY',
  EVENT: 'COMMUNITY EVENT',
  LOCAL_NEWS: 'LOCAL NEWS',
};

const CATEGORY_COLORS: Record<string, string> = {
  COORDINATION: '#3d6b4f',
  ABSURDITY: '#a83a25',
  EVENT: '#2b4c6f',
  LOCAL_NEWS: '#5a5347',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Read fonts from disk
    const fontDir = join(process.cwd(), 'assets', 'fonts');
    const [playfairData, monoData] = await Promise.all([
      readFile(join(fontDir, 'PlayfairDisplay-Bold.ttf')),
      readFile(join(fontDir, 'JetBrainsMono-Bold.ttf')),
    ]);

    const card = slug ? getCardBySlug(slug) : null;
    const isPublished = card && card.editorialStatus === 'PUBLISHED';

    const headline = isPublished
      ? card.headline.length > 110
        ? card.headline.slice(0, 107) + '...'
        : card.headline
      : 'Calm Municipal Intelligence for Local Communities';

    const categoryLabel = isPublished
      ? `${CATEGORY_LABELS[card.category] || 'CIVIC UPDATE'} · CUPERTINO ${card.zipCode}`
      : 'CURBWIRE CIVIC INTELLIGENCE · CUPERTINO 95014';

    const badgeBg = isPublished
      ? CATEGORY_COLORS[card.category] || '#a83a25'
      : '#a83a25';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#f7f1e1',
            padding: '24px',
          }}
        >
          {/* Inner Rust Frame */}
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '2px solid #a83a25',
              borderRadius: '8px',
              padding: '48px',
              backgroundColor: '#f7f1e1',
            }}
          >
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: badgeBg,
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: 18,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                {categoryLabel}
              </div>
            </div>

            {/* Center Headline */}
            <div
              style={{
                display: 'flex',
                fontSize: 52,
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                color: '#191713',
                lineHeight: 1.25,
                margin: '24px 0',
              }}
            >
              {headline}
            </div>

            {/* Bottom Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #d8cfb8',
                paddingTop: '20px',
                fontSize: 16,
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                color: '#5a5347',
                letterSpacing: '1px',
              }}
            >
              <div>CURBWIRE AMBIENT CIVIC INTELLIGENCE</div>
              <div>curbwire.com</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Playfair Display',
            data: playfairData,
            weight: 700,
            style: 'normal',
          },
          {
            name: 'JetBrains Mono',
            data: monoData,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
  } catch (err: any) {
    console.error('Error generating OG image:', err);
    // Generic fallback image response on error
    return new Response('Error generating OpenGraph preview', { status: 500 });
  }
}
