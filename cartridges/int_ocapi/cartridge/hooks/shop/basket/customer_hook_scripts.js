/**
 *
 * customer_hook_scripts.js
 *
 * Handles OCAPI hooks for basket email address update
 */

var Status = require('dw/system/Status');

exports.afterPUT = function (basket) {
    // klarna session management call
    var basketHelper = require('~/cartridge/scripts/basketHelper');
    basketHelper.manageKlarnaSession(basket);
    return new Status(Status.OK);
};
