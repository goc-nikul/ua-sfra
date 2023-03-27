'use strict';
var CustomerAddress = require('./dw_customer_CustomerAddress');
var ArrayList = require('../scripts/util/dw.util.Collection');

function Shipment() {
    this.ID = 'me';
    this.default = true;
    this.getProductLineItems = function () {
        return new ArrayList(this.productLineItems);
    };

    this.shippingAddress = new CustomerAddress();
    this.custom = {
        shipmentType: 'someType',
        fromStoreId: 'store123'
    };
    this.adjustedMerchandizeTotalPrice = {
        value: 5
    };
    this.isGift = false;
    this.gift = true;
    this.message = '';
    this.productLineItems = new ArrayList({
        custom: {
            sku: '1330767-408-8',
            giftCard: {
                value: 'NONE'
            }
        },
        ID: '12345',
        name: 'test'
    });

    this.getShippingAddress = function () {
        return this.shippingAddress;
    };

    this.setGift = function () {
        this.isGift = true;
    };

    this.setGiftMessage = function (message) {
        this.message = message;
    };

    this.shippingMethodID = 'test';

    this.shippingMethod = {
        ID: this.shippingMethodID,
        custom: {
            storePickupEnabled: false
        }
    };
    this.getShippingMethod = function () {
        return {
            ID: this.shippingMethodID,
            custom: {
                storePickupEnabled: false
            },
            getID: function () {
                return this.shippingMethodID;
            }
        };
    };
    this.setShippingMethod = function (shippingMethod) {
        this.shippingMethod = shippingMethod;
    };

    // eslint-disable-next-line no-unused-vars
    this.getShippingLineItem = function (lineItemId) {
        return {
            setPriceValue: function (price) {
                this.shippingTotalPrice = price;
            }
        };
    };

    this.getGiftMessage = function () {
        return '';
    };
    this.createShippingAddress = function () {
        return {};
    };
    this.isDefault = function () {
        return this.default;
    };
}

module.exports = Shipment;
