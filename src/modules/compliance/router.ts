/**
 * Compliance Router & Policy Enforcement Engine
 * Mandatory control point between prospect qualification and outreach dispatch.
 */

import { Channel, ComplianceDecision, ConsentRecord, SuppressionRecord } from '../../core/types/index.js';
import { COUNTRY_POLICIES, POLICY_VERSION } from '../../config/policy.js';

export interface ComplianceEvaluationRequest {
  contactEmail: string;
  domain: string;
  countryCode: string;
  channel: Channel;
  consentRecords: ConsentRecord[];
  suppressionRecords: SuppressionRecord[];
  isKillSwitchActive: boolean;
  channelSwitchAttempt?: {
    priorChannel: Channel;
    priorReplyReceived: boolean;
  };
}

export class ComplianceRouter {
  public evaluate(request: ComplianceEvaluationRequest): ComplianceDecision {
    const {
      contactEmail,
      domain,
      countryCode,
      channel,
      consentRecords,
      suppressionRecords,
      isKillSwitchActive,
      channelSwitchAttempt
    } = request;

    const evaluatedAt = new Date();
    const normalizedCountry = countryCode.toUpperCase();
    const normalizedEmail = contactEmail.toLowerCase().trim();
    const normalizedDomain = domain.toLowerCase().trim();

    // 1. Emergency Kill Switch Check
    if (isKillSwitchActive) {
      return {
        allowed: false,
        channel,
        country: normalizedCountry,
        reasonCode: 'GLOBAL_KILL_SWITCH_ACTIVE',
        suppressionHit: false,
        requiresHumanReview: true,
        evaluatedAt,
        policyVersion: POLICY_VERSION
      };
    }

    // 2. Central Suppression Check (Contact-level, Domain-level, Channel-level)
    const suppressionHit = suppressionRecords.some(rec => {
      const emailMatch = rec.contactEmail && rec.contactEmail.toLowerCase().trim() === normalizedEmail;
      const domainMatch = rec.domain && rec.domain.toLowerCase().trim() === normalizedDomain;
      const channelMatch = !rec.channel || rec.channel === channel;
      return (emailMatch || domainMatch) && channelMatch;
    });

    if (suppressionHit) {
      return {
        allowed: false,
        channel,
        country: normalizedCountry,
        reasonCode: 'SUPPRESSION_LIST_MATCH',
        suppressionHit: true,
        requiresHumanReview: false,
        evaluatedAt,
        policyVersion: POLICY_VERSION
      };
    }

    // 3. Channel Hopping Guard: Cross-channel consent cannot be inferred
    if (channelSwitchAttempt && channel === 'WHATSAPP') {
      const explicitWhatsAppConsent = consentRecords.some(
        c => c.channel === 'WHATSAPP' && (c.lawfulBasis === 'CONSENT' || c.lawfulBasis === 'CONTRACT')
      );

      if (!explicitWhatsAppConsent) {
        return {
          allowed: false,
          channel,
          country: normalizedCountry,
          reasonCode: 'UNAUTHORIZED_CROSS_CHANNEL_HOP_NO_WHATSAPP_CONSENT',
          suppressionHit: false,
          requiresHumanReview: true,
          evaluatedAt,
          policyVersion: POLICY_VERSION
        };
      }
    }

    // 4. Country Policy & Permitted Channels Matrix
    const policy = COUNTRY_POLICIES[normalizedCountry];
    if (!policy) {
      // Unknown or unapproved country -> fail closed, require human review
      return {
        allowed: false,
        channel,
        country: normalizedCountry,
        reasonCode: 'COUNTRY_NOT_CONFIGURED_FOR_OUTREACH',
        suppressionHit: false,
        requiresHumanReview: true,
        evaluatedAt,
        policyVersion: POLICY_VERSION
      };
    }

    if (!policy.permittedChannels.includes(channel)) {
      return {
        allowed: false,
        channel,
        country: normalizedCountry,
        reasonCode: `CHANNEL_${channel}_NOT_PERMITTED_IN_${normalizedCountry}`,
        suppressionHit: false,
        requiresHumanReview: false,
        evaluatedAt,
        policyVersion: POLICY_VERSION
      };
    }

    // 5. Prior Opt-In Jurisdictions (e.g. Germany cold email)
    if (policy.requiresPriorOptIn && channel === 'EMAIL') {
      const validOptIn = consentRecords.some(
        c => c.channel === 'EMAIL' && c.lawfulBasis === 'CONSENT'
      );

      if (!validOptIn) {
        return {
          allowed: false,
          channel,
          country: normalizedCountry,
          reasonCode: 'JURISDICTION_REQUIRES_PRIOR_OPT_IN_CONSENT',
          suppressionHit: false,
          requiresHumanReview: true,
          evaluatedAt,
          policyVersion: POLICY_VERSION
        };
      }
    }

    // 6. Valid B2B Lawful Basis (e.g. Legitimate Interest)
    const activeConsent = consentRecords.find(c => c.channel === channel);
    const lawfulBasis = activeConsent?.lawfulBasis || 'LEGITIMATE_INTEREST';

    return {
      allowed: true,
      channel,
      country: normalizedCountry,
      reasonCode: 'COMPLIANCE_CHECKS_PASSED',
      lawfulBasis,
      suppressionHit: false,
      requiresHumanReview: false,
      evaluatedAt,
      policyVersion: POLICY_VERSION
    };
  }
}
