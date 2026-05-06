# Webhook Ingestion Pipeline Architecture

## Service overview

Webhook Ingestion Pipeline is a production-style TypeScript service that accepts third-party webhook deliveries, validates provider credentials, prevents duplicate processing, tracks processing attempts, and exposes retry and observability endpoints for operators.

## Request flow

1. A provider posts to `POST /webhooks/:provider`.
2. The service verifies the `x-webhook-secret` header against provider configuration.
3. The payload is validated with Zod.
4. The store checks for an existing `(provider, eventId)` pair.
5. New events move through `received -> validated -> processed/failed`.
6. Failed events remain visible via `/api/failures` and may be retried via `POST /api/events/:id/retry`.
7. `/api/metrics` summarizes throughput, retries, duplicates prevented, and dead-letter volume.

## Endpoint map

- `GET /health`
- `POST /webhooks/:provider`
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events/:id/retry`
- `GET /api/failures`
- `GET /api/metrics`
- `GET /docs`

## Event lifecycle

### Core states

- `received`: delivery has entered the service
- `validated`: payload and provider checks passed
- `processed`: first-pass processing completed successfully
- `failed`: processing failed and is awaiting operator attention or retry
- `retried`: a later attempt succeeded after a failed first pass

### Failure model

This project simulates a realistic transient dependency failure when an event contains `simulateTransientFailure: true`. The first processing attempt fails, the event is recorded in the failure list, and a manual retry succeeds.

## Idempotency strategy

The service uses a provider-scoped idempotency key built from:

- explicit `idempotencyKey` when supplied
- fallback of `provider:eventId`

Duplicate deliveries increment a `duplicateDeliveries` counter and are not reprocessed. This models common webhook hardening requirements for Stripe-, HubSpot-, and Salesforce-style integrations.

## Security notes

- shared-secret verification via `x-webhook-secret`
- schema validation via Zod
- no live provider credentials committed
- centralized JSON error handling
- Helmet, CORS, and request logging enabled

## Future production upgrades

- persist events and attempts in PostgreSQL
- move processing to Redis/SQS-backed async workers
- add HMAC signature verification instead of shared-secret-only simulation
- emit OpenTelemetry traces and structured logs to an observability backend
- add provider-specific replay protection windows and alerting
