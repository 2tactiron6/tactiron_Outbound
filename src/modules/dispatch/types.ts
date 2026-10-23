/**
 * Dispatch Queue & Scheduled Worker Types
 */

export interface DispatchScheduleConfig {
  sendStart: string;         // e.g. "08:00"
  sendEnd: string;           // e.g. "18:00"
  timezone: string;          // e.g. "Asia/Dubai"
  sendDays: string[];        // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
  maxPerDay: number;         // e.g. 50
}

export interface DispatchCadenceConfig {
  followupDelayDays: number;     // e.g. 3
  maxSequenceSteps: number;      // e.g. 4
  batchIntervalMinutes: number;  // e.g. 15
}

export interface DispatchRetryConfig {
  maxRetries: number;            // e.g. 3
  retryBackoffSeconds: number;   // e.g. 60
  onBounceAction: 'suppress' | 'retry_once' | 'flag';
}

export interface DispatchClassificationConfig {
  confidenceThreshold: number;  // e.g. 85
  qaMode: 'full_review' | 'sample_review' | 'auto';
}

export interface AutomationSettings {
  schedule: DispatchScheduleConfig;
  cadence: DispatchCadenceConfig;
  retry: DispatchRetryConfig;
  classification: DispatchClassificationConfig;
}

export type JobStatus = 
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'RETRYING'
  | 'FAILED'
  | 'SUPPRESSED'
  | 'BLOCKED_WINDOW'
  | 'BLOCKED_CAP';

export interface DispatchJob {
  id: string;
  leadEmail: string;
  companyName: string;
  campaignName: string;
  step: number;
  status: JobStatus;
  scheduledAt: Date;
  nextAttemptAt?: Date;
  sentAt?: Date;
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueStats {
  totalJobs: number;
  pendingCount: number;
  sentTodayCount: number;
  retryingCount: number;
  failedCount: number;
  dailyCap: number;
  remainingCapacityToday: number;
  windowOpen: boolean;
  windowReason?: string;
  currentTimeInTz: string;
  currentDayInTz: string;
  isWorkerRunning: boolean;
}

export interface BatchDispatchResult {
  triggeredAt: Date;
  processedCount: number;
  sentCount: number;
  failedCount: number;
  retryingCount: number;
  skippedWindowCount: number;
  skippedCapCount: number;
  windowOpen: boolean;
  reason?: string;
  details: Array<{
    jobId: string;
    email: string;
    status: JobStatus;
    message?: string;
  }>;
}
