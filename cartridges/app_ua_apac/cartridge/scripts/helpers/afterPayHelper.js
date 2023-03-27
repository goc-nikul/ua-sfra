'use strict';

/**
 * Calculates the afterPay 4 interest payments
 * @param {dw.value.Money} price - The current user's available price
 * @returns {number} The afterPay price
 */
function getAfterPayInstallmentPrice(price) {
    var Money = require('dw/value/Money');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var afterPayInstallmentPPrice = formatMoney(new Money(price.value / 4, price.currencyCode));
    return afterPayInstallmentPPrice;
}

module.exports = {
    getAfterPayInstallmentPrice: getAfterPayInstallmentPrice
};
