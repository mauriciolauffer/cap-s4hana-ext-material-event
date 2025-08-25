const cds = require("@sap/cds");

class SalesService extends cds.ApplicationService {
  async init() {
    const { BusinessPartner, BusinessPartnerAddress, Notifications } =
      this.entities;
    const bupaSrv = await cds.connect.to("API_BUSINESS_PARTNER");
    const logger = cds.log("sales-service");

    this.on("READ", BusinessPartnerAddress, (req) => bupaSrv.run(req.query));
    this.on("READ", BusinessPartner, (req) => bupaSrv.run(req.query));

    this.after("UPDATE", Notifications, async (data) => {
      if (
        data.verificationStatus_code === "V" ||
        data.verificationStatus_code === "INV"
      )
        await messaging.emit("BusinessPartnerVerified", data);
    });

    const messaging = await cds.connect.to("messaging");
    messaging.on(
      "sap.s4.beh.businesspartner.v1.BusinessPartner.Created.v1",
      async (msg) => {
        logger.info("<< Create event caught", msg.data);
        const businessPartnerId = msg.data?.KEY[0]?.BUSINESSPARTNER;
        const bpQuery = bupaSrv.run(
          SELECT.one(BusinessPartner).where({
            businessPartnerId: businessPartnerId,
          })
        );
        const bpAddressQuery = bupaSrv.run(
          SELECT.one(BusinessPartnerAddress).where({
            businessPartnerId: businessPartnerId,
          })
        );
        // Not using Associations, sending two requests in parallel just to showcase this option
        const [businessPartner, address] = await Promise.all([
          bpQuery,
          bpAddressQuery,
        ]);
        await INSERT.into(Notifications).entries({
          businessPartnerId: businessPartnerId,
          verificationStatus_code: "N",
          businessPartnerName: businessPartner.businessPartnerName,
          addresses: [address],
        });
      }
    );

    // This is just to show that you can also emit events from CAP applications...
    messaging.on("BusinessPartnerVerified", (msg) => {
      logger.info("<< BP Verified event caught", msg.data);
    });

    await super.init();
  }
}

module.exports = SalesService;
