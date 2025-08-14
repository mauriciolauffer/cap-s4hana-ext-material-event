# SAP CAP S/4HANA Business Partner Event Extension

This is an event-driven SAP CAP Node.js application that extends S/4HANA Business Partner processes by listening to Business Partner creation events and storing them in a local database.

## Features

- **Event-Driven Architecture**: Listens to S/4HANA Business Partner created events
- **Automatic Data Synchronization**: Captures and stores Business Partner data locally
- **Duplicate Handling**: Updates existing records or creates new ones as needed
- **RESTful API**: Provides endpoints to access stored Business Partner data
- **Real-time Processing**: Processes events as they arrive from S/4HANA

## Architecture

```
S/4HANA System → Event Mesh → CAP Application → Local Database
                     ↓
              Business Partner Created Event
                     ↓
            Event Handler (srv/business-partner-service.js)
                     ↓
              Local Business Partner Table
```

## Project Structure

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide

## Event Handling

The application listens to the following S/4HANA event:
- `sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1`

When this event is received, the handler:
1. Validates the event data
2. Checks if the Business Partner already exists
3. Either updates existing record or creates a new one
4. Logs the processing result

## Database Schema

The `BusinessPartners` entity stores:
- Business Partner ID (primary key)
- Business Partner Name
- Category and Grouping information
- Creation and modification timestamps
- User information for audit trails

## Getting Started

### Prerequisites
- Node.js 20+
- SAP CAP CLI: `npm install -g @sap/cds-dk`

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   cds watch
   ```

The server will start at `http://localhost:4004`

### Testing

- View stored Business Partners: `http://localhost:4004/business-partners/BusinessPartners`
- Service metadata: `http://localhost:4004/business-partners/$metadata`
- Test the service programmatically: `node srv/test-service.js`

## Configuration

### Event Mesh Configuration

The application is configured to connect to SAP Event Mesh in `package.json`:

```json
{
  "cds": {
    "requires": {
      "messaging": {
        "kind": "enterprise-messaging"
      }
    },
    "messaging": {
      "events": {
        "sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1": {}
      }
    }
  }
}
```

### S/4HANA Integration

For production deployment, configure:
1. SAP Event Mesh service instance
2. S/4HANA system event routing
3. Authentication and authorization
4. HANA database connection

## API Endpoints

- `GET /business-partners/BusinessPartners` - Retrieve all Business Partners
- `GET /business-partners/BusinessPartners('ID')` - Get specific Business Partner
- Event endpoint is automatically configured by CAP framework

## Libraries and Frameworks

- SAP CAP Node.js - Core framework
- SAP Fiori Elements - Frontend (planned)
- SQLite - Development database
- SAP HANA - Production database
- Enterprise Messaging - Event handling

## Contributing

- Use Prettier for code formatting
- Use arrow functions for callbacks
- Use async/await for promises
- Follow SAP CAP best practices

## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.
