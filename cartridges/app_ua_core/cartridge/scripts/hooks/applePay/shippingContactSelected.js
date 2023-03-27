/* eslint-disable no-param-reassign */
/* eslint-disable spellcheck/spell-checker */

'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var ApplePayLogger = Logger.getLogger('ApplePay', 'ApplePay');
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var ApplePayHelper = require('*/cartridge/scripts/helpers/applePayHelper');
var Resource = require('dw/web/Resource');

/**
* The purpose of this hook is to validate shipping address fields. Get shipping address details from the basket, since shipping address
* for the default shipment will have already been updated to reflect the available shipping contact information provided by Apple Pay.
*
* @param {dw.catalog.LineItemCtnr} basket - the basket being checked out using Apple Pay
* @param {Object} event - ApplePayShippingContactSelectedEvent object
* @param {Object} response - JS object containing Apple Pay event callback parameters
* @returns {ApplePayHookResult} - a non-null result ends the hook execution
*
*/
exports.shippingContactSelected = function (basket, event, response) {
    try {
        var result = ApplePayHelper.getApplicableShippingMethods(basket);
        var shippingAddress = basket.defaultShipment.shippingAddress;
        if (!empty(result.applicableShippingMethodsObject) && result.applicableShippingMethodsObject != null) {
            response.shippingMethods = result.applicableShippingMethodsObject;
        }

        if (!(event.shippingContact.countryCode.toUpperCase() === 'AU' || event.shippingContact.countryCode.toUpperCase() === 'GB' || event.shippingContact.countryCode.toUpperCase() === 'US')) {
            var error = new Status(Status.ERROR, Resource.msg('applepay.inavild.country', 'checkout', null));
            error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
            return new ApplePayHookResult(error, null);
        }
        // Setting the locality to suburb field and clearingn the city feild
        if (event.shippingContact.countryCode.toUpperCase() === 'AU') {
            shippingAddress.custom.suburb = event.shippingContact.locality;
            shippingAddress.city = '';
        }
    } catch (e) {
        ApplePayLogger.error('Error in updating Shipping Method Override:{0}.', e.message);
    }
    return new ApplePayHookResult(new Status(Status.OK), null);
};
