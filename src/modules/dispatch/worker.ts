/**
 * Automated Dispatch Worker & Queue Runner
 * Uses node-cron to trigger automated batch sends during approved sending windows.
 */

import cron, { ScheduledTask } from 'node-cron';
import { DispatchQueue } from './queue.js';
import {
  AutomationSettings,
  BatchDispatchResult,
  QueueStats,
  DispatchJob
} from './types.js';

export class DispatchWorker {
  private queue: DispatchQueue;
  private settings: AutomationSettings;
  private cronTask: ScheduledTask | null = null;
  private isRunning: boolean = false;
  private isProcessingBatch: boolean = false;
  private isKillSwitchActiveProvider: () => boolean;
  private sendOutreachFn?: (job: DispatchJob) => Promise<boolean>;

  constructor(
    queue: DispatchQueue = new DispatchQueue(),
    initialSettings?: Partial<AutomationSettings>,
    isKillSwitchActiveProvider: () => boolean = () => false,
    sendOutreachFn?: (job: DispatchJob) => Promise<boolean>
  ) {
    this.queue = queue;
    this.isKillSwitchActiveProvider = isKillSwitchActiveProvider;
    this.sendOutreachFn = sendOutreachFn;

    this.settings = {
      schedule: {
        sendStart: '08:00',
        sendEnd: '18:00',
        timezone: 'Asia/Dubai',
        sendDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        maxPerDay: 50,
        ...initialSettings?.schedule
      },
      cadence: {
        followupDelayDays: 3,
        maxSequenceSteps: 4,
        batchIntervalMinutes: 15,
        ...initialSettings?.cadence
      },
      retry: {
        maxRetries: 3,
        retryBackoffSeconds: 60,
        onBounceAction: 'suppress',
        ...initialSettings?.retry
      },
      classification: {
        confidenceThreshold: 85,
        qaMode: 'full_review',
        ...initialSettings?.classification
      }
    };
  }

  /**
   * Start the automated background cron runner
   */
  public start(): void {
    if (this.isRunning) return;

    // Convert batch interval in minutes to cron expression
    // e.g. 15 minutes -> */15 * * * *
    const intervalMinutes = Math.max(1, Math.min(60, this.settings.cadence.batchIntervalMinutes));
    const cronExpr = `*/${intervalMinutes} * * * *`;

    this.cronTask = cron.schedule(cronExpr, async () => {
      await this.runBatch(false);
    });

    this.isRunning = true;
  }

