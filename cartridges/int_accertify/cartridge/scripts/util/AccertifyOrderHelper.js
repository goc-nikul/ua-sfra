'use strict';

/**
 * Script file AccertifyOrderHelper provide functionality to update orders with Accertify data
 */

/* API Includes */
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');
var Site = require('dw/system/Site');

/* Script modules */
var COHelpers = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');
const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');

/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */

var AccertifyOrderHelper = function () {
    /**
     * Update order with Accertify notification data
     * @param {dw.order.Order} order - Current order
     * @param {Object} object - Data to add to the order
     */
    this.addNotificationData = function (order, object) {
        Transaction.wrap(function () {
            Object.keys(object).forEach(function (key) {
                if (key !== 'remarks') {
                    order.custom[key] = object[key];
                }
            });
        });
    };

    /**
     * Update order with Accertify Notify Custom Object data
     * @param {dw.order.Order} order - Current order
     * @param {Object} object - Custom Object data
     * @returns {boolean} - Order update status
     */
    this.addCONotificationData = function (order, object) {
        try {
            Transaction.wrap(function () {
                order.custom.accertifyTransactionID = object.accertifyTransactionID;
                order.custom.accertifyRules = object.accertifyRules;
                order.custom.accertifyScore = object.accertifyScore;
                order.custom.accertifyRecCode = object.accertifyActionType;
                order.custom.accertifyActionType = object.accertifyRecCode;
            });
        } catch (e) {
            Log.error('Can not set order custom value: {0}', e.message);

            return false;
        }

        return true;
    };

    /**
     * Parse XML into the object
     * @param {string} responseMessage - Service response body
     * @returns {Object} - Parsed response object
     */
    this.parseAccertifyNotification = function (responseMessage) {
        var xml = new XML(responseMessage);

        return {
            accertifyTransactionID: xml.descendants('transaction-id').toString(),
            accertifyRules: xml.descendants('rules-tripped').toString(),
            accertifyScore: xml.descendants('total-score').toString(),
            accertifyRecCode: xml.descendants('recommendation-code').toString(),
            remarks: xml.descendants('remarks').toString(),
            accertifyActionType: xml.descendants('action-type').toString()
        };
    };

    /**
     * Create Custom Object with Accertify notification
     * @param {Object} accertifyNotification - Notification data
     */
    this.createCustomObject = function (accertifyNotification) {
        var AccertifyNotifyMgr = require('int_accertify/cartridge/scripts/util/AccertifyNotifyMgr');
        var objectNo = accertifyNotification.accertifyTransactionID;
        var co = AccertifyNotifyMgr.getNotifyCO(objectNo);
        var notifyArray = [];

        if (co) {
            var notifyDataParsed = JSON.parse(co.custom.notifyData) || [];
            notifyDataParsed.push(accertifyNotification);
            AccertifyNotifyMgr.saveNotifyCO(objectNo, JSON.stringify(notifyDataParsed));
        } else {
            notifyArray.push(accertifyNotification);
            AccertifyNotifyMgr.saveNotifyCO(objectNo, JSON.stringify(notifyArray));
        }
    };

    /**
     * Process the orders based on fraud detection status
     * @param {dw.order.Order} order - Current order
     */
    this.changeOrderStatus = function (order) {
        var accertifyRecCode = order.custom && Object.prototype.hasOwnProperty.call(order.custom, 'accertifyRecCode') ? Resource.msg('accertify.accertifyRecCode.' + order.custom.accertifyRecCode.toLowerCase(), 'accertify', null) : '';
        var adyenClientKey = Site.current.getCustomPreferenceValue('Adyen_ClientKey');
        var AdyenConfigs = adyenClientKey ? require('*/cartridge/scripts/util/adyenConfigs') : {};
        var AdyenHelper = adyenClientKey ? require('*/cartridge/scripts/util/adyenHelper') : {};
        var constants = adyenClientKey ? require('*/cartridge/adyenConstants/constants') : {};
        var adyenComponentPaymentInstruments;
        var adyenComponentPaymentInstrument;
        var pspReference;
        var paymentRequest;
        if (accertifyRecCode === Resource.msg('accertify.accertifyRecCode.accept', 'accertify', null)) {
            // Initializing eGift order level status attribute
            var eGiftCardLineItems = giftCardHelper.getEGiftCardLineItems(order);
            // Prevent re-processing of an already processed e-gift card order
            if ((eGiftCardLineItems.length > 0) && (order.custom.eGiftCardStatus !== 'PROCESSED')) {
                Transaction.wrap(function () {
                    order.custom.eGiftCardStatus = 'READY_FOR_PROCESSING';
                });
            }

            COHelpers.placeOrder(order, accertifyRecCode);
            COHelpers.handleHoldStatus(order, false, 'fraudCheck');
            if (adyenClientKey) {
                adyenComponentPaymentInstruments = order.getPaymentInstruments('AdyenComponent');
                adyenComponentPaymentInstrument = adyenComponentPaymentInstruments && adyenComponentPaymentInstruments.length > 0 ? adyenComponentPaymentInstruments[0] : null;
                var disableCaptureCall = Site.current.getCustomPreferenceValue('Adyen_disableCaptureCall');
                if (adyenComponentPaymentInstrument && !disableCaptureCall) {
                    pspReference = adyenComponentPaymentInstrument.paymentTransaction && adyenComponentPaymentInstrument.paymentTransaction.custom.Adyen_pspReference;
                    var adyenAmount = adyenComponentPaymentInstrument.paymentTransaction ? AdyenHelper.getCurrencyValueForApi(adyenComponentPaymentInstrument.paymentTransaction.amount) : null;
                    if (pspReference && adyenAmount) {
                        paymentRequest = {
                            merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
                            amount: {
                                value: adyenAmount.value,
                                currency: adyenAmount.currencyCode
                            },
                            reference: order.orderNo
                        };
                        AdyenHelper.executeCall(constants.SERVICE.CAPTURE, paymentRequest, pspReference);
                    }
                }
            }
        } else if (accertifyRecCode === Resource.msg('accertify.accertifyRecCode.reject', 'accertify', null)) {
            // Aurus Legacy Check
            var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
            if (!isAurusEnabled) {
                if (empty(adyenClientKey)) {
                    // Make a call to XiPay to do void authorization if secondary authorization site preference is enabled for PayPal
                    // "isEnabled" site preference and valid payment instrument check is already there in "doVoidAuthorization" method. So no need to put additional checks here.
                    var paymetricXiPayHelper = require('int_paymetric/cartridge/scripts/util/paymetricXiPayHelper');
                    paymetricXiPayHelper.doVoidAuthorization(order, 'PayPal');
                    var orderHasEGC = require('*/cartridge/scripts/giftcard/giftcardHelper').basketHasGiftCardItems(order).eGiftCards;
                    if (orderHasEGC) {
                        paymetricXiPayHelper.doVoidAuthorization(order, 'Paymetric');
                    }
                } else {
                    adyenComponentPaymentInstruments = order.getPaymentInstruments('AdyenComponent');
                    adyenComponentPaymentInstrument = adyenComponentPaymentInstruments && adyenComponentPaymentInstruments.length > 0 ? adyenComponentPaymentInstruments[0] : null;
                    if (adyenComponentPaymentInstrument) {
                        pspReference = adyenComponentPaymentInstrument.paymentTransaction && adyenComponentPaymentInstrument.paymentTransaction.custom.Adyen_pspReference;
                        if (pspReference) {
                            paymentRequest = {
                                merchantAccount: AdyenConfigs.getAdyenMerchantAccount()
                            };
                            AdyenHelper.executeCall(constants.SERVICE.PAYMENTREVERSAL, paymentRequest, pspReference);
                        }
                    }
                }
            }
            COHelpers.failOrder(order);
            if (order.custom.accertifyRecCode !== Resource.msg('accertify.accertifyActionType.host_fraud_prevent', 'accertify', null)) {
                COHelpers.sendFraudNotificationEmail(order);
            }
            COHelpers.handleHoldStatus(order, false, 'fraudCheck');
        } else {
            Log.error('AccertifyOrderHelper.js: Empty "accertifyRecCode" for order {0}', order.orderNo);
        }
    };
};

module.exports = AccertifyOrderHelper;
