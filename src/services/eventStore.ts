import { demoEvents, providerConfigs } from "../data.js";
import type {
  FailureRecord,
  IncomingWebhookEvent,
  ProcessingAttempt,
  ProviderConfig,
  ProviderName,
  WebhookEventRecord
} from "../types.js";

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class EventStore {
  private events: WebhookEventRecord[] = [];
  private attempts: ProcessingAttempt[] = [];
  private failures: FailureRecord[] = [];

  constructor() {
    this.seedDemoData();
  }

  reset() {
    this.events = [];
    this.attempts = [];
    this.failures = [];
    this.seedDemoData();
  }

  seedDemoData() {
    for (const entry of demoEvents) {
      const provider = this.getProvider(entry.provider);
      const record = this.createReceivedEvent(provider, entry.payload);
      this.markValidated(record.id);
      this.process(record.id, false);
    }
  }

  getProviders() {
    return providerConfigs;
  }

  getProvider(name: ProviderName): ProviderConfig {
    const provider = providerConfigs.find((item) => item.name === name);
    if (!provider) {
      throw new Error(`Unsupported provider: ${name}`);
    }
    return provider;
  }

  listEvents() {
    return [...this.events].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }

  getEventById(id: string) {
    return this.events.find((event) => event.id === id) || null;
  }

  listFailures() {
    return [...this.failures].sort((a, b) => b.failedAt.localeCompare(a.failedAt));
  }

  listAttempts() {
    return [...this.attempts].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  findDuplicate(provider: ProviderName, externalEventId: string) {
    return (
      this.events.find(
        (event) => event.provider === provider && event.externalEventId === externalEventId
      ) || null
    );
  }

  createReceivedEvent(provider: ProviderConfig, payload: IncomingWebhookEvent) {
    const timestamp = nowIso();
    const record: WebhookEventRecord = {
      id: createId("evt"),
      provider: provider.name,
      providerLabel: provider.label,
      externalEventId: payload.eventId,
      eventType: payload.eventType,
      status: "received",
      idempotencyKey: payload.idempotencyKey || `${provider.name}:${payload.eventId}`,
      receivedAt: timestamp,
      lastProcessedAt: null,
      duplicateDeliveries: 0,
      processingAttempts: 0,
      latestSummary: "Inbound delivery received and queued for validation.",
      lastError: null,
      payload
    };
    this.events.push(record);
    return record;
  }

  incrementDuplicate(recordId: string) {
    const record = this.requireEvent(recordId);
    record.duplicateDeliveries += 1;
    record.latestSummary = "Duplicate delivery detected and idempotently ignored.";
    return record;
  }

  markValidated(recordId: string) {
    const record = this.requireEvent(recordId);
    record.status = "validated";
    record.latestSummary = "Payload validated and accepted into the processing pipeline.";
    return record;
  }

  process(recordId: string, isRetry: boolean) {
    const record = this.requireEvent(recordId);
    const startedAt = nowIso();
    const attemptNumber = record.processingAttempts + 1;
    const transientFailure =
      record.payload.data.simulateTransientFailure === true && attemptNumber === 1;
    const unsupportedFailure = !this.getProvider(record.provider).supportedEventTypes.includes(
      record.eventType
    );

    record.processingAttempts = attemptNumber;

    if (transientFailure || unsupportedFailure) {
      const message = transientFailure
        ? "Transient processing dependency timed out while persisting the downstream handoff."
        : `Event type ${record.eventType} is not supported for provider ${record.provider}.`;

      record.status = "failed";
      record.lastProcessedAt = nowIso();
      record.latestSummary = "Event moved to failed state and is available for retry.";
      record.lastError = message;

      const attempt: ProcessingAttempt = {
        id: createId("attempt"),
        eventRecordId: record.id,
        provider: record.provider,
        attemptNumber,
        status: "failed",
        startedAt,
        finishedAt: record.lastProcessedAt,
        errorMessage: message,
        summary: record.latestSummary
      };

      this.attempts.push(attempt);
      this.failures.push({
        id: createId("failure"),
        eventRecordId: record.id,
        provider: record.provider,
        eventType: record.eventType,
        attemptNumber,
        errorMessage: message,
        failedAt: attempt.finishedAt
      });

      return { record, attempt };
    }

    record.status = isRetry ? "retried" : "processed";
    record.lastProcessedAt = nowIso();
    record.lastError = null;
    record.latestSummary = isRetry
      ? "Retry attempt succeeded and event completed processing."
      : "Event validated, routed, and processed successfully.";

    const attempt: ProcessingAttempt = {
      id: createId("attempt"),
      eventRecordId: record.id,
      provider: record.provider,
      attemptNumber,
      status: "processed",
      startedAt,
      finishedAt: record.lastProcessedAt,
      errorMessage: null,
      summary: record.latestSummary
    };

    this.attempts.push(attempt);
    this.failures = this.failures.filter((failure) => failure.eventRecordId !== record.id);
    return { record, attempt };
  }

  retry(recordId: string) {
    const record = this.requireEvent(recordId);
    if (record.status !== "failed") {
      throw new Error("Only failed events can be retried.");
    }
    return this.process(recordId, true);
  }

  private requireEvent(id: string) {
    const record = this.getEventById(id);
    if (!record) {
      throw new Error(`Event ${id} was not found.`);
    }
    return record;
  }
}

export const eventStore = new EventStore();
