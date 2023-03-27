'use strict';

var Basket = require('./dw_order_Basket');

class BasketMgr {
    constructor() {
        this.basket = new Basket();
    }

    static getCurrentBasket() {
        return this.basket;
    }

    static setCurrentBasket(basket) {
        this.basket = basket;
    }
}

module.exports = BasketMgr;
