/**
 * Clay Integration Adapter
 * Supports triggering Clay enrichment tables and receiving enriched webhook payloads.
 */

export interface ClayEnrichmentRequest {
  leadId: string;
  companyName: string;
  domain: string;
  contactEmail: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

export interface ClayEnrichmentResult {
  leadId: string;
  enrichedCompanyName?: string;
  industry?: string;
  employeeCount?: number;
  linkedinUrl?: string;
  phone?: string;
  jobTitle?: string;
  confidenceScore?: number;
}

export interface IClayAdapter {
  triggerEnrichment(request: ClayEnrichmentRequest): Promise<{ triggered: boolean; executionId: string }>;
}

/**
 * Mock Clay Adapter for Local Testing
 */
export class MockClayAdapter implements IClayAdapter {
  public async triggerEnrichment(request: ClayEnrichmentRequest): Promise<{ triggered: boolean; executionId: string }> {
    return {
      triggered: true,
      executionId: `clay_exec_${crypto.randomUUID().slice(0, 8)}`
    };
  }

  /**
   * Simulates what Clay returns in a webhook callback
   */
  public generateMockCallback(request: ClayEnrichmentRequest): ClayEnrichmentResult {
    return {
      leadId: request.leadId,
      enrichedCompanyName: request.companyName,
      industry: 'Transportation, Logistics, Supply Chain and Storage',
      employeeCount: 52,
      linkedinUrl: `https://www.linkedin.com/company/${request.domain.split('.')[0]}`,
      jobTitle: 'Head of Fleet & Ground Operations',
      phone: '+97144200000',
      confidenceScore: 0.95
    };
  }
}

/**
 * Production Clay Webhook Adapter
 * Posts lead to Clay webhook URL for table enrichment
 */
export class ClayWebhookAdapter implements IClayAdapter {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  public async triggerEnrichment(request: ClayEnrichmentRequest): Promise<{ triggered: boolean; executionId: string }> {
    if (!this.webhookUrl) {
      throw new Error('Clay webhook URL is not configured.');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Clay Webhook Error (${response.status}): ${response.statusText}`);
    }

    return {
      triggered: true,
      executionId: `clay_live_${Date.now()}`
    };
  }
}
