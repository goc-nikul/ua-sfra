/* eslint-disable spellcheck/spell-checker */
'use strict';

var Status = require('dw/system/Status');
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var ApplePayHelper = require('*/cartridge/scripts/helpers/applePayHelper');
var Logger = require('dw/system/Logger');
var ApplePayLogger = Logger.getLogger('ApplePay', 'ApplePay');

/** ********************************************************************
* The purpose of this hook is to Re-calculate the cart and order total
* @param {dw.catalog.LineItemCtnr}	basket - the basket being checked out using Apple Pay
* @param {string} shippingMethod - the shipping method that was selected
* @param {Object} event - ApplePayShippingMethodSelectedEvent object
* @param {Object} response - JS object containing Apple Pay event callback parameters
* @returns {ApplePayHookResult} - a non-null result ends the hook execution
***********************************************************************/
exports.shippingMethodSelected = function (basket, shippingMethod, event, response) {
    try {
        var responseObject = ApplePayHelper.getResponseObject(basket);
        if (!empty(responseObject) && responseObject != null) {
            response.lineItems = responseObject.lineItems;	// eslint-disable-line no-param-reassign
            response.total = responseObject.total;	// eslint-disable-line no-param-reassign
        }
    } catch (e) {
        ApplePayLogger.error('Error in updating Shipping Method Override:{0}.', e.message);
    }
    return new ApplePayHookResult(new Status(Status.OK), null);
};


/** ********************************************************************
*The purpose of this hook is to Re-calculate the cart and order total
*
* @param {dw.catalog.LineItemCtnr}	basket - the basket being checked out using Apple Pay
* @param {Object} event - ApplePayShippingMethodSelectedEvent object
* @param {Object} response - JS object containing Apple Pay event callback parameters
* @returns {ApplePayHookResult} - a non-null result ends the hook execution
***********************************************************************/
exports.paymentMethodSelected = function (basket, event, response) {
    try {
        var responseObject = ApplePayHelper.getResponseObject(basket);
        if (!empty(responseObject) && responseObject != null) {
            response.lineItems = responseObject.lineItems;	// eslint-disable-line no-param-reassign
            response.total = responseObject.total;	// eslint-disable-line no-param-reassign
        }
    } catch (e) {
        ApplePayLogger.error('Error in updating Payment Method Override:{0}.', e.message);
    }
    return new ApplePayHookResult(new Status(Status.OK), null);
};
