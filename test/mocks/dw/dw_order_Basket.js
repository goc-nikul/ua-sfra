'use strict';

var LineItemCtnr = require('./dw_order_LineItemCtnr');

class Basket extends LineItemCtnr {
    constructor() {
        super();
    }
    
    getCouponLineItems() {
        return this.couponLineItems;
    }
}

module.exports = Basket;
