'use strict';

/* eslint-disable no-unused-vars */

/* API Includes */
var Status = require('dw/system/Status');
var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');

/**
 * Removes existing flashes to avoid duplication
 * @param {Object} basketResponse response
 */
function removeExistingFlashes(basketResponse) {
    collections.forEach(basketResponse.flashes, function (flash) {
        if (flash.type === 'customEmailIdRequired') {
            basketResponse.removeFlash(flash);
        }
    });
}

/**
 * Validate whether basket contains response
 * @param {Object} basketResponse response
 */
function validateEmail(basketResponse) {
    if (!basketResponse.customer_info.email) {
        basketResponse.addFlash({
            type: 'customEmailIdRequired',
            message: Resource.msg('error.card.invalid.email', 'cart', null),
            path: '$.customer_info.email'
        });
    }
}

/**
 * validates order before creating
 * @param {dw.order.Basket} basketResponse  - Current basket
 * @returns {Object} Status
 */
function validateOrder(basketResponse) {
    try {
        // validates email
        removeExistingFlashes(basketResponse);
        validateEmail(basketResponse);
        return new Status(Status.OK);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e);
    }
}

exports.validateBasket = function (basketResponse, duringSubmit) {
    return duringSubmit ? validateOrder(basketResponse) : new Status(Status.OK);
};
