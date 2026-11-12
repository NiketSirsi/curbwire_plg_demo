export const WAITLIST_SEED_COUNT = 13;   // pre-existing pledges per zip, so the first real signup is #14
export const WAITLIST_TARGET = 50;
export const REFERRALS_PER_BUMP = 2;     // every 2 referred signups...
export const SPOTS_PER_BUMP = 5;         // ...moves the referrer up 5 spots
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const DEFAULT_ZIP = '95014';      // "/" redirects to this issue
export const LIVE_ZIPS = ['95014', '95015'];   // zips with a seeded issue; every other zip belongs to /unlock

/** "Denver, CO" -> "Denver". Use wherever copy needs the bare city name (Section 8.4 copy table). */
export const shortCity = (cityName: string) => cityName.split(',')[0].trim();
