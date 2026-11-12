# Technical Requirements Document (TRD): Curbwire PLG Engine Proof-of-Concept (v7)

**Version:** v7. Changes since v6:
* **Editorial gate is human-in-the-loop (Section 10):** agents draft, a human editor decides. Adds `draftedBy` and the `REJECTED_NOT_SHAREWORTHY` status; the Editorial Staging modal shows two withheld drafts beside the approved horse card.
* **Sharing is one `[Share]` button (Section 8.1):** the phone's share sheet on mobile, an email box on desktop.
* **App scaffolding is specified:** root layout, `next/font/google`, Tailwind token config, icon mapping, sonner toasts (Sections 2.5 and 3).
* **Fixes:** referral bump is visible on return visits, the dock stays on across pages, `cw_uid` always exists before a signup, issue-level share links are tracked, OG fonts load with `readFile`, the progress bar is clamped, and reset works without setting an env var.
* **Removed:** the weather module.

## 1. Project Overview & Non-Goals

### 1.1 Purpose & Scope
A standalone, hackathon-grade Proof-of-Concept (POC) designed to demonstrate Product-Led Growth (PLG) distribution mechanics and civic verification rigor to Curbwire founders Doug Hirsch and Trevor Budzek:
* **Loop 1 (Intra-Community Density):** Unbundling monolithic newsletters into atomic, shareable **"Decision Cards"** (Civic Coordination) with calendar hooks, one-tap sharing (the phone's share sheet, or an email box on desktop), and verdict tracking payoffs.
* **Loop 2 (Inter-Community Expansion):** Cross-boundary sharing via **"Bureaucratic Whimsy"** (verified quirky municipal statutes) coupled with dynamic OpenGraph previews, geo-adaptive conversion banners, and unlock waitlists.
* **Editorial Gate (Human in the Loop, Founder Confidence):** Cards are drafted by two agents: the **Civic Engagement Agent** (Decision Cards) and the **Absurdity Agent** (Bureaucratic Whimsy). No draft publishes on its own. A human editor reviews each one and sets its `editorialStatus`, and only `PUBLISHED` cards reach readers. The dock's Editorial Staging modal shows two Absurdity Agent drafts the editor withheld (one flagged as a hallucination, one accurate but not interesting enough to forward) beside the horse-commute card the editor approved, directly addressing platform-credibility risk.

```
+───────────────────────────────────────────────────────────────────────────────────────────+
|                                    POC USER JOURNEY                                       |
+───────────────────────────────────────────────────────────────────────────────────────────+
  1. Newsletter Reader View (Cupertino 95014)
     ├── Card A: Planning Commission Decision Card (Vallco Pkwy)
     └── Card B: Absurd Statute (Apple Park horse commute: CVC § 21050 + Cupertino Code)
            │
            ├── User taps [Share]: phone share sheet, or an email box on desktop
            │   (?src=native&ref=usr_xxxxxxxx)
            │
            ▼
  2. Standalone Card Landing Page (`/c/[slug]`)
     ├── Rich Link Preview (Dynamic OG with serif/mono layout)
     └── Geo-Adaptive Conversion Banner:
         ├── If Local (Cupertino): "Live in Cupertino? Get the 2-minute calm civic briefing."
         │                     + checkbox "Notify me when the Planning Commission issues a decision
         │                       on this parcel."
         │                     ──▶ [Simulate Verdict] Payoff in Dock
         └── If Remote (80202): "This is from Cupertino, CA. Want calm civic briefs and weird local
                               statutes in Denver?"
                               ──▶ "You are #14 of 50 pledges in Denver, CO (80202)" + Re-share
                                   Prompt (/unlock/80202)
            │
            ▼
  3. Interactive Demo Control Dock (Founder Sandbox - enabled via ?demo=1, stays on across pages)
     ├── Switch location (Local vs Remote), simulate verdicts, and view live telemetry
     └── [🛡️ Editorial Staging] Modal: Inspect the human-in-the-loop gate (one hallucination flagged,
         one draft rejected as not forward-worthy, one card approved)
```

### 1.2 Explicit Non-Goals for the POC
* **No Authentication / Passwords:** Session identity is simulated via a generated anonymous id cookie (`cw_uid`) and the `?ref=` query param.
* **No Live Municipal Scraping:** Agendas and codes are supplied via structured seed data.
* **No Third-Party Email/SMS Transport:** Subscriptions and alerts are logged to Supabase (or the dev-only in-memory store) and displayed on-screen via simulation modals. The desktop share box (Section 8.1) opens the visitor's own mail app through a `mailto:` link; Curbwire itself sends nothing.
* **No Cards Table in the Database:** Cards are served from `lib/mock-data.ts` (their dates are computed per request). The database stores events and leads only.
* **No Agent Runtime:** The Civic Engagement Agent and the Absurdity Agent are not built. Which agent drafted a card (`draftedBy`) is seed data.
* **No Editorial CMS:** `editorialStatus` and the editor's reasons are seed data that simulate the human review. The POC has no approve, reject, or edit actions, and no review queue UI beyond the read-only Editorial Staging modal.
* **No Primary-Source Verification of Seed Content:** Card copy is demo data, kept so both PLG loops have content to run on. Checking its legal citations is a production task (Section 10.6).

---

## 2. Technology Stack, Environment & Project Layout

### 2.1 Stack (Pinned)
* **Core Framework:** Next.js **14.2.15** (App Router, TypeScript). *Do NOT use Next 15 to avoid asynchronous dynamic route `params` breaking changes.*
* **Styling:** Tailwind CSS **v3.4** (configured with Curbwire design tokens in `tailwind.config.ts`; Section 3.1). *Do NOT use Tailwind v4, which drops `tailwind.config.ts` as the default configuration path.*
* **Web Fonts:** `next/font/google` (Playfair Display, Spectral, JetBrains Mono), loaded in `app/layout.tsx` (Section 2.5). No `<link>` tags to Google Fonts.
* **Icons:** `lucide-react` (clean, non-intrusive line icons). The icon for each control is fixed in Section 3.3.
* **Toasts:** `sonner`. One `<Toaster />` mounted in `app/layout.tsx`; components call `toast()`. Do not hand-roll a toast.
* **OpenGraph Image Generation:** `next/og` (`ImageResponse`, Node runtime, bundled TTF fonts).
* **Persistence:** Supabase (PostgreSQL) via `@supabase/supabase-js` v2, accessed **only from server code** (API routes and server components). The browser never talks to Supabase directly. The `server-only` package enforces this at build time (Section 7.2).
* **Hosting:** Netlify (using `@netlify/plugin-nextjs`).

### 2.2 Environment Variables
| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Public | Absolute site origin used for share links, `metadataBase`, OG URLs, and the unlock link (e.g., `https://curbwire-poc.netlify.app`). Never hardcode a domain. |
| `SUPABASE_URL` | Server only | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Used by API routes. **Never** prefix with `NEXT_PUBLIC_`. |
| `ALLOW_DEMO_RESET` | Server only | Optional. `POST /api/reset` is enabled unless this is set to `false`. Leave it unset for the POC. |

### 2.3 Persistence Policy
* **Deployed demo (Netlify):** Supabase is **required**. Serverless instances do not share memory, so an in-memory store cannot produce reliable counters or waitlist positions.
* **Local development only:** If `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing, fall back to the in-memory store (a `globalThis` singleton, which is stable under `next dev`) and log a console warning.
* **Misconfiguration guard:** Whenever the Supabase env vars are missing, `getStore()` uses the memory store and `GET /api/telemetry` returns `persistence: "memory"`. The dock shows a warning chip, *"Persistence not configured. Counts are unreliable."*, when it receives `persistence: "memory"` **and** the page is not served from `localhost` or `127.0.0.1`. The dock checks `window.location.hostname` inside its telemetry-polling effect (never during render). Local development therefore stays quiet, and a deploy without Supabase is flagged.
* LocalStorage is **not** used for telemetry. (It cannot be read by API routes.)

### 2.4 Project Layout
```
app/
  layout.tsx                     # Root layout: fonts, globals.css, Toaster, DemoControlDock (Section 2.5)
  globals.css                    # Tailwind directives + cw-font-* classes (Section 3.2)
  page.tsx                       # "/" redirects to /95014 (DEFAULT_ZIP)
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
assets/fonts/                    # PlayfairDisplay-Bold.ttf, JetBrainsMono-Bold.ttf (OG images only)
components/
  ShareButton.tsx  ShareEmailDialog.tsx  ShareStrip.tsx  AddToCalendar.tsx
  GeoConversionBanner.tsx  WaitlistPayoff.tsx
  ViewTracker.tsx  VerdictModal.tsx  DemoControlDock.tsx
  EditorialStagingModal.tsx
lib/
  dates.ts  mock-data.ts  location.ts  calendar.ts  identity.ts  config.ts  waitlist.ts
  store/ index.ts  supabase.ts  memory.ts
supabase/schema.sql
types/index.ts
tailwind.config.ts               # Curbwire color tokens (Section 3.1)
next.config.js                   # outputFileTracingIncludes for the OG fonts (Section 9)
```

### 2.5 Root Layout (`app/layout.tsx`)
A server component. It owns four things, and no other file may duplicate them:

1. **Fonts.** Loads Playfair Display, Spectral, and JetBrains Mono with `next/font/google`, each with a CSS variable (`--font-playfair`, `--font-spectral`, `--font-jetbrains`), and puts the three `.variable` class names on `<body>`. Spectral is not a variable font, so its `weight` list is required.
2. **Global CSS.** Imports `./globals.css`.
3. **Server-side cookie reads.** Calls `resolveLocation()` (Section 7.1, which reads `cw_demo_zip`) and `cookies().get('cw_demo')`, and passes the results to the dock as `initialLocation` and `initialDemo`. **No client component reads `document.cookie` while rendering**, because the server cannot see that value and the first client render would not match the server HTML (a hydration mismatch). Client code writes cookies only inside event handlers and effects.
4. **Global UI.** Mounts `<DemoControlDock />` (inside `<Suspense>`, because it calls `useSearchParams()`) and sonner's `<Toaster />`.

```tsx
// app/layout.tsx (server component)
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Playfair_Display, Spectral, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import DemoControlDock from '@/components/DemoControlDock';
import { resolveLocation } from '@/lib/location';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const spectral = Spectral({
  subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'],
  variable: '--font-spectral', display: 'swap',
});
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLocation = resolveLocation();                     // cookie override, then x-nf-geo, then default
  const initialDemo = cookies().get('cw_demo')?.value === '1';   // dock stays on across pages (Section 11)
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${spectral.variable} ${jetbrains.variable} bg-cw-parchment text-cw-charcoal cw-font-body`}>
        {children}
        <Suspense fallback={null}>
          <DemoControlDock initialLocation={initialLocation} initialDemo={initialDemo} />
        </Suspense>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
```

**A layout cannot pass props to the page it wraps.** The dock gets its location from the layout. The `GeoConversionBanner` lives inside pages, so each page calls `resolveLocation()` itself and passes the result down as a prop (Section 6). Both calls read the same request, so they agree. `router.refresh()` re-runs the layout and the page together.

---

## 3. Design System & Brand Tokens

The UI must faithfully replicate Curbwire's warm, publication-grade editorial identity.

### 3.1 Color Palette

| Token | Hex Value | Context / Application |
| :--- | :--- | :--- |
| `cw-parchment` | `#f7f1e1` | Primary page & container background |
| `cw-charcoal` | `#191713` | Headlines, primary text, dark borders |
| `cw-rust` | `#a83a25` | Primary actions, links, active badges, category highlights |
| `cw-bronze` | `#5a5347` | Subheaders, metadata, timestamps |
| `cw-stone` | `#6B6B66` | Secondary links, quotes, copyright notes |
| `cw-sand` | `#d8cfb8` | Dividers, card borders |
| `cw-tint-rust` | `#f3ddd4` | Share strip highlight background, quote callouts |
| `cw-badge-coordination`| `#3d6b4f` | Forest green badge for planning & school board items |
| `cw-badge-whimsy` | `#a83a25` | Terracotta rust badge for quirky municipal codes |
| `cw-badge-event` | `#2b4c6f` | Slate navy badge for public events & ceremonies |
| `cw-badge-news` | `#5a5347` | Bronze badge for general city updates |
| `cw-badge-qa-flagged` | `#b91c1c` | Deep crimson badge for hallucination rejections (`FLAGGED_HALLUCINATION` chip, FAIL result) |

**Implementation:** add every token to `tailwind.config.ts` under `theme.extend.colors`, using exactly the names above, so they work as normal Tailwind utilities (`bg-cw-parchment`, `text-cw-rust`, `border-cw-sand`). Do not invent other color names and do not use raw hex values in components.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cw-parchment': '#f7f1e1',
        'cw-charcoal': '#191713',
        'cw-rust': '#a83a25',
        'cw-bronze': '#5a5347',
        'cw-stone': '#6B6B66',
        'cw-sand': '#d8cfb8',
        'cw-tint-rust': '#f3ddd4',
        'cw-badge-coordination': '#3d6b4f',
        'cw-badge-whimsy': '#a83a25',
        'cw-badge-event': '#2b4c6f',
        'cw-badge-news': '#5a5347',
        'cw-badge-qa-flagged': '#b91c1c',
      },
    },
  },
  plugins: [],
};
export default config;
```

### 3.2 Typography Classes

* **Font Serif Display:** `'Playfair Display', Georgia, serif` (`cw-font-serif`)
* **Font Serif Body:** `'Spectral', Georgia, serif` (`cw-font-body`)
* **Font Monospace:** `'JetBrains Mono', Menlo, monospace` (`cw-font-mono`)

The three classes are defined once in `app/globals.css` and read the CSS variables that `app/layout.tsx` puts on `<body>` (Section 2.5):

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .cw-font-serif { font-family: var(--font-playfair), 'Playfair Display', Georgia, serif; }
  .cw-font-body  { font-family: var(--font-spectral), 'Spectral', Georgia, serif; }
  .cw-font-mono  { font-family: var(--font-jetbrains), 'JetBrains Mono', Menlo, monospace; }
}
```

