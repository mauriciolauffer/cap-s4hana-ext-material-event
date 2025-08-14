import cds from '@sap/cds';

/**
 * Test script to simulate S/4HANA Business Partner Created events
 * This can be used for local testing of the event handler
 */
export class BusinessPartnerEventTest {
  
  /**
   * Simulate a Business Partner Created event
   */
  static async simulateBusinessPartnerCreatedEvent() {
    const messaging = await cds.connect.to('messaging');
    
    // Sample event data that would come from S/4HANA
    const eventData = {
      BusinessPartner: "1000000003",
      BusinessPartnerName: "Test Company Ltd",
      BusinessPartnerCategory: "2",
      BusinessPartnerGrouping: "0001",
      CreationDate: new Date().toISOString(),
      CreatedBy: "TESTUSER",
      LastChangeDate: new Date().toISOString(),
      LastChangedBy: "TESTUSER"
    };
    
    // Emit the event
    await messaging.emit('sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1', eventData);
    console.log('Simulated Business Partner Created event sent:', eventData);
  }
  
  /**
   * Test multiple events
   */
  static async simulateMultipleEvents() {
    const testData = [
      {
        BusinessPartner: "1000000004",
        BusinessPartnerName: "Alpha Corp",
        BusinessPartnerCategory: "2",
        BusinessPartnerGrouping: "0001",
        CreationDate: new Date().toISOString(),
        CreatedBy: "ALPHA_USER",
        LastChangeDate: new Date().toISOString(),
        LastChangedBy: "ALPHA_USER"
      },
      {
        BusinessPartner: "1000000005",
        BusinessPartnerName: "Beta Industries",
        BusinessPartnerCategory: "1",
        BusinessPartnerGrouping: "0002",
        CreationDate: new Date().toISOString(),
        CreatedBy: "BETA_USER",
        LastChangeDate: new Date().toISOString(),
        LastChangedBy: "BETA_USER"
      }
    ];
    
    const messaging = await cds.connect.to('messaging');
    
    for (const data of testData) {
      await messaging.emit('sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1', data);
      console.log('Simulated event for Business Partner:', data.BusinessPartner);
      
      // Add small delay between events
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
