'use strict';
var showTermsEnabled = function (apiProduct) { // eslint-disable-line
    var CustomerUtils = require('*/cartridge/scripts/util/CustomerUtils');
    var customerUtils = new CustomerUtils();
    var showTerms = false;
    var promos = require('dw/campaign/PromotionMgr').activeCustomerPromotions.getProductPromotions(apiProduct);
    // eslint-disable-next-line no-undef
    var customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();

    if (customerUtils.isEmployeeDiscount(customer, customerCountry)) {
        showTerms = true;
        if (!empty(promos) && promos.length > 0) {
            for (let i = 0; i < promos.length; i++) {
                /* istanbul ignore else */
                if (('isEmployeeDiscount' in promos[i].custom) && (promos[i].custom.isEmployeeDiscount === true)) { // Only test positive case
                    showTerms = false;
                }
            }
        }
    }
    return showTerms;
};

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'showTerms', {
        enumerable: true,
        value: showTermsEnabled(apiProduct) // eslint-disable-line
    });
};
