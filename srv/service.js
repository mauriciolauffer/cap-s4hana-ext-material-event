const cds = require("@sap/cds");

class SalesService extends cds.ApplicationService {
  async init() {
    const srv = this;
    const { BusinessPartner, BusinessPartnerAddress } = srv.entities;
    const bupaSrv = await cds.connect.to("API_BUSINESS_PARTNER");

    srv.on("READ", BusinessPartnerAddress, (req) => bupaSrv.run(req.query));
    srv.on("READ", BusinessPartner, (req) => bupaSrv.run(req.query));

    await super.init();
  }
}

module.exports = SalesService;
