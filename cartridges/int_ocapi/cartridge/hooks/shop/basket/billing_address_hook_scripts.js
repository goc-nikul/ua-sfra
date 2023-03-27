'use strict';
/**
 * billing_address_hook_scripts.js
 *
 * Handles OCAPI hooks for billing address calls
 */

/* eslint-disable no-unused-vars */

/* API Includes */
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var log = Logger.getLogger('shopApp-ocapi');
var basketHooks = require('./basket_hook_scripts');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');

exports.beforePUT = function (basket, billingAddress) {
    try {
        const params = request.getHttpParameters(); // eslint-disable-line no-undef
        if (!empty(params) && params.containsKey('use_as_shipping')) {
            var useAsShipping = params.get('use_as_shipping')[0];
            if (useAsShipping === 'true' && basket.defaultShipment) {
                if (!params.containsKey('customer_address_id')) {
                    return basketHooks.beforePUT(basket, basket.defaultShipment, billingAddress);
                }
            }
        }
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.billing.addressbeforePut', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};

exports.afterPUT = function (basket, billingAddress) {
    try {
        // klarna session management call
        var basketHelper = require('~/cartridge/scripts/basketHelper');
        basketHelper.manageKlarnaSession(basket);
        const params = request.getHttpParameters(); // eslint-disable-line no-undef
        if (!empty(params) && params.containsKey('use_as_shipping')) {
            var useAsShipping = params.get('use_as_shipping')[0];
            if (useAsShipping === 'true' && basket.defaultShipment) {
                if (billingAddress == null && params.containsKey('customer_address_id')) {
                    // eslint-disable-next-line no-param-reassign
                    billingAddress = customer.addressBook.getAddress(params.get('customer_address_id')[0]);
                }
                return basketHooks.afterPUT(basket, basket.defaultShipment, billingAddress);
            }
        }
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.billing.addressafterPut', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};
