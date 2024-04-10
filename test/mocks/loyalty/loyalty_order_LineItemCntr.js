'use strict';
/* eslint-disable no-unused-vars */
var Customer = require('../dw/dw_customer_Customer');
var Shipment = require('../dw/dw_order_Shipment');
var ArrayList = require('../scripts/util/dw.util.Collection');
const PaymentInstrument = require('../dw/dw_order_PaymentInstrument');
// eslint-disable-next-line no-underscore-dangle
var _super = require('./ExtensibleObject');
const Money = require('../dw/dw_value_Money');

var LoyaltyLineItemCtnr = function () {
    this.productLineItems = [{
        adjustedGrossPrice: 120,
        adjustedNetPrice: 120,
        adjustedPrice: 120,
        adjustedTax: 0,
        basePrice: 60,
        bonusProductLineItem: false,
        bundledProductLineItem: false,
        catalogProduct: true,
        custom: {
            estimatedItemLoyaltyPoints: 270,
            sku: '1329293-002-SM'
        },
        lineItemText: 'Mens UA Sportstyle Tricot Jacket',
        minOrderQuantity: 1,
        minOrderQuantityValue: 1,
        netPrice: 120,
        price: 120,
        productID: '193444423013',
        productName: 'Mens UA Sportstyle Tricot Jacket',
        quantity: 1,
        shipment: {
            custom: {},
            default: true,
            ID: 'me',
            shippingMethodID: 'standard',
            UUID: 'fa9c6b8f518c1d4f9acc0e9ef7'
        },
        UUID: 'b9e17476840b8c0dd65ac3c7ad'
    }, {
        adjustedGrossPrice: 120,
        adjustedNetPrice: 120,
        adjustedPrice: 120,
        adjustedTax: 0,
        basePrice: 60,
        bonusProductLineItem: false,
        bundledProductLineItem: false,
        catalogProduct: true,
        custom: {
            estimatedItemLoyaltyPoints: 270,
            sku: '1329293-002-SM'
        },
        lineItemText: 'Mens TEST',
        minOrderQuantity: 1,
        minOrderQuantityValue: 1,
        netPrice: 120,
        price: 120,
        productID: '193444423012',
        productName: 'Mens TEST',
        quantity: 1,
        shipment: {
            custom: {},
            default: true,
            ID: 'me',
            shippingMethodID: 'standard',
            UUID: 'fa9c6b8f518c1d4f9acc0e9ef7'
        },
        UUID: 'b9e17476840b8c0dd65ac3c7ad'
    }
    ];
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
    this.shipments = [{
        custom: {},
        default: true,
        ID: 'me',
        shippingLineItems: [{
            ID: 'STANDARD_SHIPPING'
        }],
        shippingMethodID: 'standard'
    }];
    this.defaultShipment = this.shipments[0];
    this.customerEmail = 'test@ua.com';
    this.customerName = { trim: function () { } };
    this.customerNo = '089e51fb-aa65-485d-8a0e-0c39796e99aa';
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
    this.totalGrossPrice = 7.99;
    this.totalNetPrice = 0.0;
    this.custom = {
        estimatedLoyaltyPoints: 270
    };
    this.bonusLineItems = [];
    this.customer = new Customer();
    this.allProductLineItems = new ArrayList(this.productLineItems);
    this.shippingTotalPrice = 7.99;
    this.totalTax = 0.0;
    this.currencyCode = 'USD';
    this.priceAdjustments = new ArrayList();
};

LoyaltyLineItemCtnr.prototype = new _super();

