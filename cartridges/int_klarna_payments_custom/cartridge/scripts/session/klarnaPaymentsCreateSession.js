/**
* Script to create new Klarna Sessions
*
* @module cartridge/scripts/session/klarnaPaymentsCreateSession
*
* @input Basket : dw.order.Basket The basket
* @input LocaleObject : Object
*/

'use strict';

var superModule = module.superModule;

// import packages
var KlarnaPayments = {
    httpService: require('*/cartridge/scripts/common/klarnaPaymentsHttpService'),
    apiContext: require('*/cartridge/scripts/common/klarnaPaymentsApiContext'),
    sessionRequestBuilder: require('*/cartridge/scripts/payments/requestBuilder/session')
};
var KlarnaHelper = require('*/cartridge/scripts/util/klarnaHelper');

/**
 * Function to create session request body
 * @param {dw.order.Basket} basket cart object
 * @param {Object} localeObject Klarna locale object
 * @param {string} scope - The order scope - OCAPI
 * @return {Object} session request body
 */
function _getRequestBody (basket, localeObject, scope) { // eslint-disable-line
    var sessionRequestBuilder = new KlarnaPayments.sessionRequestBuilder();// eslint-disable-line

    sessionRequestBuilder.setParams({
        basket: basket,
        localeObject: localeObject,
        scope: scope
    });

    return sessionRequestBuilder.build();
}

/**
 * Function to call Klarna API to create session
 * @param {dw.order.Basket} basket  cart object
 * @param {Object} localeObject Klarna locale object
 * @param {string} scope - The order scope - OCAPI
 * @return {Object} success status and response
 */
superModule.createSession = function (basket, localeObject, scope) {
    var Transaction = require('dw/system/Transaction');
    var response = null;

    try {
        var klarnaPaymentsHttpService = new KlarnaPayments.httpService();// eslint-disable-line
        var klarnaApiContext = new KlarnaPayments.apiContext();// eslint-disable-line
        var requestBody = _getRequestBody(basket, localeObject, scope); // eslint-disable-line
        var requestUrl = klarnaApiContext.getFlowApiUrls().get('createSession');
        var serviceID = klarnaApiContext.getFlowApiIds().get('createSession');

        response = klarnaPaymentsHttpService.call(serviceID, requestUrl, 'POST', localeObject.custom.credentialID, requestBody);
        var klarnaPaymentMethods = response.payment_method_categories ? JSON.stringify(response.payment_method_categories) : null;
        Transaction.wrap(function () {
            session.privacy.KlarnaLocale = localeObject.custom.klarnaLocale;
            session.privacy.KlarnaPaymentMethods = klarnaPaymentMethods;
            session.privacy.SelectedKlarnaPaymentMethod = null;

            basket.custom.kpSessionId = response.session_id; // eslint-disable-line
            basket.custom.kpClientToken = response.client_token; // eslint-disable-line
        });
    } catch (e) {
        dw.system.Logger.error('Error in creating Klarna Payments Session: {0}', e.message + e.stack);
        KlarnaHelper.clearSessionRef(basket);
        return {
            success: false,
            response: null
        };
    }
    return {
        success: true,
        response: response
    };
};

module.exports = superModule;
