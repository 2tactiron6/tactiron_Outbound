import { describe, it, expect } from 'vitest';
import { ApolloDiscoveryService } from '../src/modules/leads/apollo-discovery.js';
import { ApolloCsvImporter } from '../src/modules/leads/apollo-csv.js';
import { MockApolloAdapter } from '../src/integrations/apollo/adapter.js';
import { buildApp } from '../src/app.js';
import { VerticalSliceOrchestrator } from '../src/vertical-slice.js';

describe('Apollo Lead Generation & Discovery', () => {
  it('discovers target PTT leads via Apollo search criteria and evaluates compliance', async () => {
    const adapter = new MockApolloAdapter();
    const service = new ApolloDiscoveryService(adapter);

    const report = await service.discoverLeads({
      countries: ['United Arab Emirates', 'Kenya'],
      titles: ['Operations & Fleet Director', 'Head of Logistics & Security']
    });

    expect(report.totalDiscovered).toBe(2);
    expect(report.newCompaniesCount).toBe(2);
    expect(report.newContactsCount).toBe(2);
    expect(report.eligibleForOutreachCount).toBe(2);
    expect(report.blockedByComplianceCount).toBe(0);

    const uaeLead = report.leads.find(l => l.ingestion.contact.country === 'AE');
    expect(uaeLead).toBeDefined();
    expect(uaeLead?.ingestion.contact.email).toBe('rashid@emiratesdispatch.ae');
    expect(uaeLead?.ingestion.company.teamSize).toBe(48);
    expect(uaeLead?.compliance.allowed).toBe(true);
    expect(uaeLead?.ingestion.company.provenance.source).toBe('Apollo');
  });

  it('correctly flags compliance blocks when Apollo leads are in strict opt-in markets (e.g. Germany cold email)', async () => {
    const adapter = new MockApolloAdapter();
    const service = new ApolloDiscoveryService(adapter);

    const report = await service.discoverLeads({
      countries: ['Germany']
    });

    expect(report.totalDiscovered).toBe(1);
    const germanLead = report.leads[0];
    expect(germanLead.ingestion.contact.country).toBe('DE');
    expect(germanLead.compliance.allowed).toBe(false);
    expect(germanLead.compliance.reasonCode).toBe('CHANNEL_EMAIL_NOT_PERMITTED_IN_DE');
    expect(report.blockedByComplianceCount).toBe(1);
  });
});

describe('Apollo CSV Batch Importer', () => {
  const importer = new ApolloCsvImporter();

  it('parses standard Apollo CSV exports and normalizes fields', () => {
    const sampleCsv = `First Name,Last Name,Title,Company,Email,Email Status,# Employees,Country,Website
Zayd,Mansoor,Fleet Operations Manager,Dubai Courier LLC,zayd@dubaicourier.ae,verified,65,United Arab Emirates,dubaicourier.ae
Klaus,Weber,Head of Logistics,Bavaria Transport,klaus@bavaria.de,verified,110,Germany,bavaria.de
Invalid,Record,No Email Co,,notanemail,unavailable,10,UAE,`;

    const result = importer.importCsvText(sampleCsv);

    expect(result.totalRows).toBe(3);
    expect(result.importedContacts).toBe(2);
    expect(result.skippedCount).toBe(1); // Skipped row with empty email/website
    expect(result.importedCompanies).toBe(2);
    expect(result.eligibleCount).toBe(1); // UAE email allowed
    expect(result.blockedCount).toBe(1);  // Germany email blocked
  });
});

describe('Apollo API Endpoints in Fastify', () => {
  const orchestrator = new VerticalSliceOrchestrator();
  const app = buildApp(orchestrator);

  it('POST /leads/discover/apollo discovers and returns compliance-checked leads', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/leads/discover/apollo',
      payload: {
        countries: ['United Arab Emirates', 'Kenya'],
        minEmployees: 20
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.report.totalDiscovered).toBeGreaterThan(0);
    expect(body.report.leads[0].contactEmail).toBeDefined();
  });

  it('POST /leads/import/apollo-csv imports CSV text directly into the system', async () => {
    const sampleCsv = `First Name,Last Name,Title,Company,Email,Email Status,# Employees,Country,Website
Fatima,Zahra,Dispatch Manager,Abu Dhabi Freight,fatima@adfreight.ae,verified,35,UAE,adfreight.ae`;

    const res = await app.inject({
      method: 'POST',
      url: '/leads/import/apollo-csv',
      payload: {
        csvContent: sampleCsv
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.result.importedContacts).toBe(1);
    expect(body.result.eligibleCount).toBe(1);
  });
});
