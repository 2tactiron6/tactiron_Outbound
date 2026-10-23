import { describe, it, expect, beforeEach } from 'vitest';
import { WhatsAppHandler } from '../src/modules/whatsapp/handler.js';
import { MockOdooWhatsAppAdapter } from '../src/integrations/odoo/whatsapp-adapter.js';
import { MockOdooAdapter } from '../src/integrations/odoo/adapter.js';
import { MockLLMAdapter } from '../src/integrations/llm/adapter.js';
import { ReplyType } from '../src/core/types/index.js';
import { buildApp } from '../src/app.js';
import { VerticalSliceOrchestrator } from '../src/vertical-slice.js';

describe('WhatsApp AI Inbound Response Integration', () => {
  let llmAdapter: MockLLMAdapter;
  let whatsAppAdapter: MockOdooWhatsAppAdapter;
  let odooAdapter: MockOdooAdapter;
  let handler: WhatsAppHandler;

  beforeEach(() => {
    llmAdapter = new MockLLMAdapter();
    whatsAppAdapter = new MockOdooWhatsAppAdapter();
    odooAdapter = new MockOdooAdapter();
    handler = new WhatsAppHandler(llmAdapter, whatsAppAdapter, odooAdapter);
  });

  describe('Guardrails and Safety Enforcement', () => {
    it('enforces deterministic pricing guardrail and NEVER quotes prices over WhatsApp', async () => {
      const result = await handler.handleIncoming({
        channelId: 101,
        phone: '+971501234567',
        partnerName: 'Tariq Mansoor',
        messageBody: 'Hello, what is your price per vehicle and can you send a quote?',
        partnerEmail: 'tariq@gulflogistics.ae'
      });

      // 1. Guardrail keyword must be detected
      expect(result.classification.guardrailKeywordHit).toBe(true);
      expect(result.classification.replyType).toBe(ReplyType.PRICING_OR_COMMERCIAL_TERMS);

      // 2. Reply sent must NOT contain specific prices or negotiate
      expect(result.replySent).toBeTruthy();
      expect(result.replySent).not.toMatch(/\$\d+|\bAED\b|\bEUR\b|\bUSD\b/);

      // 3. Adapter actually sent the message to Odoo discuss channel
      expect(whatsAppAdapter.sentMessages).toHaveLength(1);
      expect(whatsAppAdapter.sentMessages[0].channelId).toBe(101);

      // 4. CRM Lead created with sales escalation
      expect(result.handoverTriggered).toBe(true);
      expect(result.odooLeadId).toBeDefined();

      const odooLead = odooAdapter.getLeadByEmail('tariq@gulflogistics.ae');
      expect(odooLead).toBeDefined();
      expect(odooLead?.payload.name).toContain('[WHATSAPP]');
      expect(odooLead?.payload.priority).toBe('2'); // Standard sales escalation
    });

    it('immediately halts replies and routes legal threats / GDPR complaints to compliance', async () => {
      const result = await handler.handleIncoming({
        channelId: 102,
        phone: '+971509998877',
        partnerName: 'Karim Hadad',
        messageBody: 'This message violates GDPR and privacy laws. I am filing a complaint with my lawyer.',
        partnerEmail: 'karim@hadadholdings.com'
      });

      expect(result.classification.guardrailKeywordHit).toBe(true);
      expect(result.classification.replyType).toBe(ReplyType.COMPLAINT_OR_LEGAL_THREAT);

      // AI must NOT send automated sales replies on legal issues
      expect(result.replySent).toBeNull();
      expect(whatsAppAdapter.sentMessages).toHaveLength(0);

      // Handover triggered with urgent priority for compliance officer
      expect(result.handoverTriggered).toBe(true);
      const lead = odooAdapter.getLeadByEmail('karim@hadadholdings.com');
      expect(lead?.payload.priority).toBe('3'); // Urgent compliance priority
    });

    it('respects opt-outs, deletes from active conversations, and sends no reply', async () => {
      const phone = '+971551234567';

      const result = await handler.handleIncoming({
        channelId: 103,
        phone,
        partnerName: 'Rashid Omar',
        messageBody: 'Stop messaging me, unsubscribe immediately'
      });

      expect(result.classification.replyType).toBe(ReplyType.UNSUBSCRIBE);
      expect(result.replySent).toBeNull();
      expect(whatsAppAdapter.sentMessages).toHaveLength(0);
      expect(handler.isPhoneActiveOnWhatsApp(phone)).toBe(false);
      expect(result.handoverTriggered).toBe(false);
    });

    it('handles demo requests with warm handover pack and holding reply', async () => {
      const result = await handler.handleIncoming({
        channelId: 104,
        phone: '+966501112233',
        partnerName: 'Fahad Al-Saud',
        messageBody: 'We have 60 delivery trucks in Riyadh and want to schedule a live demo next week.',
        partnerEmail: 'fahad@riyadhdelivery.sa'
      });

      expect(result.classification.replyType).toBe(ReplyType.DEMO_OR_MEETING_REQUEST);
      expect(result.replySent).toBeTruthy();
      expect(whatsAppAdapter.sentMessages).toHaveLength(1);
      expect(result.handoverTriggered).toBe(true);

      const lead = odooAdapter.getLeadByEmail('fahad@riyadhdelivery.sa');
      expect(lead).toBeDefined();
      expect(lead?.payload.priority).toBe('3'); // Urgent meeting request (1h SLA)
      expect(lead?.payload.description).toContain('Riyadh');
    });
  });

  describe('Meta 24-Hour Window & Sequence Suppression', () => {
    it('tracks active WhatsApp phones and reports active status', async () => {
      const phone = '+971501122334';
      expect(handler.isPhoneActiveOnWhatsApp(phone)).toBe(false);

      await handler.handleIncoming({
        channelId: 105,
        phone,
        partnerName: 'Zayd K.',
        messageBody: 'Hi, does your Push-to-Talk work over 4G and WiFi networks?'
      });

      expect(handler.isPhoneActiveOnWhatsApp(phone)).toBe(true);
      expect(handler.conversationLog).toHaveLength(1);
      expect(handler.conversationLog[0].withinMetaWindow).toBe(true);
    });
  });

  describe('Fastify Webhook and API Endpoints', () => {
    it('POST /webhooks/odoo/whatsapp processes message, responds, and suppresses email queue', async () => {
      const orchestrator = new VerticalSliceOrchestrator();

      // 1. Ingest contact
      orchestrator.ingestionService.ingest({
        companyName: 'Emirates Freight FZ',
        domain: 'emiratesfreight.ae',
        country: 'AE',
        contactEmail: 'director@emiratesfreight.ae',
        phone: '+971504445555',
        source: 'TEST'
      });

      const app = buildApp(orchestrator, undefined, handler);

      // 2. Queue an outbound email dispatch job
      const queueRes = await app.inject({
        method: 'POST',
        url: '/campaigns/queue-leads',
        payload: {
          campaignName: 'Test Sequence',
          leads: [
            {
              contactEmail: 'director@emiratesfreight.ae',
              companyName: 'Emirates Freight FZ',
              contactPhone: '+971504445555',
              complianceAllowed: true
            }
          ]
        }
      });
      expect(queueRes.statusCode).toBe(200);

      // Verify email job is pending in the queue
      const queueCheck1 = await app.inject({ method: 'GET', url: '/internal/automation/queue' });
      const jobsBefore = JSON.parse(queueCheck1.body).jobs;
      expect(jobsBefore.some((j: any) => j.leadEmail === 'director@emiratesfreight.ae' && j.status === 'PENDING')).toBe(true);

      // 3. Prospect sends an inbound WhatsApp message via Odoo webhook
      const webhookRes = await app.inject({
        method: 'POST',
        url: '/webhooks/odoo/whatsapp',
        payload: {
          channelId: 777,
          phone: '+971504445555',
          partnerName: 'Director Emirates',
          messageBody: 'Hello, can you explain your pricing and license structure?',
          partnerEmail: 'director@emiratesfreight.ae'
        }
      });

      expect(webhookRes.statusCode).toBe(200);
      const webhookData = JSON.parse(webhookRes.body);
      expect(webhookData.received).toBe(true);
      expect(webhookData.handoverTriggered).toBe(true);
      expect(webhookData.replySent).toBeTruthy();

      // 4. Verify that pending email jobs for this lead were automatically SUPPRESSED
      const queueCheck2 = await app.inject({ method: 'GET', url: '/internal/automation/queue' });
      const jobsAfter = JSON.parse(queueCheck2.body).jobs;
      const suppressedJob = jobsAfter.find((j: any) => j.leadEmail === 'director@emiratesfreight.ae');
      expect(suppressedJob.status).toBe('SUPPRESSED');
      expect(suppressedJob.lastError).toContain('ACTIVE_WHATSAPP_CONVERSATION');

      // 5. If we try to queue this lead again while WhatsApp is active, it is blocked
      const queueRes2 = await app.inject({
        method: 'POST',
        url: '/campaigns/queue-leads',
        payload: {
          campaignName: 'Followup Sequence',
          leads: [
            {
              contactEmail: 'director@emiratesfreight.ae',
              contactPhone: '+971504445555',
              complianceAllowed: true
            }
          ]
        }
      });
      const queueData2 = JSON.parse(queueRes2.body);
      expect(queueData2.blockedCount).toBe(1);
      expect(queueData2.blocked[0].reason).toContain('BLOCKED_ACTIVE_WHATSAPP_CONVERSATION');
    });

    it('GET /internal/whatsapp/conversations returns logged interactions', async () => {
      const orchestrator = new VerticalSliceOrchestrator();
      const app = buildApp(orchestrator, undefined, handler);

      // Simulate a WhatsApp message
      await app.inject({
        method: 'POST',
        url: '/internal/whatsapp/simulate',
        payload: {
          phone: '+971509988776',
          partnerName: 'Salim Al-Nuaimi',
          messageBody: 'Can we setup a trial for 10 devices?'
        }
      });

      const listRes = await app.inject({
        method: 'GET',
        url: '/internal/whatsapp/conversations'
      });

      expect(listRes.statusCode).toBe(200);
      const data = JSON.parse(listRes.body);
      expect(data.total).toBe(1);
      expect(data.conversations[0].partnerName).toBe('Salim Al-Nuaimi');
      expect(data.activePhones).toContain('+971509988776');
    });

    it('rejects invalid WhatsApp webhook payloads with 400 Bad Request', async () => {
      const orchestrator = new VerticalSliceOrchestrator();
      const app = buildApp(orchestrator, undefined, handler);

      const res = await app.inject({
        method: 'POST',
        url: '/webhooks/odoo/whatsapp',
        payload: {
          // missing channelId and phone
          messageBody: 'Invalid message payload'
        }
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('INVALID_WEBHOOK_PAYLOAD');
    });
  });
});
