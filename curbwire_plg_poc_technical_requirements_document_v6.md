# Technical Requirements Document (TRD): Curbwire PLG Engine Proof-of-Concept (v4)

**Version:** v4. Adds the Editorial Workflow (Section 10): card `editorialStatus`, a strict publish gate on all public routes, and the Founder Dock's Editorial Staging modal (blocked draft beside the corrected, approved card).

## 1. Project Overview & Non-Goals

### 1.1 Purpose & Scope
A standalone, hackathon-grade Proof-of-Concept (POC) designed to demonstrate Product-Led Growth (PLG) distribution mechanics and civic verification rigor to Curbwire founders Doug Hirsch and Trevor Budzek:
* **Loop 1 (Intra-Community Density):** Unbundling monolithic newsletters into atomic, shareable **"Decision Cards"** (Civic Coordination) with calendar hooks, mobile messaging triggers, and verdict tracking payoffs.
* **Loop 2 (Inter-Community Expansion):** Cross-boundary sharing via **"Bureaucratic Whimsy"** (verified quirky municipal statutes) coupled with dynamic OpenGraph previews, geo-adaptive conversion banners, and unlock waitlists.
* **Editorial Verification Gate (Founder Confidence):** Every card carries an `editorialStatus`. Only `PUBLISHED` cards reach readers; drafts with unverified or incorrect claims are flagged and withheld. The dock's staging drawer shows the blocked draft beside the corrected card that replaced it, directly addressing platform-credibility risk.

```
+───────────────────────────────────────────────────────────────────────────────────────────+
|                                    POC USER JOURNEY                                       |
+───────────────────────────────────────────────────────────────────────────────────────────+
  1. Newsletter Reader View (Cupertino 95014)
     ├── Card A: Planning Commission Decision Card (Vallco Pkwy)
     └── Card B: Absurd Statute (Apple Park horse commute: CVC § 21050 + Cupertino Code)
            │
            ├── User clicks "Text to Neighbor" or "WhatsApp" (?src=sms&ref=usr_xxxxxxxx)
            │
            ▼
  2. Standalone Card Landing Page (`/c/[slug]`)
     ├── Rich Link Preview (Dynamic OG with serif/mono layout)
     └── Geo-Adaptive Conversion Banner:
         ├── If Local (Cupertino): "Get notified when Planning Commission votes"
         │                     ──▶ [Simulate Verdict] Payoff in Dock
         └── If Remote (80202): "See weird statutes in your town. Enter your zip."
                               ──▶ [Unlock Waitlist #14 in 80202] + Re-share Prompt (/unlock/80202)
            │
            ▼
  3. Interactive Demo Control Dock (Founder Sandbox - accessible via ?demo=1)
     ├── Switch location (Local vs Remote), simulate verdicts, and view live telemetry
     └── [🛡️ Editorial Staging] Drawer: Inspect the AI hallucination gate (catches unverified code)
```

### 1.2 Explicit Non-Goals for the POC
* **No Authentication / Passwords:** Session identity is simulated via a generated anonymous id cookie (`cw_uid`) and the `?ref=` query param.
* **No Live Municipal Scraping:** Agendas and codes are supplied via structured seed data.
* **No Third-Party Email/SMS Transport:** Subscriptions and alerts are logged to Supabase (or the dev-only in-memory store) and displayed on-screen via simulation modals.
* **No Cards Table in the Database:** Cards are served from `lib/mock-data.ts` (their dates are computed per request). The database stores events and leads only.
* **No Editorial CMS:** `editorialStatus` is seed data. The POC has no approve, reject, or edit actions, and no review queue UI beyond the read-only Editorial Staging modal.

---

## 2. Technology Stack, Environment & Project Layout

### 2.1 Stack (Pinned)
* **Core Framework:** Next.js **14.2.15** (App Router, TypeScript). *Do NOT use Next 15 to avoid asynchronous dynamic route `params` breaking changes.*
* **Styling:** Tailwind CSS (configured with Curbwire design tokens).
* **Icons:** `lucide-react` (clean, non-intrusive line icons).
* **OpenGraph Image Generation:** `next/og` (`ImageResponse`, Node runtime, bundled TTF fonts).
* **Persistence:** Supabase (PostgreSQL) via `@supabase/supabase-js` v2, accessed **only from server code** (API routes and server components). The browser never talks to Supabase directly.
* **Hosting:** Netlify (using `@netlify/plugin-nextjs`).

### 2.2 Environment Variables
| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Public | Absolute site origin used for share links, `metadataBase`, OG URLs, and the unlock link (e.g., `https://curbwire-poc.netlify.app`). Never hardcode a domain. |
| `SUPABASE_URL` | Server only | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Used by API routes. **Never** prefix with `NEXT_PUBLIC_`. |
| `ALLOW_DEMO_RESET` | Server only | `true` (default for the POC) enables `POST /api/reset`. |

### 2.3 Persistence Policy
* **Deployed demo (Netlify):** Supabase is **required**. Serverless instances do not share memory, so an in-memory store cannot produce reliable counters or waitlist positions.
* **Local development only:** If `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing, fall back to the in-memory store (a `globalThis` singleton, which is stable under `next dev`) and log a console warning.
* **Misconfiguration guard:** If running on Netlify (`process.env.NETLIFY === 'true'`) without Supabase env vars, `GET /api/telemetry` returns `persistence: "memory"` and the dock shows a warning chip: *"Persistence not configured. Counts are unreliable."*
* LocalStorage is **not** used for telemetry. (It cannot be read by API routes.)

### 2.4 Project Layout
```
app/
  [zip]/page.tsx                 # Route 1: newsletter issue (dynamic)
  c/[slug]/page.tsx              # Route 2: card landing page (dynamic)
  unlock/[zip]/page.tsx          # Route 3: remote waitlist page (dynamic)
  api/
    og/route.tsx                 # OG image generator (Node runtime)
    subscribe/route.ts
    share/route.ts
    view/route.ts
    telemetry/route.ts
    reset/route.ts
assets/fonts/                    # PlayfairDisplay-Bold.ttf, JetBrainsMono-Bold.ttf
components/
  ShareStrip.tsx  AddToCalendar.tsx  GeoConversionBanner.tsx
  ViewTracker.tsx  VerdictModal.tsx  DemoControlDock.tsx  WeatherBar.tsx
  EditorialStagingModal.tsx
lib/
  dates.ts  mock-data.ts  location.ts  calendar.ts  identity.ts  config.ts
  store/ index.ts  supabase.ts  memory.ts
supabase/schema.sql
types/index.ts
```

---

## 3. Design System & Brand Tokens

The UI must faithfully replicate Curbwire's warm, publication-grade editorial identity.

### 3.1 Color Palette

| Token | Hex Value | Context / Application |
| :--- | :--- | :--- |
| `cw-parchment` | `#f7f1e1` | Primary page & container background |
| `cw-charcoal` | `#191713` | Headlines, primary text, dark borders |
| `cw-rust` | `#a83a25` | Primary actions, links, active badges, category highlights |
| `cw-bronze` | `#5a5347` | Subheaders, weather bars, metadata, timestamps |
| `cw-stone` | `#6B6B66` | Secondary links, quotes, copyright notes |
| `cw-sand` | `#d8cfb8` | Dividers, weather scale ticks, card borders |
| `cw-tint-rust` | `#f3ddd4` | Share strip highlight background, quote callouts |
| `cw-badge-coordination`| `#3d6b4f` | Forest green badge for planning & school board items |
| `cw-badge-whimsy` | `#a83a25` | Terracotta rust badge for quirky municipal codes |
| `cw-badge-event` | `#2b4c6f` | Slate navy badge for public events & ceremonies |
| `cw-badge-news` | `#5a5347` | Bronze badge for general city updates |
| `cw-badge-qa-flagged` | `#b91c1c` | Deep crimson badge for hallucination / verification rejections (FLAGGED chip, FAIL result) |

