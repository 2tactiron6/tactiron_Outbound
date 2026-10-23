/**
 * Odoo WhatsApp Integration Adapter
 * Sends AI-generated replies back through Odoo's native WhatsApp channel
 * (discuss.channel → message_post) via Meta Cloud API.
 *
 * Business Rules:
 *  - We NEVER cold-initiate WhatsApp messages (strict Meta TOS + compliance)
 *  - All outbound replies are responses to prospect-initiated inbound messages
 *  - Same 7 guardrails apply: no price quoting, no negotiation via WhatsApp
 *  - 24-hour Meta conversation window must be respected
 */

export interface OdooWhatsAppMessage {
  channelId: number;       // Odoo discuss.channel ID
  phone: string;           // Prospect's WhatsApp phone number (E.164 format)
  partnerName: string;     // Prospect's display name from Odoo
  messageBody: string;     // Incoming WhatsApp message text
  partnerEmail?: string;   // Optional: linked email in Odoo for CRM dedup
  timestamp?: string;      // ISO 8601 timestamp of the incoming message
}

export interface IOdooWhatsAppAdapter {
  /**
   * Posts a reply message to an existing Odoo WhatsApp discuss.channel.
   * @param channelId  - Odoo discuss.channel ID
   * @param replyText  - The AI-approved reply text to send
   * @returns true if message was sent successfully, false otherwise
   */
  sendWhatsAppReply(channelId: number, replyText: string): Promise<boolean>;
}

/**
 * Mock WhatsApp Adapter for Development and Testing
 * Stores sent messages in memory; does not make real HTTP calls.
 */
export class MockOdooWhatsAppAdapter implements IOdooWhatsAppAdapter {
  public sentMessages: Array<{ channelId: number; replyText: string; sentAt: Date }> = [];
  public simulateFailure = false;

  public async sendWhatsAppReply(channelId: number, replyText: string): Promise<boolean> {
    if (this.simulateFailure) {
      throw new Error('Simulated WhatsApp send failure (HTTP 503)');
    }
    this.sentMessages.push({ channelId, replyText, sentAt: new Date() });
    return true;
  }

  public getLastSentMessage() {
    return this.sentMessages[this.sentMessages.length - 1] ?? null;
  }

  public reset() {
    this.sentMessages = [];
    this.simulateFailure = false;
  }
}

/**
 * Production Odoo WhatsApp Adapter
 * Calls Odoo's JSON-RPC endpoint to post a message on the WhatsApp discuss.channel,
 * which in turn delivers it via Meta's Cloud API.
 */
export class OdooWhatsAppAdapter implements IOdooWhatsAppAdapter {
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

    const data = await response.json() as { result?: unknown; error?: { message: string } };
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
      throw new Error('Odoo WhatsApp authentication failed: Invalid credentials');
    }
    this.uid = uid;
    return uid;
  }

  public async sendWhatsAppReply(channelId: number, replyText: string): Promise<boolean> {
    const uid = await this.authenticate();

    // Post message to the Odoo WhatsApp discuss.channel.
    // Odoo then delivers this to the prospect via Meta Cloud API.
    await this.jsonRpcCall('object', 'execute_kw', [
      this.db,
      uid,
      this.apiKey,
      'discuss.channel',
      'message_post',
      [[channelId], {
        body: replyText,
        message_type: 'whatsapp',
        subtype_xmlid: 'mail.mt_comment'
      }]
    ]);

    return true;
  }
}