### 3.3 Icons (`lucide-react`)
Use exactly these icons. Where a bracketed label elsewhere in this document shows an emoji (📍, ⚡, 🛡️), that is shorthand for the icon below; render the lucide icon, not the emoji character.

| Control | Icon |
| :--- | :--- |
| `[Share]` | `Share2` |
| Top share banner ("Send To A Friend") | `Forward` |
| `[Open Email]` (desktop share box) | `Mail` |
| `[Copy Link]` / `[Copy]` | `Copy` |
| `[Add to Calendar]` / `[Google Calendar]` | `Calendar` |
| `[Download .ics]` | `Download` |
| Source link, `View live page` | `ExternalLink` |
| Dock location switcher | `MapPin` |
| Dock `[Simulate Verdict]` | `Zap` |
| Dock `[Editorial Staging]` | `ShieldCheck` |
| Dock reset | `RotateCcw` |
| Form success confirmation | `Check` |
| Modal close | `X` |

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
    channel VARCHAR(20) NOT NULL, -- 'native', 'email', 'copy'
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
export type DraftingAgent = 'CIVIC_ENGAGEMENT_AGENT' | 'ABSURDITY_AGENT';
export type EditorialStatus =
  | 'PUBLISHED'                  // human editor approved it
  | 'FLAGGED_HALLUCINATION'      // editor found fabricated or unsupported claims
  | 'REJECTED_NOT_SHAREWORTHY'   // claims hold up, but it is not worth forwarding
  | 'PENDING_REVIEW';            // waiting for the editor
export type VerificationResult = 'PASS' | 'FAIL' | 'UNVERIFIED';
export type IntentType = 'VERDICT_ALERT' | 'GENERAL_BRIEF' | 'MARKET_UNLOCK';
export type ShareChannel = 'native' | 'email' | 'copy';   // device share sheet | desktop email box | copied link

export interface CardActionMeta {
  meetingDateDisplay?: string;
  meetingDateIso?: string;       // ISO 8601 WITH Pacific offset (e.g., '2026-11-19T18:30:00-08:00'). Use toPacificIso(); never toISOString().
  durationMinutes?: number;      // Event length for calendar end time. Default 120.
  calendarTitle?: string;
  calendarLocation?: string;
  calendarDetails?: string;
  codeSection?: string;          // Shown after the source name on the card's source line
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
  draftedBy: DraftingAgent;           // Which agent wrote the draft
  editorialStatus: EditorialStatus;   // Set by the human editor. Only 'PUBLISHED' cards may appear on public routes
  flagReason?: string;                // The editor's reason for withholding the draft (staged cards only)
  verificationNotes?: VerificationNote[]; // Shown in the Editorial Staging modal; optional on published cards
}

export interface VerificationNote {
  check: string;                      // e.g., "Enactment history"
  result: VerificationResult;
  detail: string;                     // What the check found
  excerpt?: string;                   // Exact substring of the draft to highlight in the modal
}

export interface NewsletterIssue {
  issueNumber: number;
  zipCode: string;
  cityName: string;
  formattedDate: string;
}

