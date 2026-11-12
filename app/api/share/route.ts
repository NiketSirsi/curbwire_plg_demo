// app/api/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { ShareChannel } from '@/types';

const VALID_CHANNELS: ShareChannel[] = ['native', 'email', 'copy'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardSlug, channel, referrerId } = body;

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json({ success: false, error: 'Invalid channel' }, { status: 400 });
    }

    const store = getStore();
    await store.recordShare({
      cardSlug: cardSlug || null,
      channel,
      referrerId: referrerId || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/share:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
