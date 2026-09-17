# Consuming Remote Services

In this phase you connect your CAP application to the S/4HANA Business Partner API. You will import the API definition, expose Business Partner and address data through your own service, and mock the remote API locally with CSV data so you can develop without needing a real S/4HANA system.

```
┌─────────────────────────────────────────────┐              ┌──────────────────────────────────────────┐
│              SAP S/4HANA                    │              │         CAP Application (BTP)            │
│                                             │              │                                          │
│  Business Partner API (OData V2)  ◄─────────┼──────────────┼─── CAP reads BP + address data           │
│                                             │              │                                          │
└─────────────────────────────────────────────┘              └──────────────────────────────────────────┘
```

## From SAP Business Accelerator Hub

The [SAP Business Accelerator Hub](https://api.sap.com/) provides many relevant APIs from SAP. You can download API specifications in different formats.

**EDMX** is an XML-based format that describes OData APIs — entity types, relationships, key fields, and navigation properties. Because S/4HANA APIs are OData-based, EDMX is the native format and carries the most complete picture of the API. When CAP imports an EDMX, it can fully understand the remote service's structure and wire up query delegation automatically.

The hub also offers **OpenAPI** specs (JSON or YAML). CAP can import those too — `cds import` supports both formats — but OpenAPI is designed for REST APIs and doesn't carry OData-specific metadata like entity keys and navigation properties. The import will work, but you'll get a less complete model and may need to do more manual wiring. For S/4HANA APIs, EDMX is the better choice.

If available, use the EDMX format.

To download the [Business Partner API (A2X) from SAP S/4HANA Cloud](https://api.sap.com/api/API_BUSINESS_PARTNER/overview), go to section `API Resources`, select `API Specification`, and download the `EDMX file`.

## Import API Definition

Import the API to your project using cds import.

On a terminal, execute:

```shell
cds import API_BUSINESS_PARTNER.edmx --as cds
```

The `--as cds` flag tells the importer to convert the EDMX into CDS format and place it in `srv/external/API_BUSINESS_PARTNER.cds`. It also registers the remote service in `package.json` so CAP knows how to connect to it:

```json
  "cds": {
    "requires": {
      "API_BUSINESS_PARTNER": {
        "kind": "odata-v2",
        "model": "srv/external/API_BUSINESS_PARTNER"
      }
    }
  }
```

`kind: odata-v2` tells CAP this is an OData V2 service (which S/4HANA uses). The `model` path points to the generated CDS file. CAP will use this configuration to route requests to the remote service at runtime.

The import also adds new package dependencies to `package.json`. Install them by running:

```shell
npm install
```

This creates two things:
- **`node_modules/`** — a folder containing all the downloaded packages your project depends on. This folder can be large and is never committed to git (it's in `.gitignore`). Anyone cloning the project just runs `npm install` again to recreate it.
- **`package-lock.json`** — a file that locks the exact version of every installed package. This ensures everyone working on the project gets the same versions. Without it, `npm install` would resolve to whatever the latest version is at that moment — and if a package author has released a new version since you last tested, you could silently pick up breaking changes.

## Local Mocking

When building an extension, you don't want to connect to a real S/4HANA system every time you save a file. **Mocking** lets you simulate the remote service locally — CAP serves it from CSV files instead of making real network calls. This means you can develop and test the full integration flow without needing S/4HANA credentials or connectivity.

The mock runs automatically as part of `cds watch` — CAP detects the remote service definition in `package.json` and serves it locally using any CSV files it finds in `srv/external/data/`.

The CSV files need to be added to the `srv/external/data` folder.


File `API_BUSINESS_PARTNER-A_BusinessPartner.csv`

```csv
BusinessPartner;BusinessPartnerFullName;BusinessPartnerIsBlocked
1004155;Williams Electric Drives;false
1004161;Smith Batteries Ltd;false
1004100;Johnson Automotive Supplies;true
17100001;The Local Supplier;false
```

File `API_BUSINESS_PARTNER-A_BusinessPartnerAddress.csv`

```csv
BusinessPartner,AddressID,StreetName,CityName,Country,postalCode
"17100001","124462","Dietmar-Hopp-Allee 162","Walldorf","DE","12345"
"17100005","124465","whitefield 162","Bangalore","IN","560066"
```

## Expose Remote Service

A **projection** is similar to a database view — it selects a subset of fields from an underlying entity, optionally renaming them, and presents that as the interface your service exposes. In CAP, the underlying source can be a local database table or a remote service.

You might wonder: since we've already imported `API_BUSINESS_PARTNER` and can call it directly in our handler code, why do we need a projection at all? The answer is that calling the remote service internally is not the same as exposing it. Without a projection, `BusinessPartner` and `BusinessPartnerAddress` have no OData endpoint — they're invisible to any external consumer. The Fiori UI couldn't list or query them; they'd only be usable inside your own handler logic.

The projection solves two things at once:
- **Field selection and renaming** — trimming the remote entity down to the fields you actually need, using your own naming conventions
- **OData exposure** — making those entities part of your service's public API so consumers like the Fiori app can query them directly

To expose a remote service entity, you add a projection on it to your CAP service:

```cds
using API_BUSINESS_PARTNER as BUPA_API from './external/API_BUSINESS_PARTNER';

using my.businessPartnerValidation as db from '../db/schema';

namespace service.businessPartnerValidation;

// service SalesService @(requires: 'authenticated-user') {
service SalesService {
  @odata.draft.enabled
  entity Notifications as projection on db.Notifications;

  entity Addresses     as projection on db.Addresses;

  event BusinessPartnerVerified {
    businessPartner     : String;
    businessPartnerName : String;
    verificationStatus  : String;
    addressId           : String;
    streetName          : String;
    postalCode          : String;
    country             : String;
    addressModified     : String;
  }

  @readonly
  entity BusinessPartnerAddress as
    projection on BUPA_API.A_BusinessPartnerAddress {
      key BusinessPartner as businessPartnerId,
          AddressID       as addressId,
          Country         as country,
          CityName        as cityName,
          StreetName      as streetName,
          PostalCode      as postalCode
    };

  @readonly
  entity BusinessPartner        as
    projection on BUPA_API.A_BusinessPartner {
      key BusinessPartner          as businessPartnerId,
          BusinessPartnerFullName  as businessPartnerName,
          SearchTerm1              as searchTerm1,
          BusinessPartnerIsBlocked as businessPartnerIsBlocked
    };
}
```

By default, CAP tries to resolve entity reads against the local database. Since `BusinessPartner` and `BusinessPartnerAddress` are projections on a remote service with no local table, those reads will fail — except during local development, where `cds watch` runs the mock in the same process and can resolve them automatically. That's a dev convenience, not real delegation. Without the explicit handler below, the app will break as soon as you point it at a separately-mocked or real remote service.

To avoid this, create a new `srv/service.js` file with a handler that delegates reads to the remote service:

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

    await super.init();
  }
}

module.exports = SalesService;
```

A few things worth noting here:

- **`class SalesService extends cds.ApplicationService`** — we define our service as a class that extends CAP's `ApplicationService`. This gives us access to the CAP lifecycle and lets us register event handlers cleanly.
- **`async init()`** — this is the CAP lifecycle method where handlers must be registered. Registering them here (rather than at module load time) ensures the service is fully initialised before handlers are attached.
- **`this.entities`** — a shortcut provided by CAP to access the entities defined in this service by name. Destructuring them here means we can reference `BusinessPartner` directly rather than using the full string `"BusinessPartner"` everywhere.
- **`cds.connect.to("API_BUSINESS_PARTNER")`** — connects to the remote service registered in `package.json`. CAP uses that configuration to know where to route requests — locally that means the mock, in production it would be the real S/4HANA endpoint.
- **`logger`** — a named logger scoped to this service. It's declared here but not used until Phase 3 when the messaging handlers are added. We set it up now to keep the file consistent with the final version.
- **`this.on("READ", BusinessPartner, ...)`** — intercepts any READ request for `BusinessPartner` and delegates it to the remote service by running the same query against `bupaSrv`. Without this, CAP would try to resolve the read against the local database and fail in a real deployment.
- **`await super.init()`** — must always be called at the end of `init()`. This triggers CAP's own initialisation logic. If you forget it, the service will not start correctly.

## Mock Remote Service as OData Service

Start the CAP application with the mocked remote service:

```shell
cds watch
```

You should see the Remote Service and its data coming through.

![alt text](image-2.png)

![alt text](image-3.png)


### Request failed with status code 404

If you see any of the following errors, it means the local application is trying to connect to the wrong `remote service endpoint`. When locally testing, it should automatically find and connect everything, but it fails sometimes...

```log
Cannot GET /odata/v4/api-business-partner/A_BusinessPartner
```

```json
{
  "error": {
    "message": "Error during request to remote service: Request failed with status code 404",
    "code": "502",
    "@Common.numericSeverity": 4
  }
}
```

Check the console logs, you may see an entry like this one:

```log
[cds] - connect to API_BUSINESS_PARTNER > odata { url: 'http://localhost:57066/odata/v4/api-business-partner' }
```

Try stopping and restarting all instances. If the error persists, stop all the instances and force the remote service to run on the expected port. For instance:

```shell
cds mock API_BUSINESS_PARTNER --port 57066
```

Then, run `cds watch` again.

---

## Going to production

In this workshop the BP API is mocked locally. In production, the app connects to a real S/4HANA system via a BTP Destination.

Add a `[production]` profile block to `cds.requires` in `package.json`:

```json
"[production]": {
  "API_BUSINESS_PARTNER": {
    "kind": "odata-v2",
    "credentials": {
      "destination": "S4HANA_BUSINESS_PARTNER",
      "path": "/sap/opu/odata/sap/API_BUSINESS_PARTNER"
    }
  }
}
```

- **`destination`** — the name of the BTP Destination pointing at your S/4HANA system, configured in the BTP cockpit. The app resolves it at runtime via the BTP Destination service, which must be bound to the deployed application.
- **`model`** — does not need repeating in the production block; it is inherited from the base config.
- **No code changes** — `cds.connect.to("API_BUSINESS_PARTNER")` in `service.js` works identically in both environments. CAP abstracts the transport.
