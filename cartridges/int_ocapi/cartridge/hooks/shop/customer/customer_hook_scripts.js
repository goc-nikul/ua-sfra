/**
 *
 * customer_hook_scripts.js
 *
 * Handles OCAPI hooks for customer calls
 */

var Status = require('dw/system/Status');
var collections = require('*/cartridge/scripts/util/collections');
var basketHelper = require('~/cartridge/scripts/basketHelper');

exports.modifyGETResponse_v2 = function (customer, customerBasketsResultResponse) {
    collections.forEach(customerBasketsResultResponse.baskets, function (basketResponse) {
        basketHelper.updateResponse(basketResponse);
    });

    return new Status(Status.OK);
};

exports.modifyGETResponse = function (customer, customerResponse) {
    /* Assign response arg to local variable to prevent eslint no-param-reassign
    *  errors.  Object args are passed by reference, so changes will still apply.
    */
    var response = customerResponse;
    var responseArr = [];
    var customerGroups = customer.getCustomerGroups();
    collections.forEach(customerGroups, function (customerGroup) {
        responseArr.push({ id: customerGroup.ID, UUID: customerGroup.UUID });
    });
    response.c_customerGroups = responseArr;
    return new Status(Status.OK);
};

exports.beforePATCH = function (customer, customerInput) {
    var paymentInstrumentHelper = require('app_ua_core/cartridge/controllers/PaymentInstruments');
    var requestPaymentInstruments = customerInput.paymentInstruments;
    if (requestPaymentInstruments !== null) {
        var currentDefaultCardId = paymentInstrumentHelper.getDefaultPaymentInstrument();
        var reqDefaultPI = collections.find(requestPaymentInstruments, function (pi) {
            return pi.c_defaultPaymentCard === true;
        });
        if (reqDefaultPI) {
            if (currentDefaultCardId && currentDefaultCardId === reqDefaultPI.paymentInstrumentId) {
                return new Status(Status.OK);
            }
            if (reqDefaultPI.paymentMethodId !== 'AURUS_CREDIT_CARD') {
                return new Status(Status.Error, 'Default payment instruments must be an Aurus Credit card');
            }
            var allPaymentInstruments = customer.getProfile().getWallet().getPaymentInstruments();
            var newDefaultPI = collections.find(allPaymentInstruments, function (pi) {
                return pi.UUID === reqDefaultPI.paymentInstrumentId;
            });
            paymentInstrumentHelper.makeDefaultCard(newDefaultPI);
        }
    }
    return new Status(Status.OK);
};
