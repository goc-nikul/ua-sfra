'use strict';
/* eslint-disable no-unused-vars */
var LineItemCtnr = require('./dw_order_LineItemCtnr');
class Order extends LineItemCtnr {
    constructor() {
        super();
        this.paymentInstruments = [];
        this.paymentStatus = { value: 0 };
        this.status = { value: 0 };
        this.exportStatus = { value: 0 };
        this.orderNo = '1234567890';
        this.custom = {
            eGiftCardStatus: 'NOT_APPLICABLE',
            holidaySeason: true
        };
    }

    static setClassConstants() {
        this.CONFIRMATION_STATUS_CONFIRMED = 2;
        this.CONFIRMATION_STATUS_NOTCONFIRMED = 0;
        this.EXPORT_STATUS_EXPORTED = 1;
        this.EXPORT_STATUS_FAILED = 3;
        this.EXPORT_STATUS_NOTEXPORTED = 0;
        this.EXPORT_STATUS_READY = 2;
        this.ORDER_STATUS_CANCELLED = 6;
        this.ORDER_STATUS_COMPLETED = 5;
        this.ORDER_STATUS_CREATED = 0;
        this.ORDER_STATUS_FAILED = 8;
        this.ORDER_STATUS_NEW = 3;
        this.ORDER_STATUS_OPEN = 4;
        this.ORDER_STATUS_REPLACED = 7;
        this.PAYMENT_STATUS_NOTPAID = 0;
        this.PAYMENT_STATUS_PAID = 2;
        this.PAYMENT_STATUS_PARTPAID = 1;
        this.SHIPPING_STATUS_NOTSHIPPED = 0;
        this.SHIPPING_STATUS_PARTSHIPPED = 1;
        this.SHIPPING_STATUS_SHIPPED = 2;
    }

    setPaymentStatus(status) {
        this.paymentStatus = { value: status };
    }

    getPaymentStatus() {
        return this.paymentStatus;
    }

    setExportStatus(status) {
        this.exportStatus = { value: status };
    }

    getExportStatus() {
        return this.exportStatus;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = { value: status };
    }

    setEGiftCardStatus(status) {
        this.custom.eGiftCardStatus = status;
    }
    getPaymentInstruments(paymentMethodID) {
        var paymentInstruments = this.paymentInstruments;
        if (paymentMethodID) {
            paymentInstruments = this.paymentInstruments.filter(function (paymentInstrument) {
                return paymentInstrument.paymentMethod === paymentMethodID;
            });
        }
        return paymentInstruments;
    }
    trackOrderChange(text) {
        return;
    }
}

Order.setClassConstants();

module.exports = Order;
