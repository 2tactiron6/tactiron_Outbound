/**
 * Deterministic Lead Qualification Engine
 * Implements the exact rules and formulas from Sheet 'Lead qualification' of AI - to human Handover_Rules.xlsx
 *
 * Rules:
 * 1. Warm qualified - hand to human:
 *    SegmentFit = "Yes" AND CountryPermitted = "Yes" AND TeamSize >= MinTeamSize AND RoleTarget = "Yes" AND IntentSignal = "Yes"
 *    Reason: "All three tests met" (Fit, Role, Intent)
 * 2. Country not permitted / Prohibited:
 *    Hard stop: Must NEVER route to nurture if country is not permitted or contact is suppressed.
 *    Outcome: SUPPRESSED_OR_BLOCKED, Reason: "Country not permitted."
 * 3. Nurture - fails fit or role:
 *    IntentSignal = "Yes" AND CountryPermitted = "Yes", but fails SegmentFit, TeamSize, or RoleTarget.
 *    Reason: Combined failure reasons ("Segment not a fit. ", "Team below minimum. ", "Role not a target. ")
 * 4. No action:
 *    IntentSignal = "No" / false.
 *    Reason: "No intent signal yet"
 */

import { QualificationOutcome, QualificationResult } from '../../core/types/index.js';
import { POLICY_VERSION } from '../../config/policy.js';

export interface QualificationInput {
  leadId: string;
  companyId: string;
  contactId: string;
  companyName: string;
  country: string;
  segmentFit: boolean;
  countryPermitted: boolean;
  teamSize?: number;
  minTeamSize?: number; // Configurable threshold; defaults to 20
  roleIsTarget: boolean;
  intentSignal: boolean;
  isSuppressed?: boolean;
}

export class QualificationEngine {
  private defaultMinTeamSize: number;

  constructor(defaultMinTeamSize: number = 20) {
    this.defaultMinTeamSize = defaultMinTeamSize;
  }

  public evaluate(input: QualificationInput): QualificationResult {
    const minTeamSize = input.minTeamSize ?? this.defaultMinTeamSize;
    const teamSizeVal = input.teamSize ?? 0;
    const teamSizeFit = teamSizeVal >= minTeamSize;

    // Suppression / Hard-stop check takes absolute precedence
    if (input.isSuppressed || !input.countryPermitted) {
      const rationale = input.isSuppressed
        ? 'Contact or domain is suppressed.'
        : 'Country not permitted.';

      return {
        id: crypto.randomUUID(),
        contactId: input.contactId,
        companyId: input.companyId,
        ruleVersion: POLICY_VERSION,
        segmentFit: input.segmentFit,
        countryPermitted: input.countryPermitted,
        teamSizeFit,
        teamSizeValue: input.teamSize,
        roleTargetFit: input.roleIsTarget,
        intentSignal: input.intentSignal,
        outcome: 'SUPPRESSED_OR_BLOCKED',
        rationale,
        evaluatedAt: new Date()
      };
    }

    // All three tests met: Fit (segment, country, size), Role, Intent
    const fitPass = input.segmentFit && input.countryPermitted && teamSizeFit;
    const rolePass = input.roleIsTarget;
    const intentPass = input.intentSignal;

    if (fitPass && rolePass && intentPass) {
      return {
        id: crypto.randomUUID(),
        contactId: input.contactId,
        companyId: input.companyId,
        ruleVersion: POLICY_VERSION,
        segmentFit: input.segmentFit,
        countryPermitted: input.countryPermitted,
        teamSizeFit,
        teamSizeValue: input.teamSize,
        roleTargetFit: input.roleIsTarget,
        intentSignal: input.intentSignal,
        outcome: 'WARM_QUALIFIED_HAND_TO_HUMAN',
        rationale: 'All three tests met',
        evaluatedAt: new Date()
      };
    }

    // Intent is present, but fails fit or role -> Nurture
    if (intentPass) {
      const reasons: string[] = [];
      if (!input.segmentFit) reasons.push('Segment not a fit.');
      if (!teamSizeFit) reasons.push('Team below minimum.');
      if (!rolePass) reasons.push('Role not a target.');

      return {
        id: crypto.randomUUID(),
        contactId: input.contactId,
        companyId: input.companyId,
        ruleVersion: POLICY_VERSION,
        segmentFit: input.segmentFit,
        countryPermitted: input.countryPermitted,
        teamSizeFit,
        teamSizeValue: input.teamSize,
        roleTargetFit: input.roleIsTarget,
        intentSignal: input.intentSignal,
        outcome: 'NURTURE_FAILS_FIT_OR_ROLE',
        rationale: reasons.join(' ').trim(),
        evaluatedAt: new Date()
      };
    }

    // No intent signal yet
    return {
      id: crypto.randomUUID(),
      contactId: input.contactId,
      companyId: input.companyId,
      ruleVersion: POLICY_VERSION,
      segmentFit: input.segmentFit,
      countryPermitted: input.countryPermitted,
      teamSizeFit,
      teamSizeValue: input.teamSize,
      roleTargetFit: input.roleIsTarget,
      intentSignal: false,
      outcome: 'NO_ACTION',
      rationale: 'No intent signal yet',
      evaluatedAt: new Date()
    };
  }
}
