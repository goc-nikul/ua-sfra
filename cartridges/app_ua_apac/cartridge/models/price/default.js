'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc Default price class
 * @param {dw.value.Money} salesPrice - Sales price
 * @param {dw.value.Money} listPrice - List price
 * @param {dw.value.Money} priceBookSalesPrice - Sales price from the PriceBook
 * @param {dw.value.Money} actualListPrice - Actual List price
 */
function DefaultPrice(salesPrice, listPrice, priceBookSalesPrice, actualListPrice) {
    base.call(this, salesPrice, listPrice, priceBookSalesPrice, actualListPrice);
    var isAfterPayEnabled = require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('afterPayEnabled');
    if (isAfterPayEnabled) {
        var afterPayHelper = require('*/cartridge/scripts/helpers/afterPayHelper');
        if (!empty(salesPrice)) {
            this.afterPaypdpPrice = afterPayHelper.getAfterPayInstallmentPrice(salesPrice);
        } else if (!empty(listPrice)) {
            this.afterPaypdpPrice = afterPayHelper.getAfterPayInstallmentPrice(listPrice);
        } else if (!empty(actualListPrice)) {
            this.afterPaypdpPrice = afterPayHelper.getAfterPayInstallmentPrice(actualListPrice);
        }
    }
}

module.exports = DefaultPrice;
