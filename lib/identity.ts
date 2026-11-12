// lib/identity.ts

/**
 * Returns the cw_uid cookie value, generating and setting it if absent.
 * Format: "usr_" + 8 random lowercase alphanumeric characters.
 * Safe for client-side execution in event handlers and effects only.
 */
export function ensureUid(): string {
  if (typeof document === 'undefined') return 'usr_anonymous';

  const match = document.cookie.match(/(?:^|;\s*)cw_uid=([^;]+)/);
  if (match && match[1]) {
    return match[1];
  }

  const randomPart = Math.random().toString(36).substring(2, 10);
  const newUid = `usr_${randomPart}`;
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `cw_uid=${newUid}; path=/; max-age=${maxAge}; SameSite=Lax`;
  return newUid;
}

/**
 * Builds the canonical trackable link with ?src={channel}&ref={cw_uid}
 */
export function buildShareLink(path: string, channel: 'native' | 'email' | 'copy', uid: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const separator = cleanPath.includes('?') ? '&' : '?';
  return `${base}${cleanPath}${separator}src=${channel}&ref=${uid}`;
}
