import cds from '@sap/cds';

/**
 * Event handler for Business Partner Created events from S/4HANA
 */
export default (srv) => {
  
  // Subscribe to S/4HANA Business Partner Created events
  srv.on('sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1', async (req) => {
    const { data } = req;
    
    console.log('Received Business Partner Created event:', JSON.stringify(data, null, 2));
    
    try {
      // Extract business partner data from the event
      const businessPartnerData = {
        BusinessPartner: data.BusinessPartner,
        BusinessPartnerName: data.BusinessPartnerName || '',
        BusinessPartnerCategory: data.BusinessPartnerCategory || '',
        BusinessPartnerGrouping: data.BusinessPartnerGrouping || '',
        CreationDate: data.CreationDate ? new Date(data.CreationDate) : new Date(),
        CreatedBy: data.CreatedBy || '',
        LastChangeDate: data.LastChangeDate ? new Date(data.LastChangeDate) : new Date(),
        LastChangedBy: data.LastChangedBy || ''
      };
      
      // Insert the business partner into the local database
      const { BusinessPartners } = cds.entities('cap.s4hana.ext');
      
      // Check if business partner already exists
      const existingBP = await SELECT.one.from(BusinessPartners).where({
        BusinessPartner: businessPartnerData.BusinessPartner
      });
      
      if (existingBP) {
        console.log(`Business Partner ${businessPartnerData.BusinessPartner} already exists. Updating...`);
        
        // Update existing record
        await UPDATE(BusinessPartners)
          .set({
            BusinessPartnerName: businessPartnerData.BusinessPartnerName,
            BusinessPartnerCategory: businessPartnerData.BusinessPartnerCategory,
            BusinessPartnerGrouping: businessPartnerData.BusinessPartnerGrouping,
            LastChangeDate: businessPartnerData.LastChangeDate,
            LastChangedBy: businessPartnerData.LastChangedBy,
            ModifiedAt: new Date()
          })
          .where({ BusinessPartner: businessPartnerData.BusinessPartner });
          
        console.log(`Successfully updated Business Partner: ${businessPartnerData.BusinessPartner}`);
      } else {
        // Insert new record
        await INSERT.into(BusinessPartners).entries(businessPartnerData);
        console.log(`Successfully inserted new Business Partner: ${businessPartnerData.BusinessPartner}`);
      }
      
    } catch (error) {
      console.error('Error processing Business Partner Created event:', error);
      req.error(500, `Failed to process Business Partner event: ${error.message}`);
    }
  });
  
};
