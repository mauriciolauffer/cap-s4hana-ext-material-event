# Introduction

## What we are building

In this workshop you will build a **Business Partner Validation** application — a cloud extension to SAP S/4HANA running on SAP Business Technology Platform (BTP).

The business problem it solves: when a new Business Partner is created or changed in S/4HANA, an internal team needs to review and validate it before it can be used in sales processes. S/4HANA has no built-in workflow for this — so we build one as an extension, without touching the core system.

The finished application will:
- Receive events from S/4HANA when a Business Partner is created or updated
- Automatically create a **Notification** record with the Business Partner's details and addresses
- Present those notifications in a Fiori UI where an internal user can review them
- Allow the user to set a **verification status** (New, In Process, Invalid, Verified, Completed)
- Emit an event back when a Business Partner is verified or rejected

---

## Technical architecture

The application is built with **CAP (SAP Cloud Application Programming Model)** using Node.js. CAP is SAP's framework for building cloud-native services — it handles the OData API layer, database persistence, event handling, and service-to-service connectivity, so you can focus on business logic.

The architecture has three main parts:

### 1. Local CAP service (what we build)
A CAP Node.js application with:
- A **data model** (`db/schema.cds`) defining `Notifications`, `Addresses`, and `StatusValues`
- An **OData service** (`srv/service.cds`) exposing those entities plus projections onto the remote S/4HANA API
- A **service handler** (`srv/service.js`) containing the business logic — delegating remote reads, handling incoming events, and emitting outgoing events
- A **Fiori Elements UI** (`app/`) for the validation workflow

### 2. Remote S/4HANA Business Partner API (consumed, not built)
The application connects to S/4HANA's Business Partner OData API to read Business Partner and address data. In this workshop we mock this locally using CSV files — but the same code runs against a real S/4HANA system with only a configuration change.

### 3. Messaging (events)
S/4HANA emits domain events when Business Partners are created or changed. Our CAP application subscribes to those events and reacts by creating Notification records. In this workshop we use `local-messaging` as a stand-in — in production this would be SAP Event Mesh or SAP Advanced Event Mesh, and only the `kind` configuration changes.

```
┌─────────────────────────────────────────────┐
│              SAP S/4HANA                    │
│                                             │
│  Business Partner API (OData V2)  ──────────┼──► CAP reads BP + address data
│  Domain Events (BusinessPartner.Created) ───┼──► CAP reacts, creates Notification
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           CAP Application (BTP)             │
│                                             │
│  OData Service  ◄──── Fiori Elements UI     │
│  Notifications, Addresses, StatusValues     │
│  Event handler → populate Notifications     │
│  After UPDATE  → emit BusinessPartnerVerified│
└─────────────────────────────────────────────┘
```

*An architecture diagram will be added here.*

> The architecture diagram is available as `docs/architecture.drawio` — open it in [draw.io](https://app.diagrams.net) or the draw.io VS Code extension.

---

## How the workshop is structured

The workshop is structured as a sequence of steps, each building on the last:

| Doc | What you build |
|-----|----------------|
| `01-preparation-guide.md` | Environment setup — complete before the workshop day |
| `02-basic-service.md` | Domain model, OData service, CSV seed data, local dev server |
| `03-remote-service.md` | Import S/4HANA BP API, expose remote entities, delegate reads |
| `04-events-messaging.md` | Add messaging, handle BP events, populate Notifications |
| `05-sap-fiori-app.md` | Fiori Elements List Report UI |

By the end of Phase 3 you have a fully working backend. Phase 4 adds the UI on top.

---

## Facilitator notes

**Tested versions** — this workshop has been validated against `@sap/cds@^9.2.1` and `@cap-js/sqlite@^2.0.2`. CAP v10 introduces breaking changes to event handler behaviour that affect the patterns used in Phase 3. Ensure participants install the pinned versions as instructed in Phase 1.
