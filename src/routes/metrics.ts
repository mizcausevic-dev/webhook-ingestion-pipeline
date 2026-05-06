import { Router } from "express";
import { eventStore } from "../services/eventStore.js";
import { buildMetrics } from "../utils/metrics.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(
    buildMetrics(eventStore.listEvents(), eventStore.listAttempts(), eventStore.listFailures())
  );
});

export default router;
