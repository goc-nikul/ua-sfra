/* globals empty, session, request */
'use strict';
var superMdl = module.superModule;

var KlarnaPaymentsConstants = require('*/cartridge/scripts/util/klarnaPaymentsConstants');

var KlarnaHelper = require('*/cartridge/scripts/util/klarnaHelper');
var PAYMENT_METHOD = KlarnaHelper.getPaymentMethod();
var CREDIT_CARD_PROCESSOR_ID = KlarnaPaymentsConstants.CREDIT_CARD_PROCESSOR_ID;
var KLARNA_FRAUD_STATUSES = KlarnaPaymentsConstants.FRAUD_STATUS;

var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var HookMgr = require('dw/system/HookMgr');
var log = Logger.getLogger('KlarnaPayments');
var PaymentTransaction = require('dw/order/PaymentTransaction');

var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');
var klarnaSessionManager = new KlarnaSessionManager();

/**
 * Calls Klarna Create Order API.
 *
 * @param {dw.order.Order} order SCC order object
 * @param {dw.object.CustomObject} localeObject corresponding to the locale Custom Object from KlarnaCountries
 * @param {string} scope - The order scope - OCAPI
 * @param {Object} paymentInstrument payment intrument
 *
 * @return {Object|null} Klarna Payments create order response data on success, null on failure.
 */
function callKlarnaCreateOrderAPI(order, localeObject, scope, paymentInstrument) {
    var klarnaAuthorizationToken = null;
    if (scope && scope === 'OCAPI') {
        klarnaAuthorizationToken = paymentInstrument.custom.klarnaPaymentsAuthorizationToken;
    } else {
        klarnaAuthorizationToken = session.privacy.KlarnaPaymentsAuthorizationToken;
    }

    try {
        var createOrderHelper = require('*/cartridge/scripts/order/klarnaPaymentsCreateOrder');
        var klarnaCreateOrderResponse = createOrderHelper.createOrder(order, localeObject, klarnaAuthorizationToken);
        return klarnaCreateOrderResponse.response;
    } catch (e) {
        log.error('Error in creating Klarna Payments Order: {0}', e.message + e.stack);
        var result = null;
        // logic to handle klarna error for OCAPI
        if (scope && scope === 'OCAPI') {
            var errorMsg = JSON.parse(e.message);
            errorMsg.klarnaError = true;
            result = {
                error: true,
                errorMsg: JSON.stringify(errorMsg)
            };
        }
        return result;
    }
}

/**
 * Cancels a Klarna order through Klarna API
 * @param {dw.order.Order} order SCC order object
 * @param {dw.object.CustomObject} localeObject corresponding to the locale Custom Object from KlarnaCountries
 *
 * @return {boolean} true if order has been successfully cancelled, otherwise false
 */
function cancelOrder(order, localeObject) {
    var klarnaPaymentsCancelOrderHelper = require('*/cartridge/scripts/order/klarnaPaymentsCancelOrder');
    var cancelResult = klarnaPaymentsCancelOrderHelper.cancelOrder(localeObject, order);
    return cancelResult.success;
}

/**
 * Handle auto-capture functionality.
 *
 * @param {dw.order.Order} dwOrder DW Order object.
 * @param {string} kpOrderId Klarna Payments Order ID
 * @param {dw.object.CustomObject} localeObject locale object (KlarnaCountries).
 */
function handleAutoCapture(dwOrder, kpOrderId, localeObject) {
    Transaction.wrap(function () {
        var klarnaPaymentsCaptureOrderHelper = require('*/cartridge/scripts/order/klarnaPaymentsCaptureOrder');
        klarnaPaymentsCaptureOrderHelper.handleAutoCapture(dwOrder, kpOrderId, localeObject);
    });
}

