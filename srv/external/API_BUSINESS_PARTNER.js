const cds = require("@sap/cds");

// Mock events for S4, this is just for testing and pretending the events are coming from SAP S/4HANA
module.exports = async (srv) => {
  const logger = cds.log("remote-service-event");
  const { A_BusinessPartnerAddress } = srv.entities;
  const messaging = await cds.connect.to("messaging");
  srv.after("CREATE", async (data) => {
    await INSERT.into(A_BusinessPartnerAddress).entries({
      BusinessPartner: data.BusinessPartner,
      AddressID: Date.now(),
      Country: "AU",
      CityName: "Sydney",
      StreetName: "23 Pitt Street",
      PostalCode: "2000",
    });

    const payload = { KEY: [{ BUSINESSPARTNER: data.BusinessPartner }] };
    await messaging.emit(
      "sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1",
      payload
    );
    logger.info("<< BP Created event emitted", payload);
  });

  srv.after("UPDATE", async (data) => {
    const payload = { KEY: [{ BUSINESSPARTNER: data.BusinessPartner }] };
    await messaging.emit(
      "sap.s4.beh.businesspartner.v1.BusinessPartner.Changed.v1",
      payload
    );
    logger.info("<< BP Changed event emitted", payload);
  });
};
