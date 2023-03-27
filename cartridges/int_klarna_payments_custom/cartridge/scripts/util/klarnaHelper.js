/* globals empty */

'use strict';

var superMdl = module.superModule;
var Site = require('dw/system/Site');

/**
 * Checks if payment options should be displayed, hidden or grayed out when hard reject from Klarna is received.
 * Value of "kpRejectedMethodDisplay" determines if the method will be displayed - If set to value other than "No",
 * the Klarna payment method options on the checkout will be greyed out/ not displayed to customer in the current
 * view when Klarna authorization request is rejected in the response (.i.e hard reject - "show_form" and "approved"
 * are both "false")
 * @returns {string} the selectd mode of payment method with hard reject
 */
superMdl.hideRejectedPayments = function () {
    return Site.getCurrent().getCustomPreferenceValue('kpRejectedMethodDisplay') ? Site.getCurrent().getCustomPreferenceValue('kpRejectedMethodDisplay').value : '';
};

/**
 * Returns the selected discounts taxation method.
 * Should have the same value as "Merchant Tools > Site Preferences > Promotions > Discount Taxation"
 * @return {string} the selected discounts taxation method
 */
superMdl.getDiscountsTaxation = function () {
    return Site.getCurrent().getCustomPreferenceValue('kpPromoTaxation') ? Site.getCurrent().getCustomPreferenceValue('kpPromoTaxation').value : '';
};

/**
 * Retrieves the Express Button form details
 * @param {dw.web.Form} expressForm The express form definition
 * @return {Object} klarnaDetails The KEB details
 */
superMdl.getExpressFormDetails = function (expressForm) {
    var klarnaPhNumber = expressForm.phone.value;
    klarnaPhNumber = klarnaPhNumber ? klarnaPhNumber.replace(/[^\d]/g, '').slice(-10) : '';
    var countryCode = expressForm.countryCode && expressForm.countryCode.value ? expressForm.countryCode.value : '';
    var klarnaDetails = {
        email: expressForm.email.value || '',
        phone: klarnaPhNumber,
        firstName: expressForm.firstName.value || '',
        lastName: expressForm.lastName.value || '',
        address1: expressForm.address1.value || '',
        address2: expressForm.address2.value || '',
        city: expressForm.city.value || '',
        stateCode: expressForm.stateCode.value || '',
        postalCode: expressForm.postalCode.value || '',
        countryCode: { value: countryCode }
    };

    return klarnaDetails;
};

/**
 * @param {number} orderTotal Order total amount
 * @returns {number} splitAmount Payment Method name.
 */
function getSplitPaymentAmount(orderTotal) {
    var splitAmount = orderTotal / 4;
    return splitAmount;
}

superMdl.getSplitPaymentAmount = getSplitPaymentAmount;
module.exports = superMdl;