### 3.2 Typography Classes

* **Font Serif Display:** `'Playfair Display', Georgia, serif` (`cw-font-serif`)
* **Font Serif Body:** `'Spectral', Georgia, serif` (`cw-font-body`)
* **Font Monospace:** `'JetBrains Mono', Menlo, monospace` (`cw-font-mono`)

---

## 4. Data Models & Database Schema

All database fields and JSON schemas strictly adhere to `snake_case` in SQL and `camelCase` in TypeScript. The store layer (Section 7.2) is responsible for the mapping.

There is **no `cards` table** and **no foreign keys to cards**: cards live in `lib/mock-data.ts`, so `card_slug` is a plain text column. Row Level Security is enabled on every table with no policies; only the service-role key (server) can read or write.

```sql
-- supabase/schema.sql

-- Share Attribution Events (card_slug is NULL for issue-level shares)
CREATE TABLE share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_slug TEXT,
    channel VARCHAR(20) NOT NULL, -- 'sms', 'whatsapp', 'copy', 'email'
    referrer_id TEXT,             -- the sharer's own cw_uid
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View Attribution Events (card_slug is NULL for /unlock and issue views)
CREATE TABLE view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_slug TEXT,
    referrer_id TEXT,             -- inbound ?ref=
    source_channel VARCHAR(20),   -- inbound ?src=
    user_zip VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captured Subscribers & Leads
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    source_card_slug TEXT,
    intent_type VARCHAR(30) NOT NULL, -- 'VERDICT_ALERT', 'GENERAL_BRIEF', 'MARKET_UNLOCK'
    referrer_id TEXT,                 -- inbound referrer (who brought this person)
    user_ref_id TEXT,                 -- this person's own cw_uid (so they can be referrers)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent signups: same email + zip + intent is a no-op
CREATE UNIQUE INDEX subscribers_unique_signup
    ON subscribers (lower(email), zip_code, intent_type);

ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers  ENABLE ROW LEVEL SECURITY;
```

### TypeScript Interfaces (`types/index.ts`)

```typescript
export type CardCategory = 'COORDINATION' | 'ABSURDITY' | 'LOCAL_NEWS' | 'EVENT';
export type ActionType = 'CALENDAR' | 'VERDICT_TRACK' | 'EXTERNAL_LINK';
export type EditorialStatus = 'PUBLISHED' | 'FLAGGED_HALLUCINATION' | 'PENDING_REVIEW';
export type VerificationResult = 'PASS' | 'FAIL' | 'UNVERIFIED';
export type IntentType = 'VERDICT_ALERT' | 'GENERAL_BRIEF' | 'MARKET_UNLOCK';
export type ShareChannel = 'sms' | 'whatsapp' | 'copy' | 'email';

export interface CardActionMeta {
  meetingDateDisplay?: string;
  meetingDateIso?: string;       // ISO 8601 WITH Pacific offset (e.g., '2026-11-19T18:30:00-08:00'). Use toPacificIso(); never toISOString().
  durationMinutes?: number;      // Event length for calendar end time. Default 120.
  calendarTitle?: string;
  calendarLocation?: string;
  calendarDetails?: string;
  codeSection?: string;
  statuteOriginYear?: string;
}

export interface Card {
  id: string;
  slug: string;
  zipCode: string;               // Normalized to camelCase in TS
  category: CardCategory;
  headline: string;
  summary: string;
  detailContext?: string;
  sourceName: string;
  sourceUrl: string;
  actionType: ActionType;
  actionMeta?: CardActionMeta;
  editorialStatus: EditorialStatus;   // Only 'PUBLISHED' cards may appear on public routes
  flagReason?: string;                // e.g., "Historical context unverified in the municipal code"
  verificationNotes?: VerificationNote[]; // Shown in the Editorial Staging modal; optional on published cards
}

export interface VerificationNote {
  check: string;                      // e.g., "Enactment history"
  result: VerificationResult;
  detail: string;                     // What the verifier found
  excerpt?: string;                   // Exact substring of the draft to highlight in the modal
}

export interface NewsletterIssue {
  issueNumber: number;
  zipCode: string;
  cityName: string;
  formattedDate: string;
  weather: {
    blurb: string;
    days: Array<{
      day: string;
      icon: string;
      high: number;
      low: number;
      barPct: number;
    }>;
  };
}

export interface ResolvedLocation {
  zip: string;                   // May be '' if geo returned a city but no postal code
  cityName: string;              // e.g., "Cupertino, CA"
  source: 'cookie' | 'netlify' | 'default';
}

export interface Telemetry {
  sharesSent: number;
  linkViews: number;
  leadsCaptured: number;
  verdictAlertLeads: number;     // Lights up [Simulate Verdict] when > 0
  marketUnlockLeads: number;
  persistence: 'supabase' | 'memory';
}
```

---

## 5. Seed Data with Timezone-Safe Relative Dates

### 5.1 Rules (Non-Negotiable)
1. **All dates are built and formatted in `America/Los_Angeles`**, never in the server's local timezone. Netlify servers run in UTC, so `setHours()` or `toLocaleDateString()` without a `timeZone` produces wrong times and server/client hydration mismatches.
2. **Never call `toISOString()` for `meetingDateIso`.** It returns UTC. Use `toPacificIso()`, which keeps the Pacific offset.
3. **No module-level `new Date()`.** Seed data is exposed as **functions** (`getMockIssue()`, `getMockCards()`, `getCardBySlug()`) that take `now` and are called per request. Module-level constants freeze at build or cold start. (Date-free seed data, such as `MOCK_STAGED_CARDS`, may be a plain constant.)
4. Every route that renders dates (`/[zip]`, `/c/[slug]`, `/unlock/[zip]`) exports `export const dynamic = 'force-dynamic';`.
5. Client components must not format dates with `new Date()` on first render. Render the pre-formatted strings passed from the server (`meetingDateDisplay`).

### 5.2 Date Utilities (`lib/dates.ts`)
Dependency-free; uses `Intl` only.

```typescript
// lib/dates.ts
export const CW_TZ = 'America/Los_Angeles';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Calendar date + weekday of an instant, as seen in Pacific time. */
function pacificYmdw(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: CW_TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  return { y: +p.year, m: +p.month, d: +p.day, dow: WEEKDAYS.indexOf(p.weekday) };
}

/** Pacific UTC offset in minutes at a given instant (e.g., -480 for PST, -420 for PDT). */
function pacificOffsetMinutes(instant: Date): number {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: CW_TZ, timeZoneName: 'longOffset' })
    .formatToParts(instant).find((x) => x.type === 'timeZoneName')?.value ?? 'GMT';
  const m = label.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

/** The real instant for a Pacific wall-clock time (handles DST). */
export function pacificWallTimeToDate(y: number, m: number, d: number, hour: number, minute: number): Date {
  const naiveUtc = Date.UTC(y, m - 1, d, hour, minute);
  const off1 = pacificOffsetMinutes(new Date(naiveUtc));
  let result = naiveUtc - off1 * 60_000;
  const off2 = pacificOffsetMinutes(new Date(result)); // re-check across a DST boundary
  if (off2 !== off1) result = naiveUtc - off2 * 60_000;
  return new Date(result);
}

/** Next occurrence (never today) of a weekday at a Pacific wall-clock time. 0 = Sun ... 6 = Sat. */
export function getUpcomingPacificDate(targetDow: number, hour: number, minute: number, now: Date = new Date()): Date {
  const { y, m, d, dow } = pacificYmdw(now);
  const diff = (targetDow + 7 - dow) % 7 || 7;
  const t = new Date(Date.UTC(y, m - 1, d + diff)); // calendar arithmetic only
  return pacificWallTimeToDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), hour, minute);
}

/** Always formats in Pacific time, on server and client alike. */
export function formatPacific(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: CW_TZ, ...opts }).format(d);
}

/** ISO 8601 with explicit Pacific offset, e.g. 2026-11-19T18:30:00-08:00 */
export function toPacificIso(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: CW_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  const off = pacificOffsetMinutes(d);
  const abs = Math.abs(off);
  const sign = off < 0 ? '-' : '+';
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sign}${hh}:${mm}`;
}
```

### 5.3 Seed Functions (`lib/mock-data.ts`)

```typescript
// lib/mock-data.ts
import { Card, NewsletterIssue } from '@/types';
import { formatPacific, getUpcomingPacificDate, toPacificIso } from '@/lib/dates';

