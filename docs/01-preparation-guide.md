# Workshop Preparation Guide
## CAP + S/4HANA Extension — Business Partner Validation

Please complete the setup below **before the workshop day**. You will build the project from scratch during the session — this guide just gets your environment ready.

You have two options. Choose the one that suits you best.

---

## Option A: SAP Business Application Studio (Recommended)

BAS runs in your browser and comes with all required tools pre-installed. This is the simpler path and avoids any local laptop setup.

**What you need:**
- A BTP subaccount with a **SAP Business Application Studio** entitlement and subscription

**Setup steps:**

1. Open BAS from your BTP subaccount cockpit
2. Create a new Dev Space — select **Full Stack Cloud Application** as the kind
3. Wait for the dev space to start, then open it
4. Open a terminal and verify the tools are available:

```bash
node --version       # should be 20 or higher
cds --version        # should show @sap/cds version
```

If both commands return a version number, you're ready.

---

## Option B: VS Code on your laptop

**What you need:**
- Node.js 20 or higher — [nodejs.org](https://nodejs.org)
- VS Code — [code.visualstudio.com](https://code.visualstudio.com)

**VS Code extensions — install all three:**
- [SAP CDS Language Support](https://marketplace.visualstudio.com/items?itemName=SAPSE.vscode-cds) — required from the start
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) — required from the start
- [SAP Fiori Tools](https://marketplace.visualstudio.com/items?itemName=SAPSE.sap-ux-fiori-tools-extension-pack) — required for the Fiori UI phase

**Setup steps:**

1. Install the CDS development kit globally:

```bash
npm install -g @sap/cds-dk
```

2. Verify the tools are available:

```bash
node --version       # should be 20 or higher
cds --version        # should show @sap/cds version
```

If both commands return a version number, you're ready.

---

## Verification checklist

Before the workshop, confirm the following:

- [ ] `node --version` returns 20 or higher
- [ ] `cds --version` returns a version number without errors
- [ ] Your editor recognises `.cds` files with syntax highlighting

If anything isn't working, reach out before the day so we can sort it out.
