import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { VerticalSliceOrchestrator } from '../src/vertical-slice.js';

describe('Operational API & Webhook Endpoints', () => {
  let app: FastifyInstance;
  let orchestrator: VerticalSliceOrchestrator;

  beforeAll(async () => {
    orchestrator = new VerticalSliceOrchestrator();
    app = buildApp(orchestrator);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns UP status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('UP');
    expect(body.service).toBe('tactiron-outbound-sales');
  });

  it('GET /ready returns readiness and kill switch state', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ready).toBe(true);
    expect(body.killSwitchActive).toBe(false);
  });

  it('POST /leads/import ingests and deduplicates a batch of leads', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/leads/import',
      payload: {
        leads: [
          {
            companyName: 'Red Sea Logistics',
            domain: 'redsealogistics.eg',
            country: 'EG',
            region: 'AFRICA',
            teamSize: 40,
            segmentFit: true,
            contactEmail: 'director@redsealogistics.eg',
            firstName: 'Amr',
            lastName: 'Diab',
            jobTitle: 'Fleet Director',
            roleIsTarget: true,
            source: 'Apollo'
          }
        ]
      }
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.importedCount).toBe(1);
    expect(body.contacts[0].email).toBe('director@redsealogistics.eg');
    expect(body.contacts[0].isNew).toBe(true);
  });

  it('POST /webhooks/smartlead processes an UNSUBSCRIBE event and suppresses the contact', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/smartlead',
      payload: {
        event_type: 'UNSUBSCRIBE',
        campaign_id: 'camp_123',
        lead_email: 'director@redsealogistics.eg'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.action).toBe('CONTACT_SUPPRESSED');

    const contact = orchestrator.ingestionService.getContact('director@redsealogistics.eg');
    expect(contact?.status).toBe('SUPPRESSED');
  });

  it('POST /internal/campaigns/pause activates global emergency kill switch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/internal/campaigns/pause'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.killSwitchActive).toBe(true);
  });

  it('POST /internal/campaigns/resume requires authorization', async () => {
    const unauthorizedRes = await app.inject({
      method: 'POST',
      url: '/internal/campaigns/resume'
    });
    expect(unauthorizedRes.statusCode).toBe(401);

    const authorizedRes = await app.inject({
      method: 'POST',
      url: '/internal/campaigns/resume',
      headers: {
        authorization: 'Bearer valid_admin_token'
      }
    });
    expect(authorizedRes.statusCode).toBe(200);
    expect(authorizedRes.json().killSwitchActive).toBe(false);
  });

  it('GET /internal/kpis returns zero missed escalations and target SLAs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/internal/kpis'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.missedEscalations).toBe(0);
    expect(body.missedEscalationStatus).toBe('On target (0)');
    expect(body.targetSLA.demoMeetingRequests).toBe('Within 1 hour');
  });
});
