'use strict';

var base = module.superModule;

var Resource = require('dw/web/Resource');

/**
 * Calculate Off Percentage to Show Discount Percentage
 * @param {Object} params - listPrice and salesPrice
 * @returns {Object} - returns Off Percentage
 */
function offPercentage(params) {
    const { listPrice, salesPrice } = params;

    if (!(listPrice && listPrice.value && salesPrice && salesPrice.value)) {
        return {
            show: false
        };
    }

    const amountDiff = listPrice.value - salesPrice.value;
    const showOffPercentage = Number(Math.floor((amountDiff / listPrice.value) * 100)).toFixed(0);
    const amountDiffModified = Number(Math.floor(listPrice.value - salesPrice.value)).toFixed(0);
    const displayValue = Number(showOffPercentage) > Number(amountDiffModified) ? Resource.msgf('product.off.percentage', 'product', null, showOffPercentage) : Resource.msgf('product.off.amount', 'product', null, amountDiffModified);

    return {
        show: true,
        displayValue: '(' + displayValue + ')',
        value: showOffPercentage,
        amountDiff: amountDiffModified
    };
}

/**
 * @constructor
 * @classdesc Default price class
 * @param {dw.value.Money} salesPrice - Sales price
 * @param {dw.value.Money} listPrice - List price
 * @param {dw.value.Money} priceBookSalesPrice - Sales price from the PriceBook
 * @param {dw.value.Money} actualListPrice - Actual List price
 */
function DefaultPrice(salesPrice, listPrice, priceBookSalesPrice, actualListPrice) {
    base.call(this, salesPrice, listPrice, priceBookSalesPrice, actualListPrice);
    this.offPercentage = offPercentage({ listPrice: this.list, salesPrice: this.sales });
}

module.exports = DefaultPrice;
