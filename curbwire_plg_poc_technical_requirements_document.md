# Technical Requirements Document (TRD): Curbwire PLG Engine Proof-of-Concept

## 1. Project Overview & Scope

This specification details a standalone, hackathon-grade Proof-of-Concept (POC) designed to demonstrate Product-Led Growth (PLG) mechanics for Curbwire, an ambient civic intelligence platform. 

The POC demonstrates how unbundling monolithic bi-weekly zip-code newsletters into discrete, interactive, and shareable micro-cards unlocks two self-sustaining acquisition loops:
1. **Loop 1 (Intra-Community Density):** Single-issue **Decision Cards** (Civic Coordination) with calendar hooks, SMS/WhatsApp sharing, and outcome tracking ("Notify me when the council votes").
2. **Loop 2 (Inter-Community Expansion):** Cross-boundary organic sharing via **Bureaucratic Whimsy** (Absurd Historic Ordinances & Quirky Bylaws) paired with dynamic OpenGraph previews and geo-adaptive landing pages.

```
+─────────────────────────────────────────────────────────────────────────────────────────+
|                                    POC USER JOURNEY                                     |
+─────────────────────────────────────────────────────────────────────────────────────────+
  1. Newsletter Reader View (Cupertino 95014)
     ├── Card A: Planning Commission Decision Card (Vallco Pkwy)
     └── Card B: Absurd Historic Statute (Section § 14-8 Poultry Bylaw)
            │
            ├── User clicks "Text to Neighbor" or "WhatsApp"
            │
            ▼
  2. Standalone Card Landing Page (`/c/[slug]`)
     ├── Rich Link Preview (Dynamic OG with serif/mono layout)
     └── Geo-Adaptive Conversion Banner:
         ├── If Local (95014): "Get notified when Cupertino votes on this on Tuesday"
         └── If Remote (e.g., 80202): "See weird statutes in your town. Enter your zip."
            │
            ▼
  3. Interactive Demo Control Dock (Founder Sandbox)
     └── Floating toolbar to switch user location, trigger shares, and watch analytics
```

---

## 2. Technology Stack & Environment

* **Framework:** Next.js 14+ (App Router, TypeScript).
* **Styling:** Tailwind CSS configured with exact Curbwire design tokens.
* **Component Primitives / Icons:** `lucide-react` (clean, non-intrusive icons).
* **Dynamic OpenGraph Images:** Next.js Edge Runtime `@vercel/og` (`ImageResponse`).
* **State / Storage:** 
  * In-memory / localStorage fallback for client-side demo state (shares, captures).
  * Supabase (PostgreSQL) optional schema for persistence; mock JSON seed bundled for zero-dependency offline runs.
* **Deployment Target:** Netlify (via `@netlify/plugin-nextjs`).

---

## 3. Design System & Brand Specification

The user interface must strictly preserve Curbwire's calm, publication-grade editorial identity. Avoid SaaS-generic styles, overly vibrant neon buttons, or aggressive gradients.

### 3.1 Color Palette

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `background` | `#f7f1e1` | Primary page & container background (warm parchment) |
| `text-primary` | `#191713` | Headlines, titles, and high-contrast body text |
| `accent-rust` | `#a83a25` | Primary action links, active buttons, category highlights |
| `text-muted` | `#5a5347` | Metadata, dates, timestamps, attribution subtitles |
| `text-subtle` | `#6B6B66` | Copyright, legal fine print, dividers |
| `border-rule` | `#d8cfb8` | Subtle horizontal dividers and grid lines |
| `border-dark` | `#191713` | Strong typographic rules and borders |
| `badge-tint` | `#f3ddd4` | Share strip container background and quote highlights |
| `badge-green`| `#3d6b4f` | Civic coordination / official municipal indicator accent |

### 3.2 Typography & Fonts

* **Serif Display (Headlines):** `'Playfair Display', Georgia, 'Times New Roman', serif`
  * Applied to: Masthead (`h1`), Story Headlines (`h2`), Section Headers (`h3`).
* **Serif Body (Narrative Copy):** `'Spectral', Georgia, 'Times New Roman', serif`
  * Applied to: Article summaries, contextual paragraphs, pull-quotes.
