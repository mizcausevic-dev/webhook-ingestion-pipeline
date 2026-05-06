import { Router } from "express";

const router = Router();
const startedAt = Date.now();

router.get("/", (_req, res) => {
  res.json({
    service: "Webhook Ingestion Pipeline",
    status: "ok",
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString()
  });
});

export default router;
