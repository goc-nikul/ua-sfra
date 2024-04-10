'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var BasketMgr =  require('../../../../mocks/mexico/dw/order/BasketMgr');

global.empty = (data) => {
    return !data;
};

var Site = {
    current: {
        preferences: {
            custom: {
                isInternationalBillingAddressEnabled : false
            }
        },
        getCustomPreferenceValue: function () { return { isInternationalBillingAddressEnabled: false }; }
    }
};

describe('app_ua_na/cartridge/scripts/checkout/checkoutHelpers test', () => {
    global.empty = (data) => {
        return !data;
    };
    var Forms = function () {
        var formData = {
            shipping: {
                shippingAddress:{
                    addressFields:{
                        states: {
                            stateCode:{
                                options: [{
                                    value : 'test1',
                                    label: 'test1',
                                    id:'test1'
                                }]
                            }
                        },
                        exteriorNumber: {
                            value:'exteriorNumber'
                        },
                        interiorNumber: {
                            value:'interiorNumber'
                        },
                        additionalInformation:{
                            value: 'additionalInformation'
                        },
                        colony:{
                            value: 'colony'
                        },
                        dependentLocality:{
                            value: 'dependentLocality'
                        },
                        state: {
                            value:'state'
                        }
                    }
                }
            }
        };

        this.getForm = function (id) {
            return formData[id];
        };
    };
    var server = {
        forms: new Forms()
    };

    let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_na/cartridge/scripts/checkout/checkoutHelpers', {
        'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': {
         copyShippingAddressToShipment : function(shippingData, shipmentOrNull, type){
             return '';
         },
         copyCustomerAddressToShipment : function(shippingData, shipmentOrNull){
            return '';
         },
         copyBillingAddressToBasket : function(address, basket){
            return '';
         },
         copyCustomerAddressToBilling : function(address){
            return '';
         },
         copyCustomerAddressToBasket: function(currentBasket, currentCustomer) {
            return '';
         },
         getLocaleAddress: function(coyntryCode, address) {
            return {
                address1:'add1',
                countryCode: {
                    value: 'ID'
                },
                custom: {
                    exteriorNumber:'preferredAddressExteriorNumber',
                    interiorNumber:'preferredAddressInteriorNumber',
                    additionalInformation:'preferredAddressAdditionalInformation',
                    colony:'preferredAddressColony',
                    dependentLocality:'preferredAddressDependentLocality'
                }
            };
        }
        },
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Site': Site,
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/order/BasketMgr': require('../../../../mocks/mexico/dw/order/BasketMgr'),
        '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
        'server': server,
        'dw/util/Locale': {
            getLocale: function () {
                return {
                    country: 'ID'
                };
            }
        }
    });

	it('Testing method: copyShippingAddressToShipment', () => {
        var CustomerAddress = require('../../../../mocks/mexico/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.custom ={};
        address.custom.exteriorNumber = 'exteriorNumber'
        shippingData.address.states = {
            stateCode: 'CA'
        };
        shippingData.address.country = 'US';
        var shipping = {
            shippingAddress: {
                custom:{
                    exteriorNumber:'',
                    interiorNumber: '',
                    additionalInformation: '',
                    colony: '',
                    dependentLocality:''
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                }
            }
        };
        let result = checkoutHelpers.copyShippingAddressToShipment(shippingData, shipping);
        assert.equal(shipping.shippingAddress.custom.exteriorNumber, shippingData.address.custom.exteriorNumber);
    });

    it('Testing method: copyCustomerAddressToShipment', () => {
        var CustomerAddress = require('../../../../mocks/mexico/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            exteriorNumber :'exteriorNumber',
            interiorNumber: 'interiorNumber',
            additionalInformation:'additionalInformation',
            colony:'colony',
            dependentLocality:'dependentLocality'
        }
        shippingData.address.country = 'MX';
        var shipping = {
            shippingAddress: {
                custom:{
                    exteriorNumber :'exteriorNumber',
                    interiorNumber: 'interiorNumber',
                    additionalInformation:'additionalInformation',
                    colony:'colony',
                    dependentLocality:'dependentLocality'
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                }
            }
        };

        let result = checkoutHelpers.copyCustomerAddressToShipment(address, shipping);
        assert.equal(address.custom.exteriorNumber, shipping.shippingAddress.custom.exteriorNumber);
        assert.equal(address.custom.interiorNumber, shipping.shippingAddress.custom.interiorNumber);
        assert.equal(address.custom.additionalInformation, shipping.shippingAddress.custom.additionalInformation);
        assert.equal(address.custom.colony, shipping.shippingAddress.custom.colony);
        assert.equal(address.custom.dependentLocality, shipping.shippingAddress.custom.dependentLocality)
    });

    it('Testing method: copyBillingAddressToBasket', () => {
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = {
            custom :{
                exteriorNumber:'',
                interiorNumber: '',
                additionalInformation: '',
                colony: '',
                dependentLocality:''
            }
        }
        var CustomerAddress = require('../../../../mocks/mexico/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            exteriorNumber :'exteriorNumber',
            interiorNumber: 'interiorNumber',
            additionalInformation:'additionalInformation',
            colony:'colony',
            dependentLocality:'dependentLocality'
        }

        let result = checkoutHelpers.copyBillingAddressToBasket(address, basket);
        assert.equal(address.custom.exteriorNumber, basket.billingAddress.custom.exteriorNumber);
        assert.equal(address.custom.interiorNumber, basket.billingAddress.custom.interiorNumber);
        assert.equal(address.custom.additionalInformation, basket.billingAddress.custom.additionalInformation);
        assert.equal(address.custom.colony, basket.billingAddress.custom.colony);
        assert.equal(address.custom.dependentLocality, basket.billingAddress.custom.dependentLocality)
    });

    it('Testing method: copyCustomerAddressToBilling', () => {
        var CustomerAddress = require('../../../../mocks/mexico/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            exteriorNumber :'exteriorNumber',
            interiorNumber: 'interiorNumber',
            additionalInformation:'additionalInformation',
            colony:'colony',
            dependentLocality:'dependentLocality'
        }
        let result = checkoutHelpers.copyCustomerAddressToBilling(address);
        assert.equal(address.custom.exteriorNumber,'exteriorNumber');
        assert.equal(address.custom.interiorNumber, 'interiorNumber');
        assert.equal(address.custom.additionalInformation, 'additionalInformation');
        assert.equal(address.custom.colony, 'colony');
        assert.equal(address.custom.dependentLocality,'dependentLocality' )
    });

    it('Testing method: copyCustomerAddressToBasket', () => {
        var customer = require('../../../../mocks/mexico/dw/dw_customer_Customer');
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = '';
        var shipment = require('../../../../mocks/dw/dw_order_Shipment');
        basket.shipments = [];
        basket.createShipment = function (shipment) {
            this.shipments.push(shipment);
            return shipment;
        }
        basket.defaultShipment = BasketMgr.getCurrentBasket().defaultShipment;
        basket.createShipment(new shipment());
        basket.shipments[0].shippingAddress = null;
        customer.addressBook = {};
        var preferredAddress = {
            countryCode:'ID',
            address1: '5 Wall St.',
            countryCode: 'ID',
            custom :{
                exteriorNumber :'exteriorNumber',
                interiorNumber: 'interiorNumber',
                additionalInformation:'additionalInformation',
                colony:'colony',
                dependentLocality:'dependentLocality'
            }
        }
        customer.addressBook.addresses = [
            preferredAddress
        ];
        customer.addressBook.preferredAddress = preferredAddress;
        checkoutHelpers.copyCustomerAddressToBasket(basket, customer);
        assert.equal(customer.addressBook.preferredAddress.custom.exteriorNumber, basket.defaultShipment.shippingAddress.custom.exteriorNumber);
        assert.equal(customer.addressBook.preferredAddress.custom.interiorNumber, basket.defaultShipment.shippingAddress.custom.interiorNumber);
        assert.equal(customer.addressBook.preferredAddress.custom.additionalInformation, basket.defaultShipment.shippingAddress.custom.additionalInformation);
        assert.equal(customer.addressBook.preferredAddress.custom.colony, basket.defaultShipment.shippingAddress.custom.colony);
        assert.equal(customer.addressBook.preferredAddress.custom.dependentLocality, basket.defaultShipment.shippingAddress.custom.dependentLocality);
    });

    it('Testing method: copyCustomerAddressToBasket with containsLocaleAddress', () => {
        var customer = require('../../../../mocks/mexico/dw/dw_customer_Customer');
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = '';
        var shipment = require('../../../../mocks/dw/dw_order_Shipment');
        basket.shipments = [];
        basket.createShipment = function (shipment) {
            this.shipments.push(shipment);
            return shipment;
        }
        basket.defaultShipment = BasketMgr.getCurrentBasket().defaultShipment;
        basket.createShipment(new shipment());
        basket.shipments[0].shippingAddress = null;
        customer.addressBook = {};
        var preferredAddress = {
            countryCode:'ID',
            address1: '5 Wall St.',
            countryCode: {
                value: 'ID'
            },
            custom :{
                exteriorNumber :'exteriorNumber',
                interiorNumber: 'interiorNumber',
                additionalInformation:'additionalInformation',
                colony:'colony',
                dependentLocality:'dependentLocality'
            }
        }
        customer.addressBook.addresses = [
            preferredAddress
        ];
        customer.addressBook.preferredAddress = preferredAddress;
        checkoutHelpers.copyCustomerAddressToBasket(basket, customer);
        assert.equal(customer.addressBook.preferredAddress.custom.exteriorNumber, basket.defaultShipment.shippingAddress.custom.exteriorNumber);
        assert.equal(customer.addressBook.preferredAddress.custom.interiorNumber, basket.defaultShipment.shippingAddress.custom.interiorNumber);
        assert.equal(customer.addressBook.preferredAddress.custom.additionalInformation, basket.defaultShipment.shippingAddress.custom.additionalInformation);
        assert.equal(customer.addressBook.preferredAddress.custom.colony, basket.defaultShipment.shippingAddress.custom.colony);
        assert.equal(customer.addressBook.preferredAddress.custom.dependentLocality, basket.defaultShipment.shippingAddress.custom.dependentLocality);
    });

    it('Testing method: getMxTaxMap - With uncached values (preferences)', () => {
        var checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/order/BasketMgr': require('../../../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            'dw/system/CacheMgr': {
                getCache: function () {
                    return {
                        preferences: null,
                        get: function () {
                            return this.preferences;
                        },
                        put: function (preferences) {
                            this.preferences = preferences;
                        }
                    };
                },
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            cfdiMapJSON: '',
                            regimenFiscalMapJSON: ''
                        }
                    },
                    getCustomPreferenceValue: function (preference) {
                        switch (preference) {
                            case 'cfdiMapJSON':
                                return 'cfdiMapJSON';
                            case 'regimenFiscalMapJSON':
                                return 'regimenFiscalMapJSON';
                            default:
                                break;
                        }
                        return null;
                    }
                }
            }
        });

        var result = checkoutHelpers.getMxTaxMap();
        assert.isObject(result, 'Uncached getMxTaxMap returns an object');
        if (typeof result === 'object') {
            assert.isString(result.cfdiMapJSON, 'Uncached getMxTaxMap returns an object with string parameter cfdiMapJSON');
            assert.isString(result.regimenFiscalMapJSON, 'Uncached getMxTaxMap returns an object with string parameter regimenFiscalMapJSON');
        }
    });

    it('Testing method: getMxTaxMap - With cached values', () => {
        var checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/order/BasketMgr': require('../../../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            'dw/system/CacheMgr': {
                getCache: function () {
                    return {
                        get: function () {
                            return {
                                cfdiMapJSON: '',
                                regimenFiscalMapJSON: ''
                            }
                        },
                        put: function () {}
                    };
                },
            },
        });

        var result = checkoutHelpers.getMxTaxMap();
        assert.isObject(result, 'Cached getMxTaxMap returns an object');
        if (typeof result === 'object') {
            assert.isString(result.cfdiMapJSON, 'Cached getMxTaxMap returns an object with string parameter cfdiMapJSON');
            assert.isString(result.regimenFiscalMapJSON, 'Cached getMxTaxMap returns an object with string parameter regimenFiscalMapJSON');
        }
    });

    it('Testing method: saveOxxoDetails', () => {
        var checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/order/BasketMgr': require('../../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {}
        });

        var order = {
            custom: {}
        };

        var oxxoDetailsResponse = {
            "alternativeReference": "10000000021779",
            "downloadUrl": "https://test.adyen.com/",
            "expiresAt": "2023-03-27T00:00:00",
            "initialAmount": {
                "currency": "MXN",
                "value": 99800
            },
            "instructionsUrl": "https://checkoutshopper-test.adyen.com/",
            "merchantName": "UnderArmourMX",
            "merchantReference": "orderNo",
            "reference": "1111111",
            "shopperEmail": "some@email.com",
            "shopperName": "Name",
            "totalAmount": {
                "currency": "MXN",
                "value": 99800
            },
            "type": "voucher"
        }

        assert.isUndefined(checkoutHelpers.saveOxxoDetails(order, oxxoDetailsResponse), 'saveOxxoDetails function finished without errors');
    });
});
