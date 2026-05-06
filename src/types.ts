export type ProviderName = "stripe" | "hubspot" | "salesforce" | "internal-app";

export type ProcessingStatus =
  | "received"
  | "validated"
  | "processed"
  | "failed"
  | "retried";

export interface ProviderConfig {
  name: ProviderName;
  label: string;
  secret: string;
  supportedEventTypes: string[];
}

export interface IncomingWebhookEvent {
  eventId: string;
  eventType: string;
  occurredAt: string;
  idempotencyKey?: string;
  data: Record<string, unknown>;
}

export interface WebhookEventRecord {
  id: string;
  provider: ProviderName;
  providerLabel: string;
  externalEventId: string;
  eventType: string;
  status: ProcessingStatus;
  idempotencyKey: string;
  receivedAt: string;
  lastProcessedAt: string | null;
  duplicateDeliveries: number;
  processingAttempts: number;
  latestSummary: string;
  lastError: string | null;
  payload: IncomingWebhookEvent;
}

export interface ProcessingAttempt {
  id: string;
  eventRecordId: string;
  provider: ProviderName;
  attemptNumber: number;
  status: "processed" | "failed";
  startedAt: string;
  finishedAt: string;
  errorMessage: string | null;
  summary: string;
}

export interface FailureRecord {
  id: string;
  eventRecordId: string;
  provider: ProviderName;
  eventType: string;
  attemptNumber: number;
  errorMessage: string;
  failedAt: string;
}
