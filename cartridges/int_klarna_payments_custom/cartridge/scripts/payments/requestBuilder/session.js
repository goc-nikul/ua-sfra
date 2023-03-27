/* globals empty */

(function () {
    'use strict';

    var superModule = module.superModule;

    var Site = require('dw/system/Site');
    var isEnabledPreassessmentForCountry = require('*/cartridge/scripts/util/klarnaHelper').isEnabledPreassessmentForCountry;
    var isOMSEnabled = require('*/cartridge/scripts/util/klarnaHelper').isOMSEnabled();
    var isTaxationPolicyNet = require('*/cartridge/scripts/util/klarnaHelper').isTaxationPolicyNet;
    var discountTaxationMethod = require('*/cartridge/scripts/util/klarnaHelper').getDiscountsTaxation();
    var getShippment = require('*/cartridge/scripts/util/klarnaHelper').getShippment;

    superModule.prototype.buildBilling = function (basket) {
        var currentCustomer = basket.getCustomer();
        var profileIsAvailable = !empty(currentCustomer) && !empty(currentCustomer.profile);


        if (!empty(basket.billingAddress)) {
            this.context.billing_address = this.getAddressRequestBuilder().build(basket.billingAddress);

            this.context.billing_address.email = basket.customerEmail || '';
        } else if (profileIsAvailable && !empty(currentCustomer.addressBook.preferredAddress)) {
            this.context.billing_address = this.getAddressRequestBuilder().build(currentCustomer.addressBook.preferredAddress);

            this.context.billing_address.given_name = currentCustomer.profile.firstName;
            this.context.billing_address.family_name = currentCustomer.profile.lastName;
            this.context.billing_address.email = currentCustomer.profile.email;
        }

        // always set the below field(s) based on customer profile if available
        if (typeof this.context.billing_address !== 'undefined' && profileIsAvailable) {
            // addresses do not contain phone numbers
            this.context.billing_address.phone = currentCustomer.profile.phoneHome;
        }

        return this;
    };

    superModule.prototype.buildShipping = function (basket) {
        var currentCustomer = basket.getCustomer();
        var profileIsAvailable = !empty(currentCustomer) && !empty(currentCustomer.profile);
        // get default shipment shipping address
        var shipment = getShippment(basket);
        var shippingAddress = shipment.getShippingAddress();

        if (!profileIsAvailable) {
            // If we have store pickup as the only address, then we need to use the first & last name form billing
            // as sending store name should not be used
            var storePickUp = !empty(shipment.custom.fromStoreId);
            var billingAddress = basket.getBillingAddress();

            if (storePickUp && !empty(billingAddress.firstName)) {
                this.context.shipping_address.given_name = billingAddress.firstName;
            }

            if (storePickUp && !empty(billingAddress.lastName)) {
                this.context.shipping_address.family_name = billingAddress.lastName;
            }
        }

        if (!empty(shippingAddress)) {
            this.context.shipping_address = this.getAddressRequestBuilder().build(shippingAddress);

            this.context.shipping_address.email = basket.customerEmail || '';
        } else if (profileIsAvailable && !empty(currentCustomer.addressBook.preferredAddress)) {
            this.context.shipping_address = this.getAddressRequestBuilder().build(currentCustomer.addressBook.preferredAddress);

            this.context.shipping_address.given_name = currentCustomer.profile.firstName;
            this.context.shipping_address.family_name = currentCustomer.profile.lastName;
            this.context.shipping_address.email = currentCustomer.profile.email;
        }

        // always set the below field(s) based on customer profile if available
        if (typeof this.context.shipping_address !== 'undefined' && profileIsAvailable) {
            // addresses do not contain phone numbers
            this.context.shipping_address.phone = currentCustomer.profile.phoneHome;
        }

        return this;
    };

    superModule.prototype.buildShipments = function (shipments) {
        var shipment = {};
        var shippingLineItem = {};

        for (var i = 0; i < shipments.length; i++) {
            shipment = shipments[i];

            if (shipment.productLineItems.length === 0) {
                continue; // eslint-disable-line
            }

            if (!empty(shipment.shippingMethod)) {
                shippingLineItem = this.getShipmentItemRequestBuilder().build(shipment, 'session');

                if (!isOMSEnabled && (isTaxationPolicyNet() || (!isTaxationPolicyNet() && discountTaxationMethod === 'price'))) {
                    this.addPriceAdjustments(shipment.shippingPriceAdjustments.toArray(), null, null);
                }

                this.context.order_lines.push(shippingLineItem);
            }
        }
    };

    superModule.prototype.isLocaleObjectParamsValid = function (localeObject) {
        return (localeObject && localeObject.custom && (!empty(localeObject.custom.country) || !empty(localeObject.custom.klarnaLocale)));
    };

    superModule.prototype.build = function () {
        var basket = this.params.basket;
        var scope = this.params.scope;
        var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
        var isBasketHasOnlyBOPISProducts = basket ? instorePickupStoreHelpers.basketHasOnlyBOPISProducts(basket.shipments) : false;
        var preAssement = isEnabledPreassessmentForCountry(this.getLocaleObject().country) || (scope === 'OCAPI');
        var kpAttachmentsPreferenceValue = Site.getCurrent().getCustomPreferenceValue('kpAttachments');
        var kpPaymentIntentPreferenceValue = Site.getCurrent().getCustomPreferenceValue('kpPaymentIntent');

        this.init(preAssement, basket);

        this.setMerchantReference(basket);

        this.buildLocale(basket);

        if (kpPaymentIntentPreferenceValue && kpPaymentIntentPreferenceValue.value !== 'No') {
            this.setPaymentIntent();
        }

        if (preAssement) {
            this.buildBilling(basket);
            if (basket && !basket.custom.isCommercialPickup && !isBasketHasOnlyBOPISProducts) {
                this.buildShipping(basket);
            }

            if (kpAttachmentsPreferenceValue) {
                this.buildAdditionalCustomerInfo(basket);
            }
        }

        this.buildOrderLines(basket);
        this.buildTotalAmount(basket);
        this.buildTotalTax(basket);
        this.buildOptions();

        // Validate the built data using the context and line items
        this.validateBuildAmounts();

        return this.context;
    };

    module.exports = superModule;
}());