* **Monospace (Utility & Metadata):** `'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace`
  * Applied to: Timestamps, category tags, action buttons, share links, weather widgets.

---

## 4. Data Models & Database Schema

```sql
-- Category & Action Enums
CREATE TYPE card_category AS ENUM ('COORDINATION', 'ABSURDITY', 'LOCAL_NEWS', 'EVENT');
CREATE TYPE action_type AS ENUM ('CALENDAR', 'VERDICT_TRACK', 'EXTERNAL_LINK');

-- Core Atomic Cards
CREATE TABLE cards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    slug TEXT UNIQUE NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    category card_category NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    detail_context TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    action_type action_type DEFAULT 'EXTERNAL_LINK',
    action_meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral & Share Analytics
CREATE TABLE share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id TEXT REFERENCES cards(id),
    channel VARCHAR(20) NOT NULL, -- 'SMS', 'WHATSAPP', 'COPY_LINK', 'EMAIL'
    referrer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captured Leads
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    source_card_slug TEXT REFERENCES cards(slug),
    intent_type VARCHAR(30) NOT NULL, -- 'VERDICT_ALERT', 'GENERAL_BRIEF', 'NEW_MARKET_PLEDGE'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Data Interfaces (`types/card.ts`)

```typescript
export type CardCategory = 'COORDINATION' | 'ABSURDITY' | 'LOCAL_NEWS' | 'EVENT';
export type ActionType = 'CALENDAR' | 'VERDICT_TRACK' | 'EXTERNAL_LINK';

export interface Card {
  id: string;
  slug: string;
  zip_code: string;
  category: CardCategory;
  headline: string;
  summary: string;
  detail_context?: string;
  source_name: string;
  source_url: string;
  action_type: ActionType;
  action_meta?: {
    meeting_date?: string;
    event_title?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    code_section?: string;
    [key: string]: any;
  };
}
```

---

## 5. Mock Data & Seed Specification

Create `lib/mock-data.ts` to power the standalone demo with authentic Cupertino (`95014`) civic content:

```typescript
import { Card } from '@/types/card';

export const MOCK_CARDS: Card[] = [
  {
    id: "crd_01",
    slug: "vallco-pkwy-commercial-variance",
    zip_code: "95014",
    category: "COORDINATION",
    headline: "Planning Commission Reviews 50-Seat Outdoor Dining Variance at 19900 Vallco Pkwy",
    summary: "The Cupertino Planning Commission will hear public testimony regarding outdoor noise mitigation, property setback allowances, and parking space reallocations for the new dining site.",
    detail_context: "What changed: Applicants submitted a revised soundproofing plan. Public comment and vote scheduled for Thursday at 6:30 PM in Community Hall.",
    source_name: "Cupertino Planning Commission",
    source_url: "https://www.cupertino.gov/agenda",
    action_type: "VERDICT_TRACK",
    action_meta: {
      meeting_date: "Thu, Nov 12 · 6:30 PM",
      event_title: "Cupertino Planning Commission: Vallco Pkwy Hearing"
    }
  },
  {
    id: "crd_02",
    slug: "cupertino-bylaw-backyard-poultry-curfew",
    zip_code: "95014",
    category: "ABSURDITY",
    headline: "Cupertino Municipal Code § 14-8: Poultry Prohibited Within 50 Feet of Any Public School",
    summary: "A remaining 1960s agricultural statute makes it an administrative infraction to permit domestic ducks, turkeys, or geese to wander across sidewalks or within school perimeters during session hours.",
    detail_context: "Historical note: Enacted when Monta Vista was primarily fruit orchards and small poultry farms. The code remains active and unrepealed.",
    source_name: "Municode: Cupertino Municipal Code",
    source_url: "https://library.municode.com/ca/cupertino",
    action_type: "EXTERNAL_LINK",
    action_meta: {
      code_section: "§ 14-8.020"
    }
  },
  {
    id: "crd_03",
    slug: "veterans-day-guardians-ceremony",
    zip_code: "95014",
    category: "EVENT",
    headline: "Cupertino Veterans Day Ceremony at Memorial Park",
    summary: "Annual civic assembly at the Guardians memorial featuring local veteran honors, civic leaders, live musical performance, and Taps.",
    detail_context: "Open to the public. Wednesday 11:00 AM at Memorial Park.",
    source_name: "City of Cupertino Parks & Rec",
    source_url: "https://www.cupertino.gov/events",
    action_type: "CALENDAR",
    action_meta: {
      start_time: "20261111T110000",
      end_time: "20261111T130000",
      location: "Memorial Park, Cupertino, CA"
    }
  }
];
```

---

## 6. Page Specifications, Routes & Component Architecture

### Route 1: The Newsletter Issue View (`app/[zip]/page.tsx`)
* **Endpoint:** `/[zip]` (Default: `/95014`)
* **Header Structure:** Replicates Curbwire’s publication postmark:
  * Masthead: `Hi, 95014.` with red punctuation dot (`#a83a25`).
  * Sub-bar: `Curbwire Nº6 · Tue, Nov 10` with right-aligned `Read Online` link.
  * ASCII-style high/low weather forecast bar.
  * Top share banner: *"Like Curbwire? Send To A Friend →"*.
