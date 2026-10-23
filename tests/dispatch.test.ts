import { describe, it, expect, beforeEach } from 'vitest';
import { DispatchQueue } from '../src/modules/dispatch/queue.js';
import { DispatchWorker } from '../src/modules/dispatch/worker.js';
import { buildApp } from '../src/app.js';
import { VerticalSliceOrchestrator } from '../src/vertical-slice.js';

describe('DispatchQueue Manager', () => {
  let queue: DispatchQueue;

  beforeEach(() => {
    queue = new DispatchQueue();
  });

  it('enqueues jobs and retrieves ready pending jobs', () => {
    const job = queue.enqueue({
      leadEmail: 'operations@gulflogistics.ae',
      companyName: 'Gulf Logistics LLC',
      campaignName: 'GCC Fleet Outbound',
      step: 1,
      status: 'PENDING',
      scheduledAt: new Date(Date.now() - 1000) // Scheduled in the past -> ready
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe('PENDING');

    const ready = queue.getReadyJobs();
    expect(ready.length).toBe(1);
    expect(ready[0].leadEmail).toBe('operations@gulflogistics.ae');
  });

  it('deduplicates active jobs for the same email and sequence step', () => {
    const job1 = queue.enqueue({
      leadEmail: 'contact@fleet.ae',
      companyName: 'Fleet AE',
      campaignName: 'GCC Fleet Outbound',
      step: 1,
      status: 'PENDING',
      scheduledAt: new Date()
    });

    const job2 = queue.enqueue({
      leadEmail: 'contact@fleet.ae',
      companyName: 'Fleet AE',
      campaignName: 'GCC Fleet Outbound',
      step: 1,
      status: 'PENDING',
      scheduledAt: new Date()
    });

    expect(job1.id).toBe(job2.id);
    expect(queue.getCounts().total).toBe(1);
  });

  it('tracks daily sent counts by date key', () => {
    queue.recordSent('2026-10-23');
    queue.recordSent('2026-10-23');
    expect(queue.getSentCount('2026-10-23')).toBe(2);
    expect(queue.getSentCount('2026-10-24')).toBe(0);
  });
});

describe('DispatchWorker & Scheduled Runner', () => {
  let queue: DispatchQueue;

  beforeEach(() => {
    queue = new DispatchQueue();
  });

  it('correctly evaluates approved sending window for timezone and hours', () => {
    const worker = new DispatchWorker(queue, {
      schedule: {
        sendStart: '08:00',
        sendEnd: '18:00',
        timezone: 'UTC',
        sendDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        maxPerDay: 50
      }
    });

    // 10:00 UTC on a Wednesday (2026-10-21)
    const wedMorning = new Date('2026-10-21T10:00:00Z');
    const openCheck = worker.isWindowOpen(wedMorning);
    expect(openCheck.isOpen).toBe(true);

    // 21:00 UTC on a Wednesday (outside 08:00-18:00)
    const wedNight = new Date('2026-10-21T21:00:00Z');
    const nightCheck = worker.isWindowOpen(wedNight);
    expect(nightCheck.isOpen).toBe(false);
    expect(nightCheck.reason).toContain('outside approved window');

    // 12:00 UTC on a Sunday (2026-10-25)
    const sundayNoon = new Date('2026-10-25T12:00:00Z');
    const sundayCheck = worker.isWindowOpen(sundayNoon);
    expect(sundayCheck.isOpen).toBe(false);
    expect(sundayCheck.reason).toContain('not an approved dispatch day');
  });

  it('dispatches ready jobs and auto-schedules next cadence sequence step', async () => {
    const worker = new DispatchWorker(queue, {
      schedule: {
        sendStart: '00:00',
        sendEnd: '23:59',
        timezone: 'UTC',
        sendDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        maxPerDay: 100
      },
      cadence: {
        followupDelayDays: 3,
        maxSequenceSteps: 2,
        batchIntervalMinutes: 15
      }
    });

    queue.enqueue({
      leadEmail: 'prospect@emiratescargo.ae',
      companyName: 'Emirates Cargo LLC',
      campaignName: 'Test Sequence',
      step: 1,
      status: 'PENDING',
      scheduledAt: new Date(Date.now() - 5000)
    });

    const batchResult = await worker.runBatch(true);
    expect(batchResult.sentCount).toBe(1);

    const jobs = queue.getAllJobs();
    expect(jobs.length).toBe(2); // Step 1 (SENT) + Step 2 (PENDING)
    
    const step1 = jobs.find(j => j.step === 1);
    const step2 = jobs.find(j => j.step === 2);

    expect(step1?.status).toBe('SENT');
    expect(step2?.status).toBe('PENDING');
    // Step 2 scheduled roughly 3 days into future
    const delayMs = step2!.scheduledAt.getTime() - step1!.sentAt!.getTime();
    expect(delayMs).toBeGreaterThanOrEqual(3 * 24 * 3600 * 1000 - 1000);
  });

  it('implements retry backoff and caps out after maxRetries', async () => {
    let shouldFail = true;
    const worker = new DispatchWorker(
      queue,
      {
        retry: {
          maxRetries: 2,
          retryBackoffSeconds: 10,
          onBounceAction: 'suppress'
        }
      },
      () => false,
      async () => {
        if (shouldFail) throw new Error('SMTP Connection Timeout');
        return true;
      }
    );

    const job = queue.enqueue({
      leadEmail: 'retry-test@fleet.ae',
      companyName: 'Fleet LLC',
      campaignName: 'Retry Test',
      step: 1,
      status: 'PENDING',
      scheduledAt: new Date(Date.now() - 1000)
    });

    // Attempt 1 -> should become RETRYING
    const res1 = await worker.runBatch(true);
    expect(res1.retryingCount).toBe(1);
    const jobAfter1 = queue.getJob(job.id);
    expect(jobAfter1?.status).toBe('RETRYING');
    expect(jobAfter1?.retryCount).toBe(1);
    expect(jobAfter1?.nextAttemptAt).toBeDefined();

    // Fast-forward scheduled attempt time to now
    queue.updateJob(job.id, { nextAttemptAt: new Date(Date.now() - 1000) });

    // Attempt 2 -> hits maxRetries (2) -> should become FAILED
    const res2 = await worker.runBatch(true);
    expect(res2.failedCount).toBe(1);
    const jobAfter2 = queue.getJob(job.id);
    expect(jobAfter2?.status).toBe('FAILED');
    expect(jobAfter2?.retryCount).toBe(2);
  });

  it('freezes automated dispatch when emergency kill switch is activated', async () => {
    let killSwitch = true;
    const worker = new DispatchWorker(
      queue,
      undefined,
      () => killSwitch
    );

    queue.enqueue({
      leadEmail: 'frozen@test.ae',
      companyName: 'Frozen LLC',
      campaignName: 'Test',
      step: 1,
      status: 'PENDING',
      scheduledAt: new Date()
    });

    const res = await worker.runBatch(true);
    expect(res.sentCount).toBe(0);
    expect(res.reason).toContain('EMERGENCY_KILL_SWITCH_ACTIVE');
  });
});

describe('Automation Endpoints in Fastify API', () => {
  const orchestrator = new VerticalSliceOrchestrator();
  const app = buildApp(orchestrator);

  it('GET /internal/automation/settings returns configuration and worker stats', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/internal/automation/settings'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.settings.schedule.sendStart).toBeDefined();
    expect(body.stats.windowOpen).toBeDefined();
    expect(body.stats.dailyCap).toBeGreaterThan(0);
  });

  it('POST /internal/automation/settings updates worker settings in real-time', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/internal/automation/settings',
      payload: {
        schedule: {
          sendStart: '07:30',
          sendEnd: '19:30',
          maxPerDay: 75
        },
        cadence: {
          batchIntervalMinutes: 20
        }
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.settings.schedule.sendStart).toBe('07:30');
    expect(body.settings.schedule.maxPerDay).toBe(75);
    expect(body.settings.cadence.batchIntervalMinutes).toBe(20);
  });

  it('POST /internal/automation/trigger-batch triggers manual batch evaluation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/internal/automation/trigger-batch',
      payload: {
        forceWindow: true
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.result).toBeDefined();
    expect(body.stats).toBeDefined();
  });
});
