import { describe, it, expect } from 'vitest';
import { ComplianceRouter } from '../src/modules/compliance/router.js';
import { ConsentRecord, SuppressionRecord } from '../src/core/types/index.js';

describe('ComplianceRouter - Policy Enforcement & Kill Switch', () => {
  const router = new ComplianceRouter();

  it('blocks dispatch when emergency kill switch is active', () => {
    const result = router.evaluate({
      contactEmail: 'pilot@emirateslogistics.ae',
      domain: 'emirateslogistics.ae',
      countryCode: 'AE',
      channel: 'EMAIL',
      consentRecords: [],
      suppressionRecords: [],
      isKillSwitchActive: true
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('GLOBAL_KILL_SWITCH_ACTIVE');
    expect(result.requiresHumanReview).toBe(true);
  });

  it('blocks dispatch when email matches central suppression list', () => {
    const suppressionRecords: SuppressionRecord[] = [
      {
        id: 'supp-1',
        contactEmail: 'optout@example.com',
        reason: 'UNSUBSCRIBE',
        source: 'INBOUND_REPLY',
        recordedAt: new Date()
      }
    ];

    const result = router.evaluate({
      contactEmail: 'optout@example.com',
      domain: 'example.com',
      countryCode: 'AE',
      channel: 'EMAIL',
      consentRecords: [],
      suppressionRecords,
      isKillSwitchActive: false
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SUPPRESSION_LIST_MATCH');
    expect(result.suppressionHit).toBe(true);
  });

  it('blocks dispatch when domain matches company-wide suppression', () => {
    const suppressionRecords: SuppressionRecord[] = [
      {
        id: 'supp-2',
        domain: 'competitor.com',
        reason: 'DO_NOT_CONTACT_DOMAIN',
        source: 'MANUAL',
        recordedAt: new Date()
      }
    ];

    const result = router.evaluate({
      contactEmail: 'ceo@competitor.com',
      domain: 'competitor.com',
      countryCode: 'AE',
      channel: 'EMAIL',
      consentRecords: [],
      suppressionRecords,
      isKillSwitchActive: false
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SUPPRESSION_LIST_MATCH');
    expect(result.suppressionHit).toBe(true);
  });

  it('permits B2B cold email in approved countries (UAE, UK, Kenya)', () => {
    const countries = ['AE', 'GB', 'KE', 'SA'];
    for (const code of countries) {
      const result = router.evaluate({
        contactEmail: `lead@test-${code}.com`,
        domain: `test-${code}.com`,
        countryCode: code,
        channel: 'EMAIL',
        consentRecords: [],
        suppressionRecords: [],
        isKillSwitchActive: false
      });

      expect(result.allowed).toBe(true);
      expect(result.reasonCode).toBe('COMPLIANCE_CHECKS_PASSED');
    }
  });

  it('blocks cold email in Germany (DE) due to strict opt-in rule, but allows LinkedIn', () => {
    // Attempting cold email without opt-in in Germany
    const emailResult = router.evaluate({
      contactEmail: 'hans@logistik-berlin.de',
      domain: 'logistik-berlin.de',
      countryCode: 'DE',
      channel: 'EMAIL',
      consentRecords: [],
      suppressionRecords: [],
      isKillSwitchActive: false
    });

    expect(emailResult.allowed).toBe(false);
    expect(emailResult.reasonCode).toBe('CHANNEL_EMAIL_NOT_PERMITTED_IN_DE');

    // Attempting manual LinkedIn in Germany
    const linkedInResult = router.evaluate({
      contactEmail: 'hans@logistik-berlin.de',
      domain: 'logistik-berlin.de',
      countryCode: 'DE',
      channel: 'LINKEDIN',
      consentRecords: [],
      suppressionRecords: [],
      isKillSwitchActive: false
    });

    expect(linkedInResult.allowed).toBe(true);
    expect(linkedInResult.reasonCode).toBe('COMPLIANCE_CHECKS_PASSED');
  });

  it('prevents unauthorized channel hopping: Email reply does not authorize WhatsApp', () => {
    const result = router.evaluate({
      contactEmail: 'contact@dubai-fleet.ae',
      domain: 'dubai-fleet.ae',
      countryCode: 'AE',
      channel: 'WHATSAPP',
      consentRecords: [], // No explicit WhatsApp consent
      suppressionRecords: [],
      isKillSwitchActive: false,
      channelSwitchAttempt: {
        priorChannel: 'EMAIL',
        priorReplyReceived: true
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('UNAUTHORIZED_CROSS_CHANNEL_HOP_NO_WHATSAPP_CONSENT');
    expect(result.requiresHumanReview).toBe(true);
  });
});
