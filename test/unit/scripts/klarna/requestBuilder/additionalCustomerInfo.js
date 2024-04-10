'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Basket = require('../../../../mocks/dw/dw_order_Basket');

var base = module.superModule;
base.prototype.buildAdditionalCustomerPurchaseHistory = function () {
    var purchaseHistoryFull = [{}];
    return purchaseHistoryFull;
}

describe('int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/additionalCustomerInfo.js file test cases', () => {
    let additionalCustomerInfo = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/additionalCustomerInfo.js', {
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasOnlyBOPISProducts: function () {
                return false;
            }
        }
    });
    it('Test buildOtherDeliveryAddress method', function () {
        var basket = new Basket();
        var otherdeliveryAddress = additionalCustomerInfo.prototype.buildOtherDeliveryAddress(basket)[0];
        assert.isDefined(otherdeliveryAddress.shipping_method, 'shipping_method defined');
        assert.isDefined(otherdeliveryAddress.first_name, 'first_name defined');
        assert.isDefined(otherdeliveryAddress.last_name, 'last_name defined');
        assert.isDefined(otherdeliveryAddress.street_address, 'street_address defined');
        assert.isDefined(otherdeliveryAddress.street_number, 'street_number defined');
        assert.isDefined(otherdeliveryAddress.postal_code, 'postal_code defined');
        assert.isDefined(otherdeliveryAddress.country, 'country defined');
    });
    it('Test buildAdditionalCustomerInfoBody method ', function () {
        var basket = new Basket();
        basket.custom.isCommercialPickup = false;
        var body = JSON.parse(additionalCustomerInfo.prototype.buildAdditionalCustomerInfoBody(basket));
        assert.isDefined(body.customer_account_info[0].unique_account_identifier, 'unique_account_identifier defined');
        assert.isDefined(body.customer_account_info[0].account_registration_date, 'account_registration_date defined');
        assert.isDefined(body.customer_account_info[0].account_last_modified, 'account_last_modified defined');
        assert.isDefined(body.purchase_history_full, 'purchase_history_full defined');
        assert.isUndefined(body.other_delivery_address, 'other_delivery_address is not defined');
    });
});

