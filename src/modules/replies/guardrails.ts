/**
 * Reply Guardrails Engine
 * Enforces deterministic keyword triggers and hard boundaries from Sheet 'AI guardrails'
 */

import { ESCALATION_KEYWORDS, APPROVED_HOLDING_REPLY, SLA_TARGETS } from '../../config/policy.js';
import { ReplyType, ReplyClassification } from '../../core/types/index.js';

export interface GuardrailCheckResult {
  triggered: boolean;
  matchedKeywords: string[];
  forcedClassification?: ReplyClassification;
}

export class ReplyGuardrailsEngine {
  /**
   * Scans text for the 7 mandatory escalation keywords:
   * 'price', 'quote', 'contract', 'legal', 'gdpr', 'complaint', 'lawyer'
   */
  public scanKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    const hits: string[] = [];

    for (const keyword of ESCALATION_KEYWORDS) {
      if (lower.includes(keyword)) {
        hits.push(keyword);
      }
    }
    return hits;
  }

  /**
   * Checks explicit deterministic opt-out phrases
   */
  public isExplicitOptOut(text: string): boolean {
    const lower = text.toLowerCase();
    const optOutPhrases = [
      'unsubscribe',
      'remove me',
      'stop',
      'opt out',
      'opt-out',
      'please do not email',
      'do not contact',
      'take me off your list',
      'not interested'
    ];
    return optOutPhrases.some(phrase => lower.includes(phrase));
  }

  /**
   * Checks out-of-office phrases
   */
  public isOutOfOffice(text: string): boolean {
    const lower = text.toLowerCase();
    const oooPhrases = [
      'out of the office',
      'out of office',
      'on annual leave',
      'on vacation',
      'away from my email',
      'autoreply'
    ];
    return oooPhrases.some(phrase => lower.includes(phrase));
  }

  /**
   * Evaluates text through deterministic guardrails.
   * If an explicit opt-out or keyword trigger is hit, returns a deterministic classification
   * that bypasses or overrides LLM discretion.
   */
  public evaluate(text: string, isMonth1ReviewMode: boolean = false): GuardrailCheckResult {
    const lower = text.toLowerCase();

    // 1. Explicit Opt-out (Type 1: Unsubscribe)
    if (this.isExplicitOptOut(text)) {
      return {
        triggered: true,
        matchedKeywords: ['unsubscribe_or_optout'],
        forcedClassification: {
          replyType: ReplyType.UNSUBSCRIBE,
          intentName: 'UNSUBSCRIBE_OPT_OUT',
          confidence: 1.0,
          extractedFacts: {},
          guardrailKeywordHit: false,
          matchedKeywords: [],
          recommendedAction: 'Suppress contact across all tools immediately.',
          isEscalation: false,
          escalationTarget: 'NONE',
          responseTargetHours: 0,
          requiresHumanReview: false,
          reviewStatus: 'AUTO_APPROVED'
        }
      };
    }

    // 2. Out of Office (Type 2)
    if (this.isOutOfOffice(text)) {
      return {
        triggered: true,
        matchedKeywords: ['out_of_office'],
        forcedClassification: {
          replyType: ReplyType.OUT_OF_OFFICE_OR_REFERRAL,
          intentName: 'OUT_OF_OFFICE',
          confidence: 1.0,
          extractedFacts: {},
          guardrailKeywordHit: false,
          matchedKeywords: [],
          recommendedAction: 'Log event; schedule sequence resume after expected return.',
          isEscalation: false,
          escalationTarget: 'NONE',
          responseTargetHours: 0,
          requiresHumanReview: false,
          reviewStatus: 'AUTO_APPROVED'
        }
      };
    }

    // 3. Keyword Triggers (Sheet 'AI guardrails')
    const matched = this.scanKeywords(text);
    if (matched.length > 0) {
      // Determine if it is legal/GDPR/complaint (Type 7 -> Compliance) or pricing/contract (Type 5 -> Sales)
      const isComplianceIssue = matched.some(k => ['legal', 'gdpr', 'complaint', 'lawyer'].includes(k));
      const replyType = isComplianceIssue
        ? ReplyType.COMPLAINT_OR_LEGAL_THREAT
        : ReplyType.PRICING_OR_COMMERCIAL_TERMS;

      const escalationTarget = isComplianceIssue ? 'COMPLIANCE' : 'SALES';
      const responseTargetHours = isComplianceIssue ? SLA_TARGETS.COMPLIANCE_DAYS * 24 : SLA_TARGETS.HUMAN_HANDOVER_HOURS;

      // In compliance cases, no sales holding reply is sent; route directly.
      const draftHoldingReply = isComplianceIssue ? undefined : APPROVED_HOLDING_REPLY;

      return {
        triggered: true,
        matchedKeywords: matched,
        forcedClassification: {
          replyType,
          intentName: isComplianceIssue ? 'COMPLIANCE_OR_LEGAL_ESCALATION' : 'PRICING_OR_COMMERCIAL_ESCALATION',
          confidence: 1.0,
          extractedFacts: {
            pricingMentioned: matched.includes('price') || matched.includes('quote'),
            keyConcerns: matched
          },
          guardrailKeywordHit: true,
          matchedKeywords: matched,
          recommendedAction: isComplianceIssue
            ? 'Route directly to Compliance owner. Do not send sales reply.'
            : 'Escalate to Sales rep within 4 hours. Send pre-approved holding reply.',
          draftHoldingReply,
          isEscalation: true,
          escalationTarget,
          responseTargetHours,
          requiresHumanReview: isMonth1ReviewMode,
          reviewStatus: isMonth1ReviewMode ? 'PENDING_HUMAN_REVIEW' : 'AUTO_APPROVED'
        }
      };
    }

    return {
      triggered: false,
      matchedKeywords: []
    };
  }
}
