import { Router } from "express";
import { acceptWebhook } from "../services/webhookService.js";
import { eventStore } from "../services/eventStore.js";
import type { ProviderName } from "../types.js";

const router = Router();

router.post("/:provider", (req, res) => {
  const providerName = req.params.provider as ProviderName;
  eventStore.getProvider(providerName);

  const result = acceptWebhook(providerName, req.header("x-webhook-secret"), req.body);
  res.status(202).json(result);
});

export default router;
