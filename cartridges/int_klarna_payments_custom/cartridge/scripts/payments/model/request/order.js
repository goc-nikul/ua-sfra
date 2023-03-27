'use strict';

var superModule = module.superModule;

/**
 * merchant urls request model
 * @returns {void}
 */
function MerchantUrls() {
    this.confirmation = '';
    this.notification = '';
}

/**
 * KP Order Request Model
 * @param {dw.order.Order} order order object
 */
function KlarnaPaymentsOrderModel(order) {
    var inStorePickUpHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    var isOrderHasOnlyBopisItems = order ? inStorePickUpHelpers.basketHasOnlyBOPISProducts(order.shipments) : false;
    this.purchase_country = '';
    this.purchase_currency = '';
    this.locale = '';
    var Address = superModule.Address;
    this.billing_address = new Address();
    if (order && !order.custom.isCommercialPickup && !isOrderHasOnlyBopisItems) {
        this.shipping_address = new Address();
    }
    this.order_amount = 0;
    this.order_tax_amount = 0;
    this.order_lines = [];
    this.merchant_reference1 = '';
    this.merchant_reference2 = '';
    this.options = null;
    this.merchant_urls = new MerchantUrls();
    this.merchant_data = null;
}

module.exports = superModule;
module.exports.KlarnaPaymentsOrderModel = KlarnaPaymentsOrderModel;
