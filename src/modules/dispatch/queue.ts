/**
 * In-Memory & Relational Dispatch Queue Manager
 */

import { DispatchJob, JobStatus } from './types.js';

export class DispatchQueue {
  private jobs: Map<string, DispatchJob> = new Map();
  private sentDateCounts: Map<string, number> = new Map();

  /**
   * Enqueue a new dispatch job
   */
  public enqueue(jobData: Omit<DispatchJob, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>): DispatchJob {
    const existing = this.findExistingActiveJob(jobData.leadEmail, jobData.step);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const job: DispatchJob = {
      ...jobData,
      id: crypto.randomUUID(),
      retryCount: 0,
      createdAt: now,
      updatedAt: now
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Enqueue multiple jobs in batch
   */
  public enqueueBatch(items: Array<Omit<DispatchJob, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>>): DispatchJob[] {
    return items.map(item => this.enqueue(item));
  }

  /**
   * Find ready jobs ready for dispatching
   */
  public getReadyJobs(now: Date = new Date(), limit: number = 25): DispatchJob[] {
    const ready: DispatchJob[] = [];

    for (const job of this.jobs.values()) {
      if (ready.length >= limit) break;

      if (job.status === 'PENDING' && job.scheduledAt <= now) {
        ready.push(job);
      } else if (job.status === 'RETRYING') {
        const attemptTime = job.nextAttemptAt || job.scheduledAt;
        if (attemptTime <= now) {
          ready.push(job);
        }
      }
    }

    return ready;
  }

  /**
   * Update status and properties of a job
   */
  public updateJob(id: string, updates: Partial<DispatchJob>): DispatchJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob: DispatchJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  /**
   * Record that a job was successfully sent on a given date key (e.g. YYYY-MM-DD)
   */
  public recordSent(dateKey: string): void {
    const current = this.sentDateCounts.get(dateKey) || 0;
    this.sentDateCounts.set(dateKey, current + 1);
  }

  /**
   * Get total sent count for a specific date
   */
  public getSentCount(dateKey: string): number {
    return this.sentDateCounts.get(dateKey) || 0;
  }

  public getJob(id: string): DispatchJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): DispatchJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getCounts(): {
    total: number;
    pending: number;
    retrying: number;
    sent: number;
    failed: number;
  } {
    let pending = 0;
    let retrying = 0;
    let sent = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.status === 'PENDING') pending++;
      else if (job.status === 'RETRYING') retrying++;
      else if (job.status === 'SENT') sent++;
      else if (job.status === 'FAILED') failed++;
    }

    return {
      total: this.jobs.size,
      pending,
      retrying,
      sent,
      failed
    };
  }

  public clear(): void {
    this.jobs.clear();
    this.sentDateCounts.clear();
  }

  private findExistingActiveJob(email: string, step: number): DispatchJob | undefined {
    const normalizedEmail = email.toLowerCase().trim();
    for (const job of this.jobs.values()) {
      if (job.leadEmail.toLowerCase() === normalizedEmail && job.step === step) {
        if (job.status === 'PENDING' || job.status === 'RETRYING' || job.status === 'SENDING') {
          return job;
        }
      }
    }
    return undefined;
  }
}
