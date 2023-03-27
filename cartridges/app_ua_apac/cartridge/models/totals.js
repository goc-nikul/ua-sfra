/* eslint-disable no-nested-ternary */
'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);
    var isAfterPayEnabled = require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('afterPayEnabled');
    if (require('dw/system/Site').getCurrent().getCustomPreferenceValue('atomeEnabled')) {
        var atomeHelper = require('*/cartridge/scripts/atome/helpers/atomeHelpers');
        var installmentGrossPrice = lineItemContainer.totalGrossPrice.value / 3;
        var currencySymbol = session.currency.symbol;
        this.installmentGrandTotal = currencySymbol + atomeHelper.toFixed(installmentGrossPrice, 2);
    }
    if (isAfterPayEnabled) {
        var afterPayHelper = require('*/cartridge/scripts/helpers/afterPayHelper');
        var totalGrossPrice = lineItemContainer.getTotalGrossPrice();
        this.afterPayCartPrice = afterPayHelper.getAfterPayInstallmentPrice(totalGrossPrice);
    }
}

module.exports = totals;
