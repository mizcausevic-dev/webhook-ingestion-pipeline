# Webhook Ingestion Pipeline

> **TypeScript webhook operations portfolio project** demonstrating multi-provider event ingestion, shared-secret verification, idempotency handling, retry workflows, and production-style operational visibility.

**Recruiter takeaway:** *"This person can design reliable backend services around real SaaS integration patterns, not just basic CRUD APIs."*

---

## Project Overview

| Attribute | Detail |
|---|---|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Express 5 |
| **Domain** | SaaS webhook ingestion and event operations |
| **Providers Modeled** | Stripe · HubSpot · Salesforce · Internal App |
| **Core Behaviors** | Secret verification · Idempotency · Failure handling · Retry operations · Metrics |
| **Docs** | Swagger UI at `/docs` |

---

## Executive Summary

Webhook Ingestion Pipeline models the kind of internal platform service revenue, product, and operations teams rely on when third-party systems need to push event data into a centralized processing layer. Instead of stopping at "receive a POST body," the project demonstrates the operational concerns that matter in production: duplicate delivery protection, event state transitions, retry workflows, failure visibility, and clear observability endpoints.

The result is a recruiter-facing backend project that feels like a real integration service sitting between vendors such as Stripe or HubSpot and a broader internal event-processing stack.

---

## Architecture

```text
Provider Webhook
    |
    v
POST /webhooks/:provider
    |
    +--> Shared-secret verification
    +--> Payload validation
    +--> Idempotency lookup
    +--> Event record creation
    +--> Processing attempt
             |
             +--> processed
             +--> failed
                      |
                      v
              GET /api/failures
              POST /api/events/:id/retry
```

### Request Flow

1. A provider sends an event to `POST /webhooks/:provider`.
2. The service verifies the provider secret from `x-webhook-secret`.
3. The payload is validated with Zod.
4. The service checks whether the `(provider, eventId)` pair has already been seen.
5. New events move through `received -> validated -> processed/failed`.
6. Failed events remain operator-visible via `/api/failures`.
7. Retries create a new processing attempt and can promote the event into `retried`.

---

## Event Lifecycle

| State | Meaning |
|---|---|
| `received` | Inbound delivery has been captured |
| `validated` | Provider and payload checks passed |
| `processed` | First-pass processing succeeded |
| `failed` | Processing failed and is awaiting operator action |
| `retried` | A later attempt succeeded after a prior failure |

### Idempotency Model

Each event is keyed by provider and external event ID, with an optional explicit `idempotencyKey`. Duplicate deliveries are accepted but not reprocessed. Instead, the service increments a `duplicateDeliveries` counter and returns the existing event record.

That mirrors the defensive patterns needed when Stripe, HubSpot, or internal event buses redeliver the same event more than once.

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Service status and uptime |
| `POST` | `/webhooks/:provider` | Receive a provider webhook |
| `GET` | `/api/events` | List webhook event records |
| `GET` | `/api/events/:id` | Fetch a single event |
| `GET` | `/api/failures` | View failed deliveries / dead-letter style records |
| `POST` | `/api/events/:id/retry` | Retry a failed event |
| `GET` | `/api/metrics` | Operational metrics summary |
| `GET` | `/docs` | Swagger / OpenAPI UI |

---

## Sample Webhook Request

```json
{
  "eventId": "evt_stripe_test_200",
  "eventType": "invoice.paid",
  "occurredAt": "2026-05-06T14:00:00.000Z",
  "data": {
    "customerId": "cus_test_77",
    "amount": 42000
  }
}
```

Example request:

```bash
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: stripe-demo-secret" \
  -d @payload.json
```

## Sample Processed Event Response

```json
{
  "accepted": true,
  "duplicate": false,
  "event": {
    "id": "evt_8d4b9d56-5f4f-4fd4-9a8b-4d8c0f583777",
    "provider": "stripe",
    "eventType": "invoice.paid",
    "status": "processed",
    "idempotencyKey": "stripe:evt_stripe_test_200",
    "duplicateDeliveries": 0,
    "processingAttempts": 1,
    "latestSummary": "Event validated, routed, and processed successfully."
  }
}
```

---

## Screenshots

### Hero Capture

![Swagger UI](https://raw.githubusercontent.com/mizcausevic-dev/webhook-ingestion-pipeline/project/webhook-ingestion-pipeline/screenshots/01-hero.png)

### Processing Workflow

![Event workflow](https://raw.githubusercontent.com/mizcausevic-dev/webhook-ingestion-pipeline/project/webhook-ingestion-pipeline/screenshots/02-feature.png)

### Validation Proof

![Test proof](https://raw.githubusercontent.com/mizcausevic-dev/webhook-ingestion-pipeline/project/webhook-ingestion-pipeline/screenshots/03-proof.png)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/mizcausevic-dev/webhook-ingestion-pipeline.git
cd webhook-ingestion-pipeline
npm install
cp .env.example .env
npm run dev
```

Visit:

- `http://localhost:3000/docs`
- `http://localhost:3000/api/events`
- `http://localhost:3000/api/metrics`

### Run Tests

```bash
npm test
```

---

## What This Demonstrates

- backend API design beyond CRUD
- webhook hardening with provider verification
- idempotency and duplicate-delivery handling
- event lifecycle modeling and operator-friendly retry flows
- production-minded observability through failures and metrics
- clean TypeScript service structure and documentation discipline

---

## Future Enhancements

- persist events and attempts in PostgreSQL
- introduce Redis or SQS-backed asynchronous workers
- add HMAC signature verification for each provider
- emit OpenTelemetry traces and structured logs
- add dead-letter replay policies and alerting hooks

---

## Tech Stack

- Node.js
- TypeScript
- Express
- Zod
- Swagger / OpenAPI
- Helmet
- CORS
- Morgan
- Node test runner + Supertest

### Portfolio Links

- [LinkedIn](https://www.linkedin.com/in/mirzacausevic)
- [Skills Page](https://mizcausevic.com/skills/)
- [Medium](https://medium.com/@mizcausevic)
- [GitHub](https://github.com/mizcausevic-dev)

---

*Part of [mizcausevic-dev's GitHub portfolio](https://github.com/mizcausevic-dev) — demonstrating webhook operations design, event reliability workflows, and production-aware backend delivery.*
