'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

var ReturnsUtils = function () {
    return {
        getPreferenceValue: function (service, locale) {
            if (service === 'holdExport') {
                return false;
            }
        }
    };
};

var transaction = {
    wrap: function wrap(callBack) {
        return callBack.call();
    },
    begin: function begin() {},
    commit: function commit() {},
    rollback: function begin() {}
};


describe('app_ua_emea/cartridge/scripts/orders/CreateObject.js', function () {
    var CreateObject = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/orders/CreateObject', {
        'dw/object/CustomObjectMgr': {
            createCustomObject: () => {
                return {
                    custom: {
                        dwOrderNo: '',
                        trackingNumber: '',
                        consignmentId: '',
                        readyToExport: '',
                        transactionReference: '',
                        currencyCode: '',
                        returnSkusJson: ''
                    }
                };
            }
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
        'dw/system/Transaction': transaction,
        'configuration': {
            getValue: () => {
                return 'CREDIT_CARD';
            }
        }
    });
    var order = {
        getOrderNo: () => {
            return '1234567789';
        },
        getCurrencyCode: () => {
            return 'EU';
        },
        custom: {
            customerCountry: 'AT'
        },
        getCustom: () => {
            return { Adyen_pspReference: 'Adyen_pspReference' };
        },
        addNote: (Return, returnNote) => {
            return Return + returnNote;
        },
        getPaymentInstruments: function (eaPaymentMethodType) {
            return [
                {
                    creditCardExpirationMonth: '6',
                    creditCardExpirationYear: '2019',
                    maskedCreditCardNumber: '***********4215',
                    creditCardType: 'Master Card',
                    paymentMethod: 'CREDIT_CARD',
                    custom: {
                        eaBanamexTransactionID: 'ADNTXN909',
                        eaTransbankVerificationCode: 'AdyenCode123'
                    }
                }
            ];
        },
        customerLocaleID: 'AT',
        siteId: 'OC',
        customerInfo: {
            email: 'example@example.com'
        },
        channelType: {
            value: 'Adyen_pspReference'
        },
        orderItems: [{
            ID: '1234',
            productItem: {
                product: {
                    upc: '1234',
                    sku: '1234-1234',
                    copy: {
                        name: 'product name'
                    },
                    assets: null,
                    color: null,
                    prices: {
                        total: 100
                    }
                },
                quantity: 1
            },
            shippingMethod: 'GROUND',
            shipmentId: '124',
            storeId: null,
            getLineItem: () => {
                return {
                    productID: '1234',
                    getCustom: () => {
                        return {
                            upc: '1234',
                            sku: '1234-1234',
                            copy: {
                                name: 'product name'
                            },
                            assets: null,
                            color: null,
                            prices: {
                                total: 100
                            }
                        };
                    },
                    quantity: 1
                };
            },
            getAuthorizedQuantity: () => {
                return {
                    value: 2
                };
            },
            getReasonCode: () => {
                return { value: 'SIZE_FIT_ISSUE' };
            },
            getNote: () => {
                return 'Exchanges';
            }
        }],
        originalOrderItems: [{
            ID: '1234'
        }],
        currency: 'USD',
        billingAddress: {
            firstName: 'Amanda',
            lastName: 'Jones',
            address1: '65 May Lane',
            address2: '',
            city: 'Allston',
            postalCode: '02135',
            countryCode: { value: 'us' },
            phone: '617-555-1234',
            stateCode: 'MA',
            custom: {
                suburb: 'suburb',
                district: 'district',
                businessName: 'businessName'
            }
        }
    };
    var retCase = {
        custom: {
            trackingNumber: '98889898998',
            consignmentId: 'CONS1234'
        },
        getReturnCaseNumber: () => {
            return '1234567789';
        },
        getItems: () => {
            return order.orderItems;
        }
    };
    var exportStatus = 'EXPORTED';

    it('Test Method : createObj with order, retcase details', () => {
        var result = CreateObject.createObj(order, retCase, exportStatus);
        assert.isUndefined(result);
    });

    it('Test Method : createObj with payment processing data', () => {
        order.CHANNEL_TYPE_DSS = 'Adyen_pspReference';
        var result = CreateObject.createObj(order, retCase, exportStatus);
        assert.isUndefined(result);
    });

    it('Test Method : createObj with payment processing data with empty custom values', () => {
        order.getPaymentInstruments = function (eaPaymentMethodType) {
            return [
                {
                    creditCardExpirationMonth: '6',
                    creditCardExpirationYear: '2019',
                    maskedCreditCardNumber: '***********4215',
                    creditCardType: 'Master Card',
                    paymentMethod: 'CREDIT_CARD',
                    custom: {
                        eaBanamexTransactionID: '',
                        eaTransbankVerificationCode: ''
                    }
                }
            ];
        };
        order.getCustom = () => {
            return { Adyen_pspReference: '' };
        };
        order.CHANNEL_TYPE_DSS = 'Adyen_pspReference';
        var result = CreateObject.createObj(order, retCase, exportStatus);
        assert.isUndefined(result);
    });

    it('Test Method : createObj with transaction rollback function in catch block', () => {
        var result = CreateObject.createObj(order, null, null);
        assert.isUndefined(result);
    });
});
