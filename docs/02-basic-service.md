# Creating Basic Service

In this phase you create the foundation of the application — the data model, the OData service, and the seed data. By the end you will have a running local service that exposes `Notifications`, `Addresses`, and `StatusValues` as OData endpoints, seeded with test data and viewable in the browser.

## Start a new project

The CAP development kit (`@sap/cds-dk`) gives you the `cds` CLI — it's what you'll use to scaffold, run, and build the project throughout this workshop.

On a terminal, execute:

```shell
npm i -g @sap/cds-dk
```

`cds init` creates a new CAP project with the standard folder structure (`db/`, `srv/`, `app/`).

```shell
cds init cap-s4hana-ext-material-event
```

```shell
cd cap-s4hana-ext-material-event
```

CAP needs a SQLite adapter to run the local in-memory database. Add it now as a dev dependency — pin to v2 to match the tested version of this workshop:

```shell
npm add --save-dev @cap-js/sqlite@^2.0.2
```

Also add `@sap/cds` as a direct dependency — it's needed by the service handler code you'll write in later phases. Pin to v9 for the same reason:

```shell
npm add @sap/cds@^9.2.1
```

> ⚠️ **Version note** — this workshop has been tested against `@sap/cds@^9.2.1` and `@cap-js/sqlite@^2.0.2`. Using CAP v10 or later may cause compatibility issues with the event handler patterns used in Phase 3.

## Create database layer

CAP uses CDS (Core Data Services) to define your data model. This is database-agnostic — the same model works with SQLite locally and SAP HANA in production.

Our domain model has three entities:

- **`Notifications`** — the central record created when a Business Partner event arrives from S/4HANA. It holds the Business Partner ID, name, and a verification status that an internal user will review and update.
- **`Addresses`** — a snapshot of the Business Partner's addresses at the time the event was received. Multiple addresses can belong to one Notification. Because these are local copies (the source of truth remains in S/4HANA), they are modelled as a Composition owned by the Notification.
- **`StatusValues`** — a simple code/value lookup table for verification statuses (NEW, IN PROCESS, INVALID, VERIFIED, COMPLETED). This is reference data that drives the UI status indicator.

Create a new file `db/schema.cds` and define the CDS entities.

```cds
namespace my.businessPartnerValidation;

using {
  managed,
  cuid
} from '@sap/cds/common';

entity Notifications : managed, cuid {
  businessPartnerId   : String;
  businessPartnerName : String;
  verificationStatus  : Association to StatusValues;
  addresses           : Composition of many Addresses
                          on addresses.notifications = $self;
}

entity Addresses : cuid {
  notifications     : Association to Notifications;
  addressId         : String;
  country           : String;
  cityName          : String;
  streetName        : String;
  postalCode        : String;
  isModified        : Boolean default false;
  businessPartnerId : String;
}

@cds.autoexpose
entity StatusValues {
  key code        : String;
      value       : String;
      criticality : Integer;
      updateCode  : Boolean;
}

annotate Notifications with {
  businessPartnerId  @title: 'BusinessPartner ID'  @readonly;
  verificationStatus @title: 'Verfication Status';
}
```

A few things worth noting here:

- **`managed`** adds audit fields automatically (`createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`) — you get these for free without declaring them.
- **`cuid`** adds a `ID: UUID` key field, also automatically generated.
- **`Composition of many Addresses`** means addresses are *owned* by a Notification — if you delete a Notification, its addresses go with it. This is different from a plain `Association`, which is just a link. This makes sense here because these addresses are a local snapshot captured when the Business Partner event arrived, not the master address data (which lives in S/4HANA).
- **`@cds.autoexpose`** on `StatusValues` means CAP will automatically expose it in any service that references it, without you needing to declare it explicitly in `service.cds`.

## Create OData layer

The service layer sits on top of your data model and exposes it as an OData API. CAP generates all the CRUD endpoints automatically from this definition.

Create a new file `srv/service.cds` and define the OData service.

```cds
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
}
```

A few things worth noting here:

