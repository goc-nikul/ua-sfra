'use strict';

/**
* @constructor
* @classdesc TranAmountDetails object for Aurus preAuth call
* @param {dw.order.Order} order The order object created from the current basket in CheckoutServices-PlaceOrder
*/
function TranAmountDetails(order) {
    this.Discount = '';
    this.TaxAmount = order.totalTax.value;
    this.ProductTotalAmount = order.totalNetPrice.value;
    this.TransactionTotal = order.totalGrossPrice.value;
}

module.exports = TranAmountDetails;
