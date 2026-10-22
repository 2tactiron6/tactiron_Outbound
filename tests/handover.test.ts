import { describe, it, expect } from 'vitest';
import { HandoverService } from '../src/modules/handover/service.js';
import { MockOdooAdapter } from '../src/integrations/odoo/adapter.js';
import { Company, Contact, MessageEvent, QualificationResult, ComplianceDecision, ReplyClassification, ReplyType } from '../src/core/types/index.js';

describe('HandoverService - Pack Assembly & CRM Handover', () => {
  const odooAdapter = new MockOdooAdapter();
  const service = new HandoverService(odooAdapter);

  const mockCompany: Company = {
    id: 'comp-101',
    name: 'Atlas Logistics Dubai',
    domain: 'atlaslogistics.ae',
    country: 'AE',
    region: 'GCC',
    segmentFit: true,
    teamSize: 60,
    accountStatus: 'ACTIVE_OUTREACH',
    provenance: { source: 'Apollo', importedAt: new Date().toISOString() },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockContact: Contact = {
    id: 'cont-202',
    companyId: 'comp-101',
    email: 'tariq@atlaslogistics.ae',
    firstName: 'Tariq',
    lastName: 'Al-Mansoor',
    jobTitle: 'Head of Fleet Operations',
    roleIsTarget: true,
    country: 'AE',
    verificationStatus: 'VALID',
    status: 'IN_CAMPAIGN',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockConversation: MessageEvent[] = [
    {
      id: 'm1',
      conversationId: 'c1',
      direction: 'OUTBOUND',
      channel: 'EMAIL',
      from: 'sales@tactiron.com',
      to: 'tariq@atlaslogistics.ae',
      subject: 'Fleet PTT Solution',
      body: 'Hi Tariq, how are you coordinating field operations?',
      receivedAt: new Date(Date.now() - 7200000)
    },
    {
      id: 'm2',
      conversationId: 'c1',
      direction: 'INBOUND',
      channel: 'EMAIL',
      from: 'tariq@atlaslogistics.ae',
      to: 'sales@tactiron.com',
      body: 'We are expanding to 60 vehicles and need a demo of your push-to-talk cellular devices.',
      receivedAt: new Date()
    }
  ];

  const mockQualification: QualificationResult = {
    id: 'q1',
    contactId: 'cont-202',
    companyId: 'comp-101',
    ruleVersion: 'v1.0.0-2026',
    segmentFit: true,
    countryPermitted: true,
    teamSizeFit: true,
    teamSizeValue: 60,
    roleTargetFit: true,
    intentSignal: true,
    outcome: 'WARM_QUALIFIED_HAND_TO_HUMAN',
    rationale: 'All three tests met',
    evaluatedAt: new Date()
  };

  const mockCompliance: ComplianceDecision = {
    allowed: true,
    channel: 'EMAIL',
    country: 'AE',
    reasonCode: 'COMPLIANCE_CHECKS_PASSED',
    lawfulBasis: 'LEGITIMATE_INTEREST',
    suppressionHit: false,
    requiresHumanReview: false,
    evaluatedAt: new Date(),
    policyVersion: 'v1.0.0-2026'
  };

  const mockReplyClassification: ReplyClassification = {
    replyType: ReplyType.DEMO_OR_MEETING_REQUEST,
    intentName: 'DEMO_REQUEST',
    confidence: 0.98,
    extractedFacts: { requestedDemo: true, teamSizeMentioned: 60 },
    guardrailKeywordHit: false,
    matchedKeywords: [],
    recommendedAction: 'Immediate sales follow-up.',
    draftHoldingReply: 'Thank you Tariq, a colleague will contact you today to schedule a demo.',
    isEscalation: true,
    escalationTarget: 'SALES',
    responseTargetHours: 1,
    requiresHumanReview: false,
    reviewStatus: 'AUTO_APPROVED'
  };

  it('assembles the 6 mandatory items for the Handover Pack', () => {
    const pack = service.assemblePack({
      company: mockCompany,
      contact: mockContact,
      conversation: mockConversation,
      qualificationResult: mockQualification,
      complianceDecision: mockCompliance,
      replyClassification: mockReplyClassification
    });

    // 1. Full thread
    expect(pack.fullThread).toHaveLength(2);
    // 2. Company and role details
    expect(pack.companyAndRoleDetails.companyName).toBe('Atlas Logistics Dubai');
    expect(pack.companyAndRoleDetails.jobTitle).toBe('Head of Fleet Operations');
    // 3. Channel permissions & consent record
    expect(pack.channelPermissionsAndConsentRecord.countryPermitted).toBe(true);
    expect(pack.channelPermissionsAndConsentRecord.lawfulBasis).toBe('LEGITIMATE_INTEREST');
    // 4. Qualification score and why
    expect(pack.qualificationScoreAndWhy.outcome).toBe('WARM_QUALIFIED_HAND_TO_HUMAN');
    expect(pack.qualificationScoreAndWhy.rationale).toBe('All three tests met');
    // 5. Suggested next step
    expect(pack.suggestedNextStep).toContain('1 hour');
    // 6. Risk flags
    expect(pack.riskFlags).toBeDefined();
  });

  it('calculates URGENT_1H SLA deadline for demo requests', () => {
    const { priority, slaDeadline } = service.calculatePriorityAndSLA(mockReplyClassification);
    expect(priority).toBe('URGENT_1H');
    const diffHours = (slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(1, 0.1);
  });

  it('executes handover, synchronizes to Odoo, and freezes account sequences', async () => {
    const event = await service.executeHandover({
      company: mockCompany,
      contact: mockContact,
      conversation: mockConversation,
      qualificationResult: mockQualification,
      complianceDecision: mockCompliance,
      replyClassification: mockReplyClassification
    });

    expect(event.status).toBe('SYNCHRONIZED_ODOO');
    expect(event.odooLeadId).toBeGreaterThan(1000);
    // Verified: Account status is frozen across the whole company
    expect(mockCompany.accountStatus).toBe('PAUSED_FOR_HANDOVER');
    expect(mockContact.status).toBe('HANDED_OVER');

    // Verify Odoo adapter has the lead stored
    const odooLead = odooAdapter.getLeadByEmail('tariq@atlaslogistics.ae');
    expect(odooLead).toBeDefined();
    expect(odooLead?.payload.partner_name).toBe('Atlas Logistics Dubai');
    expect(odooLead?.payload.priority).toBe('3'); // Odoo high priority
  });

  it('handles Odoo CRM outages gracefully by marking status as FAILED_RETRYING without losing data', async () => {
    odooAdapter.simulateNetworkFailure = true;

    const event = await service.executeHandover({
      company: mockCompany,
      contact: mockContact,
      conversation: mockConversation,
      qualificationResult: mockQualification,
      complianceDecision: mockCompliance,
      replyClassification: mockReplyClassification
    });

    expect(event.status).toBe('FAILED_RETRYING');
    expect(event.errorLog).toContain('504');
    expect(event.retryCount).toBe(1);
    // Data is safely preserved in event.handoverPack
    expect(event.handoverPack.companyAndRoleDetails.companyName).toBe('Atlas Logistics Dubai');

    odooAdapter.simulateNetworkFailure = false;
  });
});
