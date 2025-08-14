# Project Overview

This is an event driven SAP CAP Node.js application which extends S/4HANA Business Partner process. It reacts to S/4HANA Business Events.

## Folder Structure

- `/srv`: Contains the business logic
- `/db`: Contains the database layer represented by entities in cds files
- `/app`: Contains the frontend SAP Fiori Elements app

## Libraries and Frameworks

- SAP CAP Node.js
- SAP Fiori Elements
- SQLite is the database used for testing
- SAP HANA is the production database

## Coding Standards

- Use Prettier for formatting.
- Use arrow functions for callbacks.
- Use async/await for promises.
