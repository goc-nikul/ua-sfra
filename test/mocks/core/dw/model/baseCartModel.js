'use strict';

function BaseCartModel() {
    var resources = {
        salesTax: '',
        estimatedTax: '',
        estimatedTotal: '',
        estimatedShipping: '',
        numberOfItems: '',
        total: ''
    };
    this.resources = resources;
    this.total = '';
    this.totals = {
        grandTotal: ''
    };
    this.isVIP = false;
    this.numberOfBopisItems = '';
    this.approachingDiscounts = [{
        approachingPromoPercentage: '',
        promotionID: '',
        progressBarEnabled: '',
        promotionCalloutMsg: ''
    },
    {
        approachingPromoPercentage: '',
        promotionID: '',
        progressBarEnabled: '',
        promotionCalloutMsg: ''
    }];
    this.shipping = [{ shippingAddress: { isOfficeAddress: true } }];
}

BaseCartModel.prototype = {
};

module.exports = BaseCartModel;
