/* eslint-disable spellcheck/spell-checker */
'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
const Customer = require('../../../mocks/dw/dw_customer_Customer');
var Money = require('../../../mocks/dw/dw_value_Money');

var templateStub = sinon.stub();
var VIPAuthTokenHelperStub = sinon.stub();
var VIPCustomerServiceStub = sinon.stub();
var VIPCustomerHelperStub = sinon.stub();
var renderTemplateHelper = proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/renderTemplateHelper.js', {
    'dw/util/Template': templateStub,
    'dw/util/HashMap': function () {
        return {
            result: {},
            put: function (key, context) {
                this.result[key] = context;
            }
        };
    }
});

VIPAuthTokenHelperStub.returns({
    getValidToken: function () {
        return {
            accessToken: 'sadsfdsgfdgfdgdss'
        };
    }
});

VIPCustomerHelperStub.returns({
    prepareGraphQLRequest: function (params) {
        return params.requestType;
    }
});

VIPCustomerServiceStub.returns({
    getGraphQL: function () {
        return {
            call: function (args) {
                var object = { success: true };
                if (args.payload === 'account') {
                    object.response = {
                        availableBalance: 93795,
                        activeContract: {
                            promoGroup: 'UA_ATHLETE_20'
                        }
                    };
                } else if (args.payload === 'authorize') {
                    object.response = { id: 'VHJhbnNhY3Rpb246Nzg1ZDM2MjYtZGEzNC00OTUyLWEwOTktY2U0OWQxMjA0ZTI0' };
                } else if (args.payload === 'capture') {
                    object.response = { id: 'VHJhbnNhY3Rpb246OTI1NTk2M2UtOTBjMy00Mzg2LWE1YTgtYjgwNDI4YWNlMWU1' };
                } else if (args.payload === 'voidAuthorization') {
                    object.response = {
                        id: 'VHJhbnNhY3Rpb246MWQwMzk1NGEtOTI1OS00YzYwLTg1NTAtZjhjMTg0YzdmNmUy',
                        transactionType: 'void_authorize',
                        amount: 20
                    };
                }
                return {
                    ok: true,
                    object: object
                };
            }
        };
    }
});

const vipDataHelper = proxyquire('../../../../cartridges/int_VIP/cartridge/scripts/vipDataHelpers', {
    '*/cartridge/scripts/giftcard/giftcardHelper': {
        basketHasGiftCardItems: function () {
            return {
                giftCardItemsCount: 0,
                eGiftCards: false,
                giftCards: false,
                onlyEGiftCards: false
            };
        }
    },
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    '~/cartridge/scripts/init/VIPCustomerService': new VIPCustomerServiceStub(),
    '~/cartridge/scripts/util/VIPAuthTokenHelper': VIPAuthTokenHelperStub,
    '~/cartridge/scripts/util/VIPCustomerHelper': new VIPCustomerHelperStub(),
    'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
    '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper,
    'dw/system/HookMgr': require('../../../mocks/dw/dw_system_HookMgr'),
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'dw/order/PaymentInstruments': require('../../../mocks/dw/dw_order_PaymentInstrument')
});

const vipHooks = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/vip/hooks/vipHooks', {
    '*/cartridge/scripts/vipDataHelpers': vipDataHelper,
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
    'dw/order/Order': require('../../../mocks/dw/dw_order_Order')
});
var currentCustomer = new Customer();

