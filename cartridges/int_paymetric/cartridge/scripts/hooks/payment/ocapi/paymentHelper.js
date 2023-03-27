'use strict';

/* eslint-disable no-param-reassign */

/**
 * Update payment request with decrypted Paymetric data
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} paymentInstrumentRequest - Updated payment Instrument Request
 */
function updatePaymentInstrument(paymentInstrumentRequest) {
    var result = { error: false };
    try {
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var Resource = require('dw/web/Resource');
        var BasketMgr = require('dw/order/BasketMgr');
        var basket = BasketMgr.getCurrentBasket();
		// Remove if any existing paymetric instruments already available
        if (!empty(basket)) {
            var nonGiftCertificateAmount = COHelpers.calculateNonGiftCertificateAmount(basket);
            if (nonGiftCertificateAmount.value <= 0) {
                // eslint-disable-next-line spellcheck/spell-checker
                result.msg = Resource.msg('paytric.apply.error', 'giftcards', null);
                result.error = true;
                return result;
            }

            paymentInstrumentRequest.amount	= nonGiftCertificateAmount.value;
            var paymentInstruments = basket.getPaymentInstruments();
            if (paymentInstruments.size() > 0) {
                var paymentInstrumentsIt = paymentInstruments.iterator();
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (!paymentInstrument.getPaymentMethod().equalsIgnoreCase('GIFT_CARD')) {
                        basket.removePaymentInstrument(paymentInstrument);
                    }
                }
            }
        }
    } catch (e) {
        result.error = true;
        result.msg = e.message;
        return result;
    }
    return result;
}

/**
 * patch the payment request with paymetric payment
 * @param {Object} basket - Current basket
 * @param {Object} paymentInstrument - Payment Instrument
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} result - result
 */
function patchPaymentInstrument(basket, paymentInstrument, paymentInstrumentRequest) {
    var result = { error: false };
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var nonGiftCertificateAmount = COHelpers.calculateNonGiftCertificateAmount(basket);
    paymentInstrumentRequest.amount	= nonGiftCertificateAmount.value;
    return result;
}

exports.updatePaymentInstrument = updatePaymentInstrument;
exports.patchPaymentInstrument = patchPaymentInstrument;
