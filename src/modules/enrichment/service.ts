/**
 * Lead Enrichment & Verification Orchestrator
 * Implements Stage 2:
 * 1. Identifies missing fields
 * 2. Cascades through Apollo, Clay, and Email Verifier
 * 3. Non-destructively merges verified attributes
 * 4. Suppresses invalid emails immediately
 * 5. Gates progression to qualification
 */

import { Company, Contact, EmailVerificationStatus } from '../../core/types/index.js';
import { IApolloAdapter } from '../../integrations/apollo/adapter.js';
import { IClayAdapter, ClayEnrichmentResult } from '../../integrations/clay/adapter.js';
import { IEmailVerificationAdapter } from '../../integrations/email-verify/adapter.js';

export interface EnrichmentMissingFields {
  companyTeamSize: boolean;
  companyIndustry: boolean;
  contactJobTitle: boolean;
  contactPhone: boolean;
  emailVerification: boolean;
}

export interface EnrichmentExecutionResult {
  canProceedToQualification: boolean;
  missingFieldsIdentified: string[];
  missingFieldsRemaining: string[];
  emailVerificationStatus: EmailVerificationStatus;
  company: Company;
  contact: Contact;
  operationsPerformed: string[];
  auditLog: string;
}

// PTT platform target industries
const PTT_TARGET_INDUSTRIES = [
  'logistics',
  'transport',
  'transportation',
  'freight',
  'fleet',
  'dispatch',
  'security',
  'construction',
  'field services',
  'aviation ground',
  'mining'
];

// Target roles for PTT decision makers
const PTT_TARGET_ROLES = [
  'operations',
  'fleet',
  'dispatch',
  'logistics',
  'transport',
  'security',
  'field service',
  'managing director',
  'vp operations',
  'director of operations'
];

export class EnrichmentService {
  private apolloAdapter: IApolloAdapter;
  private clayAdapter: IClayAdapter;
  private emailVerifier: IEmailVerificationAdapter;

  constructor(
    apolloAdapter: IApolloAdapter,
    clayAdapter: IClayAdapter,
    emailVerifier: IEmailVerificationAdapter
  ) {
    this.apolloAdapter = apolloAdapter;
    this.clayAdapter = clayAdapter;
    this.emailVerifier = emailVerifier;
  }

  /**
   * Identifies which critical fields are missing from company and contact
   */
  public identifyMissingFields(company: Company, contact: Contact): EnrichmentMissingFields {
    return {
      companyTeamSize: company.teamSize === undefined || company.teamSize === null || company.teamSize === 0,
      companyIndustry: !company.industry || company.industry.trim() === '',
      contactJobTitle: !contact.jobTitle || contact.jobTitle.trim() === '',
      contactPhone: !contact.phone || contact.phone.trim() === '',
      emailVerification: contact.verificationStatus === 'UNVERIFIED'
    };
  }