describe('int_VIP/cartridge/scripts/vipDataHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    it('Test getVipPoints method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 50;
        currentCustomer.authenticated = true;
        global.session.custom = {
            insufficientVipPoints: false
        };
        vipDataHelper.handleVIPPayment(currentCustomer, lineItemCtnr);
        var result = vipDataHelper.getVipPoints(lineItemCtnr);
        assert.deepEqual({ 'availablePoints': '$93795', 'usedPoints': '$50', 'remainingPoints': '$93745', 'partialPointsApplied': false, 'pointsApplied': true, 'vipPromotionEnabled': false }, result);
        var vipPaymentInstrument = vipDataHelper.getVipPaymentInstrument(lineItemCtnr);
        lineItemCtnr.removePaymentInstrument(vipPaymentInstrument);
        result = vipDataHelper.getVipPoints(lineItemCtnr);
        assert.isUndefined(result);
    });

    it('Test isOrderTotalRedeemedByVipPoints method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 15;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        var result = vipDataHelper.isOrderTotalRedeemedByVipPoints(lineItemCtnr);
        assert.equal(true, result);

        // Negative scenario
        lineItemCtnr.totalGrossPrice.value = 50;
        result = vipDataHelper.isOrderTotalRedeemedByVipPoints(lineItemCtnr);
        assert.equal(false, result);
    });

    it('Test getVipRenderingTemplate method', function () {
        templateStub.returns({
            render: function () {
                return { text: 'rendered html' };
            }
        });

        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 50;
        currentCustomer.authenticated = true;
        vipDataHelper.handleVIPPayment(currentCustomer, lineItemCtnr);
        var vipPoints = vipDataHelper.getVipPoints(lineItemCtnr);
        var result = vipDataHelper.getVipRenderingTemplate(vipPoints);
        assert.equal('rendered html', result);
    });

    it('Test removeNonVipPaymentInstruments method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        vipDataHelper.removeNonVipPaymentInstruments(lineItemCtnr);
        assert.equal(1, lineItemCtnr.paymentInstruments.length);

        lineItemCtnr.createPaymentInstrument('GIFT_CARD', new Money(20));
        lineItemCtnr.createPaymentInstrument('Paymetric', new Money(10));
        vipDataHelper.removeNonVipPaymentInstruments(lineItemCtnr);
        assert.equal(1, lineItemCtnr.paymentInstruments.length);
    });

    it('Test getVipAuthorizationId method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        var result = vipDataHelper.getVipAuthorizationId(lineItemCtnr);
        assert.equal('7777007069967974', result);
    });

    it('Test isVIPOrder method', function () {
        const lineItemCtnr = new LineItemCtnr();
        var vipPaymentInstrument = lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        var result = vipDataHelper.isVIPOrder(lineItemCtnr);
        assert.equal(true, result);

        lineItemCtnr.removePaymentInstrument(vipPaymentInstrument);
        result = vipDataHelper.isVIPOrder(lineItemCtnr);
        assert.equal(false, result);
    });

    it('Test getRemainingBalance method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 50;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        var result = vipDataHelper.getRemainingBalance(lineItemCtnr);
        assert.equal(30, result);
    });

    it('Test getRemainingBalance method with out VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 50;
        var result = vipDataHelper.getRemainingBalance(lineItemCtnr);
        assert.equal(50, result);
    });

    it('Test checkBalance method', function () {
        var result = vipDataHelper.checkBalance('32454354564564');
        assert.deepEqual({
            response: { availableBalance: 93795,
                activeContract: {
                    promoGroup: 'UA_ATHLETE_20'
                }
            },
            success: true
        }, result);
    });

    it('Test authorize method', function () {
        var result = vipDataHelper.authorize('32454354564564', 20);
        assert.deepEqual({
            response: { id: 'VHJhbnNhY3Rpb246Nzg1ZDM2MjYtZGEzNC00OTUyLWEwOTktY2U0OWQxMjA0ZTI0' },
            success: true
        }, result);
    });

    it('Test capture method', function () {
        var result = vipDataHelper.capture('VHJhbnNhY3Rpb246Nzg1ZDM2MjYtZGEzNC00OTUyLWEwOTktY2U0OWQxMjA0ZTI0', 20);
        assert.deepEqual({
            response: { id: 'VHJhbnNhY3Rpb246OTI1NTk2M2UtOTBjMy00Mzg2LWE1YTgtYjgwNDI4YWNlMWU1' },
            success: true
        }, result);
    });

    it('Test voidAuthorization method', function () {
        var result = vipDataHelper.voidAuthorization('VHJhbnNhY3Rpb246Nzg1ZDM2MjYtZGEzNC00OTUyLWEwOTktY2U0OWQxMjA0ZTI0', 20);
        assert.deepEqual({
            response: {
                id: 'VHJhbnNhY3Rpb246MWQwMzk1NGEtOTI1OS00YzYwLTg1NTAtZjhjMTg0YzdmNmUy',
                transactionType: 'void_authorize',
                amount: 20
            },
            success: true
        }, result);
    });

    it('Test handleVIPPayment method', function () {
        var currentBasket = new LineItemCtnr();
        currentBasket.totalGrossPrice.value = 50;
        var expectedResult = { 'availablePoints': '$93795', 'usedPoints': '$50', 'remainingPoints': '$93745', 'partialPointsApplied': false, 'pointsApplied': true, 'vipPromotionEnabled': false };
        currentCustomer.authenticated = true;
        vipDataHelper.handleVIPPayment(currentCustomer, currentBasket);
        var result = vipDataHelper.getVipPoints(currentBasket);
        assert.deepEqual(expectedResult, result);

        currentBasket.totalGrossPrice.value = 30;
        expectedResult = {
            availablePoints: '$93795',
            partialPointsApplied: false,
            pointsApplied: true,
            remainingPoints: '$93765',
            usedPoints: '$30',
            vipPromotionEnabled: false
        };
        vipDataHelper.handleVIPPayment(currentCustomer, currentBasket);
        result = vipDataHelper.getVipPoints(currentBasket);
        assert.deepEqual(expectedResult, result);
    });

    it('Test handleVIPPayment method else condition if VIP POINTS are less than order value', function () {
        global.dw = {
            system: {
                HookMgr: { callHook: function () { return {}; } }
            }
        };
        var currentBasket = new LineItemCtnr();
        currentBasket.totalGrossPrice.value = 100000;
        currentCustomer.authenticated = true;
        var result = vipDataHelper.handleVIPPayment(currentCustomer, currentBasket);
        assert.isUndefined(result);
    });

    it('Test vipPartialPointsApplied method with basket total partially applied with VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        var vipPaymentInstrument = lineItemCtnr.getPaymentInstruments('VIP_POINTS').items[0];
        vipPaymentInstrument.custom = {
            vipPaymentDetails: '{"availablePoints":"$20.00","usedPoints":"$20.00","remainingPoints":"$0.00","pointsApplied":false,"partialPointsApplied":true,"vipPromotionEnabled":false}'
        };
        var result = vipDataHelper.vipPartialPointsApplied(vipPaymentInstrument);
        assert.equal(result, true);
    });

    it('Test vipPartialPointsApplied method with basket total applied with VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(100));
        var vipPaymentInstrument = lineItemCtnr.getPaymentInstruments('VIP_POINTS').items[0];
        vipPaymentInstrument.custom = {
            vipPaymentDetails: '{"availablePoints":"$1100.00","usedPoints":"$100.00","remainingPoints":"$1000.00","pointsApplied":true,"partialPointsApplied":false,"vipPromotionEnabled":false}'
        };
        var result = vipDataHelper.vipPartialPointsApplied(vipPaymentInstrument);
        assert.equal(result, false);
    });

    it('Test calculatePartialVipAmount method with basket total partially applied with VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        lineItemCtnr.paymentInstruments[0].custom = {
            vipPaymentDetails: '{"availablePoints":"$20.00","usedPoints":"$20.00","remainingPoints":"$0.00","pointsApplied":false,"partialPointsApplied":true,"vipPromotionEnabled":false}'
        };
        var result = vipDataHelper.calculatePartialVipAmount(lineItemCtnr);
        assert.equal(result, 20);
    });

    it('Test calculatePartialVipAmount method with basket total applied with VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(100));
        lineItemCtnr.paymentInstruments[0].custom = {
            vipPaymentDetails: '{"availablePoints":"$1100.00","usedPoints":"$100.00","remainingPoints":"$1000.00","pointsApplied":true,"partialPointsApplied":false,"vipPromotionEnabled":false}'
        };
        var result = vipDataHelper.calculatePartialVipAmount(lineItemCtnr);
        assert.equal(result, 0);
    });

    it('Test isPartialVipPointsApplied method with basket total partially applied with VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        lineItemCtnr.paymentInstruments[0].custom = {
            vipPaymentDetails: '{"availablePoints":"$20.00","usedPoints":"$20.00","remainingPoints":"$0.00","pointsApplied":false,"partialPointsApplied":true,"vipPromotionEnabled":false}'
        };
        var result = vipDataHelper.isPartialVipPointsApplied(lineItemCtnr);
        assert.equal(result, true);
    });

    it('Test isPartialVipPointsApplied method with basket total applied with VIP points', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(100));
        lineItemCtnr.paymentInstruments[0].custom = {
            vipPaymentDetails: '{"availablePoints":"$1100.00","usedPoints":"$100.00","remainingPoints":"$1000.00","pointsApplied":true,"partialPointsApplied":false,"vipPromotionEnabled":false}'
        };
        var result = vipDataHelper.isPartialVipPointsApplied(lineItemCtnr);
        assert.equal(result, false);
    });
});

