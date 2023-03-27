(function () {
    'use strict';

    var superModule = module.superModule;

    /**
     * KP session request model
     * @param {boolean} preAssement If locale country is preassessed
     * @param {dw.order.Basket} basket object
     */
    function KlarnaPaymentsSessionModel(preAssement, basket) {
        this.purchase_country = '';
        this.purchase_currency = '';
        this.locale = '';
        if (preAssement) {
            var Address = superModule.Address;
            this.billing_address = new Address();
            if (basket && !basket.custom.isCommercialPickup) {
                this.shipping_address = new Address();
            }
        }
        this.order_amount = 0;
        this.order_tax_amount = 0;
        this.order_lines = [];
        this.merchant_reference2 = '';
        this.options = null;
        this.merchant_data = null;
    }

    module.exports = superModule;
    module.exports.KlarnaPaymentsSessionModel = KlarnaPaymentsSessionModel;
}());
