// lib/waitlist.ts
import 'server-only';
import { WaitlistStatus } from '@/types';
import { getStore } from '@/lib/store';
import { MOCK_ZIP_DIRECTORY } from '@/lib/mock-data';
import { REFERRALS_PER_BUMP, SITE_URL, SPOTS_PER_BUMP, WAITLIST_SEED_COUNT, WAITLIST_TARGET } from '@/lib/config';

export async function getWaitlistStatus(zip: string, email: string, ownUid: string): Promise<WaitlistStatus> {
  const store = getStore();
  const [rank, count, referred] = await Promise.all([
    store.marketUnlockRank(zip, email),
    store.countMarketUnlock(zip),
    store.countReferredSignups(zip, ownUid),
  ]);
  const pledgeCount = WAITLIST_SEED_COUNT + count;
  const bump = Math.floor(referred / REFERRALS_PER_BUMP) * SPOTS_PER_BUMP;
  return {
    waitlistPosition: Math.max(1, WAITLIST_SEED_COUNT + rank - bump),
    pledgeCount,
    targetPledges: WAITLIST_TARGET,
    progressPct: Math.min(100, Math.round((pledgeCount / WAITLIST_TARGET) * 100)),
    zip,
    cityName: MOCK_ZIP_DIRECTORY[zip] ?? null,
    shareUrl: `${SITE_URL}/unlock/${zip}?src=copy&ref=${ownUid}`,
  };
}

/** For /unlock/[zip]: the visitor's live status if they already joined this zip's waitlist, else null. */
export async function getWaitlistStatusForUser(zip: string, uid: string | undefined): Promise<WaitlistStatus | null> {
  if (!uid) return null;
  const email = await getStore().findMarketUnlockEmail(zip, uid);
  return email ? getWaitlistStatus(zip, email, uid) : null;
}
