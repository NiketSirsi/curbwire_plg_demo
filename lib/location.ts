// lib/location.ts
import 'server-only';
import { headers, cookies } from 'next/headers';
import { Card, ResolvedLocation } from '@/types';
import { CITY_LOCAL_ZIPS, MOCK_ZIP_DIRECTORY } from '@/lib/mock-data';

function parseNetlifyGeo(h: string | null): { city?: string; country?: { code: string }; subdivision?: { code: string }; postalCode?: string } | null {
  if (!h) return null;
  try {
    return JSON.parse(Buffer.from(h, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export function resolveLocation(): ResolvedLocation {
  // 1. Cookie Override (cw_demo_zip) set by Founder Demo Dock
  const cookieZip = cookies().get('cw_demo_zip')?.value;
  if (cookieZip) {
    return {
      zip: cookieZip,
      cityName: MOCK_ZIP_DIRECTORY[cookieZip] ?? null,
      source: 'cookie',
    };
  }

  // 2. Netlify Geolocation Header (x-nf-geo)
  const geoHeader = headers().get('x-nf-geo');
  const geo = parseNetlifyGeo(geoHeader);
  if (geo && geo.city) {
    const cityLabel = geo.subdivision?.code ? `${geo.city}, ${geo.subdivision.code}` : geo.city;
    const zip = geo.postalCode ?? '';
    return {
      zip,
      cityName: cityLabel,
      source: 'netlify',
    };
  }

  // 3. Default Fallback (Denver 80202)
  return {
    zip: '80202',
    cityName: 'Denver, CO',
    source: 'default',
  };
}

export function isLocalToCard(loc: ResolvedLocation, card: Card): boolean {
  const cardCity = MOCK_ZIP_DIRECTORY[card.zipCode]; // "Cupertino, CA"
  if (loc.cityName && cardCity && loc.cityName.toLowerCase() === cardCity.toLowerCase()) {
    return true;
  }
  return (CITY_LOCAL_ZIPS[cardCity] ?? [card.zipCode]).includes(loc.zip);
}
