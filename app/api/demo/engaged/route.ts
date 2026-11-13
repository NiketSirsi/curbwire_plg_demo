import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { DEMO_ENGAGED_EMAIL, DEFAULT_ZIP } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Founder Dock toggle: seed or clear a Cupertino GENERAL_BRIEF for this cw_uid
 * so Vallco can show/hide on-card "Notify me of the verdict" without typing an email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const engaged = body?.engaged === true;

    let ownUid = req.cookies.get('cw_uid')?.value;
    let setCookie = false;
    if (!ownUid) {
      ownUid = `usr_${Math.random().toString(36).substring(2, 10)}`;
      setCookie = true;
    }

    const store = getStore();

    if (engaged) {
      await store.addSubscriber({
        email: DEMO_ENGAGED_EMAIL,
        zipCode: DEFAULT_ZIP,
        sourceCardSlug: null,
        intentType: 'GENERAL_BRIEF',
        userRefId: ownUid,
      });
    } else {
      await store.removeSubscribersForUser(ownUid);
    }

    const email = engaged ? DEMO_ENGAGED_EMAIL : await store.findSubscriberEmail(ownUid);
    const hasVerdictAlert = await store.hasVerdictAlert(ownUid);

    const response = NextResponse.json({
      success: true,
      engaged: Boolean(email),
      email,
      hasVerdictAlert,
    });

    if (setCookie) {
      response.cookies.set('cw_uid', ownUid, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false,
      });
    }

    return response;
  } catch (err) {
    console.error('Error in POST /api/demo/engaged:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
