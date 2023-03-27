/* globals empty */
var supermdl = module.superModule;
/**
* Klarna Session Manager
*
* Used to manage Klarna Sessions opened per-locale at checkout.
*/

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var AurusLogger = Logger.getLogger('AurusPayHelper', 'AurusPayHelper');
var log = Logger.getLogger('KlarnaPayments');
var Transaction = require('dw/system/Transaction');

/**
 * Refresh an existing Klarna Session.
 *
 * The current session is updated by using the REST Klarna interface.
 * Then, another GET call is made to retrieve session information and update klarna payment instrument
 * @param {dw.order.OrderPaymentInstrument} klarnaPaymentInstrument - klarnaPaymentInstrument
 * @param {string} scope - OCAPI
 * @returns {Object} Response from the GET call.
 */
supermdl.prototype.refreshSessionOCAPI = function (klarnaPaymentInstrument, scope) {
    var localeObject = this.getLocale();
    var basket = BasketMgr.getCurrentBasket();
    if (empty(basket)) {
        return null;
    }

    try {
        var updateSessionHelper = require('*/cartridge/scripts/session/klarnaPaymentsUpdateSession');
        var updateSessionResponse = updateSessionHelper.updateSession(basket.custom.kpSessionId, basket, localeObject);
        return updateSessionResponse.response;
    } catch (e) {
        return this.createSessionOCAPI(klarnaPaymentInstrument, scope);
    }
};

/**
 * Create a new Klarna session for OCAPI.
 *
 * Parts of the Klarna API call's response are saved into klarna payment instrument
 * @param {dw.order.OrderPaymentInstrument} klarnaPaymentInstrument - klarnaPaymentInstrument
 * @param {string} scope - OCAPI
 * @returns {Object} Klarna API call response.
 */
supermdl.prototype.createSessionOCAPI = function (klarnaPaymentInstrument, scope) {
    var localeObject = this.getLocale();
    var response = {};
    var basket = BasketMgr.getCurrentBasket();
    if (empty(basket)) {
        return null;
    }

    AurusLogger.info('createSessionOCAPI');
    var enableAurusPay = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (enableAurusPay) {
        try {
            var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
            response = aurusPayHelper.getSession(basket);

            Transaction.wrap(function () {
                klarnaPaymentInstrument.custom.ott = response['session_id']; // eslint-disable-line
            });
        } catch (error) {
            log.error('createSessionOCAPI OCAPI: {0}', JSON.stringify(error));
        }
    } else {
        var createSessionHelper = require('*/cartridge/scripts/session/klarnaPaymentsCreateSession');
        response = createSessionHelper.createSession(basket, localeObject, scope);
    }

    AurusLogger.info('createSessionOCAPI response: {0}', JSON.stringify(response));
    Transaction.wrap(function () {
        klarnaPaymentInstrument.custom.KlarnaPaymentsSessionID = response.session_id; // eslint-disable-line
        klarnaPaymentInstrument.custom.KlarnaPaymentsClientToken = response.client_token; // eslint-disable-line
    });

    return response;
};
/**
 * Create or Update Klarna session.
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {Object} Last API call's response; on error - null
 */
supermdl.prototype.createOrUpdateSessionOCAPI = function (basket) { // eslint-disable-line
    try {
        AurusLogger.info('createOrUpdateSessionOCAPI');
        if (basket && basket.getPaymentInstruments('KLARNA_PAYMENTS').length > 0) {
            var klarnaPaymentInstrument = basket.getPaymentInstruments('KLARNA_PAYMENTS')[0];
            // Klarna session creation/updation call
            if (klarnaPaymentInstrument.custom.KlarnaPaymentsSessionID) {
                AurusLogger.info('KlarnaPaymentsSessionID: {0}', klarnaPaymentInstrument.custom.KlarnaPaymentsSessionID);
                // refresh klarna session
                return this.refreshSessionOCAPI(klarnaPaymentInstrument, 'OCAPI');
            }
            // create klarna session
            return this.createSessionOCAPI(klarnaPaymentInstrument, 'OCAPI');
        }
    } catch (e) {
        log.error('Error in handling Klarna Payments Session OCAPI: {0}', e.message + e.stack);
        return null;
    }
};

module.exports = supermdl;
