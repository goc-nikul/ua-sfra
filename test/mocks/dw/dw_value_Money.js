'use strict';

class Money {
    constructor(value = 0, currencyCode = 'USD') {
        this.currencyCode = currencyCode;
        this.value = value;
        this.available = true;
        this.valueOrNull = value;
    }

    add(money) {
        this.value += money.value;
        return this;
    }

    subtract(money) {
        this.value -= money.value;
        return this;
    }

    multiply(money) {
        this.value = this.value * money.value;
        return this;
    }
    divide(money) {
        this.value = this.value / money.value;
        return this;
    }

    getAmount() {
        return this;
    }
    toFormattedString() {
        return '$' + this.value;
    }

    toNumberString() {
        return '999.00';
    }
}

module.exports = Money;
