'use strict';

var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');

/**
 * @return {Object} - returns cookieValue.
 */
function cookieValue() {
    var emailSubscribeCookie = cookieHelper.read('emailSubscribeCookie');
    return emailSubscribeCookie;
}

module.exports.cookieValue = cookieValue;
