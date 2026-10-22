/**
 * LLM Integration Interface & Providers
 * Provides a provider-independent interface with structured Zod output validation.
 */

import { z } from 'zod';
import { ReplyType } from '../../core/types/index.js';

export const StructuredClassificationSchema = z.object({
  replyType: z.nativeEnum(ReplyType),
  intentName: z.string(),
  confidence: z.number().min(0).max(1),
  extractedFacts: z.object({
    requestedDemo: z.boolean().optional(),
    pricingMentioned: z.boolean().optional(),
    competitorsMentioned: z.array(z.string()).optional(),
    urgencyTimeline: z.string().optional(),
    teamSizeMentioned: z.number().optional(),
    colleagueReferral: z.object({
      name: z.string().optional(),
      email: z.string().optional()
    }).optional(),
    keyConcerns: z.array(z.string()).optional()
  }),
  recommendedAction: z.string(),
  isEscalation: z.boolean(),
  escalationTarget: z.enum(['SALES', 'COMPLIANCE', 'NONE']),
  proposedHoldingReply: z.string().optional()
});

export type StructuredClassificationOutput = z.infer<typeof StructuredClassificationSchema>;

export interface ILLMAdapter {
  classifyReply(messageText: string): Promise<StructuredClassificationOutput>;
}

/**
 * Mock / Sandbox LLM Adapter for Unit and Integration Testing
 * Operates deterministically without external API dependencies or incurring costs.
 */
export class MockLLMAdapter implements ILLMAdapter {
  public async classifyReply(messageText: string): Promise<StructuredClassificationOutput> {
    const lower = messageText.toLowerCase();

    // Demo or meeting request (Type 4)
    if (
      lower.includes('demo') ||
      lower.includes('call') ||
      lower.includes('meeting') ||
      lower.includes('discuss') ||
      lower.includes('schedule a time') ||
      lower.includes('interested in learning more')
    ) {
      return {
        replyType: ReplyType.DEMO_OR_MEETING_REQUEST,
        intentName: 'DEMO_OR_MEETING_REQUEST',
        confidence: 0.95,
        extractedFacts: {
          requestedDemo: true,
          urgencyTimeline: 'High interest'
        },
        recommendedAction: 'Handover to Sales within 1 hour. Dispatch holding reply.',
        isEscalation: true,
        escalationTarget: 'SALES',
        proposedHoldingReply: 'Thank you for your interest. A member of our team will contact you shortly to coordinate a demonstration.'
      };
    }

    // Partner questions (Type 6)
    if (lower.includes('partner') || lower.includes('reseller') || lower.includes('distributor') || lower.includes('margin')) {
      return {
        replyType: ReplyType.PARTNER_INQUIRY,
        intentName: 'PARTNER_INQUIRY',
        confidence: 0.92,
        extractedFacts: {
          keyConcerns: ['Partnership inquiry']
        },
        recommendedAction: 'Escalate to Sales/Partnerships within 4 hours. Send holding reply.',
        isEscalation: true,
        escalationTarget: 'SALES',
        proposedHoldingReply: 'Thank you for reaching out regarding partnership opportunities. Our commercial partnerships lead will be in touch today.'
      };
    }

    // Simple factual question (Type 3)
    if (
      lower.includes('what is ptt') ||
      lower.includes('supported devices') ||
      lower.includes('coverage in') ||
      lower.includes('cellular')
    ) {
      return {
        replyType: ReplyType.SIMPLE_FACTUAL_QUESTION,
        intentName: 'SIMPLE_FACTUAL_QUESTION',
        confidence: 0.90,
        extractedFacts: {},
        recommendedAction: 'Answer using pre-approved knowledge base only.',
        isEscalation: false,
        escalationTarget: 'NONE',
        proposedHoldingReply: 'Our platform delivers instant push-to-talk communication over standard cellular and Wi-Fi networks across GCC and Africa.'
      };
    }

    // Default to Low Confidence / Uncertain (Type 9)
    return {
      replyType: ReplyType.UNCERTAIN_OR_LOW_CONFIDENCE,
      intentName: 'UNCERTAIN_OR_LOW_CONFIDENCE',
      confidence: 0.50,
      extractedFacts: {},
      recommendedAction: 'Low confidence classification. Escalate to human review.',
      isEscalation: true,
      escalationTarget: 'SALES',
      proposedHoldingReply: 'Thank you for your response. Our team will review your query and respond promptly.'
    };
  }
}

/**
 * Production Claude LLM Adapter (Anthropic Messages API)
 * Note: Requires ANTHROPIC_API_KEY. Validates JSON output with Zod.
 */
export class AnthropicClaudeAdapter implements ILLMAdapter {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async classifyReply(messageText: string): Promise<StructuredClassificationOutput> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured. Use MockLLMAdapter for local testing.');
    }

    const systemPrompt = `You are a compliance-first outbound sales reply classifier for a push-to-talk platform.
Your task is to analyze prospect replies and output ONLY a valid JSON object matching this schema:
{
  "replyType": <integer 1 to 9>,
  "intentName": "<string>",
  "confidence": <float 0.0 to 1.0>,
  "extractedFacts": {
    "requestedDemo": <boolean>,
    "pricingMentioned": <boolean>,
    "competitorsMentioned": [<string>],
    "urgencyTimeline": "<string>",
    "teamSizeMentioned": <number>,
    "colleagueReferral": { "name": "<string>", "email": "<string>" },
    "keyConcerns": [<string>]
  },
  "recommendedAction": "<string>",
  "isEscalation": <boolean>,
  "escalationTarget": "SALES" | "COMPLIANCE" | "NONE",
  "proposedHoldingReply": "<string or null>"
}

Strict Rules:
- Never quote prices or discounts.
- Never promise delivery dates.
- Never make legal or security claims.
- If uncertain, set replyType to 9 and confidence below 0.8.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Prospect Reply:\n"${messageText}"` }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${err}`);
    }

    const json = await response.json() as { content?: Array<{ text?: string }> };
    const content = json.content?.[0]?.text;
    if (!content) {
      throw new Error('Empty response from Anthropic API');
    }

    const parsedJson = JSON.parse(content);
    return StructuredClassificationSchema.parse(parsedJson);
  }
}