* **Modular Card List:** Renders cards sequentially:
  * Category badge: Forest Green for `COORDINATION`, Rust for `ABSURDITY`.
  * Clickable serif title (`text-2xl font-bold font-serif hover:underline`).
  * Body copy with bolded lead-ins (`What changed:`, `Historical note:`).
  * **Share Action Strip (Client Component):**
    * `[Text to Neighbor]` $\to$ `sms:?&body=Check%20out%20this%20update%20for%20Cupertino:%20https://[domain]/c/[slug]`
    * `[WhatsApp]` $\to$ `https://api.whatsapp.com/send?text=...`
    * `[Copy Link]` $\to$ copies clean URL to clipboard with confirmation toast.

### Route 2: Standalone Card Landing Page (`app/c/[slug]/page.tsx`)
* **Endpoint:** `/c/[slug]`
* **Metadata & Unfurling:** Populates canonical HTML `<head>` tags:
  * `og:title`: Card headline.
  * `og:description`: Card summary.
  * `og:image`: Points directly to dynamic route `/api/og?slug=[slug]`.
* **Card Display:** Shows the isolated card in full focus with source attribution.
* **Geo-Adaptive Conversion Banner (`components/GeoConversionBanner.tsx`):**
  * Reads simulated or detected user location (via context/cookie).
  * **Case A: Local User (`zip == card.zipCode`):**
    * Header: *"Live in Cupertino? Get the 2-minute calm civic briefing."*
    * If `action_type === 'VERDICT_TRACK'`:
      * Interactive checkbox: *"Notify me when the Planning Commission issues a decision on this parcel."*
    * Input: Email address field + Rust submit button `[Get Cupertino Brief]`.
  * **Case B: Remote User (`zip != card.zipCode`):**
    * Header: *"This is a verified civic item from Cupertino, CA."*
    * Subheader: *"Want calm, non-toxic civic intelligence and weird local codes for your neighborhood?"*
    * Input: Dual fields `[Your Zip Code]` and `[Your Email]` + submit button `[Check My Neighborhood]`.

### Route 3: Dynamic Edge OpenGraph Generator (`app/api/og/route.tsx`)
* **Runtime:** Edge Runtime (`export const runtime = 'edge'`).
* **Library:** `@vercel/og` (`ImageResponse`).
* **Visual Output (1200x630 PNG):**
  * Solid background: `#f7f1e1`.
  * Outer border: 2px solid `#a83a25`.
  * Top bar: Category badge (e.g., `CIVIC COORDINATION · CUPERTINO 95014`).
  * Center: Card headline in Serif font.
  * Bottom bar: *"Curbwire Ambient Civic Intelligence · curbwire.com"*.

### Route 4: Founder Sandbox Dock (`components/DemoControlDock.tsx`)
A persistent floating toolbar docked at the bottom-right of the screen during stakeholder demonstrations:
* **Location Simulator:**
  * Toggle button: `Cupertino (95014 - Local)` vs `Denver (80202 - Remote)`.
  * Instantly updates the context so the founder can see the conversion banner adapt in real-time.
* **Telemetry Counters:**
  * Displays live tallies of `Shares Generated`, `Card Link Views`, and `Leads Captured`.
* **State Reset:** One-click reset button to clear local storage back to defaults.