const shortDate = (d: Date) =>
  formatPacific(d, { weekday: 'short', month: 'short', day: 'numeric' });

export function getMockIssue(now: Date = new Date()): NewsletterIssue {
  return {
    issueNumber: 6,
    zipCode: "95014",
    cityName: "Cupertino",
    formattedDate: shortDate(now),
    weather: {
      blurb: "Warm and dry.",
      days: [
        { day: "TODAY", icon: "☀️", low: 53, high: 76, barPct: 75 },
        { day: "TOMORROW", icon: "☀️", low: 52, high: 77, barPct: 78 },
        { day: "NEXT", icon: "⛅", low: 54, high: 71, barPct: 65 },
      ]
    }
  };
}

/** PUBLISHED cards only. Every public route reads through this function (Section 10.3). */
export function getMockCards(now: Date = new Date()): Card[] {
  const nextThursday = getUpcomingPacificDate(4, 18, 30, now); // Next Thursday, 6:30 PM Pacific
  const nextSaturday = getUpcomingPacificDate(6, 10, 0, now);  // Next Saturday, 10:00 AM Pacific

  return [
    {
      id: "crd_01",
      slug: "vallco-pkwy-outdoor-dining-variance",
      zipCode: "95014",
      category: "COORDINATION",
      editorialStatus: "PUBLISHED",
      headline: "Planning Commission to Review 50-Seat Outdoor Dining Variance at 19900 Vallco Pkwy",
      summary: "The Cupertino Planning Commission will hold a public hearing on noise buffering, setback variances, and outdoor hours for the dining plaza.",
      detailContext: `What changed: Staff approved parking allocations, but noise mitigation requires Commission sign-off. Hearing is ${shortDate(nextThursday)} at 6:30 PM in Community Hall.`,
      sourceName: "Cupertino Planning Commission",
      sourceUrl: "https://www.cupertino.gov/agenda",
      actionType: "VERDICT_TRACK",
      actionMeta: {
        meetingDateDisplay: `${shortDate(nextThursday)} · 6:30 PM`,
        meetingDateIso: toPacificIso(nextThursday),
        durationMinutes: 120,
        calendarTitle: "Cupertino Planning Commission: Vallco Pkwy Hearing",
        calendarLocation: "Community Hall, 10350 Torre Ave, Cupertino, CA",
        calendarDetails: "Public testimony and vote on outdoor dining variance."
      }
    },
    {
      id: "crd_02",
      slug: "apple-park-horse-commute-ordinance",
      zipCode: "95014",
      category: "ABSURDITY",
      editorialStatus: "PUBLISHED",
      // TODO(verify before any demo; see Section 10.6): CVC § 21759 "honking is a misdemeanor" claim,
      // Cupertino Code § 11.24 vs § 11.20 (detailContext and codeSection disagree), "full lane" wording,
      // and the "no hitching corrals" zoning claim.
      headline: "Can You Legally Commute to Apple Park on a Horse? CVC § 21050 & Cupertino Code",
      summary: "Under California Vehicle Code § 21050 and Cupertino traffic ordinances, horses are 100% street-legal vehicles on thoroughfares like Stevens Creek Blvd, legally entitled to the full lane alongside Tesla traffic.",
      detailContext: "The Silicon Valley Reality Check: While CVC § 21759 makes honking at a startled mare a misdemeanor, Cupertino Code § 11.24 prohibits sidewalk riding, and commercial zoning does not mandate hitching corrals. Commuting by equestrian power is street-legal right up until you reach the badge-access gates at Tantau Ave.",
      sourceName: "California Vehicle Code & Cupertino Municipal Code",
      sourceUrl: "https://library.municode.com/ca/cupertino",
      actionType: "EXTERNAL_LINK",
      actionMeta: {
        codeSection: "CVC § 21050 / CMC § 11.20",
        statuteOriginYear: "Active"
      }
    },
    {
      id: "crd_03",
      slug: "cupertino-library-courtyard-civic-workshop",
      zipCode: "95014",
      category: "EVENT",
      editorialStatus: "PUBLISHED",
      headline: "Cupertino Community Hall: Public Budget Prioritization Session",
      summary: "The City hosts an open workshop for residents to evaluate infrastructure allocations, park improvements, and street repaving priority schedules.",
      detailContext: `Open to the public. Session starts ${shortDate(nextSaturday)} at 10:00 AM at Community Hall.`,
      sourceName: "City of Cupertino Administration",
      sourceUrl: "https://www.cupertino.gov/events",
      actionType: "CALENDAR",
      actionMeta: {
        meetingDateDisplay: `${shortDate(nextSaturday)} · 10:00 AM`,
        meetingDateIso: toPacificIso(nextSaturday),
        durationMinutes: 120,
        calendarTitle: "Cupertino Budget Prioritization Workshop",
        calendarLocation: "Community Hall, 10350 Torre Ave, Cupertino, CA",
        calendarDetails: "City of Cupertino public budget prioritization session."
      }
    }
  ];
}

/** Searches PUBLISHED cards only, so flagged or pending slugs resolve to null (404 on public routes). */
export function getCardBySlug(slug: string, now: Date = new Date()): Card | null {
  return getMockCards(now).find((c) => c.slug === slug) ?? null;
}

/**
 * Drafts that did NOT pass the editorial gate. Never rendered on public routes
 * (/[zip], /c/[slug], /unlock, /api/og). Read only by the Editorial Staging modal in the Founder Dock.
 * Date-free, so a module-level constant is safe here.
 */
