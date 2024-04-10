'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
var BasketMgr = require('../../../../mocks/dw/dw_order_BasketMgr');
var Shipment = require('../../../../mocks/dw/dw_order_Shipment');
var ArrayList = require('../../../../mocks/dw/dw_util_ArrayList');

describe('int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/session.js file test cases', () => {
    let lineItemCtr = new LineItemCtnr();
    let Session = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/session.js', {
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/util/klarnaHelper': {
            isEnabledPreassessmentForCountry: function () {
                return false;
            },
            isOMSEnabled: function () {
                return false;
            },
            isTaxationPolicyNet: function () {
                return false;
            },
            getDiscountsTaxation: function () {
                return 'price';
            },
            getShippment: function () {
                return lineItemCtr.getDefaultShipment();
            }
        },
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasOnlyBOPISProducts: function () {
                return false;
            }
        }
    });
    Session.prototype.context = {};
    let KlarnaSession = new Session();
    var basket = BasketMgr.getCurrentBasket();
    var customer = basket.customer;
    customer.addressBook = {};
    var preferredAddress = {
        firstName: 'Amanda',
        lastName: 'Jones',
        address1: '65 May Lane',
        address2: '',
        city: 'Allston',
        postalCode: '02135',
        countryCode: { value: 'US' },
        phone: '617-555-1234',
        stateCode: 'MA',
        custom: {
            suburb: 'suburb',
            district: 'district',
            businessName: 'businessName'
        }
    };
    customer.addressBook.addresses = [
        preferredAddress
    ];
    customer.addressBook.preferredAddress = preferredAddress;
    customer.profile.phoneHome = '617-555-1234';
    it('Test buildBilling method', function () {
        KlarnaSession.getAddressRequestBuilder = function () {
            return { build: function () {
                return {};
            }
            };
        };
        KlarnaSession.context = {
            billing_address: {}
        };
        var result = KlarnaSession.buildBilling(basket);
        assert.isDefined(result.context.billing_address);
    });
    it('Test buildShipping method', function () {
        let KlarnaPaymentsSessionShip = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/session.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/util/klarnaHelper': {
                isEnabledPreassessmentForCountry: function () {
                    return false;
                },
                isOMSEnabled: function () {
                    return false;
                },
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                getShippment: function () {
                    return lineItemCtr.getDefaultShipment();
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasOnlyBOPISProducts: function () {
                    return false;
                }
            }
        });
        let klarnaSessionShip = new KlarnaPaymentsSessionShip();
        KlarnaPaymentsSessionShip.prototype.getAddressRequestBuilder = function () {
            return { build: function () {
                return {};
            }
            };
        };
        KlarnaPaymentsSessionShip.prototype.context = {};
        var result = klarnaSessionShip.buildShipping(basket);
        assert.isDefined(result.context.shipping_address);
    });
    it('Test session buildShipments method', function () {
        let KlarnaPaymentsSessionshipment = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/session.js', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/util/klarnaHelper': {
                isEnabledPreassessmentForCountry: function () {
                    return false;
                },
                isOMSEnabled: function () {
                    return false;
                },
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                getShippment: function () {
                    return lineItemCtr.getDefaultShipment();
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasOnlyBOPISProducts: function () {
                    return false;
                }
            }
        });
        let klarnaSessionShipment = new KlarnaPaymentsSessionshipment();
        var shipment = new ArrayList(new Shipment());
        shipment[0].productLineItems = new ArrayList({
            custom: {
                sku: '1330767-408-9',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '123456',
            name: 'test'
        });
        shipment[0].shippingPriceAdjustments = {
            toArray: () => {
                return [];
            }
        };
        KlarnaPaymentsSessionshipment.prototype.getShipmentItemRequestBuilder = function () {
            return { build: function () {
                return 'shipingLineItem';
            }
            };
        };
        KlarnaPaymentsSessionshipment.prototype.addPriceAdjustments = function () {
            return {};
        };
        KlarnaPaymentsSessionshipment.prototype.context = {
            order_lines: []
        };
        klarnaSessionShipment.buildShipments(shipment);
        assert.isDefined(klarnaSessionShipment.context.order_lines[0], 'context.order_lines defined');
    });

    it('Test isLocaleObjectParamsValid method localeObject defined', function () {
        var localeObject = {
            custom: {
                country: 'US',
                klarnaLocale: 'en_us'
            }
        };
        var result = KlarnaSession.isLocaleObjectParamsValid(localeObject);
        assert.isTrue(result);
    });
    it('Test isLocaleObjectParamsValid method if localeObject null', function () {
        var localeObject = null;
        var result = KlarnaSession.isLocaleObjectParamsValid(localeObject);
        assert.isNull(result);
    });
    it('Test isLocaleObjectParamsValid method if localeObject no attribute', function () {
        var localeObject = {};
        var result = KlarnaSession.isLocaleObjectParamsValid(localeObject);
        assert.isUndefined(result);
    });
});