/**
 * Handles the VCN settlement
 *
 * If the settlement retry has been enabled, we will retry to settle the order in case the first one failed
 *
 * @param {dw.order.Order} order SCC order object
 * @param {string} klarnaPaymentsOrderID Klarna Payments order id
 * @param {dw.object.CustomObject} localeObject corresponding to the locale Custom Object from KlarnaCountries
 *
 * @return {boolean} true if VCN settlement is created successfully, otherwise false
 */
function handleVCNSettlement(order, klarnaPaymentsOrderID, localeObject) {
    var vcnHelper = require('*/cartridge/scripts/VCN/klarnaPaymentsVCNSettlement');
    return vcnHelper.handleVCNSettlement(order, klarnaPaymentsOrderID, localeObject);
}

/**
 * Call Credit Card Authorization Hook (for VCN settlement)
 * @param {dw.order.order} order DW Order
 * @returns {processorResult} authorization result
 */
function callCreditCardAuthorizationHook(order) {
    var processorResult = null;
    var paymentInstrument = order.getPaymentInstruments(PAYMENT_METHOD)[0];
    var paymentProcessor = PaymentMgr
        .getPaymentMethod(paymentInstrument.paymentMethod)
        .paymentProcessor;
    var transactionID = paymentInstrument.getPaymentTransaction().getTransactionID();

    var hook = 'app.payment.processor.' + CREDIT_CARD_PROCESSOR_ID;
    if (!HookMgr.hasHook(hook)) {
        throw new Error('File of app.payment.processor.' + CREDIT_CARD_PROCESSOR_ID + ' hook is missing or the hook is not configured');
    }

    processorResult = HookMgr.callHook('app.payment.processor.' + CREDIT_CARD_PROCESSOR_ID, 'Authorize', transactionID, paymentInstrument, paymentProcessor);
    return processorResult;
}

/**
 * @returns {Object} error auth result
 */
function generateErrorAuthResult() {
    return { error: true };
}

/**
 * @returns {Object} success auth result
 */
function generateSuccessAuthResult() {
    return { authorized: true };
}

/**
*
* @param {Object} authResult Authorization result
* @returns {boolean} true, if the auth result is error
*/
function isErrorAuthResult(authResult) {
    return (!empty(authResult.error) && authResult.error);
}

/**
*
* @param {dw.order.order} order DW order
* @param {dw.order.paymentInstrument} paymentInstrument DW payment instrument
* @param {string} kpOrderId Klarna Order Id.
*/
function updateOrderWithKlarnaOrderInfo(order, paymentInstrument, kpOrderId) {
    var kpVCNEnabledPreferenceValue = Site.getCurrent().getCustomPreferenceValue('kpVCNEnabled');
    var kpAutoCaptureEnabled = Site.getCurrent().getCustomPreferenceValue('kpAutoCapture');
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    var pInstr = paymentInstrument;
    var dwOrder = order;

    Transaction.wrap(function () {
        pInstr.paymentTransaction.transactionID = kpOrderId;
        pInstr.paymentTransaction.paymentProcessor = paymentProcessor;

        if (kpAutoCaptureEnabled && !kpVCNEnabledPreferenceValue) {
            pInstr.paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
        } else {
            pInstr.paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
        }

        dwOrder.custom.kpOrderID = kpOrderId;
        dwOrder.custom.kpIsVCN = empty(kpVCNEnabledPreferenceValue) ? false : kpVCNEnabledPreferenceValue;
    });
}

/**
 * Authorize order already accepted by Klarna.
 *
 * @param {dw.order.order} order DW Order
 * @param {string} kpOrderID KP Order ID
 * @param {Object} localeObject locale info
 *
 * @return {AuthorizationResult} authorization result
 */