  /**
   * Executes the enrichment waterfall
   */
  public async enrich(company: Company, contact: Contact): Promise<EnrichmentExecutionResult> {
    const missing = this.identifyMissingFields(company, contact);
    const operationsPerformed: string[] = [];
    const missingIdentifiedList = Object.entries(missing)
      .filter(([_, isMissing]) => isMissing)
      .map(([field]) => field);

    const now = new Date();

    // 1. Email Verification Step (Priority 1: Protect Domain Reputation)
    if (missing.emailVerification) {
      const verifyResult = await this.emailVerifier.verifyEmail(contact.email);
      contact.verificationStatus = verifyResult.status;
      contact.verificationMetadata = {
        provider: verifyResult.provider,
        verifiedAt: verifyResult.checkedAt.toISOString(),
        isCatchAll: verifyResult.isCatchAll,
        isDeliverable: verifyResult.isDeliverable
      };
      operationsPerformed.push(`Email verified via ${verifyResult.provider}: status=${verifyResult.status}`);

      // Hard stop on invalid email: prevent outreach
      if (verifyResult.status === 'INVALID') {
        contact.status = 'SUPPRESSED';
        operationsPerformed.push('Contact marked SUPPRESSED due to invalid email deliverability.');
        return {
          canProceedToQualification: false,
          missingFieldsIdentified: missingIdentifiedList,
          missingFieldsRemaining: ['emailDeliverable'],
          emailVerificationStatus: 'INVALID',
          company,
          contact,
          operationsPerformed,
          auditLog: `Enrichment halted: Email ${contact.email} is undeliverable.`
        };
      }
    }

    // 2. Company Enrichment via Apollo (Team Size & Industry)
    if (missing.companyTeamSize || missing.companyIndustry) {
      try {
        const orgData = await this.apolloAdapter.enrichOrganization(company.domain);
        if (orgData) {
          if (missing.companyTeamSize && orgData.estimated_num_employees) {
            company.teamSize = orgData.estimated_num_employees;
            operationsPerformed.push(`Company team size enriched: ${company.teamSize} employees`);
          }
          if (missing.companyIndustry && orgData.industry) {
            company.industry = orgData.industry;
            operationsPerformed.push(`Company industry enriched: ${company.industry}`);
          }
          company.provenance.enrichedAt = now.toISOString();
          company.provenance.enrichmentSource = 'Apollo Org API';
        }
      } catch (err) {
        operationsPerformed.push(`Apollo org enrichment error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Evaluate Segment Fit based on industry
    if (company.industry) {
      const lowerInd = company.industry.toLowerCase();
      company.segmentFit = PTT_TARGET_INDUSTRIES.some(ind => lowerInd.includes(ind));
    }

    // 3. Contact Role / Phone Enrichment via Clay
    if (missing.contactJobTitle || missing.contactPhone) {
      try {
        const clayTrigger = await this.clayAdapter.triggerEnrichment({
          leadId: contact.id,
          companyName: company.name,
          domain: company.domain,
          contactEmail: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          country: contact.country
        });
        operationsPerformed.push(`Triggered Clay table enrichment: executionId=${clayTrigger.executionId}`);
      } catch (err) {
        operationsPerformed.push(`Clay trigger error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Evaluate Role Target based on title
    if (contact.jobTitle) {
      const lowerTitle = contact.jobTitle.toLowerCase();
      contact.roleIsTarget = PTT_TARGET_ROLES.some(role => lowerTitle.includes(role));
    }

    company.updatedAt = now;
    contact.updatedAt = now;

    // Remaining missing fields check
    const remainingMissing = this.identifyMissingFields(company, contact);
    const missingRemainingList = Object.entries(remainingMissing)
      .filter(([_, isMissing]) => isMissing)
      .map(([field]) => field);

    // Gate progression: Can proceed if email is not invalid and essential company data exists
    const canProceedToQualification = contact.verificationStatus !== 'INVALID' && !!company.domain;

    return {
      canProceedToQualification,
      missingFieldsIdentified: missingIdentifiedList,
      missingFieldsRemaining: missingRemainingList,
      emailVerificationStatus: contact.verificationStatus,
      company,
      contact,
      operationsPerformed,
      auditLog: `Enrichment completed. ${operationsPerformed.join(' | ')}`
    };
  }

  /**
   * Handles asynchronous Clay callback webhook
   */
  public applyClayCallback(company: Company, contact: Contact, callbackData: ClayEnrichmentResult): void {
    if (callbackData.employeeCount && !company.teamSize) {
      company.teamSize = callbackData.employeeCount;
    }
    if (callbackData.industry && !company.industry) {
      company.industry = callbackData.industry;
      const lowerInd = company.industry.toLowerCase();
      company.segmentFit = PTT_TARGET_INDUSTRIES.some(ind => lowerInd.includes(ind));
    }
    if (callbackData.jobTitle && !contact.jobTitle) {
      contact.jobTitle = callbackData.jobTitle;
      const lowerTitle = contact.jobTitle.toLowerCase();
      contact.roleIsTarget = PTT_TARGET_ROLES.some(role => lowerTitle.includes(role));
    }
    if (callbackData.phone && !contact.phone) {
      contact.phone = callbackData.phone;
    }

    company.provenance.enrichedAt = new Date().toISOString();
    company.provenance.enrichmentSource = 'Clay Webhook';
    company.updatedAt = new Date();
    contact.updatedAt = new Date();
  }
}
