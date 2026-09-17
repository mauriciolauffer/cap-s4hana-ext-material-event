# Events and Messaging

In this phase you add the event-driven integration. Your application will listen for Business Partner created and changed events from S/4HANA, and automatically create `Notification` records in response. You will also add a mock event emitter to simulate S/4HANA sending those events locally, and wire up an outbound event when a Business Partner is verified or rejected.

```
┌─────────────────────────────────────────────┐              ┌──────────────────────────────────────────┐
│              SAP S/4HANA                    │              │         CAP Application (BTP)            │
│                                             │              │                                          │
│                                             │  ┌────────┐  │                                          │
│  Domain Events (BusinessPartner.Created) ───┼──┼────────┼──┼──► CAP reacts, creates Notification      │
│  BusinessPartner.Verified ◄─────────────────┼──┼────────┼──┼─── UPDATE → emit BusinessPartnerVerified │
│                                             │  │        │  │                                          │
│                                             │  │ Event  │  │                                          │
│                                             │  │ Broker │  │                                          │
└─────────────────────────────────────────────┘  └────────┘  └──────────────────────────────────────────┘
```

## Add messaging feature to the project

Event-driven integration means your application reacts to things that happen in another system — in this case, S/4HANA telling you a Business Partner was created or changed — rather than polling for changes or waiting for a user to trigger something. The channel that carries those events between systems is a **message broker**.

