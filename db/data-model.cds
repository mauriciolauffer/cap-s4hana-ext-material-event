namespace cap.s4hana.ext;

entity BusinessPartners {
  key ID: UUID;
  BusinessPartner: String(10) @title: 'Business Partner ID';
  BusinessPartnerName: String(80) @title: 'Business Partner Name';
  BusinessPartnerCategory: String(1) @title: 'BP Category';
  BusinessPartnerGrouping: String(4) @title: 'BP Grouping';
  CreationDate: Date @title: 'Creation Date';
  CreatedBy: String(12) @title: 'Created By';
  LastChangeDate: Date @title: 'Last Change Date';
  LastChangedBy: String(12) @title: 'Last Changed By';
  CreatedAt: Timestamp @cds.on.insert: $now;
  ModifiedAt: Timestamp @cds.on.insert: $now @cds.on.update: $now;
}
