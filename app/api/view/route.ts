// app/api/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardSlug, referrerId, sourceChannel, userZip } = body;

    const store = getStore();
    await store.recordView({
      cardSlug: cardSlug || null,
      referrerId: referrerId || undefined,
      sourceChannel: sourceChannel || undefined,
      userZip: userZip || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/view:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
