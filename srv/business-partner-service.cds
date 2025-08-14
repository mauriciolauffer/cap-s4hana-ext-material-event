using cap.s4hana.ext from '../db/data-model';

@path: '/business-partners'
service BusinessPartnerService {
  
  @readonly
  entity BusinessPartners as projection on ext.BusinessPartners;
  
  // Event type definition for S/4HANA Business Partner Created event
  type BusinessPartnerCreatedEvent {
    BusinessPartner: String(10);
    BusinessPartnerName: String(80);
    BusinessPartnerCategory: String(1);
    BusinessPartnerGrouping: String(4);
    CreationDate: String;
    CreatedBy: String(12);
    LastChangeDate: String;
    LastChangedBy: String(12);
  }
  
}
