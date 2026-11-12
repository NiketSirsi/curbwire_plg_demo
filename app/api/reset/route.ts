// app/api/reset/route.ts
import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function POST() {
  try {
    const resetAllowed = (process.env.ALLOW_DEMO_RESET ?? 'true') === 'true';
    if (!resetAllowed) {
      return NextResponse.json({ success: false, error: 'Reset is disabled' }, { status: 403 });
    }

    const store = getStore();
    await store.reset();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/reset:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
