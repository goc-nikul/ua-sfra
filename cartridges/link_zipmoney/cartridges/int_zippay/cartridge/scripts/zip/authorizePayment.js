/* globals dw, session, empty */

'use strict';

var CreateChargeZipAPIRequest = require('~/cartridge/scripts/zip/api/request/createCharge');
var CustomerTokenInWalletModel = require('~/cartridge/models/zip/customerTokenInWallet');
var ZipOrderModel = require('~/cartridge/models/zip/zipOrder');
var ZipModel = require('~/cartridge/scripts/zip/helpers/zip');

var Authority = require('~/cartridge/scripts/zip/api/model/authority');

/**
 * This function handles Zip payment authorization.
 *
 * Zip payments are authorized by executing an API call to a "Create Charge" function. The result
 * is then reflected on the DW order by updating its attributes.
 *
 * Note that in order to create a charge, Zip requires an authority. If tokenization is required
 * (turned on by the merchant), the function will attempt to retrieve the token first from the Order
 * entity, and then, if not found, will attempt the Customer's Wallet. The token is going to be used
 * as an authority for Zip Charge creation. If tokenization is not required, the checkout authority
 * is going to be used.
 *
 * @param {dw.order.Order} order Order
 * @param {dw.order.PaymentInstrument} paymentInstrument Payment Instrument
 * @param {string} orderNumber order number
 */
function authorizePayment(order, paymentInstrument, orderNumber) {
    var orderProp = order;
    var paymentInstrumentProp = paymentInstrument;

    var Transaction = require('dw/system/Transaction');
    var PaymentMgr = require('dw/order/PaymentMgr');

    var zipCheckoutId = (!empty(order.custom.ZipCheckoutId)) ? order.custom.ZipCheckoutId : '';
    var authority = new Authority('checkout_id', zipCheckoutId);

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod);
    var customerProfile = order.getCustomer().getProfile();

    if (ZipModel.isTokenizationRequired(paymentMethod) && customerProfile) {
        var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());
        var token = customerTokenInWalletModel.findToken();

        if (!orderProp.custom.ZipToken) {
            if (token) {
                Transaction.wrap(function () {
                    orderProp.custom.ZipToken = token;
                });
            }
        } else {
            token = orderProp.custom.ZipToken;
        }

        if (token) {
            authority = new Authority('account_token', token);
        }
    }

    var paymentProcessor = paymentMethod.getPaymentProcessor();
    Transaction.wrap(function () {
        paymentInstrumentProp.paymentTransaction.transactionID = orderNumber;
        paymentInstrumentProp.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    try {
        var isAutoCaptureEnabled = ZipModel.isAutoCaptureEnabled(paymentMethod);

        var createChargeAPIRequest = new CreateChargeZipAPIRequest();

        var transaction = paymentInstrument.getPaymentTransaction();
        var chargeResult = createChargeAPIRequest.execute(authority, paymentInstrument, orderNumber, isAutoCaptureEnabled);

        Transaction.wrap(function () {
            ZipOrderModel.reflectChargeAuthorized(order, transaction, chargeResult, isAutoCaptureEnabled);
        });
    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);

        if (e.name === 'ZipError') {
            session.privacy.ZipErrorCode = e.message;
        }

        throw e;
    }
}

module.exports = authorizePayment;
