/**
 * Email Verification Adapter
 * Verifies SMTP deliverability, MX records, and catch-all status before outreach dispatch.
 */

import { EmailVerificationStatus } from '../../core/types/index.js';

export interface VerificationResult {
  email: string;
  status: EmailVerificationStatus;
  isDeliverable: boolean;
  isCatchAll: boolean;
  isDisposable: boolean;
  provider: string;
  checkedAt: Date;
}

export interface IEmailVerificationAdapter {
  verifyEmail(email: string): Promise<VerificationResult>;
}

/**
 * Mock Email Verification Adapter for Testing
 */
export class MockEmailVerificationAdapter implements IEmailVerificationAdapter {
  public async verifyEmail(email: string): Promise<VerificationResult> {
    const lower = email.toLowerCase().trim();
    const checkedAt = new Date();

    if (lower.includes('invalid') || lower.includes('bounce') || lower.endsWith('.test')) {
      return {
        email,
        status: 'INVALID',
        isDeliverable: false,
        isCatchAll: false,
        isDisposable: false,
        provider: 'MOCK_VERIFIER',
        checkedAt
      };
    }

    if (lower.includes('risky') || lower.includes('catchall')) {
      return {
        email,
        status: 'RISKY',
        isDeliverable: true,
        isCatchAll: true,
        isDisposable: false,
        provider: 'MOCK_VERIFIER',
        checkedAt
      };
    }

    return {
      email,
      status: 'VALID',
      isDeliverable: true,
      isCatchAll: false,
      isDisposable: false,
      provider: 'MOCK_VERIFIER',
      checkedAt
    };
  }
}

/**
 * Production Email Verification Adapter (ZeroBounce / NeverBounce / MillionVerifier standard API)
 */
export class RestEmailVerificationAdapter implements IEmailVerificationAdapter {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string = 'https://api.zerobounce.net/v2/validate') {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  public async verifyEmail(email: string): Promise<VerificationResult> {
    if (!this.apiKey) {
      throw new Error('Email verification API key is not configured.');
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('email', email);

    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Email verification API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      status?: string;
      sub_status?: string;
      catch_all?: boolean;
    };

    let status: EmailVerificationStatus = 'UNVERIFIED';
    let isDeliverable = false;

    if (data.status === 'valid') {
      status = 'VALID';
      isDeliverable = true;
    } else if (data.status === 'invalid') {
      status = 'INVALID';
      isDeliverable = false;
    } else if (data.status === 'catch-all' || data.status === 'unknown') {
      status = 'RISKY';
      isDeliverable = true;
    }

    return {
      email,
      status,
      isDeliverable,
      isCatchAll: data.catch_all ?? false,
      isDisposable: data.sub_status === 'disposable',
      provider: 'REST_EMAIL_VERIFIER',
      checkedAt: new Date()
    };
  }
}
