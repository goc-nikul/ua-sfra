'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_memberson/cartridge/scripts/checkout/checkoutHelpers', () => {
    it('Testing method: createOrder if order number is null and current basket is null', () => {
        var checkoutHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            'dw/order/OrderMgr': require('../../../../../../mocks/dw/dw_order_OrderMgr'),
            'app_ua_apac/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/helpers/membersonHelpers': {}
        });
        var orderNo = null;
        var currentBasket = null;
        assert.doesNotThrow(() => checkoutHelpers.createOrder(currentBasket, orderNo));
    });

    it('Testting method: createOrder if order number is not null and utilizeMemberVoucher status!=OK', () => {
        var checkoutHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false,
                        membersonEnabled: true,
                        ecommLocation: true,
                        status: '',
                        errorMessage: '{"ErrorCode":4109}'
                    };
                }
            },
            'dw/order/OrderMgr': require('../../../../../../mocks/dw/dw_order_OrderMgr'),
            'app_ua_apac/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/helpers/membersonHelpers': {
                checkIfMembersonCouponApplied: function () {
                    return true;
                }
            }
        });

        var currentBasket = {
            custom: {
                'Loyalty-VoucherName': 'test=001'
            },
            getCouponLineItem: function () {
                return 'testCoupon';
            }
        };
        var orderNo = '001';
        session.custom.currentCountry = 'US';
        session.custom.membersonOrderFailedError = 'test';
        assert.doesNotThrow(() => checkoutHelpers.createOrder(currentBasket, orderNo));
    });

    it('Testing method: createOrder if order number is not null and utilizeMemberVoucher status===OK and customer is authenticated', () => {
        var checkoutHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false,
                        membersonEnabled: true,
                        ecommLocation: true,
                        status: 'OK'
                    };
                }
            },
            'dw/order/OrderMgr': require('../../../../../../mocks/dw/dw_order_OrderMgr'),
            'app_ua_apac/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/helpers/membersonHelpers': {
                checkIfMembersonCouponApplied: function () {
                    return true;
                }
            }
        });
        var currentBasket = {
            customer: {
                authenticated: true,
                getProfile: function () {
                    return {
                        custom: {
                            'Loyalty-ID': 'test001'
                        }
                    };
                }
            },
            custom: {
                'Loyalty-VoucherName': 'test=001'
            }

        };
        var orderNo = '001';
        session.custom.currentCountry = 'US';
        assert.doesNotThrow(() => checkoutHelpers.createOrder(currentBasket, orderNo));
    });

    it('Testing method: createOrder if order number is not null and Loyalty-VoucherName attribute is not present', () => {
        var checkoutHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false,
                        membersonEnabled: true
                    };
                }
            },
            'dw/order/OrderMgr': require('../../../../../../mocks/dw/dw_order_OrderMgr'),
            'app_ua_apac/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/helpers/membersonHelpers': {
                checkIfMembersonCouponApplied: function () {
                    return true;
                }
            }
        });
        var currentBasket = {
            custom: {}
        };
        var orderNo = '001';
        session.custom.currentCountry = 'US';
        assert.doesNotThrow(() => checkoutHelpers.createOrder(currentBasket, orderNo));
    });
});

