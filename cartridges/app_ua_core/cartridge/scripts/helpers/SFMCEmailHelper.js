'use strict';

var Resource = require('dw/web/Resource');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

/**
 * Create custom object to store failed sent email data.
 * @param {string} customObjectName - custom object name
 * @param {string} paramObj - order failed shipment details
 */
function createCustomObjectFailedEamilTriggers(customObjectName, paramObj) {
    var customObjKeyValue = paramObj.emailTypeID + '_' + paramObj.emailID + '_' + paramObj.orderID;
    var objectDefinition = CustomObjectMgr.getCustomObject(customObjectName, customObjKeyValue);
    if (empty(objectDefinition)) {
        require('dw/system/Transaction').wrap(function () {
            objectDefinition = CustomObjectMgr.createCustomObject(customObjectName, customObjKeyValue);
            objectDefinition.custom.Content = paramObj.orderID;
            objectDefinition.custom.EmailTypeID = paramObj.emailTypeID;
        });
    } else if (!empty(objectDefinition) && paramObj.serviceStatus !== 'OK') {
        var retryCount = !empty(objectDefinition.custom.RetryCount) ? objectDefinition.custom.RetryCount : 0;
        require('dw/system/Transaction').wrap(function () {
            objectDefinition.custom.RetryCount = retryCount + 1;
        });
    }
}

/**
 * Sends a shipment confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} params - order details
 * @returns {void}
 */
function sendShipmentConfirmationEmail(order, params) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var orderObject = {
        order: order
    };

    var emailData = {
        to: order.customerEmail,
        from: '',
        subject: Resource.msgf('email.subject.shipment', 'email', null, order.getOrderNo()),
        type: emailHelpers.emailTypes.shipmentConfirmation
    };

    var emailObj = {
        templateData: orderObject,
        emailData: emailData,
        params: params
    };
    var responseData = require('*/cartridge/modules/providers').get('Email', emailObj).send();
    if (responseData.status !== 'OK') {
        var customObjIterator = CustomObjectMgr.getAllCustomObjects('MarketingCloudFailedTriggers');
        var enableMCFailedEmailQueue = ('EnableMCFailedEmailQueue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('EnableMCFailedEmailQueue') ? Site.current.getCustomPreferenceValue('EnableMCFailedEmailQueue') : false;
        var marketingCloudCOLimit = ('MarketingCloudCOLimit' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('MarketingCloudCOLimit') ? Site.current.getCustomPreferenceValue('MarketingCloudCOLimit') : 1000;
        var paramObj = {
            emailID: order.customerEmail,
            orderID: order.orderNo,
            emailTypeID: 'shipmentConfirmation',
            serviceStatus: responseData.status
        };
        if (enableMCFailedEmailQueue) {
            if (customObjIterator.count <= marketingCloudCOLimit) {
                createCustomObjectFailedEamilTriggers('MarketingCloudFailedTriggers', paramObj);
                Logger.error('SFMCEmailHelper.js: save failed to re-send email trigger data for shipment confirmation email' + order.orderNo);
            } else {
                Logger.error('SFMCEmailHelper.js: the max number of failed triggers to save has exceeded');
            }
        }
    }
    return responseData;
}

/**
 * Sends a refubd confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} params - order details
 * @returns {void}
 */
function sendRefundConfirmationEmail(order, params) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var orderObject = {
        order: order
    };

    var emailData = {
        to: order.customerEmail,
        from: '',
        subject: Resource.msgf('email.subject.refund', 'email', null, order.getOrderNo()),
        type: emailHelpers.emailTypes.refundConfirmation
    };

    var emailObj = {
        templateData: orderObject,
        emailData: emailData,
        params: params
    };

    return require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Sends a Return confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} params - order details
 * @returns {void}
 */
function sendReturnConfirmationEmail(order, params) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var orderObject = {
        order: order
    };

    var emailData = {
        to: order.customerEmail,
        from: '',
        subject: Resource.msgf('email.subject.return', 'email', null, order.getOrderNo()),
        type: emailHelpers.emailTypes.returnOrderCreated
    };

    if (!empty(params.returnCase)) {
        var returnCase = params.returnCase;
        if (Object.prototype.hasOwnProperty.call(returnCase.custom, 'pickupEmail') && !empty(returnCase.custom.pickupEmail)) {
            emailData.to = returnCase.custom.pickupEmail;
        }
    }

    var emailObj = {
        templateData: orderObject,
        emailData: emailData,
        params: params
    };

    return require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Sends a Return confirmation to the current user
 * @param {dw.customer.Customer} customer - The current user's order
 * @returns {void}
 */
function sendPasswordResetConfirmationEmail(customer) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var customerObject = {
        resettingCustomer: customer
    };

    var emailData = {
        to: customer.profile.email,
        from: '',
        subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
        type: emailHelpers.emailTypes.passwordChanged
    };

    var emailObj = {
        templateData: customerObject,
        emailData: emailData
    };

    return require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

module.exports = {
    sendShipmentConfirmationEmail: sendShipmentConfirmationEmail,
    sendRefundConfirmationEmail: sendRefundConfirmationEmail,
    sendReturnConfirmationEmail: sendReturnConfirmationEmail,
    sendPasswordResetConfirmationEmail: sendPasswordResetConfirmationEmail,
    createCustomObjectFailedEamilTriggers: createCustomObjectFailedEamilTriggers
};
