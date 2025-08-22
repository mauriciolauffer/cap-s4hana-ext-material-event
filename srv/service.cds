using my.businessPartnerValidation as my from '../db/schema';
namespace service.businessPartnerValidation;

service SalesService @(requires: 'authenticated-user') {
  @odata.draft.enabled
  entity Notifications as projection on my.Notifications;

  entity Addresses     as projection on my.Addresses;

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