export interface ResolvedLocation {
  zip: string;                   // May be '' if geo returned a city but no postal code
  cityName: string | null;       // e.g., "Cupertino, CA". null when the zip is not in MOCK_ZIP_DIRECTORY
  source: 'cookie' | 'netlify' | 'default';
}

export interface WaitlistStatus {
  waitlistPosition: number;
  pledgeCount: number;
  targetPledges: number;
  progressPct: number;           // Clamped to 0..100
  zip: string;
  cityName: string | null;       // null when the zip is not in MOCK_ZIP_DIRECTORY
  shareUrl: string;
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

**Typing:** `getMockCards()` returns `Card[]` and `MOCK_STAGED_CARDS` is declared `Card[]`. Those annotations are what make string literals such as `"PUBLISHED"` type-check against `EditorialStatus`. Keep the annotations and do **not** add `as EditorialStatus` casts: a cast would let a misspelled status compile.

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
    formattedDate: shortDate(now)
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
      draftedBy: "CIVIC_ENGAGEMENT_AGENT",
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
      draftedBy: "ABSURDITY_AGENT",
      editorialStatus: "PUBLISHED",
      // Demo seed copy. Its citations have not been checked against primary sources;
      // that is a production follow-up (Section 10.6).
      headline: "Can You Legally Commute to Apple Park on a Horse? CVC § 21050 & Cupertino Code",
      summary: "Under California Vehicle Code § 21050 and Cupertino traffic ordinances, horses are 100% street-legal vehicles on thoroughfares like Stevens Creek Blvd, legally entitled to the full lane alongside Tesla traffic.",
      detailContext: "The Silicon Valley Reality Check: While CVC § 21759 makes honking at a startled mare a misdemeanor, Cupertino Code § 11.24 prohibits sidewalk riding, and commercial zoning does not mandate hitching corrals. Commuting by equestrian power is street-legal right up until you reach the badge-access gates at Tantau Ave.",
      sourceName: "California Vehicle Code & Cupertino Municipal Code",
      sourceUrl: "https://library.municode.com/ca/cupertino",
      actionType: "EXTERNAL_LINK",
      actionMeta: {
        codeSection: "CVC § 21050 / CMC § 11.24"
      }
    },
    {
      id: "crd_03",
      slug: "community-hall-budget-prioritization-session",
      zipCode: "95014",
      category: "EVENT",
      draftedBy: "CIVIC_ENGAGEMENT_AGENT",
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

/** Searches PUBLISHED cards only, so withheld slugs resolve to null (404 on public routes). */
export function getCardBySlug(slug: string, now: Date = new Date()): Card | null {
  return getMockCards(now).find((c) => c.slug === slug) ?? null;
}

/**
 * Agent drafts the human editor did NOT publish. Never rendered on public routes
 * (/[zip], /c/[slug], /unlock, /api/og). Imported only by EditorialStagingModal and
 * DemoControlDock (Section 10.3). Date-free, so a module-level constant is safe here.
 */
export const MOCK_STAGED_CARDS: Card[] = [
  {
    id: "crd_qa_01",
    slug: "cupertino-code-poultry-peace-ordinance-unverified",
    zipCode: "95014",
    category: "ABSURDITY",
    draftedBy: "ABSURDITY_AGENT",
    editorialStatus: "FLAGGED_HALLUCINATION",
    flagReason: "Embellishment Detected: § 10.48.061 is a general animal-noise rule, not a poultry ordinance. The 1965 orchard-worker backstory could not be verified in the municipal code. Human editor decision: blocked from publication.",
    headline: "Cupertino Code § 10.48.061: Domestic Fowl Prohibited from Habitually Disturbing the Peace",
    summary: "Under Cupertino's animal nuisance statute, it is unlawful to maintain any poultry or fowl that habitually makes sounds disturbing the neighborhood quiet, enforceable by administrative citation.",
    detailContext: "Verified Municipal Code: Enacted in 1965 during Cupertino's agricultural era, when orchard workers maintained coops. While roosters are regulated under zoning Chapter 19.20, § 10.48.061 extends nuisance citations to noisy hens.",
    sourceName: "Cupertino Municipal Code (Municode Audit)",
    sourceUrl: "https://library.municode.com/ca/cupertino",
    actionType: "EXTERNAL_LINK",
    actionMeta: {
      codeSection: "§ 10.48.061"
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
        excerpt: "Enacted in 1965 during Cupertino's agricultural era, when orchard workers maintained coops."
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
      }
    ]
  },
  {
    id: "crd_qa_02",
    slug: "cupertino-code-rooster-noise-rule",
    zipCode: "95014",
    category: "ABSURDITY",
    draftedBy: "ABSURDITY_AGENT",
    editorialStatus: "REJECTED_NOT_SHAREWORTHY",
    flagReason: "Accurate, but not forward-worthy: the rooster claim checks out against the City's Code Enforcement FAQ, but a noise rule that treats roosters like barking dogs has no surprise and no punchline. Human editor decision: held back from the newsletter.",
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
        check: "Statute scope",
        result: "PASS",
        detail: "§ 10.48.061 covers any animal, fowl included, whose sound habitually disturbs the peace. The draft states this correctly."
      },
      {
        check: "Forward-worthiness (editor)",
        result: "FAIL",
        detail: "Reads as a routine noise rule. Nothing here a reader would text to a neighbor."
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
export const DEFAULT_ZIP = '95014';      // "/" redirects to this issue
export const LIVE_ZIPS = ['95014', '95015'];   // zips with a seeded issue; every other zip belongs to /unlock

/** "Denver, CO" -> "Denver". Use wherever copy needs the bare city name (Section 8.4 copy table). */
export const shortCity = (cityName: string) => cityName.split(',')[0].trim();
```

---

## 6. Page Specifications

All three pages export `dynamic = 'force-dynamic'`, call `resolveLocation()` server-side (Section 7.1), and pass the result to client components as props. All three render `ViewTracker`. The root page `app/page.tsx` only calls `redirect('/' + DEFAULT_ZIP)`.

### 6.1 Route 1: Newsletter Issue View (`app/[zip]/page.tsx`)
* **Endpoint:** `/[zip]` (default demo URL: `/95014`). Validate `^\d{5}$` else `notFound()`. If the zip is not in `LIVE_ZIPS` (anything other than `95014`/`95015`), `redirect('/unlock/[zip]')`.
* **Masthead:** `Hi, 95014.` in `cw-font-serif` (Playfair), with the final period rendered in `cw-rust`.
* **Sub-bar:** Mono, muted (`cw-bronze`): `Curbwire Nº{issueNumber} · {formattedDate}` left-aligned; right-aligned `Read Online` link (links to the canonical `/{zip}` URL). Thin `cw-sand` rule beneath.
* **Top Share Banner:** `cw-tint-rust` background strip: *"Like Curbwire? Send To A Friend →"*. The whole strip is a `ShareButton` (Section 8.1) with the issue target: link `{SITE_URL}/{zip}`, logged with `cardSlug: null`.
* **Card List:** `PUBLISHED` cards rendered sequentially from `getMockCards()` (withheld drafts never appear; Section 10.3):
  * **Category badge:** Mono, uppercase, small, parchment text on the category token (`cw-badge-coordination`, `cw-badge-whimsy`, `cw-badge-event`, `cw-badge-news`). Labels: `CIVIC COORDINATION`, `BUREAUCRATIC WHIMSY`, `COMMUNITY EVENT`, `LOCAL NEWS`.
  * **Title:** `<Link href="/c/{slug}">` in `cw-font-serif text-2xl font-bold hover:underline`.
  * **Source line:** Mono, `cw-bronze`: `{sourceName}`, followed by ` · {codeSection}` when `actionMeta.codeSection` exists.
  * **Summary:** `cw-font-body`.
  * **Detail context:** `cw-font-body`. If the text starts with a short lead-in, bold the lead-in including its colon (`What changed:`, `The Silicon Valley Reality Check:`). A lead-in is at most 40 characters, contains no period, and is followed by a colon and a space: regex `^([^.:]{1,40}):\s`. If the text does not match, render it plain. (`crd_03` has no lead-in; its first colon is the one in "10:00 AM".)
  * **Meeting line:** For cards with `meetingDateDisplay`, show it in mono.
  * **Share Action Strip (`components/ShareStrip.tsx`):** `cw-tint-rust` container with one `[Share]` button (`ShareButton.tsx`), plus `[Add to Calendar]` (`AddToCalendar.tsx`) on cards where `actionMeta.meetingDateIso` exists. Icons per Section 3.3. Behavior in Section 8.1 and 8.2.
* **View Tracking:** `ViewTracker` with `cardSlug: null`, so a visitor who arrives through an issue-level share link (`/{zip}?src=...&ref=...`) is recorded and their `ref` is kept in the `cw_ref` cookie (same behavior as Section 6.2).
* **Footer:** Mono, `cw-stone` copyright line.

### 6.2 Route 2: Standalone Card Landing Page (`app/c/[slug]/page.tsx`)
* **Endpoint:** `/c/[slug]`. Unknown slug, or a slug whose card is not `PUBLISHED`, → `notFound()` (`getCardBySlug()` only searches published cards).
* **Metadata (`generateMetadata`):** `metadataBase: new URL(SITE_URL)`; `title` and `openGraph.title` = card headline; `openGraph.description` = card summary; `openGraph.images` = `[{ url: '/api/og?slug={slug}', width: 1200, height: 630 }]`; `twitter.card = 'summary_large_image'`.
* **Card Display:** The isolated card in full focus: badge, serif headline, summary, detail context, source attribution (`sourceName` linking to `sourceUrl`, then `codeSection` when present), and the `ShareStrip` (the `[Share]` button, plus `AddToCalendar` where applicable).
* **View Tracking (`components/ViewTracker.tsx`):** Client component, used on all three pages. On mount, once per page load, it calls `ensureUid()` (Section 8.1) and then `POST /api/view` with `cardSlug`, inbound `ref` and `src` query params, and the resolved `userZip`. It also stores the inbound `ref` in cookie `cw_ref` (30 days) so a later subscribe call can attach it. Guard the effect with a `useRef` flag (`if (sent.current) return; sent.current = true;`): React strict mode runs effects twice in development, and without the guard every page load would log two views.
* **Geo-Adaptive Conversion Banner (`components/GeoConversionBanner.tsx`):** Receives `location` (ResolvedLocation), `card`, and `isLocal` (boolean) as props from the page. The page, a server component, computes `isLocal = isLocalToCard(location, card)` (Section 7.1) and passes the result down. The banner is a client component and must **not** import `lib/location.ts`, which is server-only (Section 7.2); it takes its types with `import type { Card, ResolvedLocation } from '@/types'`.
  * **Case A: Local (`isLocal === true`):**
    * Header: *"Live in Cupertino? Get the 2-minute calm civic briefing."*
    * If `actionType === 'VERDICT_TRACK'`: checkbox, **checked by default**: *"Notify me when the Planning Commission issues a decision on this parcel."*
    * Email field + rust submit button `[Get Cupertino Brief]`.
    * Submit → `POST /api/subscribe` with `intentType: 'VERDICT_ALERT'` if the box is checked, otherwise `'GENERAL_BRIEF'`, and `zipCode: card.zipCode`.
    * Success state replaces the form: confirmation line, then a re-share prompt ("Know a neighbor who should see this?") with the `ShareStrip`.
  * **Case B: Remote (`isLocal === false`):**
    * Header: *"This is from Cupertino, CA. Want calm civic briefs and weird local statutes in {shortCity}?"*, where `{shortCity}` is `shortCity(location.cityName)` (e.g., `Denver`). When `location.cityName` is `null`, the header ends *"...in your neighborhood?"* instead.
    * Dual fields `[Your Zip Code]` (prefilled from `location.zip` when present) and `[Your Email]`, plus rust button `[Check My Neighborhood]`.
    * Submit → `POST /api/subscribe` with `intentType: 'MARKET_UNLOCK'`. Success replaces the form with `WaitlistPayoff` (Section 8.4), fed by the response.
    * Exception: if the entered zip is in `LIVE_ZIPS`, Curbwire is already there. Do not call the API; `router.push('/' + zip)` to show that issue.

### 6.3 Route 3: Remote Unlock Page (`app/unlock/[zip]/page.tsx`)
* **Endpoint:** `/unlock/[zip]` (the re-share link target). Validate `^\d{5}$` else `notFound()`. If the zip is in `LIVE_ZIPS`, `redirect('/' + zip)`: a waitlist page must never say Curbwire isn't in Cupertino.
* **Header:** Masthead-style *"Curbwire isn't in {shortCity} yet."* (e.g., *"...in Denver yet."*). For a zip that is not in `MOCK_ZIP_DIRECTORY`: *"Curbwire isn't in your area ({zip}) yet."*
* **Content, first-time visitor:** a one-line pitch, the current pledge progress (`WAITLIST_SEED_COUNT + count of MARKET_UNLOCK subscribers for the zip`, out of `WAITLIST_TARGET`), and the email form (zip prefilled and locked to the URL zip). Submit runs the same `MARKET_UNLOCK` flow as Section 6.2 Case B and shows `WaitlistPayoff`.
* **Content, returning subscriber:** the page reads the `cw_uid` cookie on the server and calls `getWaitlistStatusForUser(zip, uid)` (Section 7.3). If it returns a status, the page renders `WaitlistPayoff` with those **live** values instead of the form. This is how a referrer sees their position move up after friends sign up (Section 8.4).
* **View Tracking:** `ViewTracker` (with `cardSlug: null`) captures inbound `ref`/`src`.

---

## 7. Functional Architecture

### 7.1 Geo-Detection Precedence Engine (`lib/location.ts`, server-only)
`resolveLocation(): ResolvedLocation` resolves in this order:
1. **Cookie Override (`cw_demo_zip`):** Set by the Founder Demo Dock. `cityName` = `MOCK_ZIP_DIRECTORY[zip]`, or `null` for zips not in the directory.
2. **Netlify Geolocation Header (`x-nf-geo`):** Read with `headers().get('x-nf-geo')`. The value is **base64-encoded JSON** and must be decoded before use:
   ```typescript
   function parseNetlifyGeo(h: string | null) {
     if (!h) return null;
     try { return JSON.parse(Buffer.from(h, 'base64').toString('utf-8')); } catch { return null; }
   }
   // geo: { city?, country?: { code }, subdivision?: { code }, postalCode?, ... }
   ```
   Use `geo.postalCode` when present and `geo.city` + `geo.subdivision.code` for `cityName` (`"Denver, CO"`; the city alone if there is no subdivision). **`postalCode` is frequently absent under `netlify dev`**, so never require it: a city alone is enough to resolve a location, and the cookie override is the dependable local-testing path. If the header has no city, fall through to the default. After the first deploy, verify the header actually reaches server code (see Acceptance Criteria).
3. **Default Fallback:** `80202` / `Denver, CO` (simulates remote, out-of-town traffic), `source: 'default'`.

`cityName` is never a placeholder string. Copy that needs a fallback for an unknown city handles `null` itself (Section 8.4 copy table).

**Local vs. remote matching** (IP-derived zips are approximate, so exact zip equality is too strict). Only the card page calls this, on the server, and it hands the boolean to the banner as the `isLocal` prop (Section 6.2):
```typescript
export function isLocalToCard(loc: ResolvedLocation, card: Card): boolean {
  const cardCity = MOCK_ZIP_DIRECTORY[card.zipCode];                    // "Cupertino, CA"
  if (loc.cityName && loc.cityName.toLowerCase() === cardCity.toLowerCase()) return true;
  return (CITY_LOCAL_ZIPS[cardCity] ?? [card.zipCode]).includes(loc.zip);
}
```

**Switching location from the dock:** the dock's click handler writes `cw_demo_zip` (via `document.cookie`, `path=/`) and calls `router.refresh()`. The root layout and the page both re-run on the server and read the new cookie, so the dock receives a new `initialLocation` prop and the banner re-renders, without a full page reload. The dock shows the location from its prop; it does not read `document.cookie` to decide what to render (Section 2.5).

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
  countReferredSignups(zip: string, referrerId: string): Promise<number>; // MARKET_UNLOCK rows in zip with this referrer_id
  findMarketUnlockEmail(zip: string, userRefId: string): Promise<string | null>; // this visitor's own signup, if any (the earliest, if several)
  getTelemetry(): Promise<Telemetry>;
  reset(): Promise<void>;
}
```
`lib/store/index.ts` exports `getStore()`: Supabase implementation when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise the in-memory implementation (Section 2.3).

**Supabase client (`lib/store/supabase.ts`):**
* Use the plain `createClient` from `@supabase/supabase-js` with the service-role key and `{ auth: { persistSession: false } }`. Do not use `@supabase/ssr` or the auth helpers: the POC has no Supabase auth, so there are no session cookies to manage.
* `lib/store/index.ts`, `lib/store/supabase.ts`, `lib/waitlist.ts`, and `lib/location.ts` start with `import 'server-only';`. Any `"use client"` file that imports one of them, directly or through another module, then fails the build.
* The only callers of `getStore()` are the API routes (`app/api/**`) and server components (`app/unlock/[zip]/page.tsx`). The POC uses no server actions. Client components reach data only through `fetch('/api/...')`.
* **Duplicate signups (`addSubscriber`):** do a plain `.insert()`. If Postgres answers with error code `23505` (the `subscribers_unique_signup` index), the signup already exists: select that row with `.eq('email', email).eq('zip_code', zipCode).eq('intent_type', intentType)` and return `{ created: false, createdAt }`. Do **not** use `.upsert()` with `onConflict`: the unique index is on the expression `lower(email)`, which `onConflict` cannot name. The lookup by `.eq('email', ...)` is safe because the API route lower-cases every email before it reaches the store (Section 7.3). The memory store keys signups the same way.

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
  `cardSlug` may be `null` (e.g., from `/unlock/[zip]`).
* **Subscriber identity:** The subscriber's own id is read from the `cw_uid` cookie on the server and stored as `user_ref_id`. If the cookie is missing, the route generates one (`usr_` + 8 random alphanumerics) and sets it on the response (`Set-Cookie`: `Path=/`, 1 year, `SameSite=Lax`, **not** `HttpOnly`, because client code reads it to build share links). `shareUrl` therefore always carries a `ref`.
* **Referrer:** `referrerId` is stored as `referrer_id`, with one exception: if it equals the subscriber's own `cw_uid`, store NULL. Opening your own share link and signing up must not count toward your own bump.
* **Validation:** The route trims and lower-cases `email` first, so every store call sees the same normalized address. Valid email format, 5-digit zip, known `intentType`. Duplicate (same lower-cased email + zip + intent) is **idempotent**: no new row, `200` with `alreadySubscribed: true`. For `MARKET_UNLOCK` the duplicate response carries the **current** waitlist status, recomputed at request time, not a copy of the original response.
* **Response (`200 OK`), `intentType` = `MARKET_UNLOCK`:** the fields of `WaitlistStatus` (Section 4) plus the common fields.
  ```json
  {
    "success": true,
    "intentType": "MARKET_UNLOCK",
    "alreadySubscribed": false,
    "waitlistPosition": 14,
    "pledgeCount": 14,
    "targetPledges": 50,
    "progressPct": 28,
    "zip": "80202",
    "cityName": "Denver, CO",
    "shareUrl": "https://curbwire-poc.netlify.app/unlock/80202?src=copy&ref=usr_a1b2c3d4"
  }
  ```
* **Waitlist math** lives in `lib/waitlist.ts` (constants in `lib/config.ts`). The API route and the `/unlock/[zip]` page both call it, so the two can never disagree:
  * `rank = marketUnlockRank(zip, email)` (1-based, by `created_at`).
  * `pledgeCount = WAITLIST_SEED_COUNT + countMarketUnlock(zip)`.
  * `basePosition = WAITLIST_SEED_COUNT + rank` (first real signup in a zip is **#14**).
  * `bump = floor(countReferredSignups(zip, ownUid) / REFERRALS_PER_BUMP) * SPOTS_PER_BUMP`.
  * `waitlistPosition = max(1, basePosition - bump)`.
  * `progressPct = min(100, round(pledgeCount / WAITLIST_TARGET * 100))` (14 / 50 = **28%**; the clamp keeps the bar from overflowing past 50 pledges).
  * `cityName` = `MOCK_ZIP_DIRECTORY[zip]`, or `null` for a zip not in the directory.

  ```typescript
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
  ```
* **Response for `VERDICT_ALERT` / `GENERAL_BRIEF`:** `{ "success": true, "intentType": "...", "alreadySubscribed": false }`.

#### 2. POST `/api/share`
Logs sharing telemetry across channels.
* **Payload:**
  ```json
  {
    "cardSlug": "vallco-pkwy-outdoor-dining-variance", // null for issue-level shares
    "channel": "native",                                // "native" | "email" | "copy"
    "referrerId": "usr_demo"                            // the sharer's own cw_uid
  }
  ```
* **Response:** `{ "success": true }`.

#### 3. POST `/api/view`
Logs view events and captures inbound referral chains.
* **Payload:**
  ```json
  {
    "cardSlug": "vallco-pkwy-outdoor-dining-variance", // null for /unlock and issue views
    "referrerId": "usr_demo",
    "sourceChannel": "native",
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
Deletes all rows from `share_events`, `view_events`, and `subscribers` (or clears the memory store). Response: `{ "success": true }`.

Reset is **on by default**. The route reads the flag with a default, so an unset variable never produces a `403`:
```typescript
const resetAllowed = (process.env.ALLOW_DEMO_RESET ?? 'true') === 'true';
if (!resetAllowed) return Response.json({ success: false, error: 'Reset is disabled' }, { status: 403 });
```
The only way to get a `403` is to set `ALLOW_DEMO_RESET=false` on purpose.

---

## 8. Component & Payoff Mechanics

### 8.1 Sharing: One `[Share]` Button (`components/ShareButton.tsx`, `ShareEmailDialog.tsx`, `ShareStrip.tsx`)
**Identity (`lib/identity.ts`):** `ensureUid()` returns the `cw_uid` cookie value, creating it first if absent (`usr_` + 8 random alphanumerics; cookie, 1 year, `path=/`). It runs only in effects and event handlers, never during render. `ViewTracker` calls it on mount on every page, so the id exists before any share or signup, and `ShareButton` calls it when it builds a link. `POST /api/subscribe` is the server-side safety net (Section 7.3). Every share link uses the id as `ref`. (`usr_demo` in examples is just an example value.)

**Link builder:** `{SITE_URL}{path}?src={channel}&ref={cw_uid}`, where `{path}` is `/c/{slug}` for a card, `/{zip}` for the issue, or `/unlock/{zip}` for the waitlist, and `{channel}` is `native`, `email`, or `copy`. Always built from `NEXT_PUBLIC_SITE_URL`, never a hardcoded domain.

**One button, two behaviors.** `ShareButton` renders a single `[Share]` button. `ShareStrip` is the `cw-tint-rust` container that holds it (plus `AddToCalendar` where applicable); the top share banner (Section 6.1) and `WaitlistPayoff` (Section 8.4) render `ShareButton` directly with their own target. There are no separate SMS or WhatsApp buttons: on a phone the visitor picks the app from the share sheet.

The mobile/desktop branch is decided **inside the click handler**, never during render, because the server cannot know the device:
```typescript
// components/ShareButton.tsx (client)
async function onShareClick() {
  const uid = ensureUid();
  const isMobile = typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;
  if (!isMobile) return openEmailDialog();
  try {
    await navigator.share({ title: target.title, text: target.title, url: buildLink(target.path, 'native', uid) });
    logShare('native');                                                   // POST /api/share
  } catch (err) {
    if ((err as DOMException).name !== 'AbortError') openEmailDialog();   // a dismissed sheet is not a share
  }
}
```
Desktop Chrome, Edge, and Safari also implement `navigator.share`, so the `(pointer: coarse)` check is what keeps desktop visitors on the email path.

* **Mobile: the device's share sheet.** `navigator.share()` with the link (`src=native`). The share is logged only after the promise resolves. If the visitor dismisses the sheet, nothing is logged. If `navigator.share` is missing or fails for another reason, open the email box instead.
* **Desktop: the email box (`ShareEmailDialog`).** A small modal titled *"Send this to a friend"*, closed by `Esc` or a backdrop click:
  * `Your name` (text). Used as `{name}` in the message. If left blank, `{name}` is `A neighbor`.
  * `Friend's email` (optional). If left blank, the mail app opens with no recipient filled in.
  * A live preview of the message below the fields.
  * `[Open Email]` (primary): opens `mailto:{friendEmail}?subject={subject}&body={body}`, with `subject` and `body` passed through `encodeURIComponent` and the link carrying `src=email`. Logs the share with `channel: 'email'` and closes the box.
  * `[Copy Link]` (secondary): copies the link with `src=copy`, confirms with a sonner toast (`toast('Link copied')`), and logs the share with `channel: 'copy'`.
  * The name and the friend's address never leave the browser. The POC has no email transport (Section 1.2): the visitor sends the email from their own mail app, and an email share is counted when the mail app is opened.

**Message copy.** `{name}` comes from the email box; `{link}` is the built link. The share-sheet `title` and `text` use the subject line.

| Target | `{path}` | Subject / share-sheet title | Email body |
| :--- | :--- | :--- | :--- |
| Card | `/c/{slug}` | `{headline}` | `{name} thought you'd be interested in this article. Click {link} to see!` |
| Issue (top banner) | `/{zip}` | `Curbwire for {zip}` | `{name} thought you'd be interested in this newsletter. Click {link} to see!` |
| Waitlist (payoff screen) | `/unlock/{zip}` | `Help bring Curbwire to {shortCity}` | `{name} is trying to bring Curbwire to {shortCity}. Click {link} to add your pledge!` |

For the waitlist target, when the city is unknown (`cityName === null`), `{shortCity}` reads `our neighborhood`.

Every completed share calls `POST /api/share` with `cardSlug` (`null` for the issue and waitlist targets), the `channel`, and the sharer's own `cw_uid` as `referrerId`. Button icons are fixed in Section 3.3.

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

### 8.4 The Loop 2 Payoff: Remote Waitlist Unlock & Re-Share (`components/WaitlistPayoff.tsx`)
1. Remote user (Denver `80202`) views `/c/apple-park-horse-commute-ordinance` (or lands on `/unlock/80202`).
2. Geo-Adaptive Banner displays: *"This is from Cupertino, CA. Want calm civic briefs and weird local statutes in Denver?"*
3. Remote user enters email and zip (`80202`).
4. **Immediate Payoff Screen Replaces Form.** `WaitlistPayoff` takes a `WaitlistStatus` (Section 4) and renders:
   * The position line (copy table below).
   * Dynamic progress bar: `{progressPct}% to node launch` (first signup: `#14 of 50`, `28%`). `progressPct` is already clamped to 100.
   * **The Re-Share Nudge** (copy table below), followed by `shareUrl` (`{SITE_URL}/unlock/{zip}?src=copy&ref={cw_uid}`) with a `[Copy]` button, and a `[Share]` button (`ShareButton` with the unlock target; Section 8.1). Every 2 referred signups move the referrer up 5 spots (Section 7.3 waitlist math).
5. **Seeing the bump.** The referrer's position is recomputed on every read, never stored. When the referrer returns to `/unlock/{zip}` in the same browser, the page recognizes their `cw_uid` and shows `WaitlistPayoff` with the live position (Section 6.3). Re-submitting the same email returns the live position too (Section 7.3). Example: the first signup in `80202` is `#14`; after two people sign up through their link, a reload shows `#9`.

**Copy table.** `cityName` is the full label (`"Denver, CO"`) and is `null` for a zip outside `MOCK_ZIP_DIRECTORY`. `shortCity` is `shortCity(cityName)` (`"Denver"`).

| Where | City known | City unknown (`cityName === null`) |
| :--- | :--- | :--- |
| Remote banner header (Section 6.2) | *"...weird local statutes in {shortCity}?"* | *"...weird local statutes in your neighborhood?"* |
| Unlock page header (Section 6.3) | *"Curbwire isn't in {shortCity} yet."* | *"Curbwire isn't in your area ({zip}) yet."* |
| Payoff position line | *"You are #{waitlistPosition} of {targetPledges} pledges in {cityName} ({zip}) to unlock Curbwire."* | *"You are #{waitlistPosition} of {targetPledges} pledges in your area ({zip}) to unlock Curbwire."* |
| Re-share nudge | *"Share your unique link with 2 {shortCity} neighbors to move up 5 spots:"* | *"Share your unique link with 2 neighbors to move up 5 spots:"* |

### 8.5 The Editorial Staging Payoff: Human-in-the-Loop Gate (`components/EditorialStagingModal.tsx`)
To demonstrate Curbwire's calm credibility to founders Doug Hirsch and Trevor Budzek. The point of the demo: agents write the drafts, a human editor decides what ships, and the editor turns drafts down for two different reasons.
1. The dock features an `[🛡️ Editorial Staging · 2 withheld]` button.
2. Clicking it opens a split comparison modal:
   * **Left Panel (Withheld Agent Drafts):** Two Absurdity Agent drafts the human editor did not publish. A chip row switches between them.
     * **Hallucination (`crd_qa_01`, the Poultry Peace draft; shown first):** a crimson `FLAGGED: HALLUCINATION` chip, the unsupported passages highlighted in the draft, and the editor's reason:
       > *"Embellishment Detected: § 10.48.061 is a general animal-noise rule, not a poultry ordinance. The 1965 orchard-worker backstory could not be verified in the municipal code. Human editor decision: blocked from publication."*
     * **Not forward-worthy (`crd_qa_02`, the Rooster Noise Rule draft):** its claims pass the source checks, but the editor held it back because nobody would forward it. `REJECTED: NOT FORWARD-WORTHY` chip and the editor's reason:
       > *"Accurate, but not forward-worthy: the rooster claim checks out against the City's Code Enforcement FAQ, but a noise rule that treats roosters like barking dogs has no surprise and no punchline. Human editor decision: held back from the newsletter."*
   * **Right Panel (Approved Public Card):** The horse commute card (`crd_02`), also drafted by the Absurdity Agent, which the editor approved as pithy and worth forwarding. It is the card Loop 2 runs on.
3. **Founder Pitch Value:** Proves to the founders that Curbwire is an ambient intelligence platform with a human in the loop, not a reckless AI wrapper: a fabricated draft is caught, and an accurate but dull draft is also kept out of readers' inboxes.

---

## 9. Dynamic OpenGraph Preview Generator (`app/api/og/route.tsx`)

* **Engine:** `next/og` (`ImageResponse`).
* **Runtime:** `export const runtime = 'nodejs';` (explicit). Do not use the Edge runtime.
* **Fonts:** Bundled TTF files committed to `assets/fonts/` (`PlayfairDisplay-Bold.ttf`, `JetBrainsMono-Bold.ttf`; both SIL OFL from Google Fonts). **No woff2** (unsupported by `ImageResponse`). `next/font/google` (Section 2.5) does not apply here: `ImageResponse` needs the raw font bytes. Read them from disk with `fs`:
  ```typescript
  import { readFile } from 'node:fs/promises';
  import { join } from 'node:path';

  const fontDir = join(process.cwd(), 'assets', 'fonts');
  const [playfair, mono] = await Promise.all([
    readFile(join(fontDir, 'PlayfairDisplay-Bold.ttf')),
    readFile(join(fontDir, 'JetBrainsMono-Bold.ttf')),
  ]);
  // new ImageResponse(<Layout />, { width: 1200, height: 630, fonts: [
  //   { name: 'Playfair Display', data: playfair, weight: 700, style: 'normal' },
  //   { name: 'JetBrains Mono',   data: mono,     weight: 700, style: 'normal' } ] })
  ```
  **Required** in `next.config.js`, so the font files are copied into the Netlify function bundle (without this, `readFile` works locally and fails on the deploy):
  ```javascript
  experimental: { outputFileTracingIncludes: { '/api/og': ['./assets/fonts/**/*'] } }
  ```
  **Do not use `fetch(new URL('...ttf', import.meta.url))` in this route.** That is the Edge-runtime pattern. Under the Node runtime on Next 14.2.15 the URL resolves to a relative `/_next/static/media/...` path and `fetch` throws `Failed to parse URL` (confirmed on a scratch production build).
* **Local Windows caveat:** In the same scratch test (Windows, Node 22.14, Next 14.2.15), `ImageResponse` itself failed under the Node runtime with `ERR_INVALID_URL` while loading `next/og`'s own built-in fallback font, regardless of how the custom fonts were loaded. If `/api/og` returns a 500 with that error on a Windows machine, check the OG criteria on the Netlify deploy (Linux) or under WSL instead. The deploy has not been tested yet; Acceptance Criterion 10 is the check.
* **Data:** `GET /api/og?slug=...` → `getCardBySlug(slug)`. If the slug is unknown or the card is not `PUBLISHED` (any withheld draft), return a generic branded image (never a 404/500, so link unfurls don't break).
* **Layout Constraints:**
  * Canvas: 1200 x 630 px. Background `#f7f1e1`, outer border 16px `#f7f1e1`, inner frame 2px `#a83a25`.
  * **Top bar:** Category badge in mono, e.g. `CIVIC COORDINATION · CUPERTINO 95014`. Category labels: `CIVIC COORDINATION`, `BUREAUCRATIC WHIMSY`, `COMMUNITY EVENT`, `LOCAL NEWS`; badge color from the category token.
  * **Center:** Headline in **Playfair Display Bold** (the brand headline face), about 56px, clamped to a maximum of 3 lines (max 110 characters) with auto-ellipsis.
  * **Bottom bar:** Mono: `CURBWIRE AMBIENT CIVIC INTELLIGENCE · curbwire.com`.

---

## 10. Editorial Workflow & Gate

### 10.1 Principle
Curbwire's cards are written by agents and published by people. The **Civic Engagement Agent** drafts Decision Cards and the **Absurdity Agent** drafts Bureaucratic Whimsy. Agent drafts can hallucinate history, citations, and enforcement details, and a draft can also be accurate and still not worth a reader's attention. So every draft goes to a human editor, who makes the publish decision. The POC demonstrates that gate with seed data; it does not build the agents or a CMS. **Founder pitch value:** it shows Curbwire is an ambient-intelligence platform with a human in the loop, not an unchecked AI wrapper.

### 10.2 Status Model

| Status | Chip label | Meaning | Visible on public routes? |
| :--- | :--- | :--- | :--- |
| `PENDING_REVIEW` | `PENDING REVIEW` | Agent draft waiting for the human editor | No |
| `PUBLISHED` | `PUBLISHED` | The editor approved it: the claims hold up and the card is worth forwarding | Yes |
| `FLAGGED_HALLUCINATION` | `FLAGGED: HALLUCINATION` | The editor found fabricated or unsupported claims (`flagReason` says which) | No. Shown only in the dock's Editorial Staging modal |
| `REJECTED_NOT_SHAREWORTHY` | `REJECTED: NOT FORWARD-WORTHY` | The claims hold up, but the card is not interesting or funny enough to forward (`flagReason` says why) | No. Shown only in the dock's Editorial Staging modal |

Lifecycle: `agent draft → PENDING_REVIEW → human editor decision → PUBLISHED | FLAGGED_HALLUCINATION | REJECTED_NOT_SHAREWORTHY`. Each draft arrives with `verificationNotes` (checks of its claims against the cited source), and the editor makes the final call. A withheld draft is rewritten as a new draft and re-enters review. The POC has no UI for transitions; statuses, notes, and reasons are seed data that simulate the editor's decisions.

### 10.3 Enforcement (No New Infrastructure)
* `getMockCards()` returns **only** `PUBLISHED` cards, and `getCardBySlug()` searches only that list. The newsletter (`/[zip]`), card pages (`/c/[slug]`), OG images (`/api/og`), share links, and the unlock flow therefore inherit the gate automatically.
* Withheld drafts live in `MOCK_STAGED_CARDS`, which is imported by exactly two components: `EditorialStagingModal` (to render the drafts) and `DemoControlDock` (to count them for its pill). No page, route, API, or other component reads it.
* A withheld slug on a public route returns `404` (OG route: the generic branded image).

### 10.4 Seed Assignments

| Card | ID / Slug | Drafted by | Category | Status |
| :--- | :--- | :--- | :--- | :--- |
| Vallco Pkwy variance hearing | `crd_01` / `vallco-pkwy-outdoor-dining-variance` | Civic Engagement Agent | COORDINATION | `PUBLISHED` |
| Apple Park Horse Commute (CVC § 21050) | `crd_02` / `apple-park-horse-commute-ordinance` | Absurdity Agent | ABSURDITY | `PUBLISHED` (approved as pithy and forward-worthy; Loop 2 uses it) |
| Public Budget Prioritization Session | `crd_03` / `community-hall-budget-prioritization-session` | Civic Engagement Agent | EVENT | `PUBLISHED` |
| Poultry Peace Ordinance (hallucination) | `crd_qa_01` / `cupertino-code-poultry-peace-ordinance-unverified` | Absurdity Agent | ABSURDITY | `FLAGGED_HALLUCINATION` (staged; never public) |
| Rooster Noise Rule (accurate, not funny enough) | `crd_qa_02` / `cupertino-code-rooster-noise-rule` | Absurdity Agent | ABSURDITY | `REJECTED_NOT_SHAREWORTHY` (staged; never public) |

Both staged cards are withheld from every public route. `crd_qa_01` is the default selection in the Editorial Staging modal (Section 8.5). The three published cards stay published for the demo, because both PLG loops need them.

### 10.5 Editorial Staging Modal (`components/EditorialStagingModal.tsx`)
Opened from the Founder Dock pill `[🛡️ Editorial Staging · 2 withheld]` (Section 11). A centered split-comparison modal, parchment background, `cw-sand` borders, closes on `Esc` or backdrop click. Read-only: no approve, reject, or edit buttons. The step-by-step demo flow is in Section 8.5.
* **Header:** `🛡️ Editorial Staging`, subline: *"Agents draft. A human editor decides what publishes."*
* **Pipeline summary (mono):** `{published} published · {flagged} flagged · {rejected} rejected · {pending} pending`, counted from `getMockCards()` and `MOCK_STAGED_CARDS` (seed values: `3 · 1 · 1 · 0`).
* **Left panel: Withheld Agent Drafts.**
  * A chip row above the card switches between staged cards; the default is `crd_qa_01`. Chip text: `Hallucination` and `Not forward-worthy`.
  * The selected staged card in normal card styling (badge, serif headline, summary, detail context, source line), with a dashed `cw-sand` border, a mono line `Drafted by: Absurdity Agent` (from `draftedBy`), and a status chip using the chip label from Section 10.2: `FLAGGED_HALLUCINATION` in `cw-badge-qa-flagged`, `REJECTED_NOT_SHAREWORTHY` in `cw-stone`.
  * Any `verificationNotes[].excerpt` found in the headline, summary, or detail context is highlighted with a `cw-tint-rust` background.
  * `flagReason` appears beneath the card in a callout titled `Editor's decision`.
  * Below that, **Verification Notes**: one row per note with the `check` name, a result chip (`PASS` in `cw-badge-coordination`, `FAIL` in `cw-badge-qa-flagged`, `UNVERIFIED` in `cw-bronze`), and the `detail` text.
* **Right panel: Approved Public Card.**
  * The published ABSURDITY card from `getMockCards()` (`crd_02`, the Apple Park horse commute) in normal card styling, with `Drafted by: Absurdity Agent`, a `PUBLISHED` chip in `cw-badge-coordination`, and the line *"Editor's call: pithy and forward-worthy. Cleared for distribution."*
  * A `View live page →` link to `/c/{slug}`.
* On mobile the panels stack, withheld drafts first.

### 10.6 Production Follow-Up: Content Verification (Out of POC Scope)
The POC ships its seed content as written so that both PLG loops have data to run on. The `editorialStatus` values simulate the result of the human review; nobody has checked the published copy against primary sources. That check belongs to production, where the editor's approval has to mean it. Known open items, recorded here so they are not lost:
* **`crd_02` (horse card):** the text of CVC § 21050 and CVC § 21759 (in particular whether § 21759 makes honking a misdemeanor); which Cupertino Municipal Code chapter prohibits sidewalk riding (the card cites § 11.24 in both `detailContext` and `codeSection`); the "full lane" and "100% street-legal" wording; and the claim that commercial zoning doesn't require hitching corrals.
* **Staged cards:** the primary text of § 10.48.061 and the City Code Enforcement FAQ's rooster answer, which the verification notes on `crd_qa_01` and `crd_qa_02` rely on.

None of this blocks the demo. If the copy is ever shown as real Curbwire output rather than a demo, do this check first.

---

## 11. Founder Demo Dock (`components/DemoControlDock.tsx`)

A floating control center docked at the bottom-right, mounted once in `app/layout.tsx` with the props `initialLocation` and `initialDemo` (Section 2.5).
* **Visibility:** Hidden by default. Shown when `initialDemo` is true (the `cw_demo=1` cookie, read on the server) **or** the current URL has `?demo=1` (`useSearchParams()`). When the dock sees `?demo=1`, an effect writes the `cw_demo=1` cookie (`path=/`, session cookie), so the dock stays on while navigating to pages whose URL has no `?demo=1` (card pages, `/unlock`, `View live page →`). `Ctrl + Shift + D` toggles the dock and sets or clears the cookie.
* **Location Switcher:**
  * Button `[📍 Local: Cupertino (95014)]` vs `[📍 Remote: Denver (80202)]`. The active state comes from the `initialLocation` prop.
  * Writes the `cw_demo_zip` cookie and calls `router.refresh()` so the server re-resolves the location and the banner updates without a full page reload (Section 7.1).
* **Live Telemetry Ticker:** Polls `GET /api/telemetry` every 3 seconds (and immediately after any action in the same browser):
  * `Shares Sent: X`
  * `Link Views: Y`
  * `Leads Captured: Z`
  * A warning chip when `persistence === 'memory'` and the hostname is not `localhost` / `127.0.0.1` (Section 2.3).
* **Trigger Simulation:** Button `[⚡ Simulate Verdict]`, disabled until `verdictAlertLeads > 0`; opens the `VerdictModal`.
* **Editorial Staging:** Pill `[🛡️ Editorial Staging · {withheldCount} withheld]`. The count is `MOCK_STAGED_CARDS.length`, imported directly by the dock, so there is no API call. Clicking opens the `EditorialStagingModal` (Section 10.5).
* **Reset Button:** Calls `POST /api/reset`, then refreshes telemetry back to zero. If the route answers `403` (someone set `ALLOW_DEMO_RESET=false`), show `toast('Reset is disabled on this deploy')` instead of failing silently.
* Icons per Section 3.3.
* Because counters live in Supabase, shares, views, and leads made from the interviewer's phone also appear on the founder's laptop dock.

---

## 12. Phased Implementation Plan for Coding Agent

When instructing Cursor or Antigravity, execute in strict sequential phases:

```
+───────────────────────────────────────────────────────────────────────────────────────────+
|                                    PHASED BUILD ORDER                                     |
+───────────────────────────────────────────────────────────────────────────────────────────+
  Phase 1: Foundation ──▶ tailwind.config.ts (cw-* tokens under theme.extend.colors, exact names from 3.1),
                          app/globals.css (cw-font-* classes), app/layout.tsx (next/font/google variables
                          on <body>, Toaster; dock added in Phase 7), app/page.tsx redirect, env vars,
                          lib/config.ts, assets/fonts/ TTFs, install sonner + lucide-react + server-only
  Phase 2: Data Layer ──▶ types/index.ts (incl. EditorialStatus, DraftingAgent, WaitlistStatus), lib/dates.ts,
                          lib/mock-data.ts (published cards as functions; MOCK_STAGED_CARDS as a
                          date-free constant), lib/location.ts, lib/identity.ts
  Phase 3: Store      ──▶ supabase/schema.sql, lib/store/ (interface, supabase, memory), lib/waitlist.ts,
                          /api/subscribe, /api/share, /api/view, /api/telemetry, /api/reset
  Phase 4: Route 1    ──▶ app/[zip]/page.tsx (Header, cards, ViewTracker), components/ShareButton.tsx +
                          ShareEmailDialog.tsx + ShareStrip.tsx (8.1),
                          lib/calendar.ts + components/AddToCalendar.tsx
                          Icons (3.3): Share2, Forward, Mail, Copy, Calendar, Download
  Phase 5: Route 2    ──▶ app/c/[slug]/page.tsx (metadata, ViewTracker) +
                          components/GeoConversionBanner.tsx + app/unlock/[zip]/page.tsx
                          Icons (3.3): ExternalLink, Check
  Phase 6: Payoffs    ──▶ components/WaitlistPayoff.tsx (payoff screen + re-share nudge, live position
                          for returning subscribers), VerdictModal
  Phase 7: OG & Dock  ──▶ app/api/og/route.tsx (Node runtime, fonts via readFile + outputFileTracingIncludes),
                          components/DemoControlDock.tsx (?demo=1 + cw_demo cookie; props from layout),
                          components/EditorialStagingModal.tsx
                          Icons (3.3): MapPin, Zap, ShieldCheck, RotateCcw, X
```

### Acceptance Criteria for Verification
1. `npm run build` completes with zero TypeScript errors (`next build` type-checks the project; `next dev` does not). `npm run dev` then boots cleanly, and loading each page shows **no hydration warnings** in the browser console (all dates are Pacific-formatted on both server and client).
2. Visiting `http://localhost:3000/95014?demo=1` renders the newsletter issue with dates matching the next upcoming Thursday and Saturday (Pacific), and the dock appears.
3. **Desktop share:** On a desktop browser, `[Share]` on a card opens the email box. With the name `Sam`, `[Open Email]` opens the mail app with the card headline as the subject and the body `Sam thought you'd be interested in this article. Click {link} to see!`, where `{link}` is an absolute URL built from `NEXT_PUBLIC_SITE_URL` ending in `?src=email&ref=usr_` plus 8 characters. `[Copy Link]` in the same box copies the URL with `src=copy`, and a sonner toast confirms it. Each action adds one to `Shares Sent`.
4. Visiting a card page with the dock set to "Remote (Denver 80202)" shows the remote banner; submitting an email renders the `#14 of 50` / `28%` waitlist state. A second signup in the same zip renders `#15`.
5. In the dock, after a local `VERDICT_ALERT` signup, **[⚡ Simulate Verdict]** becomes enabled and opens the mock SMS/email modal.
6. **Timezone:** On the deployed Netlify site, "Add to Calendar" for the Vallco card creates an event at **6:30 PM Pacific**, and the downloaded `.ics` imports at the same time.
7. **Calendar links:** The Google Calendar link's `dates` value is in compact form (`YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ`) with a 2-hour span.
8. **Persistence:** On the deployed site with Supabase configured, a share or lead made from a second device increments the counters in the dock on the first device within ~3 seconds. With `ALLOW_DEMO_RESET` unset, `POST /api/reset` returns `200` and all counters go to 0.
9. **Geo:** On the deployed site with no cookie override, the dock/banner reflects the visitor's real location, or the Denver default if `x-nf-geo` doesn't reach server code (verify and note which).
10. **OG unfurl:** Pasting a deployed `/c/[slug]` URL into iMessage or WhatsApp shows the 1200x630 card with **Playfair Display** headline text (not a sans-serif fallback).
11. **API validation:** Malformed bodies to `/api/subscribe`, `/api/share`, and `/api/view` return `400`; a duplicate signup returns `200` with `alreadySubscribed: true`.
12. **Routes:** `/` redirects to `/95014`; `/unlock/80202` renders; `/80202` (and any other zip that isn't `95014`/`95015`) redirects to `/unlock/80202`; `/unlock/95014` redirects to `/95014`; an unknown `/c/[slug]` returns 404; `/api/og?slug=unknown` returns a generic image.
13. **Editorial gate (public routes):** `/95014` renders the Vallco, Apple Park Horse Commute (`crd_02`), and Budget Session cards and **not** either staged draft. `/c/cupertino-code-poultry-peace-ordinance-unverified` and `/c/cupertino-code-rooster-noise-rule` return 404, and `/api/og?slug=` for either returns the generic image.
14. **Editorial Staging (dock):** With the dock on, the `[🛡️ Editorial Staging · 2 withheld]` pill opens the split modal. The left panel defaults to the poultry draft (`crd_qa_01`): unsupported excerpts highlighted, crimson `FLAGGED: HALLUCINATION` chip, the "Embellishment Detected" editor's decision, and five verification notes with PASS / FAIL / UNVERIFIED chips. The `Not forward-worthy` chip switches to the rooster draft (`crd_qa_02`): `REJECTED: NOT FORWARD-WORTHY` chip, the "Accurate, but not forward-worthy" editor's decision, and three notes (two PASS, one FAIL). Both show `Drafted by: Absurdity Agent`. The right panel shows the published horse card (`crd_02`) with a `PUBLISHED` chip. `Esc` closes it.
15. **Loop 2 uses the published whimsy card:** A remote visitor landing on `/c/apple-park-horse-commute-ordinance` sees the geo-targeted waitlist banner and the `#14 of 50` payoff, and its OG image renders the horse card headline.
16. **Import boundary:** No component other than `EditorialStagingModal` and `DemoControlDock` imports `MOCK_STAGED_CARDS`, and no `"use client"` file imports `lib/store`, `lib/waitlist`, or `lib/location` (the `server-only` import fails the build if one does).
17. **Dock persistence:** Open `/95014?demo=1`, then click a card title. The dock is still visible on `/c/[slug]`, whose URL has no `?demo=1`, and there is no hydration warning. `Ctrl + Shift + D` hides it, and it stays hidden after a reload.
18. **Referral bump is visible:** Browser A joins the `80202` waitlist (`#14`) and copies its `shareUrl`. Two other browsers open that link and sign up. Browser A reloads `/unlock/80202` and sees `#9`, with no form.
19. **Identity on the unlock page:** In a fresh browser (no cookies), open `/unlock/80202` directly and sign up. The `shareUrl` on the payoff screen ends in `&ref=usr_` plus 8 characters, never an empty `ref`.
20. **Issue-level referral:** Opening `/95014?src=copy&ref=usr_test1234` adds one row to `view_events` with `referrer_id = 'usr_test1234'` and a NULL `card_slug`.
21. **Progress clamp:** With more than 37 real `MARKET_UNLOCK` signups in one zip (over 50 pledges including the seed), the payoff shows `100%` and the bar does not overflow.
22. **Mobile share:** On a phone, `[Share]` on a card opens the device's share sheet with the card link (`src=native`). Completing the share adds one to `Shares Sent`; dismissing the sheet adds nothing and does not open the email box.
23. **One view per load:** Under `npm run dev`, loading a card page once adds exactly one to `Link Views`, not two.
24. **No self-referral:** In one browser, join the `80202` waitlist, open your own `shareUrl`, then sign up twice more from a card page with two other email addresses. Your position does not get the 5-spot bump, and no row in `subscribers` has `referrer_id` equal to its own `user_ref_id`.
25. **Persistence chip:** With the Supabase env vars unset, the dock on `localhost` shows no warning chip. On a deployed URL without them, the chip *"Persistence not configured. Counts are unreliable."* appears.
