/* eslint-disable no-nested-ternary */
'use strict';

var atomePrefs = require('*/cartridge/scripts/service/atomeConfigurations');
var Transaction = require('dw/system/Transaction');

/**
 * Save Order Transaction Details
 * @param {Object} address - address obj
 * @returns {JSON} addressObject - address object to pass with atome payment request
 */
function getAddress(address) {
    var addressLines = [];

    addressLines.push(address.address1 + ' ' + address.address2);
    addressLines.push(address.city + ', ' + address.stateCode);
    addressLines.push(address.countryCode + ', ' + address.postalCode);

    return addressLines;
}

/**
 * Save Order Transaction Details
 * @param {Object} productLineItems - productLineItems obj
 * @returns {JSON} items - productLineItems object to pass with atome payment request
 */
function getItems(productLineItems) {
    var items = [];

    for (var i = 0; i < productLineItems.length; i++) {
        var originalPrice = 0;
        var item = productLineItems[i];

        for (var j = 0; j < item.priceAdjustments.length; j++) {
            originalPrice += item.priceAdjustments[j].price.value * -1;
        }

        originalPrice += item.adjustedGrossPrice;

        var itemObj = {
            itemId: item.productID,
            name: item.product.name,
            price: Math.round(item.adjustedGrossPrice * 100),
            quantity: item.quantity.value,
            variationName: item.product.name,
            originalPrice: Math.round(originalPrice * 100)
        };
        items.push(itemObj);
    }
    return items;
}

/**
 * Return Price without any Discount
 * @param {Order} order - Order object
 * @returns {number} originalPrice - Price without any Discount
 */
function getOriginalPrice(order) {
    var originalPrice = 0;

    for (var i = 0; i < order.priceAdjustments.length; i += 1) {
        originalPrice += order.priceAdjustments[i].price.value * -1;
    }

    for (var l = 0; l < order.productLineItems.length; l += 1) {
        for (var j = 0; j < order.productLineItems[l].priceAdjustments.length; j += 1) {
            originalPrice += order.productLineItems[l].priceAdjustments[j].price.value * -1;
        }
    }

    originalPrice += order.getTotalGrossPrice().value;
    return originalPrice;
}

/**
 * Save Order Transaction Details
 * @param {string} orderNo - order Number
 * @returns {JSON} orderObject - Order object to pass with atome payment request
 */
function createOrderRequest(orderNo) {
    var order = dw.order.OrderMgr.getOrder(orderNo);

    var shippingAddress = getAddress(order.getDefaultShipment().shippingAddress);
    var billingAddress = getAddress(order.getBillingAddress());
    var originalPrice = getOriginalPrice(order);

    var amount;
    var originalAmount;
    if(order.getCurrencyCode() == 'VND' || order.getCurrencyCode() == 'IDR' || order.getCurrencyCode() == 'TWD'|| order.getCurrencyCode() == 'KRW'|| order.getCurrencyCode() == 'JPY'){
        amount = order.getTotalGrossPrice().value;
        originalAmount = originalPrice;
    } else if (order.getCurrencyCode() == 'SGD'||  order.getCurrencyCode() == 'MYR'||  order.getCurrencyCode() == 'HKD'|| order.getCurrencyCode() == 'THB'){
        amount = Math.round(order.getTotalGrossPrice().value * 100);
        originalAmount = Math.round(originalPrice * 100);
    }
    else{
        amount = Math.round(order.getTotalGrossPrice().value * 100);
        originalAmount = Math.round(originalPrice * 100);
    }


    var orderObject = {
        referenceId: orderNo,
        currency: order.getCurrencyCode(),
        amount: amount,
        callbackUrl: atomePrefs.callbackUrl + '?orderID=' + orderNo,
        paymentResultUrl: atomePrefs.resultUrl + '?orderToken=' + order.orderToken + '&orderID=' + orderNo,
        paymentCancelUrl: atomePrefs.cancelUrl + '?orderID=' + orderNo,
        merchantReferenceId: orderNo,
        customerInfo: {
            mobileNumber: order.getBillingAddress().phone,
            fullName: order.getBillingAddress().firstName + ' ' + order.getBillingAddress().lastName,
            email: order.getCustomerEmail()
        },
        shippingAddress: {
            countryCode: order.getDefaultShipment().shippingAddress.countryCode.value,
            lines: shippingAddress,
            postCode: order.getDefaultShipment().shippingAddress.postalCode
        },

        billingAddress: {
            countryCode: order.getBillingAddress().countryCode.value,
            lines: billingAddress,
            postCode: order.getBillingAddress().postalCode
        },
        taxAmount: Math.round(order.getTotalTax().value * 100),
        shippingAmount: Math.round(order.getShippingTotalPrice().value * 100),
        originalAmount: originalAmount,
        items: getItems(order.getProductLineItems())
    };

    return orderObject;
}


/**
 * Save Order Transaction Details
 * @param {dw.order} order - order
 * @param {string} referenceId - referenceId
 * @param {string} status - status
 * @param {string} refundableAmount - refundable Amount
 * @param {string} atomeCurrency - atomeCurrency
 */
function saveOrderTransactionDetails(order, referenceId, status, refundableAmount, atomeCurrency) {
    var paymentTransaction = order.getPaymentInstruments('ATOME_PAYMENT').length > 0 ? order.getPaymentInstruments('ATOME_PAYMENT')[0].getPaymentTransaction() : null;
    var currencySymbol = session.currency.symbol;
    var refundAmount = currencySymbol + (refundableAmount / 100);
    Transaction.wrap(function () {
        if (paymentTransaction) {
            paymentTransaction.custom.atomeReferenceId = referenceId;
            paymentTransaction.custom.atomePaymentStatus = status;
            paymentTransaction.custom.atomeRefundableAmount = refundAmount;
            paymentTransaction.custom.atomeCurrency = atomeCurrency;
        }
    });
}

/**
 * fixed 2 digit after point in price
 * @param {number} num - num
 * @param {number} fixed - fixed digit after point
 * @return {number} fixed Number
 */
function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

module.exports = {
    createOrderRequest: createOrderRequest,
    saveOrderTransactionDetails: saveOrderTransactionDetails,
    toFixed: toFixed
};
