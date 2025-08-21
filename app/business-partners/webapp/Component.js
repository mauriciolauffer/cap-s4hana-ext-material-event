sap.ui.define(
    ["sap/fe/core/AppComponent"],
    function (Component) {
        "use strict";

        return Component.extend("cap.s4hana.ext.businesspartners.Component", {
            metadata: {
                manifest: "json"
            },
            
            /**
             * Component is automatically initialized by UI5 at startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                Component.prototype.init.apply(this, arguments);
            }
        });
    }
);
