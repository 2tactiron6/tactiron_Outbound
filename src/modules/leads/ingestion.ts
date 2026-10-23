/**
 * Lead Ingestion & Deduplication Service
 * Ingests prospective leads, normalizes records, and avoids duplicate side effects.
 */

import { Company, Contact, EmailVerificationStatus } from '../../core/types/index.js';

export interface RawLeadImport {
  companyName: string;
  domain: string;
  website?: string;
  country: string;
  region?: 'GCC' | 'AFRICA' | 'EUROPE' | 'OTHER';
  industry?: string;
  teamSize?: number;
  segmentFit?: boolean;
  companyPhone?: string;
  contactEmail: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  phone?: string;
  roleIsTarget?: boolean;
  source: string;
  sourceId?: string;
  emailDeliverability?: 'deliverable' | 'risky' | 'undeliverable' | 'unknown';
}

export interface IngestionResult {
  company: Company;
  contact: Contact;
  isNewCompany: boolean;
  isNewContact: boolean;
}

export class LeadIngestionService {
  private companiesByDomain: Map<string, Company> = new Map();
  private contactsByEmail: Map<string, Contact> = new Map();

  public normalizeDomain(input: string): string {
    let domain = input.toLowerCase().trim();
    domain = domain.replace(/^https?:\/\//i, '');
    domain = domain.replace(/^www\./i, '');
    domain = domain.split('/')[0];
    return domain;
  }

  public normalizeEmail(input: string): string {
    return input.toLowerCase().trim();
  }

  public ingest(raw: RawLeadImport): IngestionResult {
    const normalizedDomain = this.normalizeDomain(raw.domain || raw.website || raw.contactEmail.split('@')[1]);
    const normalizedEmail = this.normalizeEmail(raw.contactEmail);
    const now = new Date();

    // 1. Ingest or Merge Company
    let isNewCompany = false;
    let company = this.companiesByDomain.get(normalizedDomain);

    if (!company) {
      isNewCompany = true;
      company = {
        id: crypto.randomUUID(),
        name: raw.companyName.trim(),
        domain: normalizedDomain,
        website: raw.website,
        country: raw.country.toUpperCase().trim(),
        region: raw.region,
        industry: raw.industry,
        segmentFit: raw.segmentFit ?? false,
        teamSize: raw.teamSize,
        companyPhone: raw.companyPhone?.trim(),
        accountStatus: 'PROSPECT',
        provenance: {
          source: raw.source,
          sourceId: raw.sourceId,
          importedAt: now.toISOString()
        },
        createdAt: now,
        updatedAt: now
      };
      this.companiesByDomain.set(normalizedDomain, company);
    } else {
      // Merge updates without destroying existing verified values
      if (!company.teamSize && raw.teamSize) company.teamSize = raw.teamSize;
      if (!company.industry && raw.industry) company.industry = raw.industry;
      if (!company.companyPhone && raw.companyPhone) company.companyPhone = raw.companyPhone.trim();
      if (raw.segmentFit !== undefined) company.segmentFit = raw.segmentFit;
      company.updatedAt = now;
    }

    // 2. Ingest or Merge Contact
    let isNewContact = false;
    let contact = this.contactsByEmail.get(normalizedEmail);

    let verificationStatus: EmailVerificationStatus = 'UNVERIFIED';
    if (raw.emailDeliverability === 'deliverable') verificationStatus = 'VALID';
    else if (raw.emailDeliverability === 'risky') verificationStatus = 'RISKY';
    else if (raw.emailDeliverability === 'undeliverable') verificationStatus = 'INVALID';

    if (!contact) {
      isNewContact = true;
      contact = {
        id: crypto.randomUUID(),
        companyId: company.id,
        email: normalizedEmail,
        firstName: raw.firstName?.trim(),
        lastName: raw.lastName?.trim(),
        jobTitle: raw.jobTitle?.trim(),
        roleIsTarget: raw.roleIsTarget ?? false,
        phone: raw.phone?.trim(),
        country: raw.country.toUpperCase().trim(),
        verificationStatus,
        status: verificationStatus === 'INVALID' ? 'SUPPRESSED' : 'NEW',
        createdAt: now,
        updatedAt: now
      };
      this.contactsByEmail.set(normalizedEmail, contact);
    } else {
      // Retain existing valid data
      if (!contact.jobTitle && raw.jobTitle) contact.jobTitle = raw.jobTitle.trim();
      if (!contact.phone && raw.phone) contact.phone = raw.phone.trim();
      if (raw.roleIsTarget !== undefined) contact.roleIsTarget = raw.roleIsTarget;
      contact.updatedAt = now;
    }

    return {
      company,
      contact,
      isNewCompany,
      isNewContact
    };
  }

  public getCompany(domain: string): Company | undefined {
    return this.companiesByDomain.get(this.normalizeDomain(domain));
  }

  public getContact(email: string): Contact | undefined {
    return this.contactsByEmail.get(this.normalizeEmail(email));
  }
}
