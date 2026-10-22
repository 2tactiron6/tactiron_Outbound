import { describe, it, expect } from 'vitest';
import { QualificationEngine } from '../src/modules/qualification/engine.js';

describe('QualificationEngine - Spreadsheet Formula Verification', () => {
  const engine = new QualificationEngine(20);

  it('matches Excel Row 7 example: Example Logistics LLC -> Warm qualified', () => {
    const result = engine.evaluate({
      leadId: 'lead-1',
      companyId: 'comp-1',
      contactId: 'cont-1',
      companyName: 'Example Logistics LLC',
      country: 'UAE',
      segmentFit: true,
      countryPermitted: true,
      teamSize: 45,
      roleIsTarget: true,
      intentSignal: true
    });

    expect(result.outcome).toBe('WARM_QUALIFIED_HAND_TO_HUMAN');
    expect(result.rationale).toBe('All three tests met');
    expect(result.teamSizeFit).toBe(true);
  });

  it('routes to Nurture when intent exists but segment is not a fit', () => {
    const result = engine.evaluate({
      leadId: 'lead-2',
      companyId: 'comp-2',
      contactId: 'cont-2',
      companyName: 'Retail Co',
      country: 'UAE',
      segmentFit: false,
      countryPermitted: true,
      teamSize: 50,
      roleIsTarget: true,
      intentSignal: true
    });

    expect(result.outcome).toBe('NURTURE_FAILS_FIT_OR_ROLE');
    expect(result.rationale).toBe('Segment not a fit.');
  });

  it('routes to Nurture when intent exists but team size is below minimum placeholder (20)', () => {
    const result = engine.evaluate({
      leadId: 'lead-3',
      companyId: 'comp-3',
      contactId: 'cont-3',
      companyName: 'Small Fleet Co',
      country: 'UAE',
      segmentFit: true,
      countryPermitted: true,
      teamSize: 15,
      roleIsTarget: true,
      intentSignal: true
    });

    expect(result.outcome).toBe('NURTURE_FAILS_FIT_OR_ROLE');
    expect(result.rationale).toBe('Team below minimum.');
  });

  it('routes to Nurture when intent exists but role is not a target', () => {
    const result = engine.evaluate({
      leadId: 'lead-4',
      companyId: 'comp-4',
      contactId: 'cont-4',
      companyName: 'Fleet Tech',
      country: 'UAE',
      segmentFit: true,
      countryPermitted: true,
      teamSize: 30,
      roleIsTarget: false,
      intentSignal: true
    });

    expect(result.outcome).toBe('NURTURE_FAILS_FIT_OR_ROLE');
    expect(result.rationale).toBe('Role not a target.');
  });

  it('combines multiple failure reasons correctly in Nurture outcome', () => {
    const result = engine.evaluate({
      leadId: 'lead-5',
      companyId: 'comp-5',
      contactId: 'cont-5',
      companyName: 'Multi Fail LLC',
      country: 'UAE',
      segmentFit: false,
      countryPermitted: true,
      teamSize: 10,
      roleIsTarget: false,
      intentSignal: true
    });

    expect(result.outcome).toBe('NURTURE_FAILS_FIT_OR_ROLE');
    expect(result.rationale).toBe('Segment not a fit. Team below minimum. Role not a target.');
  });

  it('evaluates No action when no intent signal exists', () => {
    const result = engine.evaluate({
      leadId: 'lead-6',
      companyId: 'comp-6',
      contactId: 'cont-6',
      companyName: 'Cold Prospect Co',
      country: 'UAE',
      segmentFit: true,
      countryPermitted: true,
      teamSize: 50,
      roleIsTarget: true,
      intentSignal: false
    });

    expect(result.outcome).toBe('NO_ACTION');
    expect(result.rationale).toBe('No intent signal yet');
  });

  it('enforces compliance hard-stop over nurture when country is not permitted', () => {
    // Reconciling the Excel formula bug with the spec: prohibited leads CANNOT be nurtured
    const result = engine.evaluate({
      leadId: 'lead-7',
      companyId: 'comp-7',
      contactId: 'cont-7',
      companyName: 'Sanctioned Region LLC',
      country: 'XX',
      segmentFit: true,
      countryPermitted: false,
      teamSize: 100,
      roleIsTarget: true,
      intentSignal: true
    });

    expect(result.outcome).toBe('SUPPRESSED_OR_BLOCKED');
    expect(result.rationale).toBe('Country not permitted.');
  });

  it('respects configurable minimum team size thresholds', () => {
    const customEngine = new QualificationEngine(50);
    const result = customEngine.evaluate({
      leadId: 'lead-8',
      companyId: 'comp-8',
      contactId: 'cont-8',
      companyName: 'Fleet Medium',
      country: 'UAE',
      segmentFit: true,
      countryPermitted: true,
      teamSize: 35, // passes default (20), but fails custom (50)
      roleIsTarget: true,
      intentSignal: true
    });

    expect(result.outcome).toBe('NURTURE_FAILS_FIT_OR_ROLE');
    expect(result.rationale).toBe('Team below minimum.');
  });
});