function authorizeAcceptedOrder(order, kpOrderID, localeObject) {
    var autoCaptureEnabled = Site.getCurrent().getCustomPreferenceValue('kpAutoCapture');
    var kpVCNEnabledPreferenceValue = Site.getCurrent().getCustomPreferenceValue('kpVCNEnabled');
    var authResult = {};

    if (!kpVCNEnabledPreferenceValue) {
        if (autoCaptureEnabled) {
            try {
                handleAutoCapture(order, kpOrderID, localeObject);
            } catch (e) {
                authResult = generateErrorAuthResult();
            }
        }
    } else {
        try {
            var isSettlementCreated = handleVCNSettlement(order, kpOrderID, localeObject);

            if (!isSettlementCreated) {
                authResult = generateErrorAuthResult();
                cancelOrder(order, localeObject);
            } else {
                authResult = callCreditCardAuthorizationHook(order);
            }
        } catch (e) {
            authResult = generateErrorAuthResult();
            cancelOrder(order, localeObject);
        }
    }

    if (isErrorAuthResult(authResult)) {
        return authResult;
    }

    return generateSuccessAuthResult();
}

/**
 * Handle Klarna Create Order API call response.
 *
 * @param {dw.order.order} order DW Order.
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument DW PaymentInstrument.
 * @param {Object} kpOrderInfo Response data from Klarna Create Order API call.
 * @param {string} scope - The order scope - OCAPI
 * @returns {Object} Authorization result object.
 */
function handleKlarnaOrderCreated(order, paymentInstrument, kpOrderInfo, scope) {
    var authorizationResult = {};
    var localeObject = klarnaSessionManager.getLocale();
    var kpFraudStatus = kpOrderInfo.fraud_status;
    var kpOrderId = kpOrderInfo.order_id;
    var redirectURL = kpOrderInfo.redirect_url;

    if (scope && scope === 'OCAPI') {
        // remove session & auth token attributes
        Transaction.wrap(function () {
            paymentInstrument.custom.KlarnaPaymentsClientToken = null; // eslint-disable-line
            paymentInstrument.custom.KlarnaPaymentsSessionID = null; // eslint-disable-line
            paymentInstrument.custom.klarnaPaymentsAuthorizationToken = null; // eslint-disable-line
        });
    } else {
        klarnaSessionManager.removeSession();
    }

    Transaction.wrap(function () {
        var pInstr = paymentInstrument;
        pInstr.paymentTransaction.custom.kpFraudStatus = kpFraudStatus;
    });

    updateOrderWithKlarnaOrderInfo(order, paymentInstrument, kpOrderId);

    if (kpFraudStatus === KLARNA_FRAUD_STATUSES.REJECTED) {
        authorizationResult = generateErrorAuthResult();
    } else if (kpFraudStatus === KLARNA_FRAUD_STATUSES.PENDING) {
        authorizationResult = generateSuccessAuthResult();
    } else {
        authorizationResult = authorizeAcceptedOrder(order, kpOrderId, localeObject);
    }

    if (!authorizationResult.error) {
        session.privacy.KlarnaPaymentsAuthorizationToken = '';
        session.privacy.KPAuthInfo = null;

        if (redirectURL) {
            session.privacy.KlarnaPaymentsRedirectURL = redirectURL;
        }
    }

    return authorizationResult;
}

/**
 * Update Order Data
 *
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {string} orderNo - Order Number
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @param {string} scope - The order scope - OCAPI
 * @returns {Object} Processor authorizing result
 */
superMdl.authorize = function (order, orderNo, paymentInstrument, scope) {
    var localeObject = klarnaSessionManager.getLocale();
    Transaction.wrap(function () {
        if (order && order.custom) {
            order.custom.customerLocale = request.locale; // eslint-disable-line
        }
    });
    var apiResponseData = callKlarnaCreateOrderAPI(order, localeObject, scope, paymentInstrument);

    if (!apiResponseData) {
        return generateErrorAuthResult();
    } else if (scope === 'OCAPI' && apiResponseData && apiResponseData.error) {
        return { error: true, errorMessage: apiResponseData.errorMsg };
    }

    return handleKlarnaOrderCreated(order, paymentInstrument, apiResponseData, scope);
};

module.exports = superMdl;
