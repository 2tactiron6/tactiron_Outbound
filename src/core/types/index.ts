/**
 * Core Domain Types for Headless Outbound Sales Automation System
 * Push-to-Talk (PTT) Platform - GCC, Africa, Europe
 */

export type Channel = 'EMAIL' | 'LINKEDIN' | 'WHATSAPP';

export type AccountStatus =
  | 'PROSPECT'
  | 'ACTIVE_OUTREACH'
  | 'PAUSED_FOR_HANDOVER'
  | 'QUALIFIED'
  | 'NURTURE'
  | 'DISQUALIFIED'
  | 'SUPPRESSED';

export type ContactStatus =
  | 'NEW'
  | 'ENRICHED'
  | 'ELIGIBLE'
  | 'IN_CAMPAIGN'
  | 'HANDED_OVER'
  | 'SUPPRESSED';

export type EmailVerificationStatus =
  | 'UNVERIFIED'
  | 'VALID'
  | 'RISKY'
  | 'INVALID';

export interface Company {
  id: string;
  name: string;
  domain: string;
  website?: string;
  country: string;
  region?: 'GCC' | 'AFRICA' | 'EUROPE' | 'OTHER';
  industry?: string;
  segmentFit: boolean;
  teamSize?: number;
  accountStatus: AccountStatus;
  provenance: {
    source: string;
    sourceId?: string;
    importedAt: string;
    enrichedAt?: string;
    enrichmentSource?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  companyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  roleIsTarget: boolean;
  phone?: string;
  country: string;
  verificationStatus: EmailVerificationStatus;
  verificationMetadata?: {
    provider: string;
    verifiedAt: string;
    isCatchAll?: boolean;
    isDeliverable: boolean;
  };
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type LawfulBasis =
  | 'LEGITIMATE_INTEREST'
  | 'CONSENT'
  | 'CONTRACT'
  | 'LEGAL_OBLIGATION';

export interface ConsentRecord {
  id: string;
  contactId: string;
  channel: Channel;
  lawfulBasis: LawfulBasis;
  evidenceReference: string;
  recordedAt: Date;
  notes?: string;
}

export type SuppressionReason =
  | 'UNSUBSCRIBE'
  | 'COMPLAINT'
  | 'LEGAL_DEMAND'
  | 'INVALID_EMAIL'
  | 'DO_NOT_CONTACT_DOMAIN'
  | 'MANUAL_SUPPRESSION';

export interface SuppressionRecord {
  id: string;
  contactEmail?: string;
  domain?: string;
  channel?: Channel; // If undefined, applies globally to all channels
  reason: SuppressionReason;
  source: string;
  recordedAt: Date;
}

export type QualificationOutcome =
  | 'WARM_QUALIFIED_HAND_TO_HUMAN'
  | 'NURTURE_FAILS_FIT_OR_ROLE'
  | 'NO_ACTION'
  | 'SUPPRESSED_OR_BLOCKED';

export interface QualificationResult {
  id: string;
  contactId: string;
  companyId: string;
  ruleVersion: string;
  segmentFit: boolean;
  countryPermitted: boolean;
  teamSizeFit: boolean;
  teamSizeValue?: number;
  roleTargetFit: boolean;
  intentSignal: boolean;
  outcome: QualificationOutcome;
  rationale: string;
  evaluatedAt: Date;
}

export interface ComplianceDecision {
  allowed: boolean;
  channel: Channel;
  country: string;
  reasonCode: string;
  lawfulBasis?: LawfulBasis;
  suppressionHit: boolean;
  requiresHumanReview: boolean;
  evaluatedAt: Date;
  policyVersion: string;
}

export interface MessageEvent {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  channel: Channel;
  from: string;
  to: string;
  subject?: string;
  body: string;
  receivedAt: Date;
  externalMessageId?: string;
}

/**
 * 9 Reply Types defined in the Excel Handover Rules sheet
 */
export enum ReplyType {
  UNSUBSCRIBE = 1,                 // 1: Unsubscribe, "remove me" or "stop"
  OUT_OF_OFFICE_OR_REFERRAL = 2,   // 2: Out-of-office, or wrong person with a referral
  SIMPLE_FACTUAL_QUESTION = 3,     // 3: Simple factual question covered by approved material
  DEMO_OR_MEETING_REQUEST = 4,     // 4: Asks for a demo, call or meeting
  PRICING_OR_COMMERCIAL_TERMS = 5, // 5: Price, licence terms, contract, SLA, security, data residency
  PARTNER_INQUIRY = 6,             // 6: Partner questions (margins, exclusivity, territory)
  COMPLAINT_OR_LEGAL_THREAT = 7,   // 7: Complaint, legal threat, data-access or deletion request
  C_LEVEL_OR_MULTI_THREAD = 8,     // 8: C-level or MD reply, second contact from the same account, or a forward
  UNCERTAIN_OR_LOW_CONFIDENCE = 9  // 9: Anything the AI is not confident about
}

export type EscalationTarget = 'SALES' | 'COMPLIANCE' | 'NONE';

export interface ReplyClassification {
  replyType: ReplyType;
  intentName: string;
  confidence: number;
  extractedFacts: {
    requestedDemo?: boolean;
    pricingMentioned?: boolean;
    competitorsMentioned?: string[];
    urgencyTimeline?: string;
    teamSizeMentioned?: number;
    colleagueReferral?: { name?: string; email?: string };
    keyConcerns?: string[];
  };
  guardrailKeywordHit: boolean;
  matchedKeywords: string[];
  recommendedAction: string;
  draftHoldingReply?: string;
  isEscalation: boolean;
  escalationTarget: EscalationTarget;
  responseTargetHours: number; // 1h, 4h, or 24h
  requiresHumanReview: boolean;
  reviewStatus: 'AUTO_APPROVED' | 'PENDING_HUMAN_REVIEW' | 'APPROVED' | 'REJECTED';
}

/**
 * The 6 items required for the Odoo Handover Pack
 */
export interface HandoverPack {
  fullThread: MessageEvent[];
  companyAndRoleDetails: {
    companyName: string;
    domain: string;
    country: string;
    teamSize?: number;
    industry?: string;
    contactName: string;
    contactEmail: string;
    jobTitle?: string;
  };
  channelPermissionsAndConsentRecord: {
    channel: Channel;
    countryPermitted: boolean;
    lawfulBasis: LawfulBasis;
    evidenceReference: string;
    recordedAt: string;
  };
  qualificationScoreAndWhy: {
    outcome: QualificationOutcome;
    rationale: string;
    segmentFit: boolean;
    countryPermitted: boolean;
    teamSizeFit: boolean;
    roleTargetFit: boolean;
    intentSignal: boolean;
  };
  suggestedNextStep: string;
  riskFlags: string[];
}

export type HandoverPriority = 'URGENT_1H' | 'STANDARD_4H' | 'COMPLIANCE_1D';

export interface HandoverEvent {
  id: string;
  contactId: string;
  companyId: string;
  conversationId: string;
  priority: HandoverPriority;
  slaDeadline: Date;
  status: 'PENDING' | 'SYNCHRONIZED_ODOO' | 'FAILED_RETRYING' | 'RESOLVED';
  handoverPack: HandoverPack;
  odooLeadId?: number;
  assignedOwnerEmail?: string;
  retryCount: number;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  entityType: 'LEAD' | 'COMPANY' | 'CONTACT' | 'OUTREACH' | 'REPLY' | 'HANDOVER' | 'SUPPRESSION' | 'KILL_SWITCH';
  entityId: string;
  eventType: string;
  actor: 'SYSTEM' | 'AI_AGENT' | 'HUMAN_OPERATOR' | 'WEBHOOK';
  details: Record<string, unknown>;
  timestamp: Date;
}
