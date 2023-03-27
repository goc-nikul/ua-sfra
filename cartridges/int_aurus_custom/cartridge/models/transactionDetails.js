'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
* @constructor
* @classdesc TranAmountDetails object for Aurus preAuth call
* @param {dw.order.Order} order The order object created from the current basket in CheckoutServices-PlaceOrder
* @param {boolean} noTotal - indicates if we need total or not
*/
function TranAmountDetails(order, noTotal) {
    var transactionTotal = COHelpers.calculateNonGiftCertificateAmount(order);
    if (typeof noTotal !== undefined && noTotal) {
        this.Discount = '';
        this.TaxAmount = '0';
        this.ProductTotalAmount = '0';
        this.TransactionTotal = '0';
    } else {
        this.Discount = '';
        this.TaxAmount = order.totalTax.value;
        this.ProductTotalAmount = order.totalNetPrice.value;
        this.TransactionTotal = transactionTotal.value;
    }
}

module.exports = TranAmountDetails;