CAP supports several message brokers for production use — SAP Event Mesh, SAP Advanced Event Mesh, and others. You can see the full list in the [Message Brokers documentation](https://cap.cloud.sap/docs/node.js/messaging#message-brokers). The key thing is that your application code stays the same regardless of which broker you use — only the `kind` value in `package.json` changes. That's what makes CAP's approach to messaging agnostic and portable.

For this workshop we use `local-messaging`, which runs entirely in-process with no external broker needed. It's a dev-only stand-in, but the subscribe/emit pattern is identical to what you'd use in production.

On a terminal, execute:

```shell
cds add local-messaging
```

A new entry will be added to the CDS configuration in the `package.json` file:

```json
  "cds": {
    "requires": {
      "API_BUSINESS_PARTNER": {
        "kind": "odata-v2",
        "model": "srv/external/API_BUSINESS_PARTNER"
      },
      "messaging": {
        "kind": "local-messaging"
      }
    }
  }
```

## Find Information About Events

This step is optional background reading — the event declarations you need are already provided in the next section. However, if you want to understand where the topic strings and payload structure come from, the SAP Business Accelerator Hub documents them.

Using [SAP Business Accelerator Hub](https://api.sap.com/):

- Find the [BusinessPartner Events page](https://api.sap.com/event/CE_BUSINESSPARTNEREVENTS/resource).
- Choose `View Event Reference`.
- Expand the `POST` request shown.
- Choose `Schema` tab.
- Expand the `data` property.

## Add Missing Event Declarations

S/4HANA publishes events asynchronously through a message broker, completely separately from its OData API. When you imported the EDMX in Phase 2, you got the synchronous API (OData) — but the event definitions were not included. CAP needs to know about those events to route incoming messages correctly, so we declare them manually.

Create a new file `srv/external/API_BUSINESS_PARTNER_EVENTS.cds` and add the following:

```cds
// Filling in missing events as found on SAP Business Accelerator Hub
using { API_BUSINESS_PARTNER as BUPA_S4 } from './API_BUSINESS_PARTNER';
extend service BUPA_S4 with {
  event BusinessPartner.Created @(topic:'sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1') {
    BusinessPartner : String
  }
  event BusinessPartner.Changed @(topic:'sap.s4.beh.businesspartner.v1.BusinessPartner.Changed.v1') {
    BusinessPartner : String
  }
}
```

A few things worth noting:
- **`extend service`** adds to an existing service definition without modifying the original imported file — keeping your changes separate from the generated code.
- **`@(topic:...)`** is the message topic string — the exact identifier S/4HANA uses when emitting the event. CAP uses this to match incoming messages to the right event handler in your service.
- The event payload only declares `BusinessPartner : String` — just the key. The full Business Partner data is fetched separately via the OData API in the handler, which you'll see in the next section.

## Consume Events Agnostically

"Agnostic consumption" means your event-handling code doesn't care which broker delivers the message — local-messaging in dev, SAP Event Mesh in production. The subscribe/emit pattern is identical; only the configuration changes. This is one of CAP's core strengths.

Edit `srv/service.js` to add the messaging handlers. The new code goes inside `init()`, after the existing `this.on("READ", ...)` lines and before `await super.init()`. The complete updated file looks like this:

```js
const cds = require("@sap/cds");

class SalesService extends cds.ApplicationService {
  async init() {
    const { BusinessPartner, BusinessPartnerAddress, Notifications } =
      this.entities;
    const bupaSrv = await cds.connect.to("API_BUSINESS_PARTNER");
    const logger = cds.log("sales-service");

    this.on("READ", BusinessPartnerAddress, (req) => bupaSrv.run(req.query));
    this.on("READ", BusinessPartner, (req) => bupaSrv.run(req.query));

    this.after("UPDATE", Notifications, async (data) => {
      if (
        data.verificationStatus_code === "V" ||
        data.verificationStatus_code === "INV"
      )
        await messaging.emit("BusinessPartnerVerified", data);
    });

    const messaging = await cds.connect.to("messaging");
    messaging.on(
      "sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1",
      async (msg) => {
        logger.info("<< Create event caught", msg.data);
        const businessPartnerId = msg.data?.KEY[0]?.BUSINESSPARTNER;
        const bpQuery = bupaSrv.run(
          SELECT.one(BusinessPartner).where({
            businessPartnerId: businessPartnerId,
          })
        );
        const bpAddressQuery = bupaSrv.run(
          SELECT.one(BusinessPartnerAddress).where({
            businessPartnerId: businessPartnerId,
          })
        );
        // Not using Associations, sending two requests in parallel just to showcase this option
        const [businessPartner, address] = await Promise.all([
          bpQuery,
          bpAddressQuery,
        ]);
        await INSERT.into(Notifications).entries({
          businessPartnerId: businessPartnerId,
          verificationStatus_code: "N",
          businessPartnerName: businessPartner.businessPartnerName,
          addresses: [address],
        });
      }
    );

    // This is just to show that you can also emit events from CAP applications...
    messaging.on("BusinessPartnerVerified", (msg) => {
      logger.info("<< BP Verified event caught", msg.data);
    });

    await super.init();
  }
}

module.exports = SalesService;
```

A few things worth noting:

- **`this.after("UPDATE", Notifications, ...)`** — fires after a Notification is successfully updated. We use `after` (not `on`) because we want to emit the outbound event only once the update has been committed. If the verification status is set to Verified (`V`) or Invalid (`INV`), it emits a `BusinessPartnerVerified` event.

- **`messaging` is declared after `this.after(...)`** — this looks like it should fail, but it doesn't. `this.after` registers a *callback* that only fires at runtime when an update actually happens — by that point `messaging` is fully initialised. It's still worth being aware of this ordering if you're reading the code for the first time.

- **`cds.connect.to("messaging")`** — connects to the messaging service configured in `package.json`. Locally that's `local-messaging`; in production it would be SAP Event Mesh with no code change required.

- **`messaging.on("sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1", ...)`** — subscribes to the exact topic string declared in `API_BUSINESS_PARTNER_EVENTS.cds`. When a matching message arrives, this handler fires.

- **`msg.data?.KEY[0]?.BUSINESSPARTNER`** — this is the shape of the S/4HANA event payload. The `KEY` array holds the primary key of the affected record. The `?.` optional chaining guards against the message arriving with unexpected structure. We extract just the Business Partner ID here, then fetch the full data separately via the OData API.

- **`Promise.all([bpQuery, bpAddressQuery])`** — fires both OData queries in parallel rather than sequentially, halving the wait time. The comment in the code notes this is deliberately showcasing the pattern — you could also use CAP associations to fetch address data in a single query, but parallel queries are a useful technique to know.

- **The second `messaging.on("BusinessPartnerVerified", ...)`** — this subscribes to the outbound event that our own `this.after("UPDATE", ...)` emits. In production you wouldn't normally listen to your own events like this — it's included here to demonstrate that CAP applications can both emit and consume events, and to make the full loop visible during local testing.

## Mocking events from SAP S/4HANA

In a real deployment, S/4HANA emits Business Partner events automatically whenever a Business Partner is created or changed. Since we don't have a real S/4HANA system here, we need to simulate that behaviour locally.

> **Local development only** — this file simulates S/4HANA's event emission for local testing. In production, the real S/4HANA system emits events instead and this file is never invoked.

Create a new file `srv/external/API_BUSINESS_PARTNER.js`:

```js
const cds = require("@sap/cds");

// Mock events for S4, this is just for testing and pretending the events are coming from SAP S/4HANA
module.exports = async (srv) => {
  const logger = cds.log("remote-service-event");
  const { A_BusinessPartnerAddress } = srv.entities;
  const messaging = await cds.connect.to("messaging");
  srv.after("CREATE", async (data) => {
    await INSERT.into(A_BusinessPartnerAddress).entries({
      BusinessPartner: data.BusinessPartner,
      AddressID: Date.now(),
      Country: "AU",
      CityName: "Sydney",
      StreetName: "23 Pitt Street",
      PostalCode: "2000",
    });

    const payload = { KEY: [{ BUSINESSPARTNER: data.BusinessPartner }] };
    await messaging.emit(
      "sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1",
      payload
    );
    logger.info("<< BP Created event emitted", payload);
  });

  srv.after("UPDATE", async (data) => {
    const payload = { KEY: [{ BUSINESSPARTNER: data.BusinessPartner }] };
    await messaging.emit(
      "sap.s4.beh.businesspartner.v1.BusinessPartner.Changed.v1",
      payload
    );
    logger.info("<< BP Changed event emitted", payload);
  });
};
```

A few things worth noting:

- **Why this file is picked up automatically** — CAP looks for a `.js` file with the same name as a registered service. Because `API_BUSINESS_PARTNER` is registered in `package.json`, placing `API_BUSINESS_PARTNER.js` in `srv/external/` causes CAP to execute it as a handler for that service automatically. No additional wiring is needed.

- **`srv.after("CREATE", async (data) => {})`** — fires after a Business Partner is successfully created in the mock service. The `data` parameter contains the created record, from which we extract `data.BusinessPartner` to build the event payload.

- **`module.exports = async (srv) => {}`** — this is the CAP handler pattern for an external service. The `srv` parameter is the mocked service instance, giving you access to its entities and lifecycle hooks.

- **Why it inserts an address on CREATE** — when our event handler in `service.js` receives the Created event, it immediately queries `bupaSrv` for the Business Partner's address. If no address exists in the mock data, that query returns nothing and the Notification will have no address. Inserting a dummy address here ensures the full flow works end to end.

- **The payload structure** — `{ KEY: [{ BUSINESSPARTNER: data.BusinessPartner }] }` deliberately mirrors the real S/4HANA event payload shape. This is why `service.js` reads `msg.data?.KEY[0]?.BUSINESSPARTNER` — the two files are designed to work together, and this mock payload is what makes the handler's data extraction work locally.

## Testing services and events

Create an `.http` file to send requests to your CAP service and to trigger events.

File `test/req.http`:

```http
### Create BP
POST http://localhost:4004/odata/v4/api-business-partner/A_BusinessPartner
Content-Type: application/json

{
  "BusinessPartner": "17100008",
  "BusinessPartnerFullName": "Testing BP x1",
  "BusinessPartnerIsBlocked": true,
  "Language": "EN"
}
### Edit BP
PATCH http://localhost:4004/odata/v4/api-business-partner/A_BusinessPartner('17100008')
Content-Type: application/json

{
    "BusinessPartnerIsBlocked": false
}
```

As expected, the BP will be created and the event will be triggered. Our CAP application will react to that and populate the `Notifications` and `Addresses` tables.

![alt text](image-4.png)

---

## Going to production

In this workshop messaging uses `local-messaging` — an in-process stand-in. Moving to real S/4HANA events requires one configuration change in `package.json` — no code changes.

Add a `[production]` profile block inside `cds.requires`. CAP activates it automatically when `NODE_ENV=production`:

```json
"[production]": {
  "messaging": {
    "kind": "enterprise-messaging"
  }
}
```

- **`kind`** — swap `local-messaging` for `enterprise-messaging` (SAP Event Mesh). The topic subscription pattern in `service.js` does not change.
- **No destination needed** — unlike the OData API, Event Mesh does not use a BTP Destination. Credentials are injected automatically by BTP at deploy time via a service binding. You bind your SAP Event Mesh service instance to the deployed application in your `mta.yaml`, and BTP populates the connection details into `VCAP_SERVICES` at runtime. CAP reads these automatically.
- **No code changes** — `cds.connect.to("messaging")` in `service.js` works identically in both environments.