import { describe, it, expect } from 'vitest';
import { ReplyGuardrailsEngine } from '../src/modules/replies/guardrails.js';
import { ReplyClassifier } from '../src/modules/replies/classifier.js';
import { MockLLMAdapter } from '../src/integrations/llm/adapter.js';
import { ReplyType } from '../src/core/types/index.js';

describe('ReplyGuardrailsEngine - Deterministic Triggers', () => {
  const guardrails = new ReplyGuardrailsEngine();

  it('scans and detects all 7 mandatory escalation keywords', () => {
    expect(guardrails.scanKeywords('Can you send me your price list?')).toContain('price');
    expect(guardrails.scanKeywords('Please provide a quote for 100 units')).toContain('quote');
    expect(guardrails.scanKeywords('Send over the contract draft')).toContain('contract');
    expect(guardrails.scanKeywords('Our legal team needs to review this')).toContain('legal');
    expect(guardrails.scanKeywords('Is your platform GDPR compliant?')).toContain('gdpr');
    expect(guardrails.scanKeywords('I have a complaint regarding unsolicited emails')).toContain('complaint');
    expect(guardrails.scanKeywords('My lawyer will be contacting you')).toContain('lawyer');
  });

  it('evaluates explicit opt-outs to Type 1 (UNSUBSCRIBE) with automatic suppression', () => {
    const optOutMessages = [
      'Please unsubscribe me',
      'Remove me from your mailing list',
      'STOP',
      'Not interested, please do not contact me again'
    ];

    for (const msg of optOutMessages) {
      const result = guardrails.evaluate(msg);
      expect(result.triggered).toBe(true);
      expect(result.forcedClassification?.replyType).toBe(ReplyType.UNSUBSCRIBE);
      expect(result.forcedClassification?.isEscalation).toBe(false);
      expect(result.forcedClassification?.recommendedAction).toContain('Suppress');
    }
  });

  it('evaluates Out of Office messages to Type 2 (OUT_OF_OFFICE)', () => {
    const result = guardrails.evaluate('I am currently out of the office on annual leave until next Monday.');
    expect(result.triggered).toBe(true);
    expect(result.forcedClassification?.replyType).toBe(ReplyType.OUT_OF_OFFICE_OR_REFERRAL);
  });

  it('forces escalation to Sales within 4h on pricing/contract keywords (Type 5)', () => {
    const result = guardrails.evaluate('Hi, can you give me a quote for 50 handheld devices?');
    expect(result.triggered).toBe(true);
    expect(result.forcedClassification?.replyType).toBe(ReplyType.PRICING_OR_COMMERCIAL_TERMS);
    expect(result.forcedClassification?.escalationTarget).toBe('SALES');
    expect(result.forcedClassification?.responseTargetHours).toBe(4);
    expect(result.forcedClassification?.draftHoldingReply).toBeDefined();
  });

  it('forces escalation to Compliance within 1 business day on legal/GDPR/complaint keywords (Type 7)', () => {
    const result = guardrails.evaluate('This email violates GDPR. Remove my data immediately.');
    expect(result.triggered).toBe(true);
    expect(result.forcedClassification?.replyType).toBe(ReplyType.COMPLAINT_OR_LEGAL_THREAT);
    expect(result.forcedClassification?.escalationTarget).toBe('COMPLIANCE');
    expect(result.forcedClassification?.responseTargetHours).toBe(24);
    // Does NOT send standard sales holding reply
    expect(result.forcedClassification?.draftHoldingReply).toBeUndefined();
  });
});

describe('ReplyClassifier - Hybrid Intelligence & SLAs', () => {
  const classifier = new ReplyClassifier(new MockLLMAdapter(), new ReplyGuardrailsEngine(), false);

  it('classifies demo / meeting request as Type 4 with URGENT 1-hour SLA', async () => {
    const result = await classifier.classify('This looks very relevant. Can we schedule a quick demo call tomorrow?');
    expect(result.replyType).toBe(ReplyType.DEMO_OR_MEETING_REQUEST);
    expect(result.isEscalation).toBe(true);
    expect(result.escalationTarget).toBe('SALES');
    expect(result.responseTargetHours).toBe(1);
    expect(result.extractedFacts.requestedDemo).toBe(true);
  });

  it('classifies partner inquiry as Type 6 with 4-hour SLA', async () => {
    const result = await classifier.classify('We are a telecom reseller in Nairobi and would like to explore distributor margins.');
    expect(result.replyType).toBe(ReplyType.PARTNER_INQUIRY);
    expect(result.isEscalation).toBe(true);
    expect(result.escalationTarget).toBe('SALES');
    expect(result.responseTargetHours).toBe(4);
  });

  it('handles low confidence or ambiguous replies by falling back to Type 9 (Uncertainty)', async () => {
    const result = await classifier.classify('maybe later, not sure what this is');
    expect(result.replyType).toBe(ReplyType.UNCERTAIN_OR_LOW_CONFIDENCE);
    expect(result.isEscalation).toBe(true);
    expect(result.requiresHumanReview).toBe(true);
  });

  it('enforces Month 1 review mode by flagging drafts for human review', async () => {
    const month1Classifier = new ReplyClassifier(new MockLLMAdapter(), new ReplyGuardrailsEngine(), true);
    const result = await month1Classifier.classify('Can we book a demo for next Tuesday?');

    expect(result.requiresHumanReview).toBe(true);
    expect(result.reviewStatus).toBe('PENDING_HUMAN_REVIEW');
  });
});
