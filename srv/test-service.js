import cds from '@sap/cds';

/**
 * Simple test script to verify the Business Partner service is working
 * Run this after the server is started: node srv/test-service.js
 */

async function testService() {
  try {
    console.log('Testing Business Partner Service...');
    
    // Connect to the service
    const srv = await cds.connect.to('BusinessPartnerService');
    
    // Get all business partners
    const businessPartners = await srv.read('BusinessPartners');
    console.log(`Found ${businessPartners.length} Business Partners in the database:`);
    businessPartners.forEach(bp => {
      console.log(`- ${bp.BusinessPartner}: ${bp.BusinessPartnerName}`);
    });
    
    // Test event simulation (if messaging is available)
    try {
      console.log('\nTesting event simulation...');
      
      // Sample event data
      const testEventData = {
        BusinessPartner: "1000000010",
        BusinessPartnerName: "Event Test Company",
        BusinessPartnerCategory: "2",
        BusinessPartnerGrouping: "0001",
        CreationDate: new Date().toISOString(),
        CreatedBy: "TESTUSER",
        LastChangeDate: new Date().toISOString(),
        LastChangedBy: "TESTUSER"
      };
      
      // Try to get messaging service
      const messaging = await cds.connect.to('messaging');
      await messaging.emit('sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1', testEventData);
      console.log('Event emitted successfully!');
      
      // Wait a moment and check if the business partner was created
      setTimeout(async () => {
        const updatedBPs = await srv.read('BusinessPartners');
        const newBP = updatedBPs.find(bp => bp.BusinessPartner === testEventData.BusinessPartner);
        if (newBP) {
          console.log('✅ Event processing successful! New Business Partner created:', newBP.BusinessPartnerName);
        } else {
          console.log('❌ Event processing may have failed - Business Partner not found');
        }
        process.exit(0);
      }, 2000);
      
    } catch (msgError) {
      console.log('Messaging service not available for testing:', msgError.message);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error testing service:', error);
    process.exit(1);
  }
}

// Run the test
testService();
