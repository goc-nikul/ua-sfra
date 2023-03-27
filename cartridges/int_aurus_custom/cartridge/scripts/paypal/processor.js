'use strict';

var base = module.superModule;

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var paypalApi = require('*/cartridge/scripts/paypal/paypalApi');
var accountHelper = require('*/cartridge/scripts/paypal/accountHelpers');
var paypalHelper = require('*/cartridge/scripts/paypal/paypalHelper');
var prefs = paypalHelper.getPrefs();
var Logger = require('dw/system/Logger').getLogger('AurusPayHelper', 'AurusPayHelper');

/**
 * Processor Handle
 *
 * @param {dw.order.LineItemCtnr} basket - Current basket
 * @param {boolean} isFromCart - Is checkout started from cart
 * @param {boolean} inpIsUseBillingAgreement - Is Billing Agreement used
 * @param {boolean} isOcapi - Is OCAPI
 * @returns {Object} Processor handling result
 */
function handle(basket, isFromCart, inpIsUseBillingAgreement, isOcapi) {
    var isUseBillingAgreement = inpIsUseBillingAgreement;
    var paypalForm = session.forms.billing.paypal;

    paypalHelper.removeAllPaypalPaymentInstruments(basket);

    var methodName = 'PayPal';

    if (!isFromCart) {
        isUseBillingAgreement = paypalForm.useCustomerBillingAgreement.checked;
    }

    var paymentInstrument = paypalHelper.createPaymentInstrument(basket, methodName);
    var customerBillingAgreement = paypalHelper.getCustomerBillingAgreement(basket.getCurrencyCode());

    Transaction.wrap(function () {
        paymentInstrument.custom.paypalBillingAgreement = false;
        if (!prefs.isMFRA) {
            session.forms.billing.fulfilled.value = true;
            session.forms.billing.paymentMethods.selectedPaymentMethodID.value = methodName;
            session.forms.billing.paymentMethods.creditCard.saveCard.value = false;
        }
    });

    if (isUseBillingAgreement) {
        var actualBillingAgreementData = accountHelper.getActualBillingAgreementData(basket);
        if (actualBillingAgreementData) {
            Transaction.wrap(function () {
                paymentInstrument.custom.paypalBillingAgreement = true;
            });
            return {
                success: true,
                paymentInstrument: paymentInstrument,
                actualBillingAgreementData: actualBillingAgreementData,
                paypalEmail: customerBillingAgreement.getDefault().email,
                paypalBillingAgreementIsActaual: true
            };
        }
        return {
            error: true,
            paypalBillingAgreementNotActaual: true
        };
    }

    if (!isFromCart && basket.custom.paypalAlreadyHandledToken && !paypalForm.useAnotherAccount.checked) {
        Transaction.wrap(function () {
            paymentInstrument.custom.paypalToken = basket.custom.paypalAlreadyHandledToken;
            paymentInstrument.custom.paypalPayerID = basket.custom.paypalAlreadyHandledPayerID;
            paymentInstrument.custom.paypalEmail = basket.custom.paypalAlreadyHandledEmail;
        });
        return {
            success: true,
            redirectUrl: URLUtils.https(prefs.summaryPageEndpoint, 'stage', 'placeOrder').toString(),
            paypalEmail: basket.custom.paypalAlreadyHandledEmail,
            paypalToken: basket.custom.paypalAlreadyHandledToken,
            paymentInstrument: paymentInstrument
        };
    }

    var paypalToken;
    var enableAurusPay = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (isOcapi && enableAurusPay) {
        var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
        var tokenObject = aurusPayHelper.getTokenID(basket);
        paypalToken = tokenObject.tokenID;
        var sessionID = tokenObject.sessionID;
        Transaction.wrap(function () {
            basket.custom.paypalSessionID = sessionID; // eslint-disable-line no-param-reassign
            paymentInstrument.custom.paypalToken = paypalToken;
        });
        Logger.info('processor paypal: ' + JSON.stringify({
            sessionID: basket.custom.paypalSessionID,
            paypalToken: paypalToken
        }));
    } else {
        var isNeedInitiateBillingAgreement = paypalHelper.checkIsNeedInitiateBillingAgreement(isFromCart, basket);
        var returnFromPaypalUrl = URLUtils.https('Paypal-ReturnFromPaypal', 'isFromCart', isFromCart).toString();
        var cancelUrl = URLUtils.https(isFromCart ? prefs.cartPageEndpoint : prefs.checkoutBillingPageEndpoint).toString();
        var setExpressCheckoutResult = paypalApi.setExpressCheckout(paypalHelper.createSetExpressCheckoutRequestData(basket, returnFromPaypalUrl, cancelUrl, isNeedInitiateBillingAgreement));

        paypalForm.expressCheckoutSetForBillingAgreement.setValue(isNeedInitiateBillingAgreement);

        if (setExpressCheckoutResult.error) {
            var paypalErrorMessage = paypalHelper.createPaypalErrorMessage(setExpressCheckoutResult.responseData);
            if (!isFromCart) {
                session.custom.paypalErrorMessage = paypalErrorMessage;
            }
            return {
                error: true,
                paypalErrorMessage: paypalErrorMessage
            };
        }
        paypalToken = setExpressCheckoutResult.responseData.token;
        Transaction.wrap(function () {
            paymentInstrument.custom.paypalToken = paypalToken;
        });
    }

    return {
        success: true,
        paypalToken: paypalToken,
        paymentInstrument: paymentInstrument
    };
}

base.handle = handle;

module.exports = base;
