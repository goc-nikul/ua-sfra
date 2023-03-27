'use strict';

/**
 * @module models/analyticsDataRow
 */

/**
 * @type {dw.util.StringUtils}
 */
var StringUtils = require('dw/util/StringUtils');

/**
 * @type {dw.util.Calendar}
 */
var Calendar = require('dw/util/Calendar');

/**
 * @constructor
 * @param {dw.system.Site} site Current Website
 * @alias module:models/analyticsDataRow~DataRow
 */
function DataRow(site) {
    /**
     * @type {dw.system.Site}
     */
    this.site = site;

    /**
     * @type Object
     */
    this.rowStructure = {
        orderNumber: function (instance) {
            return instance.order.orderNo;
        },
        orderDate: function (instance) {
            var orderDate = new Calendar(instance.order.getCreationDate());
            orderDate.setTimeZone(instance.site.getTimezone());
            return StringUtils.formatCalendar(orderDate, 'yyyy-MM-dd HH:mm:ss');
        },
        site: function (instance) {
            return instance.site.ID;
        },
        registrationStatus: function (instance) {
            // eslint-disable-next-line
            return (instance.order.customer.isRegistered()) ? 'registered' : 'unregistered';
        },
        productID: function (instance) {
            return instance.lineItem.productID;
        },
        sku: function (instance) {
            return instance.lineItem.custom.sku;
        },
        style: function (instance) {
            return instance.lineItem.product.custom.style;
        },
        productName: function (instance) {
            return instance.lineItem.productName;
        },
        quantity: function (instance) {
            return instance.lineItem.quantityValue;
        },
        currencyCode: function (instance) {
            return instance.order.getCurrencyCode();
        },
        lineItemPrice: function (instance) {
            return instance.lineItem.getGrossPrice();
        },
        lineItemTaxBasisPrice: function (instance) {
            return instance.lineItem.getTaxBasis();
        },
        shippingTotal: function (instance) {
            return instance.order.getShippingTotalGrossPrice();
        },
        orderTotal: function (instance) {
            return instance.order.getTotalGrossPrice();
        },
        orderTax: function (instance) {
            return instance.order.getTotalTax();
        },
        promotions: function (instance) {
            var priceAdjustments = instance.lineItem.getPriceAdjustments();
            var promotions = [];
            var promotionData;
            for (var i = 0; i < priceAdjustments.length; i++) {
                promotionData = priceAdjustments[i].getPromotionID();
                if (priceAdjustments[i].getGrossPrice()) {
                    promotionData += ' (' + instance.order.getCurrencyCode() + ' ' + priceAdjustments[i].getGrossPrice() + ')';
                }
                promotions.push(promotionData);
            }
            return promotions.join(';');
        },
        status: function (instance) {
            return instance.order.status.displayValue;
        },
        paymentMethodId: function (instance) {
            var paymentInstruments = instance.order.paymentInstruments;
            var paymentMethods = [];
            for (var i = 0; i < paymentInstruments.length; i++) {
                paymentMethods.push(paymentInstruments[i].paymentMethod);
            }
            return paymentMethods.join(';');
        },
        maoOrderType: function (instance) {
            return instance.order.custom.maoOrderType.value;
        }
    };
}

/**
 * @alias module:models/analyticsDataRow~DataRow#prototype
 */
DataRow.prototype = {
    /**
     * @param {dw.order.Order} order Order Instance
     * @param {dw.order.ProductLineItem} lineItem Product Line Item Instance
     */
    initRow: function initRow(order, lineItem) {
        this.order = order;
        this.lineItem = lineItem;
    },

    /**
     * @returns {Array} Row Data as an Array
     */
    buildRow: function buildRow() {
        var row = [];
        var propValue;
        var instance = this;
        Object.keys(this.rowStructure).forEach((propName) => {
            propValue = instance.rowStructure[propName](instance);
            row.push(propValue);
        });
        return row;
    }
};

module.exports = DataRow;
