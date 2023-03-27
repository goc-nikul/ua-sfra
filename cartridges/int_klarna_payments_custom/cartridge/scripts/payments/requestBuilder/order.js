/* globals empty */

(function () {
    'use strict';

    var superModule = module.superModule;
    var getShippment = require('*/cartridge/scripts/util/klarnaHelper').getShippment;
    var KlarnaPaymentsOrderModel = require('*/cartridge/scripts/payments/model/request/order').KlarnaPaymentsOrderModel;
    var isTaxationPolicyNet = require('*/cartridge/scripts/util/klarnaHelper').isTaxationPolicyNet;
    var discountTaxationMethod = require('*/cartridge/scripts/util/klarnaHelper').getDiscountsTaxation();
    var isOMSEnabled = require('*/cartridge/scripts/util/klarnaHelper').isOMSEnabled();


    superModule.prototype.init = function (order) {
        this.context = new KlarnaPaymentsOrderModel(order);

        return this;
    };

    superModule.prototype.buildShipping = function (order) {
        if (order) {
            var inStorePickUpHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
            var isOrderHasOnlyBopisItems = inStorePickUpHelpers.basketHasOnlyBOPISProducts(order.shipments);
            var shipment = getShippment(order);

            if (!order.custom.isCommercialPickup && !isOrderHasOnlyBopisItems) {
                // get default shipment shipping address
                var shippingAddress = !empty(shipment) ? shipment.getShippingAddress() : null;

                if (shippingAddress === null || shippingAddress.address1 === null) {
                    delete this.context.shipping_address;
                    return this;
                }

                this.context.shipping_address = this.getAddressRequestBuilder().build(shippingAddress);
                this.context.shipping_address.email = order.customerEmail;
            }

            // If we have store pickup as the only address, then we need to use the first & last name form billing
            // as sending store name should not be used
            var storePickUp = !empty(shipment.custom.fromStoreId);
            var billingAddress = order.getBillingAddress();

            if (storePickUp && !empty(billingAddress.firstName)) {
                this.context.shipping_address.given_name = billingAddress.firstName;
            }

            if (storePickUp && !empty(billingAddress.lastName)) {
                this.context.shipping_address.family_name = billingAddress.lastName;
            }
        }

        return this;
    };

    superModule.prototype.buildShipments = function (shipments, context) {
        var shipment = {};
        var shippingLineItem = {};

        for (var i = 0; i < shipments.length; i++) {
            shipment = shipments[i];

            if (shipment.productLineItems.length === 0) {
                continue; // eslint-disable-line
            }

            if (!empty(shipment.shippingMethod)) {
                shippingLineItem = this.getShipmentItemRequestBuilder().build(shipment, 'order');

                if (!isOMSEnabled && (isTaxationPolicyNet() || (!isTaxationPolicyNet() && discountTaxationMethod === 'price'))) {
                    this.addPriceAdjustments(shipment.shippingPriceAdjustments.toArray(), null, null, context);
                }

                context.order_lines.push(shippingLineItem);
            }
        }
    };

    superModule.prototype.isValidLocaleObjectParams = function (localeObject) {
        return (!empty(localeObject.custom) && (!empty(localeObject.custom.country) || !empty(localeObject.custom.klarnaLocale)));
    };

    superModule.prototype.build = function () {
        var order = this.params.order;

        this.init(order)
            .setMerchantReference(order)
            .buildLocale(order)
            .buildBilling(order)
            .buildShipping(order)
            .buildOrderLines(order)
            .buildTotalAmount(order)
            .buildTotalTax(order)
            .buildAdditionalCustomerInfo(order)
            .buildOptions()
            .buildMerchantInformation(order);

        return this.context;
    };

    module.exports = superModule;
}());