- **`@(requires: 'authenticated-user')`** locks the service down to authenticated users. For this workshop it is commented out to keep things simple. Worth knowing: when deployed to BTP, CAP defaults to `authenticated-user` even without this annotation — so a deployed service is protected by default. To make it public you would need to explicitly override that.
- **`@odata.draft.enabled`** on `Notifications` enables SAP Fiori's draft editing pattern, where changes are saved temporarily before being committed.
- **The `event` block** defines a CAP event that this service can emit. You won't use it until Phase 3 — it's declared here so the service definition is complete from the start.

## Providing Initial Data

CAP can seed your database from CSV files on startup. The filenames must match the fully-qualified entity names in your CDS model.

Run this to generate an initial set of empty `.csv` files with header lines based on your CDS model:

```shell
cds add data
```

![alt text](image.png)

CAP looks for CSV files in `db/data` and `test/data`. The key distinction:

- **`db/data`** — loaded in all environments, including production builds.
- **`test/data`** — loaded during development (`cds watch`) and testing only; excluded from production builds.

Because `Notifications` and `Addresses` are test data, move `db/data/my.businessPartnerValidation-Addresses.csv` and `db/data/my.businessPartnerValidation-Notifications.csv` to `test/data`. `StatusValues` stays in `db/data` because it's reference data needed in production.

Now, let's populate these files with initial data.

File `db/data/my.businessPartnerValidation-StatusValues.csv`

```csv
code;value;criticality;updateCode
N;NEW;3;false
P;IN PROCESS;2;false
INV;INVALID;1;false
V;VERIFIED;4;true
C;COMPLETED;5;true
```

File `test/data/my.businessPartnerValidation-Addresses.csv`

```csv
ID;addressId;country;cityName;streetName;postalCode;notifications_ID;businessPartnerId
58040e66-1dcd-4ffb-ab10-fdce32028b79;"124462";"DE";"Walldorf";"Dietmar-Hopp-Allee 162";"560066";2c728381-72ce-4fdd-8293-8add71579666;17100001
64e718c9-ff99-47f1-8ca3-950c850777d4;"124463";"DE";"Walldorf";"some street";"123456";ff0bc005-710c-4097-a687-64ef380498f4;17100002
64e718c9-ff99-47f1-8ca3-950c850777e5;"124464";"DE";"Walldorf";"some street";"123456";16f00c9c-323f-4ce4-876f-efaefe1c6f69;17100003
```

File `test/data/my.businessPartnerValidation-Notifications.csv`

```csv
ID;businessPartnerId;businessPartnerName;verificationStatus_code
2c728381-72ce-4fdd-8293-8add71579666;17100001;TestData1;N
ff0bc005-710c-4097-a687-64ef380498f4;17100002;TestData2;P
16f00c9c-323f-4ce4-876f-efaefe1c6f69;17100003;TestData3;P
```

## Running the application locally

`cds watch` starts a local development server with live reload — any file change you save will automatically restart the server and reseed the database. The app runs on `http://localhost:4004` by default.

On a terminal, execute:

```shell
cds watch
```

![alt text](image-1.png)

## Verify the service

Once the app is running, open `http://localhost:4004` in your browser. You should see the service endpoints listed. Click on **StatusValues** and verify it returns the seed data:

```json
{
  "@odata.context": "$metadata#StatusValues",
  "value": [
    {
      "code": "C",
      "value": "COMPLETED",
      "criticality": 5,
      "updateCode": true
    },
    {
      "code": "INV",
      "value": "INVALID",
      "criticality": 1,
      "updateCode": false
    },
    {
      "code": "N",
      "value": "NEW",
      "criticality": 3,
      "updateCode": false
    },
    {
      "code": "P",
      "value": "IN PROCESS",
      "criticality": 2,
      "updateCode": false
    },
    {
      "code": "V",
      "value": "VERIFIED",
      "criticality": 4,
      "updateCode": true
    }
  ]
}
```

If you see this, your data model, service, and seed data are all wired up correctly.