LoyaltyLineItemCtnr.prototype.createBillingAddress = function () {
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
};
LoyaltyLineItemCtnr.prototype.getCurrencyCode = function () {
    return 'USD';
};
LoyaltyLineItemCtnr.prototype.getProductLineItems = function (productId) {
    var lineItems = this.productLineItems.filter(function (lineItem) {
        return lineItem.productID === productId;
    });
    return (productId ? lineItems : this.productLineItems);
};
LoyaltyLineItemCtnr.prototype.getCustomerEmail = function () {
    return this.customerEmail;
};
LoyaltyLineItemCtnr.prototype.getCustomer = function () {
    return this.customer;
};
LoyaltyLineItemCtnr.prototype.getCustomerNo = function () {
    return this.customerNo;
};
LoyaltyLineItemCtnr.prototype.createProductLineItem = function (product, shipment) {
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
                this.price = price;
                this.priceValue = price;
                this.basePrice = price;
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
};
LoyaltyLineItemCtnr.prototype.createBonusProductLineItem = function () {};
LoyaltyLineItemCtnr.prototype.getDefaultShipment = function () {
    return this.shipments.get(0);
};
LoyaltyLineItemCtnr.prototype.getAllProductLineItems = function () {
    return new ArrayList(this.productLineItems);
};
LoyaltyLineItemCtnr.prototype.getAllGiftCertificateLineItems = function () {};
LoyaltyLineItemCtnr.prototype.getGiftCertificateLineItems = function () {
    return new ArrayList();
};
LoyaltyLineItemCtnr.prototype.getProductQuantityTotal = function () {};
LoyaltyLineItemCtnr.prototype.createGiftCertificatePaymentInstrument = function () {};
LoyaltyLineItemCtnr.prototype.createPaymentInstrument = function (paymentMethodID, grossPrice) {
    var paymentInstrument = new PaymentInstrument(paymentMethodID, grossPrice);
    if (!empty(paymentInstrument)) {
        this.paymentInstruments.push(paymentInstrument);
    }
};
LoyaltyLineItemCtnr.prototype.createCouponLineItem = function (couponCode, campaignBased) {
    var c = {
        promotion: { name: 'testPromo', calloutMsg: 'msg' },
        couponCode: couponCode
    };
    this.couponLineItems.add(c);
    return c;
};
LoyaltyLineItemCtnr.prototype.getCouponLineItem = function () {};
LoyaltyLineItemCtnr.prototype.removeCouponLineItem = function (couponLineItem) {
    this.couponLineItems.remove(couponLineItem);
};
LoyaltyLineItemCtnr.prototype.removePaymentInstrument = function (pi) {
    const index = this.paymentInstruments.indexOf(pi);
    if (index > -1) {
        this.paymentInstruments.splice(index, 1);
    }
};
LoyaltyLineItemCtnr.prototype.removeAllPaymentInstruments = function () {};
LoyaltyLineItemCtnr.prototype.getAllLineItems = function () {
    return new ArrayList(this.productLineItems);
};
LoyaltyLineItemCtnr.prototype.getCouponLineItems = function () {};
LoyaltyLineItemCtnr.prototype.getBonusDiscountLineItems = function () {};
LoyaltyLineItemCtnr.prototype.removeBonusDiscountLineItem = function () {};
LoyaltyLineItemCtnr.prototype.createPriceAdjustment = function () {};
LoyaltyLineItemCtnr.prototype.getPriceAdjustmentByPromotionID = function () {};
LoyaltyLineItemCtnr.prototype.getPriceAdjustments = function () {};
LoyaltyLineItemCtnr.prototype.removePriceAdjustment = function () {};
LoyaltyLineItemCtnr.prototype.removeProductLineItem = function (productLineItem) {
    const index = this.productLineItems.indexOf(productLineItem);
    if (index > -1) {
        this.productLineItems.splice(index, 1);
    }
};
LoyaltyLineItemCtnr.prototype.createShippingPriceAdjustment = function () {};
LoyaltyLineItemCtnr.prototype.getShippingPriceAdjustmentByPromotionID = function () {};
LoyaltyLineItemCtnr.prototype.createShipment = function (giftCardShipmentID) {
    var newShipment = new Shipment();
    newShipment.ID = giftCardShipmentID;
    this.shipments.push(newShipment);
    return newShipment;
};
LoyaltyLineItemCtnr.prototype.getShipment = function () {
    return this.shipments;
};
LoyaltyLineItemCtnr.prototype.removeShipment = function (shipment) {
    const index = this.shipments.toArray().indexOf(shipment);
    if (index > -1) {
        this.shipments.toArray().splice(index, 1);
    }
    this.shipments = new ArrayList(this.shipments.toArray());
};
LoyaltyLineItemCtnr.prototype.getShippingPriceAdjustments = function () {};
LoyaltyLineItemCtnr.prototype.getAllShippingPriceAdjustments = function () {};
LoyaltyLineItemCtnr.prototype.removeShippingPriceAdjustment = function () {};
LoyaltyLineItemCtnr.prototype.getShipments = function () {
    return this.shipments;
};
LoyaltyLineItemCtnr.prototype.getBillingAddress = function () {
    return this.billingAddress;
};
LoyaltyLineItemCtnr.prototype.setCustomerNo = function () {};
LoyaltyLineItemCtnr.prototype.getCustomerName = function () {
    return this.customerName;
};
LoyaltyLineItemCtnr.prototype.setCustomerName = function (customerName) {
    this.customerName = customerName;
};
LoyaltyLineItemCtnr.prototype.setCustomerEmail = function (customerEmail) {
    this.customerEmail = customerEmail;
};
LoyaltyLineItemCtnr.prototype.getMerchandizeTotalGrossPrice = function () {
    return this.totalGrossPrice;
};
LoyaltyLineItemCtnr.prototype.getAdjustedMerchandizeTotalGrossPrice = function () {};
LoyaltyLineItemCtnr.prototype.getMerchandizeTotalNetPrice = function () {};
LoyaltyLineItemCtnr.prototype.getAdjustedMerchandizeTotalNetPrice = function () {};
LoyaltyLineItemCtnr.prototype.getMerchandizeTotalTax = function () {};
LoyaltyLineItemCtnr.prototype.getAdjustedMerchandizeTotalTax = function () {};
LoyaltyLineItemCtnr.prototype.getGiftCertificateTotalNetPrice = function () {};
LoyaltyLineItemCtnr.prototype.getGiftCertificateTotalGrossPrice = function () {};
LoyaltyLineItemCtnr.prototype.getGiftCertificateTotalTax = function () {};
LoyaltyLineItemCtnr.prototype.getTotalNetPrice = function () {
    return this.totalNetPrice;
};
LoyaltyLineItemCtnr.prototype.getTotalTax = function () {
    return this.totalTax;
};
LoyaltyLineItemCtnr.prototype.getTotalGrossPrice = function () {
    return this.totalGrossPrice;
};
LoyaltyLineItemCtnr.prototype.getShippingTotalNetPrice = function () {
    return this.shippingTotalNetPrice;
};
LoyaltyLineItemCtnr.prototype.getAdjustedShippingTotalNetPrice = function () {};
LoyaltyLineItemCtnr.prototype.getShippingTotalTax = function () {
    return this.shippingTotalTax;
};
LoyaltyLineItemCtnr.prototype.getAdjustedShippingTotalTax = function () {
    return this.adjustedShippingTotalTax;
};
LoyaltyLineItemCtnr.prototype.getShippingTotalGrossPrice = function () {
    return this.shippingTotalGrossPrice;
};
LoyaltyLineItemCtnr.prototype.getAdjustedShippingTotalGrossPrice = function () {
    return this.adjustedShippingTotalGrossPrice;
};
LoyaltyLineItemCtnr.prototype.getPaymentInstrument = function (paymentMethodID) {
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
};
LoyaltyLineItemCtnr.prototype.getPaymentInstruments = function () {
    return this.paymentInstruments;
};
LoyaltyLineItemCtnr.prototype.getGiftCertificatePaymentInstruments = function () {};
LoyaltyLineItemCtnr.prototype.getProductQuantities = function () {};
LoyaltyLineItemCtnr.prototype.getAllProductQuantities = function () {};
LoyaltyLineItemCtnr.prototype.updateTotals = function () {};
LoyaltyLineItemCtnr.prototype.getAdjustedMerchandizeTotalPrice = function () {
    return {
        getValue: function () { return 7.99; }
    };
};
LoyaltyLineItemCtnr.prototype.getAdjustedShippingTotalPrice = function () {
    return this.shippingTotalPrice;
};
LoyaltyLineItemCtnr.prototype.getGiftCertificateTotalPrice = function () {};
LoyaltyLineItemCtnr.prototype.getMerchandizeTotalPrice = function () {};
LoyaltyLineItemCtnr.prototype.getShippingTotalPrice = function () {
    return this.shippingTotalPrice;
};
LoyaltyLineItemCtnr.prototype.getEtag = function () {};
LoyaltyLineItemCtnr.prototype.currencyCode = 'USD';
LoyaltyLineItemCtnr.prototype.productLineItems = [{
    adjustedGrossPrice: 120,
    adjustedNetPrice: 120,
    adjustedPrice: 120,
    adjustedTax: 0,
    basePrice: 60,
    bonusProductLineItem: false,
    bundledProductLineItem: false,
    catalogProduct: true,
    custom: {
        estimatedItemLoyaltyPoints: 270,
        sku: '1329293-002-SM'
    },
    lineItemText: 'Mens UA Sportstyle Tricot Jacket',
    minOrderQuantity: 1,
    minOrderQuantityValue: 1,
    netPrice: 120,
    price: 120,
    productID: '193444423013',
    productName: 'Mens UA Sportstyle Tricot Jacket',
    quantity: 1,
    shipment: {
        custom: {},
        default: true,
        ID: 'me',
        shippingMethodID: 'standard',
        UUID: 'fa9c6b8f518c1d4f9acc0e9ef7'
    },
    UUID: 'b9e17476840b8c0dd65ac3c7ad'
}];
LoyaltyLineItemCtnr.prototype.customerEmail = 'test@ua.com';
LoyaltyLineItemCtnr.prototype.customer = null;
LoyaltyLineItemCtnr.prototype.customerNo = '089e51fb-aa65-485d-8a0e-0c39796e99aa';
LoyaltyLineItemCtnr.prototype.defaultShipment = {
    custom: {},
    default: true,
    ID: 'me',
    shippingMethodID: 'standard',
    UUID: 'fa9c6b8f518c1d4f9acc0e9ef7'
};
LoyaltyLineItemCtnr.prototype.allProductLineItems = new ArrayList(this.productLineItems);
LoyaltyLineItemCtnr.prototype.allGiftCertificateLineItems = null;
LoyaltyLineItemCtnr.prototype.giftCertificateLineItems = new ArrayList();
LoyaltyLineItemCtnr.prototype.productQuantityTotal = null;
LoyaltyLineItemCtnr.prototype.couponLineItem = [];
LoyaltyLineItemCtnr.prototype.allLineItems = new ArrayList(this.productLineItems);
LoyaltyLineItemCtnr.prototype.couponLineItems = [];
LoyaltyLineItemCtnr.prototype.bonusDiscountLineItems = null;
LoyaltyLineItemCtnr.prototype.priceAdjustmentByPromotionID = null;
LoyaltyLineItemCtnr.prototype.priceAdjustments = new ArrayList();
LoyaltyLineItemCtnr.prototype.shippingPriceAdjustmentByPromotionID = null;
LoyaltyLineItemCtnr.prototype.shipment = {
    custom: {},
    default: true,
    ID: 'me',
    shippingMethodID: 'standard',
    UUID: 'fa9c6b8f518c1d4f9acc0e9ef7'
};
LoyaltyLineItemCtnr.prototype.shippingPriceAdjustments = null;
LoyaltyLineItemCtnr.prototype.allShippingPriceAdjustments = null;
LoyaltyLineItemCtnr.prototype.shipments = [{
    custom: {},
    default: true,
    ID: 'me',
    shippingLineItems: [{
        ID: 'STANDARD_SHIPPING'
    }],
    shippingMethodID: 'standard'
}];
LoyaltyLineItemCtnr.prototype.billingAddress = {
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
LoyaltyLineItemCtnr.prototype.customerName = { trim: function () { } };
LoyaltyLineItemCtnr.prototype.merchandizeTotalGrossPrice = null;
LoyaltyLineItemCtnr.prototype.adjustedMerchandizeTotalGrossPrice = null;
LoyaltyLineItemCtnr.prototype.merchandizeTotalNetPrice = null;
LoyaltyLineItemCtnr.prototype.adjustedMerchandizeTotalNetPrice = null;
LoyaltyLineItemCtnr.prototype.merchandizeTotalTax = null;
LoyaltyLineItemCtnr.prototype.adjustedMerchandizeTotalTax = null;
LoyaltyLineItemCtnr.prototype.giftCertificateTotalNetPrice = null;
LoyaltyLineItemCtnr.prototype.giftCertificateTotalGrossPrice = null;
LoyaltyLineItemCtnr.prototype.giftCertificateTotalTax = null;
LoyaltyLineItemCtnr.prototype.totalNetPrice = new Money(0);
LoyaltyLineItemCtnr.prototype.totalTax = new Money(0);
LoyaltyLineItemCtnr.prototype.totalGrossPrice = new Money(7.99);
LoyaltyLineItemCtnr.prototype.shippingTotalNetPrice = new Money(0);
LoyaltyLineItemCtnr.prototype.adjustedShippingTotalNetPrice = new Money(0);
LoyaltyLineItemCtnr.prototype.shippingTotalTax = new Money(0);
LoyaltyLineItemCtnr.prototype.adjustedShippingTotalTax = new Money(0);
LoyaltyLineItemCtnr.prototype.shippingTotalGrossPrice = new Money(0);
LoyaltyLineItemCtnr.prototype.adjustedShippingTotalGrossPrice = new Money(0);
LoyaltyLineItemCtnr.prototype.paymentInstrument = {};
LoyaltyLineItemCtnr.prototype.paymentInstruments = [];
LoyaltyLineItemCtnr.prototype.giftCertificatePaymentInstruments = [];
LoyaltyLineItemCtnr.prototype.productQuantities = null;
LoyaltyLineItemCtnr.prototype.allProductQuantities = null;
LoyaltyLineItemCtnr.prototype.adjustedMerchandizeTotalPrice = new Money(7.99);
LoyaltyLineItemCtnr.prototype.adjustedShippingTotalPrice = new Money(7.99);
LoyaltyLineItemCtnr.prototype.giftCertificateTotalPrice = null;
LoyaltyLineItemCtnr.prototype.merchandizeTotalPrice = new Money(7.99);
LoyaltyLineItemCtnr.prototype.shippingTotalPrice = new Money(7.99);
LoyaltyLineItemCtnr.prototype.etag = null;

module.exports = {
    LoyaltyLineItemCtnr
};
