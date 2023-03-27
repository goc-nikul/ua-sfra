'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');

global.session = {
    forms: {}
};
describe('app_ua_core/cartridge/scripts/checkout/paypalHelpers test', () => {
    let paypalHelpers = require('../../../mocks/scripts/checkout/paypalHelpers');
    global.customer = new Customer();
    global.customer.getProfile = function () {
        return {
            getEmail: function () {
                return 'test@test.com';
            }
        };
    };
    var req = {
        session: {
            privacyCache: {
                set: function () {
                    return '';
                }
            }
        },
        locale: {
            id: 'someId'
        }
    };

    it('Testing method: hanldePaypalCallback', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var res = {
            setViewData: function (data) {
                return data;
            }
        };
        global.session.forms = {
            billing: {
                paypal: {
                    useCustomerBillingAgreement: {
                        checked: true
                    }
                }
            }
        };
        let result = paypalHelpers.hanldePaypalCallback(req, res);
        assert.equal(result.paypalProcessorResult.isCalled, true);
    });
    it('Testing method: getPaypalResponse', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var res = {
            setViewData: function (data) {
                return data;
            }
        };
        let result = paypalHelpers.getPaypalResponse(req, res);
        assert.equal(result.error, false);
    });

    it('Testing method: hanldePaypalCallback -> billing address is null', () => {
        paypalHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/paypalHelpers', {
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                validateBillingForm: function () {
                    return [];
                },
                validateCreditCard: function () {
                    return {};
                },
                getRenderedPaymentInstruments: function () {
                    return {};
                }
            },
            '*/cartridge/models/account': function () {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'server': {
                forms: {
                    getForm: function () {
                        return {
                            paymentMethod: {
                                value: 'TestID'
                            },
                            addressFields: {
                                firstName: {
                                    value: 'John'
                                },
                                lastName: {
                                    value: 'John'
                                },
                                address1: {
                                    value: '1 microsoft way'
                                },
                                address2: {
                                    value: ''
                                },
                                city: {
                                    value: 'Redmond'
                                },
                                postalCode: {
                                    value: '98052'
                                },
                                country: {
                                    value: 'US'
                                },
                                states: {
                                    stateCode: {
                                        value: 'WA'
                                    }
                                }
                            },
                            creditCardFields: {
                                email: {
                                    value: 'test@test.com'
                                }
                            }
                        };
                    }
                }
            },
            '*/cartridge/models/order': function () {},
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
            'dw/system/HookMgr': {
                hasHook: function () {
                    return {};
                },
                callHook: function () {
                    return {
                        error: true,
                        paypalBillingAgreementNotActaual: {},
                        isCalled: true
                    };
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
        var basket = new LineItemCtnr();
        basket.billingAddress = null;
        basket.createBillingAddress = function () {
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
        };
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var res = {
            setViewData: function (data) {
                return data;
            }
        };
        global.session.forms = {
            billing: {
                paypal: {
                    useCustomerBillingAgreement: {
                        checked: true
                    }
                }
            }
        };
        let result = paypalHelpers.hanldePaypalCallback(req, res);
        assert.equal(result.cartError, true);
    });
    it('Testing method: hanldePaypalCallback -> billingFormErrors', () => {
        paypalHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/paypalHelpers', {
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                validateBillingForm: function () {
                    return [{}];
                },
                validateCreditCard: function () {
                    return {};
                },
                getRenderedPaymentInstruments: function () {
                    return {};
                }
            },
            '*/cartridge/models/account': function () {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'server': {
                forms: {
                    getForm: function () {
                        return {
                            paymentMethod: {
                                value: 'TestID'
                            },
                            addressFields: {
                                firstName: {
                                    value: 'John'
                                },
                                lastName: {
                                    value: 'John'
                                },
                                address1: {
                                    value: '1 microsoft way'
                                },
                                address2: {
                                    value: ''
                                },
                                city: {
                                    value: 'Redmond'
                                },
                                postalCode: {
                                    value: '98052'
                                },
                                country: {
                                    value: 'US'
                                },
                                states: {
                                    stateCode: {
                                        value: 'WA'
                                    }
                                }
                            },
                            creditCardFields: {
                                email: {
                                    value: 'test@test.com'
                                }
                            }
                        };
                    }
                }
            },
            '*/cartridge/models/order': function () {},
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
            'dw/system/HookMgr': require('../../../mocks/dw/dw_system_HookMgr'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var res = {
            setViewData: function (data) {
                return data;
            }
        };
        global.session.forms = {
            billing: {
                paypal: {
                    useCustomerBillingAgreement: {
                        checked: true
                    }
                }
            }
        };
        let result = paypalHelpers.hanldePaypalCallback(req, res);
        assert.equal(result.error, true);
    });
});
