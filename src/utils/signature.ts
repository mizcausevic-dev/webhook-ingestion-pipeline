import type { ProviderConfig } from "../types.js";

export function verifyWebhookSecret(secretHeader: string | undefined, provider: ProviderConfig) {
  return secretHeader === provider.secret;
}