export const MOCK_STAGED_CARDS: Card[] = [
  {
    id: "crd_qa_01",
    slug: "cupertino-code-poultry-peace-ordinance-unverified",
    zipCode: "95014",
    category: "ABSURDITY",
    editorialStatus: "FLAGGED_HALLUCINATION",
    flagReason: "Embellishment Detected: § 10.48.061 is a general noise statute. Historical backstory regarding 1965 orchard workers could not be verified in Municode records. Staged for review — Blocked from publication.",
    headline: "Cupertino Code § 10.48.061: Domestic Fowl Prohibited from Habitually Disturbing the Peace",
    summary: "Under Cupertino's animal nuisance statute, it is unlawful to maintain any poultry or fowl that habitually makes sounds disturbing the neighborhood quiet, enforceable by administrative citation.",
    detailContext: "Verified Municipal Code: Enacted during Cupertino's agricultural era when orchard workers maintained coops. While roosters are regulated under zoning Chapter 19.20, § 10.48.061 extends nuisance citations to noisy hens.",
    sourceName: "Cupertino Municipal Code (Municode Audit)",
    sourceUrl: "https://library.municode.com/ca/cupertino",
    actionType: "EXTERNAL_LINK",
    actionMeta: {
      codeSection: "§ 10.48.061",
      statuteOriginYear: "1965 (Unverified)"
    },
    verificationNotes: [
      {
        check: "Section exists",
        result: "PASS",
        detail: "§ 10.48.061 is a real provision. It covers animals, fowl included, whose sound habitually disturbs the peace."
      },
      {
        check: "Framing: poultry-specific",
        result: "FAIL",
        detail: "The provision applies to any animal. The City's own FAQ says rooster noise falls under the same rule as barking dogs, so the headline overstates it.",
        excerpt: "Domestic Fowl Prohibited"
      },
      {
        check: "Enactment history",
        result: "UNVERIFIED",
        detail: "No source found for the 1965 origin year or the agricultural-era orchard-coop story.",
        excerpt: "Enacted during Cupertino's agricultural era when orchard workers maintained coops."
      },
      {
        check: "Zoning cross-reference",
        result: "UNVERIFIED",
        detail: "Could not confirm that Chapter 19.20 regulates roosters. The City's FAQ says keeping a rooster is not itself a code violation.",
        excerpt: "While roosters are regulated under zoning Chapter 19.20"
      },
      {
        check: "Enforcement mechanism",
        result: "UNVERIFIED",
        detail: "Administrative citation not confirmed as the enforcement route.",
        excerpt: "enforceable by administrative citation"
      },
      {
        check: "Source link",
        result: "UNVERIFIED",
        detail: "Link points to Municode. Cupertino's own pages reference its Gridics code hub; confirm the URL resolves to the section."
      }
    ],
  {
    id: "crd_qa_02",
    slug: "cupertino-code-rooster-noise-rule",
    zipCode: "95014",
    category: "ABSURDITY",
    editorialStatus: "FLAGGED_HALLUCINATION",
    flagReason: "Withheld pending primary-source check: the text of § 10.48.061 has not been confirmed against the municipal code. The rooster claim rests on the City's Code Enforcement FAQ and a secondary code summary.",
    headline: "Cupertino Code § 10.48.061: A Rooster Is Legal. A Noisy One Is Not.",
    summary: "Keeping a rooster in Cupertino isn't a code violation by itself, the City says, but one that habitually disturbs the neighbors is treated like a barking dog.",
    detailContext: "Municipal Code Fact-Check: § 10.48.061 applies to any animal, fowl included, whose sound habitually disturbs the peace. The City's Code Enforcement FAQ confirms rooster noise falls under the same rule as barking dogs.",
    sourceName: "City of Cupertino Code Enforcement FAQ",
    sourceUrl: "https://www.cupertino.gov/Your-City/Departments/Community-Development/Code-Enforcement/Resources/FAQs",
    actionType: "EXTERNAL_LINK",
    actionMeta: {
      codeSection: "§ 10.48.061"
    },
    verificationNotes: [
      {
        check: "Rooster claim",
        result: "PASS",
        detail: "City Code Enforcement FAQ: keeping a rooster is not itself a code violation; its noise is handled under the same rule as barking dogs."
      },
      {
        check: "Primary statute text",
        result: "UNVERIFIED",
        detail: "§ 10.48.061 was confirmed only through a secondary summary. Read the section on Cupertino's code hub before publishing."
      }
    ]
  }
];

export const MOCK_ZIP_DIRECTORY: Record<string, string> = {
  "95014": "Cupertino, CA",
  "95015": "Cupertino, CA",
  "80202": "Denver, CO",
  "78701": "Austin, TX",
  "94087": "Sunnyvale, CA"
};

/** Zips treated as "local" for a card's city (IP-derived zips are approximate). */
export const CITY_LOCAL_ZIPS: Record<string, string[]> = {
  "Cupertino, CA": ["95014", "95015"]
};
```

### 5.4 Shared Config (`lib/config.ts`)
```typescript
export const WAITLIST_SEED_COUNT = 13;   // pre-existing pledges per zip, so the first real signup is #14
export const WAITLIST_TARGET = 50;
export const REFERRALS_PER_BUMP = 2;     // every 2 referred signups...
export const SPOTS_PER_BUMP = 5;         // ...moves the referrer up 5 spots
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
```

---

## 6. Page Specifications

All three pages export `dynamic = 'force-dynamic'`, resolve the visitor location server-side (Section 7.1), and pass it to client components as props.

### 6.1 Route 1: Newsletter Issue View (`app/[zip]/page.tsx`)
* **Endpoint:** `/[zip]` (default demo URL: `/95014`). Validate `^\d{5}$` else `notFound()`. If the zip has no seeded issue (anything other than `95014`/`95015`), `redirect('/unlock/[zip]')`.
* **Masthead:** `Hi, 95014.` in `cw-font-serif` (Playfair), with the final period rendered in `cw-rust`.
* **Sub-bar:** Mono, muted (`cw-bronze`): `Curbwire Nº{issueNumber} · {formattedDate}` left-aligned; right-aligned `Read Online` link (links to the canonical `/{zip}` URL). Thin `cw-sand` rule beneath.
* **Weather Bar (`components/WeatherBar.tsx`):** Mono, ASCII-style row per day from `issue.weather.days`: `TODAY ☀️ 53° ▕█████████████░░░░░░░▏ 76°`. Bar is 20 characters wide; filled blocks = `round(barPct / 5)`. `blurb` shown above the rows. Tick/empty characters in `cw-sand`, filled in `cw-bronze`.
* **Top Share Banner:** `cw-tint-rust` background strip: *"Like Curbwire? Send To A Friend →"*. Click uses `navigator.share()` or copies `{SITE_URL}/{zip}?src=copy&ref={cw_uid}`, and logs `POST /api/share` with `cardSlug: null`.
* **Card List:** `PUBLISHED` cards rendered sequentially from `getMockCards()` (flagged and pending drafts never appear; Section 10.3):
  * **Category badge:** Mono, uppercase, small, parchment text on the category token (`cw-badge-coordination`, `cw-badge-whimsy`, `cw-badge-event`, `cw-badge-news`). Labels: `CIVIC COORDINATION`, `BUREAUCRATIC WHIMSY`, `COMMUNITY EVENT`, `LOCAL NEWS`.
  * **Title:** `<Link href="/c/{slug}">` in `cw-font-serif text-2xl font-bold hover:underline`.
  * **Source line:** Mono, `cw-bronze`: `{sourceName}`.
  * **Summary:** `cw-font-body`.
  * **Detail context:** `cw-font-body`; the text before the first colon is bolded as a lead-in (`What changed:`, `Verified Municipal Code:`, etc.).
  * **Meeting line:** For cards with `meetingDateDisplay`, show it in mono.
  * **Share Action Strip (`components/ShareStrip.tsx`):** `cw-tint-rust` container with `[Text to Neighbor]`, `[WhatsApp]`, `[Copy Link]`, plus `[Add to Calendar]` (`AddToCalendar.tsx`) on cards where `actionMeta.meetingDateIso` exists. Behavior in Section 8.1 and 8.2.
* **Footer:** Mono, `cw-stone` copyright line.

### 6.2 Route 2: Standalone Card Landing Page (`app/c/[slug]/page.tsx`)
* **Endpoint:** `/c/[slug]`. Unknown slug, or a slug whose card is not `PUBLISHED`, → `notFound()` (`getCardBySlug()` only searches published cards).
* **Metadata (`generateMetadata`):** `metadataBase: new URL(SITE_URL)`; `title` and `openGraph.title` = card headline; `openGraph.description` = card summary; `openGraph.images` = `[{ url: '/api/og?slug={slug}', width: 1200, height: 630 }]`; `twitter.card = 'summary_large_image'`.
* **Card Display:** The isolated card in full focus: badge, serif headline, summary, detail context, source attribution (`sourceName` linking to `sourceUrl`), `AddToCalendar` where applicable, and the `ShareStrip`.
* **View Tracking (`components/ViewTracker.tsx`):** Client component; on mount, once per page load, calls `POST /api/view` with `cardSlug`, inbound `ref` and `src` query params, and the resolved `userZip`. Also stores the inbound `ref` in cookie `cw_ref` (30 days) so a later subscribe call can attach it.
* **Geo-Adaptive Conversion Banner (`components/GeoConversionBanner.tsx`):** Receives `location` (ResolvedLocation) and `card` as props. `isLocal = isLocalToCard(location, card)` (Section 7.1).
  * **Case A: Local (`isLocal === true`):**
    * Header: *"Live in Cupertino? Get the 2-minute calm civic briefing."*
    * If `actionType === 'VERDICT_TRACK'`: checkbox, **checked by default**: *"Notify me when the Planning Commission issues a decision on this parcel."*
    * Email field + rust submit button `[Get Cupertino Brief]`.
    * Submit → `POST /api/subscribe` with `intentType: 'VERDICT_ALERT'` if the box is checked, otherwise `'GENERAL_BRIEF'`, and `zipCode: '95014'`.
    * Success state replaces the form: confirmation line, then a re-share prompt ("Know a neighbor who should see this?") with the `ShareStrip`.
  * **Case B: Remote (`isLocal === false`):**
    * Header: *"This is from Cupertino, CA. Want calm civic briefs and weird local statutes in {cityName}?"* (falls back to *"in your neighborhood"* when the city is unknown).
    * Dual fields `[Your Zip Code]` (prefilled from `location.zip` when present) and `[Your Email]`, plus rust button `[Check My Neighborhood]`.
    * Submit → `POST /api/subscribe` with `intentType: 'MARKET_UNLOCK'`. Success renders the waitlist payoff screen (Section 8.4).

### 6.3 Route 3: Remote Unlock Page (`app/unlock/[zip]/page.tsx`)
* **Endpoint:** `/unlock/[zip]` (the re-share link target). Validate `^\d{5}$` else `notFound()`.
* **Content:** Masthead-style header *"Curbwire isn't in {cityName} yet."*, a one-line pitch, the current pledge progress (`WAITLIST_SEED_COUNT + count of MARKET_UNLOCK subscribers for the zip`, out of `WAITLIST_TARGET`), the email form (zip prefilled and locked to the URL zip), and `ViewTracker` (with `cardSlug: null`) to capture inbound `ref`/`src`.
* **Submit:** Same `MARKET_UNLOCK` flow and payoff screen as 8.4.

---

## 7. Functional Architecture

### 7.1 Geo-Detection Precedence Engine (`lib/location.ts`, server-only)
`resolveLocation(): ResolvedLocation` resolves in this order:
1. **Cookie Override (`cw_demo_zip`):** Set by the Founder Demo Dock. `cityName` = `MOCK_ZIP_DIRECTORY[zip]`, or the fallback label `your area ({zip})` for zips not in the directory.
2. **Netlify Geolocation Header (`x-nf-geo`):** Read with `headers().get('x-nf-geo')`. The value is **base64-encoded JSON** and must be decoded before use:
   ```typescript
   function parseNetlifyGeo(h: string | null) {
     if (!h) return null;
     try { return JSON.parse(Buffer.from(h, 'base64').toString('utf-8')); } catch { return null; }
   }
   // geo: { city?, country?: { code }, subdivision?: { code }, postalCode?, ... }
   ```
   Use `geo.postalCode` when present and `geo.city` + `geo.subdivision.code` for `cityName`. **`postalCode` is frequently absent under `netlify dev`**, so never require it: a city alone is enough to resolve a location, and the cookie override is the dependable local-testing path. After the first deploy, verify the header actually reaches server code (see Acceptance Criteria).
3. **Default Fallback:** `80202` / `Denver, CO` (simulates remote, out-of-town traffic), `source: 'default'`.

**Local vs. remote matching** (IP-derived zips are approximate, so exact zip equality is too strict):
```typescript
export function isLocalToCard(loc: ResolvedLocation, card: Card): boolean {
  const cardCity = MOCK_ZIP_DIRECTORY[card.zipCode];                    // "Cupertino, CA"
  if (loc.cityName.toLowerCase() === cardCity.toLowerCase()) return true;
  return (CITY_LOCAL_ZIPS[cardCity] ?? [card.zipCode]).includes(loc.zip);
}
```

**Switching location from the dock:** the dock writes `cw_demo_zip` (via `document.cookie`, `path=/`) and calls `router.refresh()`. Because pages are `force-dynamic` and read the cookie on the server, the banner re-renders without a full page reload.

### 7.2 Store Layer (`lib/store/`)
All persistence goes through one interface so API routes never branch on the backend:
```typescript
export interface EventStore {
  recordShare(e: { cardSlug: string | null; channel: ShareChannel; referrerId?: string }): Promise<void>;
  recordView(e: { cardSlug: string | null; referrerId?: string; sourceChannel?: string; userZip?: string }): Promise<void>;
  addSubscriber(s: {
    email: string; zipCode: string; sourceCardSlug?: string | null; intentType: IntentType;
    referrerId?: string; userRefId?: string;
  }): Promise<{ created: boolean; createdAt: string }>;               // idempotent on (lower(email), zip, intent)
  countMarketUnlock(zip: string): Promise<number>;                     // total MARKET_UNLOCK rows for zip
  marketUnlockRank(zip: string, email: string): Promise<number>;       // 1-based by created_at
  countReferredSignups(zip: string, referrerId: string): Promise<number>;
  getTelemetry(): Promise<Telemetry>;
  reset(): Promise<void>;
}
```
`lib/store/index.ts` exports `getStore()`: Supabase implementation when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise the in-memory implementation (Section 2.3). The Supabase client is created server-side only.

### 7.3 API Specification
All routes are `POST` JSON unless noted, return `400 Bad Request` with `{ "success": false, "error": "..." }` on malformed bodies, and run on the Node runtime.

#### 1. POST `/api/subscribe`
Handles subscriptions from both local and remote funnels.
* **Payload:**
  ```json
  {
    "email": "user@example.com",
    "zipCode": "95014",
    "cardSlug": "vallco-pkwy-outdoor-dining-variance",
    "intentType": "VERDICT_ALERT", // "VERDICT_ALERT" | "GENERAL_BRIEF" | "MARKET_UNLOCK"
    "referrerId": "usr_demo"       // inbound referrer (from ?ref= or the cw_ref cookie); optional
  }
  ```
  `cardSlug` may be `null` (e.g., from `/unlock/[zip]`). The subscriber's own id is read from the `cw_uid` cookie on the server and stored as `user_ref_id`.
* **Validation:** Valid email format, 5-digit zip, known `intentType`. Duplicate (same lower-cased email + zip + intent) is **idempotent**: returns `200` with `alreadySubscribed: true` and the same payload as the original signup.
* **Response (`200 OK`), `intentType` = `MARKET_UNLOCK`:**
  ```json
  {
    "success": true,
    "waitlistPosition": 14,
    "pledgeCount": 14,
    "targetPledges": 50,
    "progressPct": 28,
    "cityName": "Denver, CO",
    "shareUrl": "https://curbwire-poc.netlify.app/unlock/80202?src=copy&ref=usr_a1b2c3d4"
  }
  ```
* **Waitlist math** (constants in `lib/config.ts`):
  * `rank = marketUnlockRank(zip, email)` (1-based, by `created_at`).
  * `pledgeCount = WAITLIST_SEED_COUNT + countMarketUnlock(zip)`.
  * `basePosition = WAITLIST_SEED_COUNT + rank` (first real signup in a zip is **#14**).
  * `bump = floor(countReferredSignups(zip, ownUid) / REFERRALS_PER_BUMP) * SPOTS_PER_BUMP`.
  * `waitlistPosition = max(1, basePosition - bump)`.
  * `progressPct = round(pledgeCount / WAITLIST_TARGET * 100)` (14 / 50 = **28%**).
  * `cityName` = `MOCK_ZIP_DIRECTORY[zip]` or `your area ({zip})`.
* **Response for `VERDICT_ALERT` / `GENERAL_BRIEF`:** `{ "success": true, "intentType": "...", "alreadySubscribed": false }`.

#### 2. POST `/api/share`
Logs sharing telemetry across channels.
* **Payload:**
  ```json
  {
    "cardSlug": "vallco-pkwy-outdoor-dining-variance", // null for issue-level shares
    "channel": "sms",                                   // "sms" | "whatsapp" | "copy" | "email"
    "referrerId": "usr_demo"
  }
  ```
* **Response:** `{ "success": true }`.

#### 3. POST `/api/view`
Logs view events and captures inbound referral chains.
* **Payload:**
  ```json
  {
    "cardSlug": "vallco-pkwy-outdoor-dining-variance", // null for /unlock views
    "referrerId": "usr_demo",
    "sourceChannel": "sms",
    "userZip": "80202"
  }
  ```
* **Response:** `{ "success": true }`.

#### 4. GET `/api/telemetry`
Powers the dock's live counters. Returns `Telemetry` (Section 4):
```json
{
  "sharesSent": 3, "linkViews": 7, "leadsCaptured": 2,
  "verdictAlertLeads": 1, "marketUnlockLeads": 1,
  "persistence": "supabase"
}
```
Definitions: `sharesSent` = rows in `share_events`; `linkViews` = rows in `view_events`; `leadsCaptured` = rows in `subscribers`. Responds with `Cache-Control: no-store`.

#### 5. POST `/api/reset`
Deletes all rows from `share_events`, `view_events`, and `subscribers` (or clears the memory store). Returns `403` unless `ALLOW_DEMO_RESET === 'true'`. Response: `{ "success": true }`.

---

## 8. Component & Payoff Mechanics

### 8.1 Share Strip & Native Share Fallback (`components/ShareStrip.tsx`)
**Identity (`lib/identity.ts`):** On first mount, if the `cw_uid` cookie is absent, create `usr_` + 8 random alphanumerics and persist it (cookie, 1 year). Every share link uses it as `ref`. (`usr_demo` in examples is just an example value.)

**Link builder:** `{SITE_URL}/c/{slug}?src={channel}&ref={cw_uid}` (issue-level shares use `{SITE_URL}/{zip}`; unlock shares use `{SITE_URL}/unlock/{zip}`). Always built from `NEXT_PUBLIC_SITE_URL`, never a hardcoded domain.

On mobile devices, clicking "Text to Neighbor" triggers `navigator.share()` if supported, falling back to:
* **SMS URI Scheme:** `sms:?&body=` with fully URL-encoded copy and absolute URL:
  `Check out this Cupertino Planning Commission update: {SITE_URL}/c/vallco-pkwy-outdoor-dining-variance?src=sms&ref=usr_a1b2c3d4`
* **WhatsApp Link:** `https://api.whatsapp.com/send?text=...` (URL-encoded, `src=whatsapp`).
* **Desktop Fallback:** "Copy Link" copies the clean absolute URL (`src=copy`) and fires toast feedback.

Every successful share action calls `POST /api/share`.

### 8.2 Calendar Utility (`lib/calendar.ts`, `components/AddToCalendar.tsx`)
Applies to any card with `actionMeta.meetingDateIso` (both `CALENDAR` and `VERDICT_TRACK`). End time = start + `durationMinutes` (default `120`).

```typescript
// lib/calendar.ts
import { Card } from '@/types';

/** 20261120T023000Z (compact UTC), required by Google Calendar's `dates` param and by iCalendar. */
const toCompactUtc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function range(card: Card) {
  const start = new Date(card.actionMeta!.meetingDateIso!);          // parses the Pacific-offset ISO string
  const end = new Date(start.getTime() + (card.actionMeta!.durationMinutes ?? 120) * 60_000);
  return { start, end };
}

export function googleCalendarUrl(card: Card): string {
  const { start, end } = range(card);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: card.actionMeta?.calendarTitle ?? card.headline,
    dates: `${toCompactUtc(start)}/${toCompactUtc(end)}`,
    details: card.actionMeta?.calendarDetails ?? card.summary,
    location: card.actionMeta?.calendarLocation ?? '',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildIcs(card: Card): string {
  const { start, end } = range(card);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Curbwire//PLG POC//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${card.slug}@curbwire-poc`,
    `DTSTAMP:${toCompactUtc(new Date())}`,
    `DTSTART:${toCompactUtc(start)}`,
    `DTEND:${toCompactUtc(end)}`,
    `SUMMARY:${esc(card.actionMeta?.calendarTitle ?? card.headline)}`,
    `LOCATION:${esc(card.actionMeta?.calendarLocation ?? '')}`,
    `DESCRIPTION:${esc(card.actionMeta?.calendarDetails ?? card.summary)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';          // CRLF line endings are required by RFC 5545
}
```
* **`AddToCalendar` (client):** Two actions: `[Google Calendar]` (opens `googleCalendarUrl` in a new tab) and `[Download .ics]` (builds a `Blob` of type `text/calendar`, triggers a download named `curbwire-{slug}.ics`).
* **Verification:** A Vallco card created on a Netlify deploy must show **6:30 PM Pacific** in the resulting Google Calendar event, not 10:30 AM.

### 8.3 The Loop 1 Payoff: Simulated Planning Commission Verdict
1. User enters their email on `/c/vallco-pkwy-outdoor-dining-variance` with checkbox checked: *"Notify me when the Planning Commission issues a decision on this parcel."*
2. Lead is logged (`VERDICT_ALERT`).
3. In the **Founder Demo Dock**, the **[⚡ Simulate Verdict]** button lights up (the dock polls `GET /api/telemetry`; enabled when `verdictAlertLeads > 0`).
4. Clicking this opens a modal (`VerdictModal.tsx`) displaying the instant notification email/SMS that Curbwire would dispatch 48 hours later, with a visible **"Simulated"** label:
   > *"Planning Commission Decision: 19900 Vallco Pkwy was APPROVED with 4 noise mitigations. Tap here for the 60-second recap."*
   > *This proves the retention loop to the founders.*

### 8.4 The Loop 2 Payoff: Remote Waitlist Unlock & Re-Share
1. Remote user (Denver `80202`) views `/c/apple-park-horse-commute-ordinance` (or lands on `/unlock/80202`).
2. Geo-Adaptive Banner displays: *"This is from Cupertino, CA. Want calm civic briefs and weird local statutes in Denver?"*
3. Remote user enters email and zip (`80202`).
4. **Immediate Payoff Screen Replaces Form** (values from the `/api/subscribe` response):
   * *"You are #{waitlistPosition} of {targetPledges} pledges in {cityName} ({zip}) to unlock Curbwire."*
   * Dynamic progress bar: `{progressPct}% to node launch` (first signup: `#14 of 50`, `28%`).
   * **The Re-Share Nudge:** *"Share your unique link with 2 {city} neighbors to move up 5 spots:"* followed by `shareUrl` (`{SITE_URL}/unlock/{zip}?src=copy&ref={cw_uid}`) with a Copy button and the share strip. Every 2 referred signups move the referrer up 5 spots (Section 7.3 waitlist math).
5. For zips outside `MOCK_ZIP_DIRECTORY`, `{cityName}` renders as *"your area ({zip})"* and the copy reads *"...with 2 neighbors..."*.

### 8.5 The Editorial Staging Payoff: Fact-Check Gate (`components/EditorialStagingModal.tsx`)
To demonstrate Curbwire's calm credibility to founders Doug Hirsch and Trevor Budzek:
1. The dock features an `[🛡️ Editorial Staging]` button.
2. Clicking it opens a split comparison drawer:
   * **Left Panel (Blocked LLM Draft):** Displays the unverified poultry card (`crd_qa_01`) with a red `FLAGGED_HALLUCINATION` badge and the explicit failure explanation:
     > *"Embellishment Detected: § 10.48.061 is a general noise statute. Historical backstory regarding 1965 orchard workers could not be verified in Municode records. Staged for review — Blocked from publication."*
   * **Right Panel (Approved Public Card):** Displays the vetted, high-humor horse commute card (`crd_02`) cleared for distribution.
3. **Founder Pitch Value:** Proves to the founders that Curbwire is an ambient intelligence platform with verification guardrails, not a reckless AI wrapper.

---

## 9. Dynamic OpenGraph Preview Generator (`app/api/og/route.tsx`)

* **Engine:** `next/og` (`ImageResponse`).
* **Runtime:** `export const runtime = 'nodejs';` (explicit). Do not use the Edge runtime.
* **Fonts:** Bundled TTF files committed to `assets/fonts/` (`PlayfairDisplay-Bold.ttf`, `JetBrainsMono-Bold.ttf`; both SIL OFL from Google Fonts). **No woff2** (unsupported by `ImageResponse`). Load them with a bundler-traced URL, **not** `fs` + `process.cwd()` (those files are not included in the Netlify function bundle):
  ```typescript
  const playfair = await fetch(
    new URL('../../../assets/fonts/PlayfairDisplay-Bold.ttf', import.meta.url)
  ).then((r) => r.arrayBuffer());
  const mono = await fetch(
    new URL('../../../assets/fonts/JetBrainsMono-Bold.ttf', import.meta.url)
  ).then((r) => r.arrayBuffer());
  // new ImageResponse(<Layout />, { width: 1200, height: 630, fonts: [
  //   { name: 'Playfair Display', data: playfair, weight: 700, style: 'normal' },
  //   { name: 'JetBrains Mono',   data: mono,     weight: 700, style: 'normal' } ] })
  ```
  Safety net in `next.config.js`, in case the traced import misses the files on Netlify:
  ```javascript
  experimental: { outputFileTracingIncludes: { '/api/og': ['./assets/fonts/**/*'] } }
  ```
* **Data:** `GET /api/og?slug=...` → `getCardBySlug(slug)`. If the slug is unknown or the card is not `PUBLISHED` (flagged or pending drafts), return a generic branded image (never a 404/500, so link unfurls don't break).
* **Layout Constraints:**
  * Canvas: 1200 x 630 px. Background `#f7f1e1`, outer border 16px `#f7f1e1`, inner frame 2px `#a83a25`.
  * **Top bar:** Category badge in mono, e.g. `CIVIC COORDINATION · CUPERTINO 95014`. Category labels: `CIVIC COORDINATION`, `BUREAUCRATIC WHIMSY`, `COMMUNITY EVENT`, `LOCAL NEWS`; badge color from the category token.
  * **Center:** Headline in **Playfair Display Bold** (the brand headline face), about 56px, clamped to a maximum of 3 lines (max 110 characters) with auto-ellipsis.
  * **Bottom bar:** Mono: `CURBWIRE AMBIENT CIVIC INTELLIGENCE · curbwire.com`.

---

## 10. Editorial Workflow & Gate

### 10.1 Principle
Curbwire's promise is *verified* civic items. LLM-drafted civic content can hallucinate history, citations, and enforcement details, so every card passes a verification step before it can publish. The POC demonstrates that gate with seed data; it does not build a CMS. **Founder pitch value:** it shows Curbwire is an ambient-intelligence platform with verification guardrails, not an unchecked AI wrapper.

### 10.2 Status Model

| Status | Meaning | Visible on public routes? |
| :--- | :--- | :--- |
| `PENDING_REVIEW` | Drafted; verification not finished | No |
| `PUBLISHED` | Passed verification against the primary source | Yes |
| `FLAGGED_HALLUCINATION` | Verification found unsupported or incorrect claims (`flagReason` says which) | No. Shown only in the dock's Editorial Staging modal |

Lifecycle: `draft → PENDING_REVIEW → PUBLISHED | FLAGGED_HALLUCINATION`. A flagged draft is rewritten as a new draft and re-enters review. The POC has no UI for transitions; status is seed data.

### 10.3 Enforcement (No New Infrastructure)
* `getMockCards()` returns **only** `PUBLISHED` cards, and `getCardBySlug()` searches only that list. The newsletter (`/[zip]`), card pages (`/c/[slug]`), OG images (`/api/og`), share links, and the unlock flow therefore inherit the gate automatically.
* Staged drafts live in `MOCK_STAGED_CARDS`, which is imported **only** by `EditorialStagingModal`. No other component, route, or API reads it.
* A flagged slug on a public route returns `404` (OG route: the generic branded image).

### 10.4 Seed Assignments

| Card | ID / Slug | Category | Status |
| :--- | :--- | :--- | :--- |
| Vallco Pkwy variance hearing | `crd_01` / `vallco-pkwy-outdoor-dining-variance` | COORDINATION | `PUBLISHED` |
| Apple Park Horse Commute (CVC § 21050) | `crd_02` / `apple-park-horse-commute-ordinance` | ABSURDITY | `PUBLISHED` (active whimsy card; Loop 2 uses it) |
| Public Budget Prioritization Session | `crd_03` / `cupertino-library-courtyard-civic-workshop` | EVENT | `PUBLISHED` |
| Poultry Peace Ordinance (blocked draft) | `crd_qa_01` / `cupertino-code-poultry-peace-ordinance-unverified` | ABSURDITY | `FLAGGED_HALLUCINATION` (staged; never public) |
| Rooster Noise Rule (withheld draft) | `crd_qa_02` / `cupertino-code-rooster-noise-rule` | ABSURDITY | `FLAGGED_HALLUCINATION` (staged; never public) |

Both staged cards are withheld from every public route. `crd_qa_01` is the featured contrast in the Editorial Staging modal (Section 8.5).

### 10.5 Editorial Staging Modal (`components/EditorialStagingModal.tsx`)
Opened from the Founder Dock pill `[🛡️ Editorial Staging · 2 flagged]` (Section 11). A split comparison drawer (centered modal, or a wide right-side slide-out), parchment background, `cw-sand` borders, closes on `Esc` or backdrop click. Read-only: no approve, reject, or edit buttons. The step-by-step demo flow is in Section 8.5.
* **Header:** `🛡️ Editorial Staging`, subline: *"Every card is checked against its primary source before it can publish."*
* **Pipeline summary (mono):** `{published} published · {flagged} flagged · {pending} pending`, counted from `getMockCards()` and `MOCK_STAGED_CARDS`.
* **Left panel: Blocked LLM Draft.**
  * A chip row above the card switches between staged cards when more than one exists; the default is `crd_qa_01`.
  * The selected staged card in normal card styling (badge, serif headline, summary, detail context, source line), with a dashed `cw-sand` border and a `FLAGGED_HALLUCINATION` chip in `cw-badge-qa-flagged`.
  * Any `verificationNotes[].excerpt` found in the headline, summary, or detail context is highlighted with a `cw-tint-rust` background.
  * `flagReason` appears beneath the card in a callout.
  * Below that, **Verification Notes**: one row per note with the `check` name, a result chip (`PASS` in `cw-badge-coordination`, `FAIL` in `cw-badge-qa-flagged`, `UNVERIFIED` in `cw-bronze`), and the `detail` text.
* **Right panel: Approved Public Card.**
  * The published ABSURDITY card from `getMockCards()` (`crd_02`, the Apple Park horse commute) in normal card styling, with a `PUBLISHED` chip in `cw-badge-coordination` and a *"Cleared for distribution"* line.
  * A `View live page →` link to `/c/{slug}`.
* On mobile the panels stack, blocked draft first.

### 10.6 Pre-Demo Content Check (Human Step)
Before any demo, a person confirms every `PUBLISHED` card against primary sources. For `crd_02` (the horse card), check the following, fix or soften whatever fails, and then remove the `TODO(verify)` comment:
* The text of CVC § 21050 and CVC § 21759. In particular, confirm whether § 21759 actually makes honking a misdemeanor.
* The Cupertino Code chapter that prohibits sidewalk riding. The card's `detailContext` says § 11.24 while `codeSection` says § 11.20; reconcile them against the code hub.
* The "full lane" and "100% street-legal" wording, and the claim that commercial zoning doesn't require hitching corrals.

A card that fails the check moves to `MOCK_STAGED_CARDS` with the appropriate status, and the modal's right panel should then point at whichever ABSURDITY card remains published. For `crd_qa_02`, read the primary text of § 10.48.061 and re-check the City FAQ's rooster answer; if both hold, it can be promoted.

---

## 11. Founder Demo Dock (`components/DemoControlDock.tsx`)

A floating control center docked at the bottom-right, **hidden unless `?demo=1` is present in the URL** (or toggled via pressing `Ctrl + Shift + D`):
* **Location Switcher:**
  * Button `[📍 Local: Cupertino (95014)]` vs `[📍 Remote: Denver (80202)]`.
  * Writes the `cw_demo_zip` cookie and calls `router.refresh()` so the server re-resolves the location and the banner updates without a full page reload (Section 7.1).
* **Live Telemetry Ticker:** Polls `GET /api/telemetry` every 3 seconds (and immediately after any action in the same browser):
  * `Shares Sent: X`
  * `Link Views: Y`
  * `Leads Captured: Z`
  * A warning chip when `persistence === 'memory'` on a deployed site (Section 2.3).
* **Trigger Simulation:** Button `[⚡ Simulate Verdict]`, disabled until `verdictAlertLeads > 0`; opens the `VerdictModal`.
* **Editorial Staging:** Pill `[🛡️ Editorial Staging · {flaggedCount} flagged]`. The count is computed from `MOCK_STAGED_CARDS` (status `FLAGGED_HALLUCINATION`), imported directly by the dock, so there is no API call. Clicking opens the `EditorialStagingModal` (Section 10.5).
* **Reset Button:** Calls `POST /api/reset`, then refreshes telemetry back to zero.
* Because counters live in Supabase, shares, views, and leads made from the interviewer's phone also appear on the founder's laptop dock.

---

## 12. Phased Implementation Plan for Coding Agent

When instructing Cursor or Antigravity, execute in strict sequential phases:

```
+───────────────────────────────────────────────────────────────────────────────────────────+
|                                    PHASED BUILD ORDER                                     |
+───────────────────────────────────────────────────────────────────────────────────────────+
  Phase 1: Foundation ──▶ Tailwind config, Google Fonts layout, brand color tokens, env vars,
                          lib/config.ts, assets/fonts/ TTFs
  Phase 2: Data Layer ──▶ types/index.ts (incl. EditorialStatus), lib/dates.ts, lib/mock-data.ts (published cards as
                          functions; MOCK_STAGED_CARDS as a date-free constant),
                          lib/location.ts, lib/identity.ts
  Phase 3: Store      ──▶ supabase/schema.sql, lib/store/ (interface, supabase, memory),
                          /api/subscribe, /api/share, /api/view, /api/telemetry, /api/reset
  Phase 4: Route 1    ──▶ app/[zip]/page.tsx (Header, WeatherBar, cards, ShareStrip),
                          lib/calendar.ts + components/AddToCalendar.tsx
  Phase 5: Route 2    ──▶ app/c/[slug]/page.tsx (metadata, ViewTracker) +
                          components/GeoConversionBanner.tsx + app/unlock/[zip]/page.tsx
  Phase 6: Payoffs    ──▶ Waitlist payoff screen + re-share nudge, VerdictModal
  Phase 7: Edge & Dock──▶ app/api/og/route.tsx (Node runtime, bundled fonts),
                          components/DemoControlDock.tsx (?demo=1),
                          components/EditorialStagingModal.tsx
```

### Acceptance Criteria for Verification
1. Running `npm run dev` boots cleanly with zero TypeScript errors and **no hydration warnings** (all dates are Pacific-formatted on both server and client).
2. Visiting `http://localhost:3000/95014?demo=1` renders the newsletter issue with dates matching the next upcoming Thursday and Saturday (Pacific), and the dock appears.
3. Clicking "Copy Link" on a card copies an absolute URL built from `NEXT_PUBLIC_SITE_URL` containing `ref=` and `src=copy` (e.g., `...?src=copy&ref=usr_a1b2c3d4`).
4. Visiting a card page with the dock set to "Remote (Denver 80202)" shows the remote banner; submitting an email renders the `#14 of 50` / `28%` waitlist state. A second signup in the same zip renders `#15`.
5. In the dock, after a local `VERDICT_ALERT` signup, **[⚡ Simulate Verdict]** becomes enabled and opens the mock SMS/email modal.
6. **Timezone:** On the deployed Netlify site, "Add to Calendar" for the Vallco card creates an event at **6:30 PM Pacific**, and the downloaded `.ics` imports at the same time.
7. **Calendar links:** The Google Calendar link's `dates` value is in compact form (`YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ`) with a 2-hour span.
8. **Persistence:** On the deployed site with Supabase configured, a share or lead made from a second device increments the counters in the dock on the first device within ~3 seconds. `POST /api/reset` returns all counters to 0.
9. **Geo:** On the deployed site with no cookie override, the dock/banner reflects the visitor's real location, or the Denver default if `x-nf-geo` doesn't reach server code (verify and note which).
10. **OG unfurl:** Pasting a deployed `/c/[slug]` URL into iMessage or WhatsApp shows the 1200x630 card with **Playfair Display** headline text (not a sans-serif fallback).
11. **API validation:** Malformed bodies to `/api/subscribe`, `/api/share`, and `/api/view` return `400`; a duplicate signup returns `200` with `alreadySubscribed: true`.
12. **Routes:** `/unlock/80202` renders; `/80202` (and any other zip that isn't `95014`/`95015`) redirects to `/unlock/80202`; an unknown `/c/[slug]` returns 404; `/api/og?slug=unknown` returns a generic image.
13. **Editorial gate (public routes):** `/95014` renders the Vallco, Apple Park Horse Commute (`crd_02`), and Budget Workshop cards and **not** either staged draft. `/c/cupertino-code-poultry-peace-ordinance-unverified` and `/c/cupertino-code-rooster-noise-rule` return 404, and `/api/og?slug=` for either returns the generic image.
14. **Editorial Staging (dock):** With `?demo=1`, the `[🛡️ Editorial Staging · 2 flagged]` pill opens a split drawer. The left panel defaults to the blocked poultry draft (`crd_qa_01`): unverified excerpts highlighted, crimson `FLAGGED_HALLUCINATION` chip, the "Embellishment Detected" explanation, and six verification notes with PASS / FAIL / UNVERIFIED chips. A chip switches to `crd_qa_02`. The right panel shows the published horse card (`crd_02`) with a `PUBLISHED` chip. `Esc` closes it.
15. **Loop 2 uses the published whimsy card:** A remote visitor landing on `/c/apple-park-horse-commute-ordinance` sees the geo-targeted waitlist banner and the `#14 of 50` payoff, and its OG image renders the horse card headline.
16. **Type safety:** No component other than `EditorialStagingModal` and `DemoControlDock` imports `MOCK_STAGED_CARDS`.
