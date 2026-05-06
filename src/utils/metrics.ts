import type { FailureRecord, ProcessingAttempt, WebhookEventRecord } from "../types.js";

export function buildMetrics(events: WebhookEventRecord[], attempts: ProcessingAttempt[], failures: FailureRecord[]) {
  const byProvider = Object.fromEntries(
    [...new Set(events.map((event) => event.provider))].map((provider) => [
      provider,
      {
        totalEvents: events.filter((event) => event.provider === provider).length,
        processed: events.filter((event) => event.provider === provider && event.status === "processed").length,
        failed: events.filter((event) => event.provider === provider && event.status === "failed").length
      }
    ])
  );

  const retriesTriggered = attempts.filter((attempt) => attempt.attemptNumber > 1).length;
  const retrySuccesses = attempts.filter(
    (attempt) => attempt.attemptNumber > 1 && attempt.status === "processed"
  ).length;

  return {
    totalEvents: events.length,
    processedEvents: events.filter((event) => event.status === "processed").length,
    failedEvents: events.filter((event) => event.status === "failed").length,
    retriedEvents: events.filter((event) => event.processingAttempts > 1).length,
    duplicateDeliveriesPrevented: events.reduce((sum, event) => sum + event.duplicateDeliveries, 0),
    totalProcessingAttempts: attempts.length,
    retriesTriggered,
    retrySuccesses,
    deadLetterCount: failures.length,
    byProvider
  };
}