describe('int_VIP/cartridge/scripts/vipDataHelper test', () => {
    xit('Test Authorize  method', function () {
        global.session = {
            custom: {}
        };
        global.request = {
            getLocale() {
                return {
                    slice() {
                        return {
                            toUpperCase() {
                                return 'en_US';
                            }
                        };
                    }
                };
            }
        };
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        currentCustomer.authenticated = true;
        vipDataHelper.handleVIPPayment(currentCustomer, order);

        var vipPaymentInstruments = order.getPaymentInstruments('VIP_POINTS').items[0];
        var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
        // eslint-disable-next-line no-unused-vars
        var BasketMgrObj = new BasketMgr();
        BasketMgr.setCurrentBasket(order);
        // eslint-disable-next-line new-cap
        var result = vipHooks.Authorize('123455677', vipPaymentInstruments);
        assert.equal(result.response.id, 'VHJhbnNhY3Rpb246Nzg1ZDM2MjYtZGEzNC00OTUyLWEwOTktY2U0OWQxMjA0ZTI0');
    });

    it('Test Handle method', function () {
        // eslint-disable-next-line new-cap
        var result = vipHooks.Handle();
        assert.equal(result.error, false);
    });

    it('Test processForm method', function () {
        // eslint-disable-next-line new-cap
        var result = vipHooks.processForm({});
        assert.equal(result.error, false);
    });

    it('Test reverseVipPoints  method', function () {
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        currentCustomer.authenticated = true;
        vipDataHelper.handleVIPPayment(currentCustomer, order);

        // eslint-disable-next-line new-cap
        var result = vipHooks.reverseVipPoints(order);
        assert.equal(result.response.transactionType, 'void_authorize');
    });

    it('Test reverseVipPoints  method', function () {
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        currentCustomer.authenticated = false;
        currentCustomer.profile = null;
        vipDataHelper.handleVIPPayment(currentCustomer, order);
    });

    it('Test removeVipPaymentInstruments  method', function () {
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        order.createPaymentInstrument('VIP_POINTS', new Money(20));
        var result = vipDataHelper.handleVIPPayment(currentCustomer, order);
        assert.isUndefined(result);
    });

    it('Test removeVipPaymentInstruments  method', function () {
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 94000;
        order.createPaymentInstrument('VIP_POINTS', new Money(20));
        var result = vipDataHelper.handleVIPPayment(currentCustomer, order);
        assert.isUndefined(result);
    });

    it('Test isOrderTotalRedeemedByVipPoints  method', function () {
        var result = vipDataHelper.isOrderTotalRedeemedByVipPoints(null);
        assert.isFalse(result);
    });

    it('Test handleVipPaymentMethod  method', function () {
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        currentCustomer.authenticated = true;
        currentCustomer.raw = {
            profile: {
                custom: {
                    vipAccountId: true
                }
            }
        };
        var result = vipDataHelper.isVIPCustomerOrder(currentCustomer, order);
        assert.equal(result, true);
    });

    xit('Test reverseVipPoints  method', function () {
        global.res = {
            setViewData: (viewData) =>{
                return viewData;
            }
        };
        class OrderModel {
            constructor() {}
        }
        class AccountModel {
            constructor() {}
        }
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        currentCustomer.authenticated = true;
        currentCustomer.raw = {
            profile: {
                custom: {
                    vipAccountId: true
                }
            }
        };
        var req = {
            session: {
                privacyCache: {
                    set: function () {
                        return '';
                    },
                    get: function () {
                        return '';
                    }
                }
            },
            locale: {
                id: 'someId'
            }
        };
        const vipDataHelper = proxyquire('../../../../cartridges/int_VIP/cartridge/scripts/vipDataHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/init/VIPCustomerService': new VIPCustomerServiceStub(),
            '~/cartridge/scripts/util/VIPAuthTokenHelper': VIPAuthTokenHelperStub,
            '~/cartridge/scripts/util/VIPCustomerHelper': new VIPCustomerHelperStub(),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper,
            'dw/system/HookMgr': require('../../../mocks/dw/dw_system_HookMgr'),
            'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                validateBillingForm: () => {
                    return {};
                },
                getRenderedPaymentInstruments: () => {
                    return 'VIP_POINTS';
                }
            },
            '*/cartridge/models/account': AccountModel,
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'server': {
                forms: {
                    getForm: () => {
                        return {
                            addressFields: {
                                firstName: { value: 'firstName' },
                                lastName: { value: 'lastName' },
                                address1: { value: 'address1' },
                                address2: { value: 'address2' },
                                city: { value: 'city' },
                                postalCode: { value: 'postalCode' },
                                country: { value: 'country' },
                                states: { stateCode: { value: 'AT' } }
                            },
                            creditCardFields: { email: { value: 'test@gmail.com' } }
                        };
                    }
                }
            }
        });
        var result = vipDataHelper.handleVipPaymentMethod(req, global.res);
        assert.isNotNull(result);
        assert.isDefined(result.customer);
        assert.isDefined(result.form);
    });

    xit('Test handleVipPaymentMethod  method', function () {
        global.res = {
            setViewData: (viewData) =>{
                return viewData;
            }
        };
        class OrderModel {
            constructor() {}
        }
        class AccountModel {
            constructor() {}
        }
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        
        var req = {
            session: {
                privacyCache: {
                    set: function () {
                        return '';
                    },
                    get: function () {
                        return true;
                    }
                }
            },
            locale: {
                id: 'someId'
            }
        };
        const vipDataHelper = proxyquire('../../../../cartridges/int_VIP/cartridge/scripts/vipDataHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/init/VIPCustomerService': new VIPCustomerServiceStub(),
            '~/cartridge/scripts/util/VIPAuthTokenHelper': VIPAuthTokenHelperStub,
            '~/cartridge/scripts/util/VIPCustomerHelper': new VIPCustomerHelperStub(),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                validateBillingForm: () => {
                    return {};
                },
                getRenderedPaymentInstruments: () => {
                    return 'VIP_POINTS';
                }
            },
            '*/cartridge/models/account': AccountModel,
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        billingAddress: null,
                        createBillingAddress: () => {
                            return {
                                setFirstName() {},
                                setLastName() {},
                                setAddress1() {},
                                setAddress2() {},
                                setCity() {},
                                setPostalCode() {},
                                setCountryCode() {},
                                setStateCode() {}
                            };
                        },
                        setCustomerEmail: (parmas) => {
                            return parmas;
                        },
                        shipments: {
                            length: 1
                        }
                    };
                }
            },
            'server': {
                forms: {
                    getForm: () => {
                        return {
                            addressFields: {
                                firstName: { value: 'firstName' },
                                lastName: { value: 'lastName' },
                                address1: { value: 'address1' },
                                address2: { value: 'address2' },
                                city: { value: 'city' },
                                postalCode: { value: 'postalCode' },
                                country: { value: 'country' },
                                states: { stateCode: { value: 'AT' } }
                            },
                            creditCardFields: { email: { value: 'test@gmail.com' } }
                        };
                    }
                }
            }
        });
        var result = vipDataHelper.handleVipPaymentMethod(req, global.res);
        assert.isNotNull(result);
        assert.isDefined(result.customer);
        assert.isDefined(result.form);
    });

    xit('Test handleVipPaymentMethod  method', function () {
        global.res = {
            setViewData: (viewData) =>{
                return viewData;
            }
        };
        class OrderModel {
            constructor() {}
        }
        class AccountModel {
            constructor() {}
        }
        var order = new LineItemCtnr();
        order.totalGrossPrice.value = 50;
        
        var req = {
            session: {
                privacyCache: {
                    set: function () {
                        return '';
                    },
                    get: function () {
                        return true;
                    }
                }
            },
            locale: {
                id: 'someId'
            }
        };
        class VIPAuthTokenHelperStubs {
            constructor() {}
            getValidToken() { return null; }
        }
        const vipDataHelper = proxyquire('../../../../cartridges/int_VIP/cartridge/scripts/vipDataHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/init/VIPCustomerService': new VIPCustomerServiceStub(),
            '~/cartridge/scripts/util/VIPAuthTokenHelper': VIPAuthTokenHelperStubs,
            '~/cartridge/scripts/util/VIPCustomerHelper': new VIPCustomerHelperStub(),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345',
                        error: true
                    };
                }
            },
            'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                validateBillingForm: () => {
                    return {};
                },
                getRenderedPaymentInstruments: () => {
                    return 'VIP_POINTS';
                }
            },
            '*/cartridge/models/account': AccountModel,
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        billingAddress: null,
                        createBillingAddress: () => {
                            return {
                                setFirstName() {},
                                setLastName() {},
                                setAddress1() {},
                                setAddress2() {},
                                setCity() {},
                                setPostalCode() {},
                                setCountryCode() {},
                                setStateCode() {}
                            };
                        },
                        setCustomerEmail: (parmas) => {
                            return parmas;
                        },
                        shipments: {
                            length: 1
                        }
                    };
                }
            },
            'server': {
                forms: {
                    getForm: () => {
                        return {
                            addressFields: {
                                firstName: { value: 'firstName' },
                                lastName: { value: 'lastName' },
                                address1: { value: 'address1' },
                                address2: { value: 'address2' },
                                city: { value: 'city' },
                                postalCode: { value: 'postalCode' },
                                country: { value: 'country' },
                                states: { stateCode: { value: 'AT' } }
                            },
                            creditCardFields: { email: { value: 'test@gmail.com' } }
                        };
                    }
                }
            }
        });
        var result = vipDataHelper.handleVipPaymentMethod(req, global.res);
        assert.equal(result.error, true);
        assert.isDefined(result.fieldErrors);
        assert.isDefined(result.serverErrors);
        result = vipDataHelper.checkBalance('321090');
        assert.equal(result, null);
    });
});