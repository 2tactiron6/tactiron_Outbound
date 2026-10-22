import { describe, it, expect } from 'vitest';
import { VerticalSliceOrchestrator } from '../src/vertical-slice.js';

describe('Vertical Slice Orchestrator - End-to-End Business Workflows', () => {
  it('Scenario 1: Warm qualified prospect requests a demo -> Handed over to Odoo with URGENT_1H priority and paused sequences', async () => {
    const orchestrator = new VerticalSliceOrchestrator();

    const result = await orchestrator.run({
      lead: {
        companyName: 'Gulf Heavy Transport Ltd',
        domain: 'gulfheavy.com',
        website: 'https://gulfheavy.com',
        country: 'AE',
        region: 'GCC',
        teamSize: 55,
        segmentFit: true,
        contactEmail: 'operations@gulfheavy.com',
        firstName: 'Zayd',
        lastName: 'Al-Husseini',
        jobTitle: 'VP Fleet Logistics',
        roleIsTarget: true,
        source: 'Apollo',
        emailDeliverability: 'deliverable'
      },
      channel: 'EMAIL',
      simulatedOutboundMessage: 'Hi Zayd, can we assist your fleet dispatch team with instant PTT over cellular?',
      simulatedInboundReply: 'Hi, yes we are looking for a reliable push-to-talk system for 50 drivers. Can you give us a demo tomorrow at 2 PM?'
    });

    // 1. Ingestion verified
    expect(result.ingestion.isNewCompany).toBe(true);
    expect(result.ingestion.isNewContact).toBe(true);

    // 2. Compliance check passed
    expect(result.compliance.allowed).toBe(true);
    expect(result.compliance.reasonCode).toBe('COMPLIANCE_CHECKS_PASSED');

    // 3. Classification verified
    expect(result.replyClassification.replyType).toBe(4); // DEMO_OR_MEETING_REQUEST
    expect(result.replyClassification.extractedFacts.requestedDemo).toBe(true);

    // 4. Qualification outcome: Warm qualified
    expect(result.qualification.outcome).toBe('WARM_QUALIFIED_HAND_TO_HUMAN');
    expect(result.qualification.rationale).toBe('All three tests met');

    // 5. Handover event verified
    expect(result.handoverEvent).toBeDefined();
    expect(result.handoverEvent?.priority).toBe('URGENT_1H');
    expect(result.handoverEvent?.status).toBe('SYNCHRONIZED_ODOO');
    expect(result.handoverEvent?.odooLeadId).toBeDefined();

    // 6. Account sequence paused
    expect(result.accountSequenceStatus).toBe('PAUSED_FOR_HANDOVER');
  });

  it('Scenario 2: Inbound reply triggers pricing keyword guardrail -> Escalated to Sales within 4h with holding reply', async () => {
    const orchestrator = new VerticalSliceOrchestrator();

    const result = await orchestrator.run({
      lead: {
        companyName: 'Nairobi Courier Express',
        domain: 'nairobicourier.co.ke',
        country: 'KE',
        region: 'AFRICA',
        teamSize: 30,
        segmentFit: true,
        contactEmail: 'fleet@nairobicourier.co.ke',
        firstName: 'Kip',
        lastName: 'Otieno',
        jobTitle: 'Dispatch Manager',
        roleIsTarget: true,
        source: 'Regional Data',
        emailDeliverability: 'deliverable'
      },
      channel: 'EMAIL',
      simulatedOutboundMessage: 'Hello Kip, how does your dispatch team handle long-range communications?',
      simulatedInboundReply: 'Could you please send me a quote and pricing table for 30 handsets?'
    });

    // Guardrail triggered
    expect(result.replyClassification.guardrailKeywordHit).toBe(true);
    expect(result.replyClassification.matchedKeywords).toContain('quote');
    expect(result.replyClassification.matchedKeywords).toContain('pricing');
    expect(result.replyClassification.replyType).toBe(5); // PRICING_OR_COMMERCIAL_TERMS
    expect(result.replyClassification.draftHoldingReply).toBeDefined();

    // Handover created for Sales rep
    expect(result.handoverEvent).toBeDefined();
    expect(result.handoverEvent?.priority).toBe('STANDARD_4H');
    expect(result.handoverEvent?.handoverPack.riskFlags.some(f => f.includes('Pricing inquiry'))).toBe(true);
  });

  it('Scenario 3: Prospect replies "Unsubscribe" -> AI suppresses contact immediately, no CRM handover', async () => {
    const orchestrator = new VerticalSliceOrchestrator();

    const result = await orchestrator.run({
      lead: {
        companyName: 'Saudi Mining Supplies',
        domain: 'saudimining.sa',
        country: 'SA',
        region: 'GCC',
        teamSize: 100,
        segmentFit: true,
        contactEmail: 'info@saudimining.sa',
        firstName: 'Fahad',
        roleIsTarget: true,
        source: 'Apollo',
        emailDeliverability: 'deliverable'
      },
      channel: 'EMAIL',
      simulatedOutboundMessage: 'Field communications solution for remote mining teams.',
      simulatedInboundReply: 'Please remove me from your list. Unsubscribe.'
    });

    expect(result.replyClassification.replyType).toBe(1); // UNSUBSCRIBE
    expect(result.accountSequenceStatus).toBe('SUPPRESSED');
    expect(result.handoverEvent).toBeUndefined(); // No human handover needed for opt-outs
  });

  it('Scenario 4: Prohibited outreach in Germany (cold email) is blocked by compliance router before dispatch', async () => {
    const orchestrator = new VerticalSliceOrchestrator();

    const result = await orchestrator.run({
      lead: {
        companyName: 'Bavaria Fleet Gmbh',
        domain: 'bavariafleet.de',
        country: 'DE',
        region: 'EUROPE',
        teamSize: 80,
        segmentFit: true,
        contactEmail: 'leiter@bavariafleet.de',
        firstName: 'Stefan',
        roleIsTarget: true,
        source: 'Manual Import',
        emailDeliverability: 'deliverable'
      },
      channel: 'EMAIL', // Cold email strictly forbidden in DE without double opt-in
      simulatedOutboundMessage: 'Guten Tag, PTT-Lösung für Flotten',
      simulatedInboundReply: 'Should never be dispatched'
    });

    expect(result.compliance.allowed).toBe(false);
    expect(result.compliance.reasonCode).toBe('CHANNEL_EMAIL_NOT_PERMITTED_IN_DE');
    expect(result.handoverEvent).toBeUndefined();
  });
});
