import { Router } from "express";
import { eventStore } from "../services/eventStore.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(eventStore.listFailures());
});

export default router;
