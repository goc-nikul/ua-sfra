'use strict';

/**
 * Remove all payment instrument if paymet method is klarna
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} paymentInstrumentRequest - Updated payment Instrument Request
 */
function updatePaymentInstrument(paymentInstrumentRequest) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    var Transaction = require('dw/system/Transaction');

    // Remove the existing payment instruments
    if (!empty(basket)) {
        var paymentInstruments = basket.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            while (paymentInstrumentsIt.hasNext()) {
                Transaction.wrap(function () {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    basket.removePaymentInstrument(paymentInstrument);
                });
            }
        }
    }
    var nonGiftCertificateAmount = COHelpers.calculateNonGiftCertificateAmount(basket);
    // eslint-disable-next-line no-param-reassign
    paymentInstrumentRequest.amount	= nonGiftCertificateAmount.value;
    return { error: false };
}

exports.updatePaymentInstrument = updatePaymentInstrument;
