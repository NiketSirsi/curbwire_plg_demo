import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Session identity for the Founder Dock / engaged-reader UI. */
export async function GET(req: NextRequest) {
  try {
    const uid = req.cookies.get('cw_uid')?.value;
    if (!uid) {
      return NextResponse.json(
        { success: true, engaged: false, email: null, hasVerdictAlert: false },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const store = getStore();
    const [email, hasVerdictAlert] = await Promise.all([
      store.findSubscriberEmail(uid),
      store.hasVerdictAlert(uid),
    ]);

    return NextResponse.json(
      {
        success: true,
        engaged: Boolean(email),
        email,
        hasVerdictAlert,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Error in GET /api/me:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
