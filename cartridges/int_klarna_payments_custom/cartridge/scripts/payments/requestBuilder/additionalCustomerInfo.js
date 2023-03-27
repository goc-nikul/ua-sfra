/* globals empty */

'use strict';

var superModule = module.superModule;

superModule.prototype.buildOtherDeliveryAddress = function (basket) {
    var otherdeliveryAddress = [{}];
    otherdeliveryAddress[0].shipping_method = 'pick-up point';
    var shipment = basket.getShipments().iterator().next();
    var shippingAddress = shipment.getShippingAddress();
    otherdeliveryAddress[0].first_name = shippingAddress.firstName || '';
    otherdeliveryAddress[0].last_name = shippingAddress.lastName || '';
    otherdeliveryAddress[0].street_address = shippingAddress.address1 || '';
    otherdeliveryAddress[0].street_number = shippingAddress.address2 || '';
    otherdeliveryAddress[0].postal_code = shippingAddress.postalCode || '';
    otherdeliveryAddress[0].country = shippingAddress.city || '';
    otherdeliveryAddress[0].country = shippingAddress.getCountryCode().value || '';

    return otherdeliveryAddress;
};

superModule.prototype.buildAdditionalCustomerInfoBody = function (basket) {
    var customer = basket.getCustomer();
    var body = {};

    body.customer_account_info = new Array({});

    if (customer.registered) {
        body.customer_account_info[0].unique_account_identifier = customer.profile.customerNo;
        body.customer_account_info[0].account_registration_date = !empty(customer.profile.creationDate) ? customer.profile.creationDate.toISOString().slice(0, -5) + 'Z' : '';
        body.customer_account_info[0].account_last_modified = !empty(customer.profile.lastModified) ? customer.profile.lastModified.toISOString().slice(0, -5) + 'Z' : '';
    }

    body.purchase_history_full = this.buildAdditionalCustomerPurchaseHistory(customer);
    var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    var isBasketHasOnlyBOPISProducts = basket ? instorePickupStoreHelpers.basketHasOnlyBOPISProducts(basket.shipments) : false;
    if (basket.custom.isCommercialPickup || isBasketHasOnlyBOPISProducts) {
        body.other_delivery_address = this.buildOtherDeliveryAddress(basket);
    }

    return JSON.stringify(body);
};

module.exports = superModule;
