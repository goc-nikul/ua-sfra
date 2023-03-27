'use strict';
/* eslint-disable no-unused-vars */
class Promotion {
    static setClassConstants() {
        this.PROMOTION_CLASS_ORDER = 'ORDER';
        this.PROMOTION_CLASS_PRODUCT = 'PRODUCT';
        this.PROMOTION_CLASS_SHIPPING = 'SHIPPING';
    }
}

Promotion.setClassConstants();

module.exports = Promotion;