  /**
   * Stop the background cron runner
   */
  public stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isRunning = false;
  }

  /**
   * Update automation settings in real-time
   */
  public updateSettings(newSettings: Partial<AutomationSettings>): AutomationSettings {
    if (newSettings.schedule) {
      this.settings.schedule = { ...this.settings.schedule, ...newSettings.schedule };
    }
    if (newSettings.cadence) {
      const prevInterval = this.settings.cadence.batchIntervalMinutes;
      this.settings.cadence = { ...this.settings.cadence, ...newSettings.cadence };
      
      // Reschedule if interval changed while running
      if (this.isRunning && newSettings.cadence.batchIntervalMinutes !== prevInterval) {
        this.stop();
        this.start();
      }
    }
    if (newSettings.retry) {
      this.settings.retry = { ...this.settings.retry, ...newSettings.retry };
    }
    if (newSettings.classification) {
      this.settings.classification = { ...this.settings.classification, ...newSettings.classification };
    }

    return this.getSettings();
  }

  public getSettings(): AutomationSettings {
    return JSON.parse(JSON.stringify(this.settings));
  }

  public getQueue(): DispatchQueue {
    return this.queue;
  }

  /**
   * Check if the current time in the configured timezone falls within approved window
   */
  public isWindowOpen(now: Date = new Date()): {
    isOpen: boolean;
    reason?: string;
    currentTimeStr: string;
    currentDay: string;
    dateKey: string;
  } {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: this.settings.schedule.timezone || 'Asia/Dubai',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(now);
      const day = parts.find(p => p.type === 'weekday')?.value || 'Mon';
      const year = parts.find(p => p.type === 'year')?.value || '2026';
      const month = parts.find(p => p.type === 'month')?.value || '01';
      const dayNum = parts.find(p => p.type === 'day')?.value || '01';
      const hourStr = parts.find(p => p.type === 'hour')?.value || '00';
      const minStr = parts.find(p => p.type === 'minute')?.value || '00';

      const currentTimeStr = `${hourStr}:${minStr}`;
      const dateKey = `${year}-${month}-${dayNum}`;

      // 1. Day of Week Check
      const allowedDays = (this.settings.schedule.sendDays || []).map(d => d.slice(0, 3).toLowerCase());
      const currentDayNorm = day.slice(0, 3).toLowerCase();

      if (!allowedDays.includes(currentDayNorm)) {
        return {
          isOpen: false,
          reason: `Current day (${day}) is not an approved dispatch day [${this.settings.schedule.sendDays.join(', ')}] in ${this.settings.schedule.timezone}`,
          currentTimeStr,
          currentDay: day,
          dateKey
        };
      }

      // 2. Sending Window Hours Check
      const [startH, startM] = this.settings.schedule.sendStart.split(':').map(Number);
      const [endH, endM] = this.settings.schedule.sendEnd.split(':').map(Number);

      const currentMinutes = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10);
      const startMinutes = (isNaN(startH) ? 8 : startH) * 60 + (isNaN(startM) ? 0 : startM);
      const endMinutes = (isNaN(endH) ? 18 : endH) * 60 + (isNaN(endM) ? 0 : endM);

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return {
          isOpen: false,
          reason: `Current time (${currentTimeStr}) is outside approved window (${this.settings.schedule.sendStart} - ${this.settings.schedule.sendEnd}) in ${this.settings.schedule.timezone}`,
          currentTimeStr,
          currentDay: day,
          dateKey
        };
      }

      return {
        isOpen: true,
        currentTimeStr,
        currentDay: day,
        dateKey
      };
    } catch (err: any) {
      return {
        isOpen: false,
        reason: `Timezone calculation error: ${err.message}`,
        currentTimeStr: '00:00',
        currentDay: 'Unknown',
        dateKey: new Date().toISOString().slice(0, 10)
      };
    }
  }

  /**
   * Run a dispatch batch through the queue
   * @param forceWindow - If true, bypasses the approved window check (useful for manual test triggers)
   */
  public async runBatch(forceWindow: boolean = false): Promise<BatchDispatchResult> {
    const now = new Date();
    const windowCheck = this.isWindowOpen(now);

    const result: BatchDispatchResult = {
      triggeredAt: now,
      processedCount: 0,
      sentCount: 0,
      failedCount: 0,
      retryingCount: 0,
      skippedWindowCount: 0,
      skippedCapCount: 0,
      windowOpen: windowCheck.isOpen,
      reason: windowCheck.reason,
      details: []
    };

    // 1. Emergency Kill Switch check
    if (this.isKillSwitchActiveProvider()) {
      result.reason = 'EMERGENCY_KILL_SWITCH_ACTIVE: All outbound automated sending is frozen.';
      return result;
    }

    // 2. Dispatch Window check (unless forceWindow is set)
    if (!windowCheck.isOpen && !forceWindow) {
      result.skippedWindowCount = this.queue.getCounts().pending;
      return result;
    }

    if (this.isProcessingBatch) {
      result.reason = 'ALREADY_PROCESSING: Previous batch run is currently active.';
      return result;
    }

    this.isProcessingBatch = true;

    try {
      const dateKey = windowCheck.dateKey;
      const sentToday = this.queue.getSentCount(dateKey);
      const maxPerDay = this.settings.schedule.maxPerDay;
      const remainingToday = Math.max(0, maxPerDay - sentToday);

      if (remainingToday <= 0 && !forceWindow) {
        result.reason = `DAILY_SENDING_CAP_REACHED: Daily limit of ${maxPerDay} emails already sent today.`;
        result.skippedCapCount = this.queue.getCounts().pending;
        return result;
      }

      // Pick ready jobs up to remaining daily capacity
      const batchLimit = Math.min(remainingToday || 25, 25);
      const readyJobs = this.queue.getReadyJobs(now, batchLimit);

      for (const job of readyJobs) {
        result.processedCount++;
        this.queue.updateJob(job.id, { status: 'SENDING' });

        try {
          // Perform outreach dispatch (either custom handler or default simulated send)
          let sendSuccess = true;
          if (this.sendOutreachFn) {
            sendSuccess = await this.sendOutreachFn(job);
          } else {
            // Default simulator send: successful
            sendSuccess = true;
          }

          if (sendSuccess) {
            const sentAt = new Date();
            this.queue.updateJob(job.id, {
              status: 'SENT',
              sentAt,
              lastError: undefined
            });
            this.queue.recordSent(dateKey);
            result.sentCount++;

            result.details.push({
              jobId: job.id,
              email: job.leadEmail,
              status: 'SENT',
              message: `Step ${job.step} dispatched successfully to ${job.leadEmail}`
            });

            // Schedule next sequence step if configured
            if (job.step < this.settings.cadence.maxSequenceSteps) {
              const nextStepDelayMs = this.settings.cadence.followupDelayDays * 24 * 60 * 60 * 1000;
              const nextStepDate = new Date(sentAt.getTime() + nextStepDelayMs);
              
              this.queue.enqueue({
                leadEmail: job.leadEmail,
                companyName: job.companyName,
                campaignName: job.campaignName,
                step: job.step + 1,
                status: 'PENDING',
                scheduledAt: nextStepDate
              });
            }
          } else {
            throw new Error('Provider dispatch reported delivery error');
          }

        } catch (err: any) {
          const nextRetry = job.retryCount + 1;
          const maxRetries = this.settings.retry.maxRetries;

          if (nextRetry < maxRetries) {
            // Exponential/linear retry delay
            const backoffMs = this.settings.retry.retryBackoffSeconds * 1000 * Math.pow(2, nextRetry - 1);
            const nextAttemptAt = new Date(Date.now() + backoffMs);

            this.queue.updateJob(job.id, {
              status: 'RETRYING',
              retryCount: nextRetry,
              nextAttemptAt,
              lastError: err.message
            });
            result.retryingCount++;

            result.details.push({
              jobId: job.id,
              email: job.leadEmail,
              status: 'RETRYING',
              message: `Attempt ${nextRetry}/${maxRetries} failed: ${err.message}. Retrying at ${nextAttemptAt.toISOString()}`
            });
          } else {
            // Exhausted retries -> FAILED
            this.queue.updateJob(job.id, {
              status: 'FAILED',
              retryCount: nextRetry,
              lastError: `Max retries exhausted (${maxRetries}): ${err.message}`
            });
            result.failedCount++;

            result.details.push({
              jobId: job.id,
              email: job.leadEmail,
              status: 'FAILED',
              message: `Failed after ${maxRetries} attempts: ${err.message}`
            });
          }
        }
      }

      return result;
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * Get queue statistics and operational health
   */
  public getStats(): QueueStats {
    const now = new Date();
    const windowCheck = this.isWindowOpen(now);
    const counts = this.queue.getCounts();
    const sentToday = this.queue.getSentCount(windowCheck.dateKey);
    const maxPerDay = this.settings.schedule.maxPerDay;

    return {
      totalJobs: counts.total,
      pendingCount: counts.pending,
      sentTodayCount: sentToday,
      retryingCount: counts.retrying,
      failedCount: counts.failed,
      dailyCap: maxPerDay,
      remainingCapacityToday: Math.max(0, maxPerDay - sentToday),
      windowOpen: windowCheck.isOpen,
      windowReason: windowCheck.reason,
      currentTimeInTz: windowCheck.currentTimeStr,
      currentDayInTz: windowCheck.currentDay,
      isWorkerRunning: this.isRunning
    };
  }
}
