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
