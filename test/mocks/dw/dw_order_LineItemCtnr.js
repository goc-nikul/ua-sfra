'use strict';
/* eslint-disable no-unused-vars */
var Shipment = require('./dw_order_Shipment');
var Customer = require('./dw_customer_Customer');
var ArrayList = require('../scripts/util/dw.util.Collection');
var Money = require('./dw_value_Money');
const PaymentInstrument = require('./dw_order_PaymentInstrument');

class LineItemCtnr {
    constructor() {
        this.productLineItems = [];
        this.paymentInstruments = [];
        this.couponLineItems = [];
        this.paymentStatus = { value: 0 };
        this.status = { value: 0 };
        this.couponLineItems = new ArrayList(
            [
                {
                    couponCode: 'abc',
                        promotion: {
                            name: '123',
                            calloutMsg: 'asdsad'
                        }
                }
            ]);
        this.shipments = new ArrayList([new Shipment()]);
        this.defaultShipment = this.shipments.get(0);
        this.customerEmail = 'test@ua.com';
        this.customerName = { trim: function () { } };
        this.billingAddress = {
            firstName: 'test',
            lastName: 'test',
            fullName: 'test_test',
            address1: 'test',
            address2: 'test',
            city: 'test',
            stateCode: 'CA',
            postalCode: '04330',
            countryCode: {
                displayValue: 'United States',
                value: 'US'
            },
            phone: '9234567890',
            setPhone: function (phoneNumber) { },
            getCountryCode: function () { return { value: this.countryCode }; },
            setCountryCode: function (countryCode) { },
            setFirstName: function (o) { },
            setLastName: function (o) { },
            setAddress1: function (o) { },
            setAddress2: function (o) { },
            setCity: function (o) { },
            setPostalCode: function (o) { },
            setStateCode: function (o) { },
            custom: {
                suburb: '',
                district: '',
                businessName: ''
            }
        };
        this.totalGrossPrice = new Money(0);
        this.totalNetPrice = new Money(0);
        this.custom = {};
        this.bonusLineItems = [];
        this.customer = new Customer();
        this.allProductLineItems = new ArrayList(this.productLineItems);
        this.shippingTotalPrice = new Money(7.99);
        this.totalTax = new Money(0);
        this.currencyCode = 'USD';
        this.priceAdjustments = new ArrayList();
    }

    getPaymentInstruments(paymentMethodID) {
        var paymentInstruments = this.paymentInstruments;
        if (paymentMethodID) {
            paymentInstruments = this.paymentInstruments.filter(function (paymentInstrument) {
                return paymentInstrument.paymentMethod === paymentMethodID;
            });
        }
        var index = 0;
        var initialLength = paymentInstruments.length;
        return {
            items: paymentInstruments,
            iterator: () => {
                return {
                    items: paymentInstruments,
                    hasNext: () => {
                        if (initialLength !== paymentInstruments.length) {
                            initialLength = paymentInstruments.length;
                            index--;
                        }
                        return index < paymentInstruments.length;
                    },
                    next: () => {
                        return paymentInstruments[index++];
                    }
                };
            },
            toArray: () => {
                return paymentInstruments;
            },
            size: () => {
                return paymentInstruments.length;
            }
        };
    }

    getGiftCertificatePaymentInstruments() {
        var giftCertPaymentInstruments = this.paymentInstruments.filter(function (paymentInstrument) {
            return paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE';
        });
        return new ArrayList(giftCertPaymentInstruments);
    }

    createBonusLineItem(product, shipment) {
        var productObj = product === Object(product) ? product : {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: product,
            name: 'test',
            productID: product
        };
        if (!empty(productObj)) {
            this.bonusLineItems.push({
                getQualifyingProductLineItemForBonusProduct() {
                    return productObj;
                }
            });
        }
    }

    createPaymentInstrument(paymentMethodID, grossPrice) {
        var paymentInstrument = new PaymentInstrument(paymentMethodID, grossPrice);
        if (!empty(paymentInstrument)) {
            this.paymentInstruments.push(paymentInstrument);
        }
    }

    createCouponLineItem(couponCode, campaignBased) {
        var c = {
            promotion: { name: 'testPromo', calloutMsg: 'msg' },
            couponCode: couponCode
        };
        this.couponLineItems.add(c);
        return c;
    }

    removeCouponLineItem(couponLineItem) {
        this.couponLineItems.remove(couponLineItem);
    }

