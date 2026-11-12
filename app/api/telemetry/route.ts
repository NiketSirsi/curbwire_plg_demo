// app/api/telemetry/route.ts
import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = getStore();
    const telemetry = await store.getTelemetry();
    return NextResponse.json(telemetry, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/telemetry:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
