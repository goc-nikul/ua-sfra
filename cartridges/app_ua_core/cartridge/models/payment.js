'use strict';

var base = module.superModule;

var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
var Resource = require('dw/web/Resource');
var Constants = require('*/cartridge/scripts/constants/constants.js'); // eslint-disable-line no-unused-vars
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods) {
    return collections.map(paymentMethods, function (method) {
        return {
            ID: method.ID,
            name: method.name
        };
    });
}

/**
 * Creates an array of objects containing applicable credit cards
 * @param {dw.util.Collection<dw.order.PaymentCard>} paymentCards - An ArrayList of applicable
 *      payment cards that the user could use for the current basket.
 * @returns {Array} Array of objects that contain information about applicable payment cards for
 *      current basket.
 */
function applicablePaymentCards(paymentCards) {
    return collections.map(paymentCards, function (card) {
        return {
            cardType: card.cardType,
            name: card.name
        };
    });
}

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList of payment instruments that the user is using to pay for the current basket
 * @param {string} currencyCode - currencycode of the basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments, currencyCode, currentBasket) {
    var amount = currentBasket.totalGrossPrice;
    var vipDataHelper;
    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
        vipDataHelper = require('*/cartridge/scripts/vipDataHelpers');
    }
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: amount.value,
            formattedAmount: formatMoney(new Money(amount.value, currencyCode))
        };
        if (paymentInstrument.paymentMethod === 'CREDIT_CARD' || paymentInstrument.paymentMethod === 'Paymetric' || paymentInstrument.paymentMethod === 'AURUS_CREDIT_CARD') {
            results.lastFour = paymentInstrument.creditCardNumberLastDigits || '';
            results.owner = paymentInstrument.creditCardHolder || '';
            results.expirationYear = paymentInstrument.creditCardExpirationYear || '';
            results.type = accountHelper.getCardType(paymentInstrument.creditCardType) || '';
            results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber || '';
            results.expirationMonth = paymentInstrument.creditCardExpirationMonth || '';
        } else if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        } else if (paymentInstrument.paymentMethod === 'GIFT_CARD') {
            results.maskedGcNumber = paymentInstrument.custom.gcNumber.slice(12, paymentInstrument.custom.gcNumber.length);
        } else if (paymentInstrument.paymentMethod === 'KLARNA_PAYMENTS') {
            results.paymentCategory = paymentInstrument.custom.klarnaPaymentCategoryID;
            results.categoryName = paymentInstrument.custom.klarnaPaymentCategoryName;
            var splitAmount = require('*/cartridge/scripts/util/klarnaHelper').getSplitPaymentAmount(amount.value);
            var installmentAmount = formatMoney(new Money(splitAmount, currencyCode));
            results.amountFormatted = formatMoney(new Money(amount.value, currencyCode));
            results.klarnaSplitMsg = Resource.msgf('klarna.confirmation.split.amount', 'checkout', null, installmentAmount);
        } else if (paymentInstrument.paymentMethod === Constants.AURUS_OXXO || paymentInstrument.paymentMethod === Constants.AURUS_SAFETYPAY) {
            results.name = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getName();
        } else if (vipDataHelper && vipDataHelper.vipPartialPointsApplied(paymentInstrument) && paymentInstrument.paymentTransaction) {
            results.amount = paymentInstrument.paymentTransaction.amount.value;
            results.formattedAmount = formatMoney(new Money(paymentInstrument.paymentTransaction.amount.value, currencyCode));
        }

        return results;
    });
}

/**
 * Is already paid through paypal
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @returns {boolean} is basket contains payment instrument
 */
function isAlreadyPaidFromPayPal(currentBasket) {
    var paymentInstruments = currentBasket.paymentInstruments;
    if (currentBasket && currentBasket.custom && 'paypalAlreadyHandledPayerID' in currentBasket.custom && currentBasket.custom.paypalAlreadyHandledPayerID) {
        var paypalInstrument = collections.find(paymentInstruments, function (paymentInstrument) {
            return paymentInstrument.paymentMethod === 'PayPal' && 'paypalToken' in paymentInstrument.custom && paymentInstrument.custom.paypalToken;
        });
        return !!paypalInstrument;
    }
    return false;
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
base.Payment = function (currentBasket, currentCustomer, countryCode) {
    var paymentAmount = currentBasket.totalGrossPrice;
    var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
         countryCode,
         paymentAmount.value
     );
    var paymentCards = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD)
         .getApplicablePaymentCards(currentCustomer, countryCode, paymentAmount.value);
    var paymentInstruments = currentBasket.paymentInstruments;

     // TODO: Should compare currentBasket and currentCustomer and countryCode to see
     //     if we need them or not
    this.applicablePaymentMethods =
         paymentMethods ? applicablePaymentMethods(paymentMethods) : null;

    this.applicablePaymentCards =
         paymentCards ? applicablePaymentCards(paymentCards) : null;

    this.selectedPaymentInstruments = paymentInstruments ?
         getSelectedPaymentInstruments(paymentInstruments, currentBasket.getCurrencyCode(), currentBasket) : null;

    this.isAlreadyPaidFromPayPal = paymentInstruments ? isAlreadyPaidFromPayPal(currentBasket) : false;
};

module.exports = base.Payment;
