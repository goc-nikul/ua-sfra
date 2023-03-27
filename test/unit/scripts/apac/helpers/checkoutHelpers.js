'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
var Money = require('../../../../mocks/dw/dw_value_Money');
var BasketMgr =  require('../../../../mocks/apac/dw/order/BasketMgr');
var sinon = require('sinon');
const Site = require('../../../../mocks/dw/dw_system_Site');

// Stubs
var getCurrentBasketStub = sinon.stub();
var getFormStub = sinon.stub();
var getLocaleStub = sinon.stub();

describe('app_ua_apac/cartridge/scripts/checkout/checkoutHelpers test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.session = {
        custom: {
            currentCountry: ''
        }
    }

    global.request = {
        getLocale: () => {
            return {
                country: 'ID'
            };
        },
        locale: ''
    };

    getLocaleStub.returns({country: 'ID'});

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
                        suburb: {
                            value:'suburb'
                        },
                        district: {
                            value:'distrit'
                        },
                        businessName:{
                            value: 'businessName'
                        },
                        phone1:{
                            value: '010'
                        },
                        phone2:{
                            value: '111'
                        },
                        phone3:{
                            value: '1111'
                        },
                        state: {
                            value:'state'
                        }
                    }
                }
            },
            billing: {
                emailaddressName: {
                    value: 'beforeTest'
                },
                emailaddressDomainSelect: {
                    value: 'beforeTest.com'
                },
                emailaddressDomain: {
                    value: 'beforeTest.com'
                },
                billEmail: {
                    value: 'beforeTest@beforeTest.com'
                }
            }
        };

        this.getForm = function (id) {
            return formData[id];
        };
    };

    var server = {
        forms: {
            getForm: getFormStub
        }
    };

    let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
        'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                    district:'preferredAddressDistrict',
                    suburb:'preferredAddressSuburb',
                    businessName:'preferredAddressBusinessName'
                }
            };
        }
        },
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
        '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
        '*/cartridge/scripts/utils/checkCrossSiteScript': {
            crossSiteScriptPatterns: function() {
                return 'error'
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
        'server': server,
        'dw/util/Locale': {
            getLocale: getLocaleStub
        },
        '*/cartridge/config/preferences' : {
            isShowSplitPhoneMobileField: false
        }
    });

	it('Testing method: copyShippingAddressToShipment', () => {
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.custom ={};
        address.custom.suburb = 'suburb'
        shippingData.address.states = {
            stateCode: 'CA'
        };
        shippingData.address.country = 'US';
        var shipping = {
            shippingAddress: {
                custom:{
                    suburb:'',
                    district:'',
                    businessName:'',
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                }
            }
        };
        var shippingForm = new Forms().getForm('shipping');
        getFormStub.returns(shippingForm);
        let result = checkoutHelpers.copyShippingAddressToShipment(shippingData, shipping);
        assert.equal(shipping.shippingAddress.custom.suburb, shippingData.address.custom.suburb);

        shippingForm.shippingAddress.addressFields.district.value = '';
        getFormStub.returns(shippingForm);
        result = checkoutHelpers.copyShippingAddressToShipment(shippingData, shipping);

        shippingForm = new Forms().getForm('shipping');
        getFormStub.returns(shippingForm);
        result = checkoutHelpers.copyShippingAddressToShipment(shippingData, null);
    });

    it('Testing method for copy split mobile field: copyShippingAddressToShipment', () => {
        let checkoutHelpersNew = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                        district:'preferredAddressDistrict',
                        suburb:'preferredAddressSuburb',
                        businessName:'preferredAddressBusinessName'
                    }
                };
            }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isShowSplitPhoneMobileField: true
            }
        });
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.custom ={};
        address.custom.phone1 = '010';
        address.custom.phone2 = '111';
        address.custom.phone3 = '1111';
        var shipping = {
            shippingAddress: {
                custom:{
                    phone1: '',
                    phone2: '',
                    phone3: ''
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                }
            }
        };
        var shippingForm = new Forms().getForm('shipping');
        getFormStub.returns(shippingForm);
        let result = checkoutHelpersNew.copyShippingAddressToShipment(shippingData, shipping);
        assert.equal(shipping.shippingAddress.custom.phone1, shippingData.address.custom.phone1);
        assert.equal(shipping.shippingAddress.custom.phone2, shippingData.address.custom.phone2);
        assert.equal(shipping.shippingAddress.custom.phone3, shippingData.address.custom.phone3);
    });

    it('Testing method: copyCustomerAddressToShipment', () => {
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            suburb :'suburb',
            district: 'district',
            businessName:'businessName'
        }
        shippingData.address.country = 'US';
        var shipping = {
            shippingAddress: {
                custom:{
                    suburb:'suburb',
                    district:'district',
                    businessName:'businessName', 
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                }
            }
        };

        let result = checkoutHelpers.copyCustomerAddressToShipment(address, shipping);
        assert.equal(address.custom.suburb, shipping.shippingAddress.custom.suburb);
        assert.equal(address.custom.district, shipping.shippingAddress.custom.district);
        assert.equal(address.custom.businessName, shipping.shippingAddress.custom.businessName);
    });

    it('Testing method for  copy split mobile field : copyCustomerAddressToShipment', () => {
        let checkoutHelpersNew = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                        district:'preferredAddressDistrict',
                        suburb:'preferredAddressSuburb',
                        businessName:'preferredAddressBusinessName'
                    }
                };
            }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isShowSplitPhoneMobileField: true
            }
        });
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            phone1: '010',
            phone2: '111',
            phone3: '1111'

        }
        address.phone = '010-111-1111';
        shippingData.address.country = 'US';
        var shipping = {
            shippingAddress: {
                custom:{
                    phone1: '010',
                    phone2: '111',
                    phone3: '1111'
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                }
            }
        };

        let result = checkoutHelpersNew.copyCustomerAddressToShipment(address, shipping);
        assert.equal(address.custom.phone1, shipping.shippingAddress.custom.phone1);
        assert.equal(address.custom.phone2, shipping.shippingAddress.custom.phone2);
        assert.equal(address.custom.phone3, shipping.shippingAddress.custom.phone3);
        assert.equal(address.phone, shipping.shippingAddress.custom.phone1 + '-' + shipping.shippingAddress.custom.phone2 + '-' + shipping.shippingAddress.custom.phone3);
    });


    it('Testing method: copyBillingAddressToBasket', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isKRCustomCheckoutEnabled: true
            }
        });
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = {
            custom :{
                suburb:'',
                district: '',
                businessName:''
            }
        }
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            suburb :'suburb',
            district: 'district',
            businessName:'businessName'
        }

        let result = checkoutHelpers.copyBillingAddressToBasket(address, basket);
        assert.equal(address.custom.suburb, basket.billingAddress.custom.suburb);
        assert.equal(address.custom.district, basket.billingAddress.custom.district);
        assert.equal(address.custom.businessName, basket.billingAddress.custom.businessName);
        assert.equal('', basket.billingAddress.lastName);
        assert.equal('', basket.billingAddress.firstName);
        assert.equal('', basket.billingAddress.phone);
    });

    it('Testing method when KR custom checkout disabled: copyBillingAddressToBasket', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isKRCustomCheckoutEnabled: false
            }
        });
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = {
            custom :{
                suburb:'',
                district: '',
                businessName:''
            }
        }
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.custom ={};
        address.custom = {
            suburb :'suburb',
            district: 'district',
            businessName:'businessName'
        }

        let result = checkoutHelpers.copyBillingAddressToBasket(address, basket);
        assert.equal(address.custom.suburb, basket.billingAddress.custom.suburb);
        assert.equal(address.custom.district, basket.billingAddress.custom.district);
        assert.equal(address.custom.businessName, basket.billingAddress.custom.businessName);
        assert.equal(address.lastName, basket.billingAddress.lastName);
        assert.equal(address.firstName, basket.billingAddress.firstName);
        assert.equal(address.phone, basket.billingAddress.phone);
    });

    it('Testing method: copyCustomerAddressToBilling', () => {
        var CustomerAddress = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var shippingData = {
            address: new CustomerAddress()
        }
        var address = shippingData.address = {};
        address.countryCode = 'ID';
        address.countryCode = {
            value: 'ID'
        };
        address.custom ={};
        address.custom = {
            suburb :'suburb',
            district: 'district',
            businessName:'businessName'
        }
        let result = checkoutHelpers.copyCustomerAddressToBilling(address);
        assert.equal(address.custom.suburb,'suburb');
        assert.equal(address.custom.district, 'district');
        assert.equal(address.custom.businessName, 'businessName');
    });

    it('Testing method: copyCustomerAddressToBasket', () => {
        var customer = require('../../../../mocks/apac/dw/dw_customer_Customer');
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = {
            custom :{
                suburb:'',
                district: '',
                businessName:''
            }
        }
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
            custom :{
                suburb:'suburb',
                district: 'district',
                businessName:'businessName'
            }
        }
        customer.addressBook.addresses = [
            preferredAddress
        ];
        customer.addressBook.preferredAddress = preferredAddress;
        basket.billingAddress = undefined;
        Site.current.preferences.custom.isInternationalBillingAddressEnabled = false;
        checkoutHelpers.copyCustomerAddressToBasket(basket, customer);
        assert.equal(customer.addressBook.preferredAddress.custom.district, basket.defaultShipment.shippingAddress.custom.district);
        assert.equal(customer.addressBook.preferredAddress.custom.suburb, basket.defaultShipment.shippingAddress.custom.suburb);
        assert.equal(customer.addressBook.preferredAddress.custom.businessName, basket.defaultShipment.shippingAddress.custom.businessName);

        customer.addressBook.preferredAddress.countryCode = {
            value: 'ID'
        };
        Site.current.preferences.custom.isInternationalBillingAddressEnabled = true;
        checkoutHelpers.copyCustomerAddressToBasket(basket, customer);
        assert.equal(customer.addressBook.preferredAddress.custom.district, basket.defaultShipment.shippingAddress.custom.district);
        assert.equal(customer.addressBook.preferredAddress.custom.suburb, basket.defaultShipment.shippingAddress.custom.suburb);
        assert.equal(customer.addressBook.preferredAddress.custom.businessName, basket.defaultShipment.shippingAddress.custom.businessName);
    });

    it('Testing method: checkOrderLimit', () => {
        session.custom.currentCountry = 'ID'
        request.locale = 'en_ID';
        let result = checkoutHelpers.checkOrderLimit();

        let checkoutHelpersNew = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                        district:'preferredAddressDistrict',
                        suburb:'preferredAddressSuburb',
                        businessName:'preferredAddressBusinessName'
                    }
                };
            }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': {
                getCurrentBasket: getCurrentBasketStub
            },
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
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

        getCurrentBasketStub.returns({
            productLineItems: [
                {
                    UUID: 'testUUID',
                    id: 'testProductID',
                    quantity: {
                        value: 6
                    },
                    product: {
                        masterProduct: {
                            custom: {
                                division: 'apparel'
                            }
                        },
                        custom: {
                            availableForLocale: {
                                value: 'No'
                            }
                        }
                    }
                }
            ]
        });
        result = checkoutHelpersNew.checkOrderLimit();
        assert.isTrue(result.orderLimitExceeds);
        getCurrentBasketStub.returns({productLineItems: null});
        result = checkoutHelpersNew.checkOrderLimit();
        assert.isFalse(result.orderLimitExceeds);
    });

    it('Testing method: validateInputFieldsForShippingMethod', () => {
        session.custom.currentCountry = 'HK';
        var addressobject = {};
        let result = checkoutHelpers.validateInputFieldsForShippingMethod(addressobject);
        assert.isTrue(result.error);
    });

    it('Testing method: validateInputFieldsForShippingMethod AU/NZ/PH/ID', () => {
        session.custom.currentCountry = 'AU';
        var addressobject = {};
        let result = checkoutHelpers.validateInputFieldsForShippingMethod(addressobject);
        assert.isTrue(result.error);
        session.custom.currentCountry = 'NZ';
        result = checkoutHelpers.validateInputFieldsForShippingMethod(addressobject);
        assert.isTrue(result.error);

        session.custom.currentCountry = 'PH';
        result = checkoutHelpers.validateInputFieldsForShippingMethod(addressobject);
        assert.isTrue(result.error);

        session.custom.currentCountry = 'ID';
        result = checkoutHelpers.validateInputFieldsForShippingMethod(addressobject);
        assert.isTrue(result.error);
    });

    it('Testing method: checkEmptyEmojiNonLatinChars', () => {
        var address = {
            firstName: 'James',
            lastName: 'Bond',
            address1: '10 Oxford St',
            address2: 'suite 20',
            city: 'London',
            postalCode: '12345',
            countryCode: { value: 'NZ' },
            phone: '603-333-1212',
            stateCode: 'NH',
            suburb: ''
        };
        var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'postalCode', 'countryCode'];
        let result = checkoutHelpers.checkEmptyEmojiNonLatinChars(address,addressFieldsToVerify, 'NZ');
        assert.isNotNull(result.postalCode);

        address.firstName = '';
        addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'postalCode'];
        result = checkoutHelpers.checkEmptyEmojiNonLatinChars(address,addressFieldsToVerify, 'NZ');
        assert.isObject(result);
        assert.equal(result.firstName, 'firstName is empty');

        address.firstName = 'James';
        session.custom.currentCountry = 'AU';
        addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'postalCode', 'suburb'];
        result = checkoutHelpers.checkEmptyEmojiNonLatinChars(address,addressFieldsToVerify, 'AU');
        assert.isObject(result);
        assert.isUndefined(result.firstName);
        session.custom.currentCountry = 'ID';
    });

    it('Testing method: validateInputFields', () => {
        let basket = new LineItemCtnr();
        basket.defaultShipment.giftMessage = 'Test';
        let result = checkoutHelpers.validateInputFields(basket);
        assert.isTrue(result.error);
        assert.equal(result.billingAddressErrors, 'error');
        assert.equal(result.giftMessageErrors, 'error');
        basket.customerEmail = 'test@ua..@com';
        basket.billingAddress.phone = '333-4445555';
        result = checkoutHelpers.validateInputFields(basket);
        assert.isTrue(result.error);
        assert.isNotNull(result.contactInfoErrors);
        assert.equal(result.contactInfoErrors.customerEmail, 'testMsg');
        assert.equal(result.contactInfoErrors.phone, 'testMsg');
    });

    it('Testing method: smsOptInEnabled', () => {
        session.custom.currentCountry = 'ID';
        let result = checkoutHelpers.smsOptInEnabled();
        assert.isTrue(result);
        session.custom.currentCountry = 'US';
        result = checkoutHelpers.smsOptInEnabled();
        assert.isTrue(result);
        getLocaleStub.returns({country: 'US'});
        session.custom.currentCountry = null;
        var smsOptInSitesConfig = JSON.parse(Site.current.preferences.custom.smsOptInSitesConfig);
        smsOptInSitesConfig.default = false;
        Site.current.preferences.custom.smsOptInSitesConfig = JSON.stringify(smsOptInSitesConfig);
        result = checkoutHelpers.smsOptInEnabled();
        assert.isFalse(result);
        // reset
        getLocaleStub.reset();
        session.custom.currentCountry = 'ID';
    });

    it('Testing method: validatephoneNumber SG country', () => {
        var countries = JSON.parse(Site.current.preferences.custom.countriesJSON);
        if(countries && countries.length > 0){
            countries.map(country => {
                if(country.countryDialingCode && !empty(country.countryDialingCode)){
                    country.areaCode = country.countryDialingCode;
                    country.areaDigitCount = country.countryDialingCode.length;
                }
                if(country.countryCode == 'AU'){
                    country.areaCode = '+61';
                    country.areaDigitCount = 3;
                    country.regexp = '^[0-9]{9}$';
                }
            });
        }
        Site.current.preferences.custom.countriesJSON = JSON.stringify(countries);
        let result = checkoutHelpers.validatephoneNumber('11111111','+65');
        assert.isTrue(result);
        result = checkoutHelpers.validatephoneNumber('11111111','+35');
        assert.isFalse(result);
    });

    it('Testing method: validatephoneNumber AU country', () => {
        session.custom.currentCountry = 'AU';
        let result = checkoutHelpers.validatephoneNumber('123456789','+61');
        assert.isTrue(result);
        result = checkoutHelpers.validatephoneNumber('123','+61');
        assert.isFalse(result);
        result = checkoutHelpers.validatephoneNumber('ASD123','+61');
        assert.isFalse(result);
        result = checkoutHelpers.validatephoneNumber('ASD123','+62');
        assert.isFalse(result);
    });

    it('Testing method: validatephoneNumber KR country', () => {
        session.custom.currentCountry = 'KR';
        let result = checkoutHelpers.validatephoneNumber('123456789','+82');
        assert.isTrue(result);
        result = checkoutHelpers.validatephoneNumber('010-111-1111','+82');
        assert.isTrue(result);
        result = checkoutHelpers.validatephoneNumber('123','+82');
        assert.isFalse(result);
        result = checkoutHelpers.validatephoneNumber('ASD123','+82');
        assert.isFalse(result);
        result = checkoutHelpers.validatephoneNumber('ASD123','+82');
        assert.isFalse(result);
    });

    it('Testing method: validatePhoneAreaCode', () => {
        let result = checkoutHelpers.validatePhoneAreaCode('1111111111','+65');
        assert.isFalse(result);
        result = checkoutHelpers.validatePhoneAreaCode('+651111111','+65');
        assert.isTrue(result);
    });

    it('Testing method: getCountryDialingCodeBasedOnCurrentCountry', () => {
        session.custom.currentCountry = 'SG';
        let result = checkoutHelpers.getCountryDialingCodeBasedOnCurrentCountry();
        assert.isNotNull(result);
    });

    it('Testing method: isAfterPayBasket', () => {
        var PaymentInstrument = require('../../../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('AdyenComponent', new Money(10));
        let result = checkoutHelpers.isAfterPayBasket(lineItemCtnr);
        assert.isFalse(result);
        lineItemCtnr.paymentInstruments[0].custom.adyenPaymentMethod = 'Afterpay';
        result = checkoutHelpers.isAfterPayBasket(lineItemCtnr);
        assert.isTrue(result);
        result = checkoutHelpers.isAfterPayBasket(null);
        assert.isFalse(result);
    });

    it('Testing method: isBasketExceedingAfterPayLimit', () => {
        // var PaymentInstrument = require('../../../../mocks/dw/dw_order_PaymentInstrument');
        // var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('AdyenComponent', new Money(10));
        let result = checkoutHelpers.isBasketExceedingAfterPayLimit(lineItemCtnr);
        assert.isTrue(result);
        lineItemCtnr.totalGrossPrice.value = 2500;
        result = checkoutHelpers.isBasketExceedingAfterPayLimit(lineItemCtnr);
        assert.isTrue(result);
        result = checkoutHelpers.isBasketExceedingAfterPayLimit(null);
        assert.isFalse(result);
    });

    it('Testing method: checkBasketHasProductsNotAvailableForLocale', () => {
        var lineItemCtnr = new LineItemCtnr();
        let result = checkoutHelpers.checkBasketHasProductsNotAvailableForLocale(lineItemCtnr);
        assert.isTrue(result.basketHasInvalidProducts);
    });

    it('Testing method: isEmployeeOfficeAddressAvailableForCurrentCountry', () => {
        var address = {
            firstName: 'James',
            lastName: 'Bond',
            address1: '10 Oxford St',
            address2: 'suite 20',
            city: 'London',
            postalCode: '12345',
            countryCode:'NZ',
            phone: '603-333-1212',
            stateCode: 'test'
        }
        var officeAddresses = [address];
        let result = checkoutHelpers.isEmployeeOfficeAddressAvailableForCurrentCountry(officeAddresses, 'NZ');
        assert.isTrue(result);

        result = checkoutHelpers.isEmployeeOfficeAddressAvailableForCurrentCountry([], 'NZ');
        assert.isFalse(result);
    });

    it('Testing method: setAdyenOrderStatusToNotExported', () => {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('AdyenComponent', new Money(10));
        lineItemCtnr.custom.Adyen_paymentMethod = 'Adyen';
        let result = checkoutHelpers.setAdyenOrderStatusToNotExported(lineItemCtnr);
        assert.isUndefined(result);
        lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('AdyenComponent', new Money(10));
        lineItemCtnr.custom.Adyen_paymentMethod = 'TEST';
        lineItemCtnr.custom.Adyen_pspReference = 'TEST';
        lineItemCtnr.custom.Adyen_eventCode = 'TEST';
        lineItemCtnr.custom.Adyen_value = '';
        result = checkoutHelpers.setAdyenOrderStatusToNotExported(lineItemCtnr);
        assert.isUndefined(result);
    });

    it('Testing method when email split field is enabled: setEmailFiledsInBillingForm', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isShowSplitEmailField: true
            }
        });
        var basket = require('../../../../mocks/dw/dw_order_Basket');
        basket.custom = {
            emailaddressName: 'testemail',
            emailaddressDomainSelect: 'test.com',
            emailaddressDomain: 'test.com',
        }

        var billingForm = new Forms().getForm('billing');

        let result = checkoutHelpers.setEmailFiledsInBillingForm(basket, billingForm);
        assert.equal(result.emailaddressName.value, basket.custom.emailaddressName);
        assert.equal(result.emailaddressDomainSelect.value, basket.custom.emailaddressDomainSelect);
        assert.equal(result.emailaddressDomain.value, basket.custom.emailaddressDomain);
    });

    it('Testing method when email split field is disabled: setEmailFiledsInBillingForm', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isShowSplitEmailField: false
            }
        });
        let basket = new LineItemCtnr();
        var billingForm = new Forms().getForm('billing');

        let result = checkoutHelpers.setEmailFiledsInBillingForm(basket, billingForm);
        assert.equal(result.billEmail.value, basket.customerEmail);
    });

    it('Testing method option with in emailaddressDomainSelect options: splitEmail', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            }
        });
        var email = 'test@gmail.com';
        var billingForm = new Forms().getForm('billing');
        billingForm.emailaddressDomainSelect.options = [{
            value : 'gmail.com',
            label: 'gmail.com',
            id:'gmail.com'
        }];

        let result = checkoutHelpers.splitEmail(email, billingForm);
        assert.equal(result.emailaddressName, 'test');
        assert.equal(result.emailaddressDomain, 'gmail.com');
        assert.equal(result.emailaddressDomainSelect , 'gmail.com');
    });

    it('Testing method option not with in emailaddressDomainSelect options: splitEmail', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            }
        });
        var email = 'test@test.com';
        var billingForm = new Forms().getForm('billing');
        billingForm.emailaddressDomainSelect.options = [{
            value : 'gmail.com',
            label: 'gmail.com',
            id:'gmail.com'
        }];

        let result = checkoutHelpers.splitEmail(email, billingForm);
        assert.equal(result.emailaddressName, 'test');
        assert.equal(result.emailaddressDomain, 'test.com');
        assert.equal(result.emailaddressDomainSelect , '');
    });

    it('Testing method without emailaddressDomainSelect options: splitEmail', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            }
        });
        var email = 'test@test.com';
        var billingForm = new Forms().getForm('billing');

        let result = checkoutHelpers.splitEmail(email, billingForm);
        assert.equal(result.emailaddressName, 'test');
        assert.equal(result.emailaddressDomain, 'test.com');
        assert.equal(result.emailaddressDomainSelect , '');
    });

    it('Testing method without Birthday: prepProfileObjFromContactInfo', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isShowSplitEmailField: false
            }
        });
        var phone = '0102223334';
        var customer = {
            profile: {
                firstName: 'John',
                lastName: 'Snow',
                email: 'jsnow@starks.com',
                gender: {
                    value: 'male'
                }
            }
        };

        let result = checkoutHelpers.prepProfileObjFromContactInfo(customer, phone);
        assert.equal(result.customer.lastname, customer.profile.lastName);
        assert.equal(result.customer.gender, customer.profile.gender.value);
        assert.equal(result.customer.phone, phone);
        assert.equal(result.customer.birthDay, null);
        assert.equal(result.customer.birthMonth, null);
        assert.equal(result.customer.birthYear, null);
    });

    it('Testing method with Birthday: prepProfileObjFromContactInfo', () => {
        let checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/checkout/checkoutHelpers', {
            'app_ua_emea/cartridge/scripts/checkout/checkoutHelpers': {
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
                           district:'preferredAddressDistrict',
                           suburb:'preferredAddressSuburb',
                           businessName:'preferredAddressBusinessName'
                       }
                   };
               }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/BasketMgr': require('../../../../mocks/apac/dw/order/BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function() {
                    return 'error'
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'server': server,
            'dw/util/Locale': {
                getLocale: getLocaleStub
            },
            '*/cartridge/config/preferences' : {
                isShowSplitEmailField: false
            }
        });
        var phone = '0102223334';
        var customer = {
            profile: {
                firstName: 'John',
                lastName: 'Snow',
                email: 'jsnow@starks.com',
                gender: {
                    value: 'male'
                },
                birthday: new Date('01/01/1990')
            }
        };

        let result = checkoutHelpers.prepProfileObjFromContactInfo(customer, phone);
        assert.equal(result.customer.lastname, customer.profile.lastName);
        assert.equal(result.customer.gender, customer.profile.gender.value);
        assert.equal(result.customer.phone, phone);
        assert.equal(result.customer.birthDay, customer.profile.birthday.getDate());
        assert.equal(result.customer.birthMonth, customer.profile.birthday.getMonth());
        assert.equal(result.customer.birthYear, customer.profile.birthday.getFullYear());
    });
});
