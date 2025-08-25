sap.ui.define(["sap/fe/core/AppComponent"], function (AppComponent) {
  "use strict";

  return AppComponent.extend("com.sap.bp.businesspartners.Component", {
    metadata: {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"],
    },
  });
});
