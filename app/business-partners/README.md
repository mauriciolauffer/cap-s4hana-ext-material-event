# Business Partners Frontend Application

This is a SAP Fiori Elements application that provides a user interface for viewing Business Partners that are automatically captured from S/4HANA events.

## Features

- **List Report**: Display all Business Partners in a responsive table
- **Object Page**: Detailed view of individual Business Partners
- **Real-time Data**: Automatically refreshes when new Business Partners are created via events
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **SAP Fiori UX**: Follows SAP Fiori design guidelines

## Application Structure

```
app/business-partners/
├── webapp/
│   ├── Component.js           # Main UI5 Component
│   ├── manifest.json          # App descriptor
│   ├── index.html             # Standalone app entry point
│   ├── i18n/                  # Internationalization files
│   │   └── i18n.properties    # English texts
│   └── test/
│       ├── flpSandbox.html    # Fiori Launchpad sandbox
│       └── simple.html        # Simple test page
├── annotations.cds            # UI annotations for Fiori Elements
├── package.json               # Frontend dependencies
└── ui5.yaml                   # UI5 tooling configuration
```

## Getting Started

### Prerequisites
- Node.js 20+
- CAP backend server running at http://localhost:4004

### Running the Application

#### Option 1: Simple Test Page (Recommended for quick testing)
```bash
# Make sure CAP server is running
npm run watch

# Open in browser
http://localhost:4004/app/business-partners/webapp/test/simple.html
```

#### Option 2: Full Fiori Elements App
```bash
# Install UI5 dependencies
cd app/business-partners
npm install

# Start the frontend (make sure backend is running)
npm start
```

#### Option 3: Complete Application Stack
```bash
# Start both backend and frontend
npm run start:all
```

## Application Pages

### List Report
- **URL**: Main entry point
- **Features**: 
  - Table view of all Business Partners
  - Search and filter capabilities
  - Sort functionality
  - Export to Excel
  - Responsive design

### Object Page
- **URL**: Accessed by clicking on a Business Partner
- **Features**:
  - Detailed view of Business Partner information
  - All fields from the data model
  - Read-only mode (data comes from events)

## Data Model

The frontend displays the following Business Partner fields:

| Field | Description |
|-------|-------------|
| Business Partner ID | Unique identifier from S/4HANA |
| Business Partner Name | Company/Person name |
| Category | Business Partner category |
| Grouping | Business Partner grouping |
| Creation Date | When the BP was created |
| Created By | User who created the BP |
| Last Change Date | Last modification date |
| Last Changed By | User who last modified |

## UI Annotations

The application uses CDS annotations to define the UI structure:

- **List Report**: Table columns and filters
- **Object Page**: Field groups and sections
- **Header Info**: Title and description
- **Selection Fields**: Available filters

## Configuration

### Manifest.json
Key configuration sections:
- **Data Sources**: OData service connection
- **Models**: OData v4 model configuration
- **Routing**: Navigation between List and Object pages

### UI5.yaml
Development server configuration:
- Proxy to backend service
- Live reload functionality
- Mock server for offline development

## Testing

### Simple Test
Access: `http://localhost:4004/app/business-partners/webapp/test/simple.html`
- Basic table view
- Direct OData binding
- Refresh functionality

### Fiori Launchpad Sandbox
Access: `http://localhost:4004/app/business-partners/webapp/test/flpSandbox.html`
- Full Fiori Launchpad experience
- Tile-based navigation
- Fiori Elements templates

## Event Integration

The frontend automatically displays Business Partners as they are created:

1. S/4HANA sends Business Partner Created event
2. CAP backend processes event and stores data
3. Frontend table refreshes automatically
4. New Business Partner appears in the list

## Responsive Design

The application adapts to different screen sizes:
- **Desktop**: Full table with all columns
- **Tablet**: Condensed table view
- **Mobile**: Stacked list items

## Customization

### Adding New Fields
1. Update the data model in `/db/data-model.cds`
2. Add field to service in `/srv/business-partner-service.cds`
3. Update UI annotations in `/app/business-partners/annotations.cds`

### Changing UI Layout
- Modify annotations in `annotations.cds`
- Update manifest.json routing settings
- Customize i18n texts

## Troubleshooting

### Common Issues

**Frontend not loading:**
- Ensure CAP backend is running at http://localhost:4004
- Check browser console for errors
- Verify manifest.json service URL

**Data not displaying:**
- Check OData service: http://localhost:4004/business-partners/BusinessPartners
- Verify model binding in browser console
- Check for CORS issues

**UI5 loading errors:**
- Ensure stable internet connection (CDN resources)
- Check UI5 version compatibility
- Clear browser cache

## Development

### Live Development
```bash
# Backend with live reload
npm run watch

# Frontend with live reload  
cd app/business-partners && npm start
```

### Building for Production
```bash
# Build the complete app
npm run build

# Build only frontend
cd app/business-partners && npm run build
```

## Learn More

- [SAP Fiori Elements](https://sapui5.hana.ondemand.com/sdk/#/topic/797c3239b2a9491fa137e4998fd76aa7)
- [UI5 Development](https://sapui5.hana.ondemand.com/)
- [CAP UI Annotations](https://cap.cloud.sap/docs/guides/fiori/#annotations)
