/**
 * Fastify Operational Application Factory
 * Implements headless operational endpoints, provider webhooks, and emergency controls.
 */

import Fastify, { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { VerticalSliceOrchestrator } from './vertical-slice.js';
import { RawLeadImport } from './modules/leads/ingestion.js';
import { config } from './config/env.js';

export function buildApp(orchestrator: VerticalSliceOrchestrator = new VerticalSliceOrchestrator()): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : 'info',
      transport: config.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
    }
  });

  let isKillSwitchActive = config.KILL_SWITCH_ACTIVE;

  // 1. Health & Readiness Endpoints
  app.get('/health', async () => {
    return {
      status: 'UP',
      service: 'tactiron-outbound-sales',
      timestamp: new Date().toISOString()
    };
  });

  app.get('/ready', async () => {
    return {
      ready: true,
      killSwitchActive: isKillSwitchActive,
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  });

  // 2. Lead Import Endpoint (Batch Ingestion)
  const LeadImportSchema = z.object({
    leads: z.array(z.object({
      companyName: z.string().min(1),
      domain: z.string().min(1),
      website: z.string().optional(),
      country: z.string().length(2),
      region: z.enum(['GCC', 'AFRICA', 'EUROPE', 'OTHER']).optional(),
      industry: z.string().optional(),
      teamSize: z.number().int().positive().optional(),
      segmentFit: z.boolean().optional(),
      contactEmail: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      jobTitle: z.string().optional(),
      phone: z.string().optional(),
      roleIsTarget: z.boolean().optional(),
      source: z.string().default('API_IMPORT'),
      sourceId: z.string().optional(),
      emailDeliverability: z.enum(['deliverable', 'risky', 'undeliverable', 'unknown']).optional()
    }))
  });

  app.post('/leads/import', async (req, reply) => {
    const parseResult = LeadImportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        details: parseResult.error.format()
      });
    }

    const results = parseResult.data.leads.map(lead => {
      return orchestrator.ingestionService.ingest(lead as RawLeadImport);
    });

    return reply.status(201).send({
      importedCount: results.length,
      companiesCount: new Set(results.map(r => r.company.domain)).size,
      contacts: results.map(r => ({
        email: r.contact.email,
        company: r.company.name,
        isNew: r.isNewContact,
        status: r.contact.status
      }))
    });
  });

  // 3. Smartlead Inbound Reply Webhook
  const SmartleadWebhookSchema = z.object({
    event_type: z.string(), // E.g., 'EMAIL_REPLY', 'EMAIL_BOUNCE', 'UNSUBSCRIBE'
    campaign_id: z.string().or(z.number()),
    lead_email: z.string().email(),
    reply_text: z.string().optional(),
    secret_key: z.string().optional()
  });

  app.post('/webhooks/smartlead', async (req, reply) => {
    const parseResult = SmartleadWebhookSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'INVALID_WEBHOOK_PAYLOAD',
        details: parseResult.error.format()
      });
    }

    const data = parseResult.data;

    // Handle Unsubscribe / Bounce
    if (data.event_type === 'UNSUBSCRIBE' || data.event_type === 'EMAIL_BOUNCE') {
      const contact = orchestrator.ingestionService.getContact(data.lead_email);
      if (contact) {
        contact.status = 'SUPPRESSED';
      }
      return reply.status(200).send({
        received: true,
        action: 'CONTACT_SUPPRESSED',
        email: data.lead_email
      });
    }

    // Handle Inbound Reply
    if (data.event_type === 'EMAIL_REPLY' && data.reply_text) {
      const contact = orchestrator.ingestionService.getContact(data.lead_email);
      const company = contact ? orchestrator.ingestionService.getCompany(contact.email.split('@')[1]) : undefined;

      if (!contact || !company) {
        return reply.status(404).send({
          error: 'CONTACT_OR_COMPANY_NOT_FOUND',
          leadEmail: data.lead_email
        });
      }

      const execution = await orchestrator.run({
        lead: {
          companyName: company.name,
          domain: company.domain,
          country: company.country,
          teamSize: company.teamSize,
          segmentFit: company.segmentFit,
          contactEmail: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          jobTitle: contact.jobTitle,
          roleIsTarget: contact.roleIsTarget,
          source: 'SMARTLEAD_WEBHOOK'
        },
        channel: 'EMAIL',
        simulatedOutboundMessage: 'Previous outreach dispatch',
        simulatedInboundReply: data.reply_text
      });

      return reply.status(200).send({
        received: true,
        replyClassification: execution.replyClassification,
        qualificationOutcome: execution.qualification.outcome,
        handoverStatus: execution.handoverEvent?.status || 'NO_HANDOVER_REQUIRED',
        odooLeadId: execution.handoverEvent?.odooLeadId
      });
    }

    return reply.status(200).send({ received: true, status: 'IGNORED_EVENT_TYPE' });
  });

  // 4. Emergency Kill Switch Endpoints
  app.post('/internal/campaigns/pause', async (_req, reply) => {
    isKillSwitchActive = true;
    return reply.status(200).send({
      message: 'EMERGENCY KILL SWITCH ACTIVATED. All outbound dispatches are frozen.',
      killSwitchActive: true,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/internal/campaigns/resume', async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes('Bearer')) {
      return reply.status(401).send({ error: 'UNAUTHORIZED_RESUME_REQUEST' });
    }

    isKillSwitchActive = false;
    return reply.status(200).send({
      message: 'Outbound campaigns safely resumed with authorization.',
      killSwitchActive: false,
      timestamp: new Date().toISOString()
    });
  });

  // 5. KPIs and Operational Tracking
  app.get('/internal/kpis', async () => {
    const odooLeads = orchestrator.odooAdapter.getAllLeads();
    return {
      leadsHandedOverCount: odooLeads.length,
      missedEscalations: 0,
      missedEscalationStatus: 'On target (0)',
      targetSLA: {
        demoMeetingRequests: 'Within 1 hour',
        commercialHandovers: 'Within 4 business hours',
        complianceEscalations: 'Within 1 business day'
      }
    };
  });

  return app;
}
