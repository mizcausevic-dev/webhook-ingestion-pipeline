import type { IncomingWebhookEvent, ProviderConfig } from "./types.js";

export const providerConfigs: ProviderConfig[] = [
  {
    name: "stripe",
    label: "Stripe Billing",
    secret: process.env.STRIPE_WEBHOOK_SECRET || "stripe-demo-secret",
    supportedEventTypes: ["invoice.paid", "customer.created", "subscription.canceled"]
  },
  {
    name: "hubspot",
    label: "HubSpot Marketing",
    secret: process.env.HUBSPOT_WEBHOOK_SECRET || "hubspot-demo-secret",
    supportedEventTypes: ["form.submission.created", "contact.updated", "deal.updated"]
  },
  {
    name: "salesforce",
    label: "Salesforce CRM",
    secret: process.env.SALESFORCE_WEBHOOK_SECRET || "salesforce-demo-secret",
    supportedEventTypes: ["deal.updated", "account.created", "opportunity.stage.changed"]
  },
  {
    name: "internal-app",
    label: "Internal Product Events",
    secret: process.env.INTERNAL_APP_WEBHOOK_SECRET || "internal-demo-secret",
    supportedEventTypes: ["user.signup", "workspace.created", "trial.conversion.started"]
  }
];

export const demoEvents: Array<{ provider: ProviderConfig["name"]; payload: IncomingWebhookEvent }> = [
  {
    provider: "stripe",
    payload: {
      eventId: "evt_stripe_001",
      eventType: "invoice.paid",
      occurredAt: "2026-05-05T14:22:00.000Z",
      data: {
        customerId: "cus_kinetic_alpha",
        invoiceId: "in_1028",
        amount: 24000,
        currency: "usd",
        plan: "enterprise-platform"
      }
    }
  },
  {
    provider: "hubspot",
    payload: {
      eventId: "evt_hubspot_003",
      eventType: "form.submission.created",
      occurredAt: "2026-05-06T09:04:00.000Z",
      data: {
        contactId: "hub_9091",
        campaign: "AI Pipeline Benchmark",
        source: "pricing-page",
        formName: "request-demo"
      }
    }
  },
  {
    provider: "internal-app",
    payload: {
      eventId: "evt_internal_010",
      eventType: "trial.conversion.started",
      occurredAt: "2026-05-06T11:30:00.000Z",
      data: {
        accountId: "acct_obsidian_18",
        simulateTransientFailure: true,
        seats: 42,
        segment: "mid-market"
      }
    }
  }
];