    createProductLineItem(product, shipment) {
        var productObj = product === Object(product) ? product : {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: product,
            name: 'test'
        };
        // eslint-disable-next-line no-param-reassign
        shipment = 'ID' in shipment ? shipment : this.defaultShipment;
        if (!empty(productObj)) {
            this.productLineItems.push({
                isGift: function () {
                    return false;
                },
                product: productObj,
                productID: productObj.ID,
                quantity: {
                    value: 1
                },
                price: {
                    value: 100
                },
                basePrice: {
                    value: 100
                },
                tax: {
                    value: 10
                },
                shipment: shipment,
                setShipment(shipmentObj) {
                    this.shipment = shipmentObj;
                },
                UUID: 'ca155038d934befcd30f532e92',
                getUUID() {
                    return this.UUID;
                },
                custom: {},
                setPriceValue(price) {
                    this.price = new Money(price);
                    this.priceValue = price;
                    this.basePrice = new Money(price);
                },
                setQuantityValue(quantityValue) {
                    this.quantity.value = quantityValue;
                },
                replaceProduct(replaceableProduct) {
                    this.product = replaceableProduct;
                }
            });
        }
        // eslint-disable-next-line no-param-reassign
        shipment.productLineItems = this.productLineItems;
        return this.productLineItems[this.productLineItems.length - 1];
    }

    removeProductLineItem(productLineItem) {
        const index = this.productLineItems.indexOf(productLineItem);
        if (index > -1) {
            this.productLineItems.splice(index, 1);
        }
    }

    getAllProductLineItems() {
        return new ArrayList(this.productLineItems);
    }

    getAllLineItems() {
        return new ArrayList(this.productLineItems);
    }

    getProductLineItems(productId) {
        var lineItems = this.productLineItems.filter(function (lineItem) {
            return lineItem.product.ID === productId;
        });
        return new ArrayList(productId ? lineItems : this.productLineItems);
    }

    getDefaultShipment() {
        return this.shipments.get(0);
    }

    createPaymentInstrument(paymentMethodId, amount) {
        var paymentInstrument = new PaymentInstrument(paymentMethodId, amount);

        this.paymentInstruments.push(paymentInstrument);

        return paymentInstrument;
    }

    removePaymentInstrument(pi) {
        const index = this.paymentInstruments.indexOf(pi);
        if (index > -1) {
            this.paymentInstruments.splice(index, 1);
        }
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

    getShipments() {
        return this.shipments;
    }

    getShipment(id) {
        this.shipments.toArray().find(function (shipment) {
            return shipment.ID === id;
        });
    }

    createShipment(giftCardShipmentID) {
        var newShipment = new Shipment();
        newShipment.ID = giftCardShipmentID;
        this.shipments.push(newShipment);
        return newShipment;
    }

    removeShipment(shipment) {
        const index = this.shipments.toArray().indexOf(shipment);
        if (index > -1) {
            this.shipments.toArray().splice(index, 1);
        }
        this.shipments = new ArrayList(this.shipments.toArray());
    }

    getCustomer() {
        return this.customer;
    }

    getCustomerEmail() {
        return this.customerEmail;
    }

    getBillingAddress() {
        return this.billingAddress;
    }

    addNote() {
        return true;
    }
    setCustomerEmail(emailAddress) {
        return {};
    }

    getTotalGrossPrice() {
        return this.totalGrossPrice;
    }

    getCurrencyCode() {
        return 'USD';
    }

    getAdjustedShippingTotalPrice() {
        return this.shippingTotalPrice;
    }

    getAdjustedMerchandizeTotalPrice() {
        return this.totalGrossPrice;
    }

    getGiftCertificateLineItems() {
        return new ArrayList();
    }

    createBillingAddress() {
        this.billingAddress = {
            firstName: 'test',
            lastName: 'test',
            fullName: 'test_test',
            address1: 'test',
            address2: 'test',
            city: 'test',
            stateCode: 'CA',
            postalCode: '04330',
            countryCode: {
                displayValue: 'United States',
                value: 'US'
            },
            phone: '9234567890',
            setPhone: function (phoneNumber) { },
            getCountryCode: function () { return { value: this.countryCode }; },
            setCountryCode: function (countryCode) { },
            setFirstName: function (o) { },
            setLastName: function (o) { },
            setAddress1: function (o) { },
            setAddress2: function (o) { },
            setCity: function (o) { },
            setPostalCode: function (o) { },
            setStateCode: function (o) { },
            custom: {
                suburb: '',
                district: '',
                businessName: ''
            }
        };
        return this.billingAddress;
    }
}

module.exports = LineItemCtnr;
