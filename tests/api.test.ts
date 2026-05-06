import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { eventStore } from "../src/services/eventStore.js";

test.beforeEach(() => {
  eventStore.reset();
});

test("GET /health returns 200", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.service, "Webhook Ingestion Pipeline");
});

test("POST /webhooks/stripe accepts a valid event", async () => {
  const response = await request(app)
    .post("/webhooks/stripe")
    .set("x-webhook-secret", "stripe-demo-secret")
    .send({
      eventId: "evt_stripe_test_200",
      eventType: "invoice.paid",
      occurredAt: "2026-05-06T14:00:00.000Z",
      data: {
        customerId: "cus_test_77",
        amount: 42000
      }
    });

  assert.equal(response.status, 202);
  assert.equal(response.body.accepted, true);
  assert.equal(response.body.duplicate, false);
  assert.equal(response.body.event.status, "processed");
});

test("duplicate webhook event is handled idempotently", async () => {
  const payload = {
    eventId: "evt_hubspot_dup_1",
    eventType: "form.submission.created",
    occurredAt: "2026-05-06T14:15:00.000Z",
    data: {
      campaign: "Enterprise SEO Governance",
      source: "webinar"
    }
  };

  await request(app)
    .post("/webhooks/hubspot")
    .set("x-webhook-secret", "hubspot-demo-secret")
    .send(payload);

  const duplicateResponse = await request(app)
    .post("/webhooks/hubspot")
    .set("x-webhook-secret", "hubspot-demo-secret")
    .send(payload);

  assert.equal(duplicateResponse.status, 202);
  assert.equal(duplicateResponse.body.duplicate, true);
  assert.equal(duplicateResponse.body.event.duplicateDeliveries, 1);
});

test("GET /api/events returns an array", async () => {
  const response = await request(app).get("/api/events");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 3);
});

test("POST /api/events/:id/retry works for a failed event", async () => {
  const createResponse = await request(app)
    .post("/webhooks/internal-app")
    .set("x-webhook-secret", "internal-demo-secret")
    .send({
      eventId: "evt_retry_001",
      eventType: "trial.conversion.started",
      occurredAt: "2026-05-06T15:00:00.000Z",
      data: {
        accountId: "acct_retry_44",
        simulateTransientFailure: true
      }
    });

  assert.equal(createResponse.body.event.status, "failed");

  const retryResponse = await request(app).post(
    `/api/events/${createResponse.body.event.id}/retry`
  );

  assert.equal(retryResponse.status, 200);
  assert.equal(retryResponse.body.event.status, "retried");
  assert.equal(retryResponse.body.attempt.attemptNumber, 2);
});
