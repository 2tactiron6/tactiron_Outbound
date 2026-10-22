/**
 * Odoo CRM Integration Adapter
 * Responsible for creating/updating leads in Odoo CRM with deduplication.
 */

import { HandoverPack, HandoverPriority } from '../../core/types/index.js';

export interface OdooLeadPayload {
  name: string; // Opportunity / Lead title
  contact_name: string;
  email_from: string;
  phone?: string;
  partner_name: string; // Company name
  description: string;  // Formatted handover pack description
  priority: '0' | '1' | '2' | '3'; // Odoo priority mapping
  user_id?: number;    // Assigned sales rep ID
  team_id?: number;    // Regional sales team ID
  tag_ids?: number[];  // Tags: ['AI_QUALIFIED', 'GCC', 'URGENT']
}

export interface IOdooAdapter {
  createOrUpdateLead(payload: OdooLeadPayload): Promise<{ odooLeadId: number; isNew: boolean }>;
}

/**
 * Mock Odoo CRM Adapter for Local Development and Integration Testing
 * Keeps state in-memory, enforces deduplication by email, and tracks leads.
 */
export class MockOdooAdapter implements IOdooAdapter {
  private leads: Map<string, { id: number; payload: OdooLeadPayload; updatedAt: Date }> = new Map();
  private nextId = 1001;
  public simulateNetworkFailure = false;

  public async createOrUpdateLead(payload: OdooLeadPayload): Promise<{ odooLeadId: number; isNew: boolean }> {
    if (this.simulateNetworkFailure) {
      throw new Error('Simulated Odoo connection timeout (HTTP 504)');
    }

    const email = payload.email_from.toLowerCase().trim();
    const existing = this.leads.get(email);

    if (existing) {
      existing.payload = payload;
      existing.updatedAt = new Date();
      return { odooLeadId: existing.id, isNew: false };
    }

    const odooLeadId = this.nextId++;
    this.leads.set(email, {
      id: odooLeadId,
      payload,
      updatedAt: new Date()
    });

    return { odooLeadId, isNew: true };
  }

  public getLeadByEmail(email: string) {
    return this.leads.get(email.toLowerCase().trim());
  }

  public getAllLeads() {
    return Array.from(this.leads.values());
  }
}

/**
 * Production Odoo JSON-RPC Adapter
 * Interacts with Odoo's standard /jsonrpc endpoint
 */
export class OdooJsonRpcAdapter implements IOdooAdapter {
  private url: string;
  private db: string;
  private username: string;
  private apiKey: string;
  private uid: number | null = null;

  constructor(url: string, db: string, username: string, apiKey: string) {
    this.url = url;
    this.db = db;
    this.username = username;
    this.apiKey = apiKey;
  }

  private async jsonRpcCall(service: string, method: string, args: unknown[]): Promise<unknown> {
    const response = await fetch(`${this.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args },
        id: Math.floor(Math.random() * 100000)
      })
    });

    if (!response.ok) {
      throw new Error(`Odoo HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { result?: unknown; error?: { message: string; data: unknown } };
    if (data.error) {
      throw new Error(`Odoo RPC Error: ${data.error.message}`);
    }

    return data.result;
  }

  private async authenticate(): Promise<number> {
    if (this.uid) return this.uid;
    const uid = await this.jsonRpcCall('common', 'authenticate', [
      this.db,
      this.username,
      this.apiKey,
      {}
    ]) as number;

    if (!uid) {
      throw new Error('Odoo authentication failed: Invalid credentials');
    }
    this.uid = uid;
    return uid;
  }

  public async createOrUpdateLead(payload: OdooLeadPayload): Promise<{ odooLeadId: number; isNew: boolean }> {
    const uid = await this.authenticate();

    // 1. Check for existing lead by email to prevent duplicates
    const searchResult = await this.jsonRpcCall('object', 'execute_kw', [
      this.db,
      uid,
      this.apiKey,
      'crm.lead',
      'search',
      [[['email_from', '=ilike', payload.email_from.trim()]]],
      { limit: 1 }
    ]) as number[];

    if (searchResult && searchResult.length > 0) {
      const existingId = searchResult[0];
      // Update existing record
      await this.jsonRpcCall('object', 'execute_kw', [
        this.db,
        uid,
        this.apiKey,
        'crm.lead',
        'write',
        [[existingId], payload]
      ]);
      return { odooLeadId: existingId, isNew: false };
    }

    // 2. Create new lead
    const newId = await this.jsonRpcCall('object', 'execute_kw', [
      this.db,
      uid,
      this.apiKey,
      'crm.lead',
      'create',
      [payload]
    ]) as number;

    return { odooLeadId: newId, isNew: true };
  }
}
