# Business Partner Event Handler

This module implements an event-driven architecture to capture Business Partner creation events from S/4HANA and store them in a local database.

## Features

- **Event Listening**: Listens to `sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1` events from S/4HANA
- **Data Persistence**: Automatically stores Business Partner data in local database
- **Duplicate Handling**: Updates existing records if Business Partner already exists
- **Error Handling**: Comprehensive error handling and logging

## Event Structure

The handler expects events with the following structure:

```json
{
  "BusinessPartner": "1000000001",
  "BusinessPartnerName": "Company Name",
  "BusinessPartnerCategory": "2",
  "BusinessPartnerGrouping": "0001",
  "CreationDate": "2024-01-15T10:30:00.000Z",
  "CreatedBy": "USERNAME",
  "LastChangeDate": "2024-01-15T10:30:00.000Z",
  "LastChangedBy": "USERNAME"
}
```

## Database Schema

The `BusinessPartners` entity stores:
- Business Partner ID (primary identifier)
- Business Partner details (name, category, grouping)
- Audit fields (creation/modification timestamps and users)
- System fields (CreatedAt, ModifiedAt)

## Testing

For local testing, use the test event simulator:

```javascript
import { BusinessPartnerEventTest } from './test-events.js';

// Simulate single event
await BusinessPartnerEventTest.simulateBusinessPartnerCreatedEvent();

// Simulate multiple events
await BusinessPartnerEventTest.simulateMultipleEvents();
```

## Configuration

Event handling is configured in `package.json`:

```json
{
  "cds": {
    "messaging": {
      "events": {
        "sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1": {}
      }
    }
  }
}
```

## Service Endpoints

- `GET /business-partners/BusinessPartners` - Retrieve stored Business Partners
- Event endpoint is automatically configured by CAP framework

## Error Handling

- Validates incoming event data
- Logs all events and processing steps
- Returns appropriate error responses
- Continues processing even if individual events fail
