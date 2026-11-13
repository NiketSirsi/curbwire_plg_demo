export type ShareCopyTarget = {
  type: 'card' | 'issue' | 'waitlist';
  title: string;
  zip?: string;
  cityName?: string | null;
};

/**
 * Subject + body for share emails. Used by ShareEmailDialog and /demo/email
 * so the founder preview cannot drift from the real mailto copy.
 */
export function getShareEmailCopy(
  target: ShareCopyTarget,
  shareUrl: string,
  senderName?: string
): { subject: string; body: string; displayName: string } {
  const displayName = senderName?.trim() || 'A neighbor';
  const cleanCity = target.cityName ? target.cityName.split(',')[0].trim() : 'our neighborhood';

  if (target.type === 'card') {
    return {
      displayName,
      subject: target.title,
      body: `${displayName} thought you'd be interested in this article. Click ${shareUrl} to see!`,
    };
  }

  if (target.type === 'issue') {
    return {
      displayName,
      subject: `Curbwire for ${target.zip || 'Cupertino'}`,
      body: `${displayName} thought you'd be interested in this newsletter. Click ${shareUrl} to see!`,
    };
  }

  return {
    displayName,
    subject: `Help bring Curbwire to ${cleanCity}`,
    body: `${displayName} is trying to bring Curbwire to ${cleanCity}. Click ${shareUrl} to add your pledge!`,
  };
}

/** Read inbound referrer from ?ref= or the cw_ref cookie (client only). */
export function getInboundReferrerId(searchRef?: string | null): string | undefined {
  if (searchRef) return searchRef;
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)cw_ref=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}
