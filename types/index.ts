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
