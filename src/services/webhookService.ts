import { z } from "zod";
import { eventStore } from "./eventStore.js";
import { verifyWebhookSecret } from "../utils/signature.js";
import type { ProviderName } from "../types.js";

const webhookSchema = z.object({
  eventId: z.string().min(3),
  eventType: z.string().min(3),
  occurredAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  idempotencyKey: z.string().min(3).optional(),
  data: z.record(z.any())
});

export function acceptWebhook(providerName: ProviderName, secretHeader: string | undefined, payload: unknown) {
  const provider = eventStore.getProvider(providerName);

  if (!verifyWebhookSecret(secretHeader, provider)) {
    const error = new Error("Webhook signature or shared secret verification failed.") as Error & {
      statusCode?: number;
    };
    error.statusCode = 401;
    throw error;
  }

  const parsedPayload = webhookSchema.parse(payload);
  const duplicate = eventStore.findDuplicate(providerName, parsedPayload.eventId);

  if (duplicate) {
    const record = eventStore.incrementDuplicate(duplicate.id);
    return {
      accepted: true,
      duplicate: true,
      event: record
    };
  }

  const record = eventStore.createReceivedEvent(provider, parsedPayload);
  eventStore.markValidated(record.id);
  const result = eventStore.process(record.id, false);

  return {
    accepted: true,
    duplicate: false,
    event: result.record,
    latestAttempt: result.attempt
  };
}
