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