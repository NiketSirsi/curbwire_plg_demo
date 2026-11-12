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
