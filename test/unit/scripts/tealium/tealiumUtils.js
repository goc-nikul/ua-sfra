'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
let Collection = require('../../../mocks/dw/dw_util_Collection');
var mockSuperModule = require('../../../mockModuleSuperModule');
var Logger = require('../../../mocks/dw/dw_system_Logger');
var Order = require('../../../mocks/dw/dw_order_Order');

var tealiumUtils;
function Base() { }
describe('int_tealium/cartridge/scripts/tealiumUtils', function () {

    const PaymentMethods = {
        VISA: 'visa'
    };

    var order = new Order();
    order.paymentInstruments = [{
        custom: {
            adyenPaymentMethod: null
        },
        paymentTransaction: {
            custom: {
                Adyen_log: JSON.stringify({
                    paymentMethod: {
                        brand: PaymentMethods.VISA,
                        type: 'scheme'
                    }
                })
            }
        }
    }];

    before(function () {
        mockSuperModule.create(Base);
        tealiumUtils = proxyquire('../../../../cartridges/int_tealium/cartridge/scripts/tealiumUtils', {
            '*/cartridge/scripts/util/collections' : Collection,
            '*/cartridge/scripts/factories/price' : {
                getPrice: function () {
                    return null;
                }
            },
            'dw/system/Site' : require('../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource' : require('../../../mocks/dw/dw_web_Resource')
        });
    });

    it('Testing method: getABTestData --> Test AB Test site view', () => {
        tealiumUtils = proxyquire('../../../../cartridges/int_tealium/cartridge/scripts/tealiumUtils', {
            '*/cartridge/scripts/util/collections' : Collection,
            '*/cartridge/scripts/factories/price' : {
                getPrice: function () {
                    return null;
                }
            },
            'dw/system/Site' : require('../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource' : require('../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/ABTestMgr' : require('../../../mocks/dw/dw_campaign_ABTestMgr')
        });
        let result = tealiumUtils.getABTestData();
        let expectedResult =  {   
            campaignId: 'test',
            experienceId: 'test',
            testGroup: true,
            controlGroup: false
        }
        assert.equal(result.campaignId, expectedResult.campaignId);
        assert.equal(result.experienceId, expectedResult.experienceId);
        assert.equal(result.testGroup, expectedResult.testGroup);
        assert.equal(result.controlGroup, expectedResult.controlGroup);
    });

    it('Testing method: getABTestData --> Test Normal site view', () => {
        tealiumUtils = proxyquire('../../../../cartridges/int_tealium/cartridge/scripts/tealiumUtils', {
            '*/cartridge/scripts/util/collections' : Collection,
            '*/cartridge/scripts/factories/price' : {
                getPrice: function () {
                    return null;
                }
            },
            'dw/system/Site' : require('../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource' : require('../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/ABTestMgr' : {
                getAssignedTestSegments : function(){
                    return new Collection();
                }
            }
        });
        var result = tealiumUtils.getABTestData();
        
        assert.isUndefined(result.experienceId);
    });

    it('Testing method: paymentMethod --> payment method as a string', () => {
        tealiumUtils = proxyquire('../../../../cartridges/int_tealium/cartridge/scripts/tealiumUtils', {
            '*/cartridge/scripts/util/collections': Collection,
            '*/cartridge/scripts/factories/price': {},
            'dw/system/Site': {},
            'dw/web/Resource': {},
            'dw/system/Logger': Logger
        });

        order.paymentTransaction = {
            custom: {
                Adyen_log: JSON.stringify({
                    paymentMethod: PaymentMethods.VISA
                })
            }
        };

        assert.equal(tealiumUtils.paymentMethod(order), PaymentMethods.VISA);
    });

    it('Testing method: paymentMethod --> payment method as an object', () => {
        tealiumUtils = proxyquire('../../../../cartridges/int_tealium/cartridge/scripts/tealiumUtils', {
            '*/cartridge/scripts/util/collections': Collection,
            '*/cartridge/scripts/factories/price': {},
            'dw/system/Site': {},
            'dw/web/Resource': {},
            'dw/system/Logger': Logger
        });

        order.paymentTransaction = {
            custom: {
                Adyen_log: JSON.stringify({
                    paymentMethod: {
                        brand: PaymentMethods.VISA,
                        type: 'scheme'
                    }
                })
            }
        };

        assert.equal(tealiumUtils.paymentMethod(order), PaymentMethods.VISA);
    });
});


