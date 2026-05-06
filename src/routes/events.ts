import { Router } from "express";
import { eventStore } from "../services/eventStore.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(eventStore.listEvents());
});

router.get("/:id", (req, res) => {
  const event = eventStore.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({
      error: "NotFound",
      message: `Event ${req.params.id} was not found.`
    });
  }

  return res.json(event);
});

router.post("/:id/retry", (req, res, next) => {
  try {
    const result = eventStore.retry(req.params.id);
    return res.json({
      message: "Retry attempt completed.",
      event: result.record,
      attempt: result.attempt
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
