// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getWaitlistStatus } from '@/lib/waitlist';
import { IntentType } from '@/types';

const VALID_INTENTS: IntentType[] = ['VERDICT_ALERT', 'GENERAL_BRIEF', 'MARKET_UNLOCK'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, zipCode, cardSlug, intentType, referrerId } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
    }

    if (!zipCode || typeof zipCode !== 'string' || !/^\d{5}$/.test(zipCode.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid 5-digit zip code' }, { status: 400 });
    }

    if (!intentType || !VALID_INTENTS.includes(intentType)) {
      return NextResponse.json({ success: false, error: 'Invalid intentType' }, { status: 400 });
    }

    // Determine user's own identity (cw_uid)
    let ownUid = req.cookies.get('cw_uid')?.value;
    let setCookieHeader = false;
    if (!ownUid) {
      ownUid = `usr_${Math.random().toString(36).substring(2, 10)}`;
      setCookieHeader = true;
    }

    // Self-referral protection: if referrerId equals ownUid, ignore referrer
    const cleanReferrer = referrerId && referrerId !== ownUid ? referrerId : undefined;
    const normalizedEmail = email.trim().toLowerCase();

    const store = getStore();
    const { created } = await store.addSubscriber({
      email: normalizedEmail,
      zipCode: zipCode.trim(),
      sourceCardSlug: cardSlug || null,
      intentType,
      referrerId: cleanReferrer,
      userRefId: ownUid,
    });

    let resData: any = {
      success: true,
      intentType,
      alreadySubscribed: !created,
    };

    if (intentType === 'MARKET_UNLOCK') {
      const waitlist = await getWaitlistStatus(zipCode.trim(), normalizedEmail, ownUid);
      resData = {
        ...resData,
        ...waitlist,
      };
    }

    const response = NextResponse.json(resData);
    if (setCookieHeader) {
      response.cookies.set('cw_uid', ownUid, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false,
      });
    }

    return response;
  } catch (err: any) {
    console.error('Error in /api/subscribe:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
