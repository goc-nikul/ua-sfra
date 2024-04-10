'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Order = require('../../../mocks/dw/dw_order_Order');
const assert = require('chai').assert;
const sinon = require('sinon');

describe('int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers.js test', () => {
    global.empty = (data) => {
        return !data;
    };

    it('rejectCancelledOrderCoupons() can reject all coupons in a CANCELLED order', () => {
        const mockLoyaltyHelperStub = {
            // eslint-disable-next-line no-unused-vars
            rejectReward: sinon.spy((code) => { return true; })
        };

        const loyaltyOrderHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelperStub,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
        });

        const mockOrder = new Order();
        mockOrder.status = { value: Order.ORDER_STATUS_CANCELLED };
        mockOrder.custom.customerGroups = 'Everyone,Loyalty,Registered';
        mockOrder.couponLineItems = [
            {
                couponCode: 'LYLD-0000-0000-0000'
            },
            {
                couponCode: 'LYLD-1111-1111-1111'
            },
            {
                couponCode: 'XYZA-1234-1234-1234'
            }
        ];
        const res = loyaltyOrderHelpers.rejectCancelledOrderCoupons(mockOrder);
        assert.isTrue(res);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.withArgs('LYLD-0000-0000-0000').calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.withArgs('LYLD-1111-1111-1111').calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.calledTwice);
    });

    it('processLoyaltyOrder() can fail order with invalid coupons', () => {
        const mockLoyaltyHelperStub = {
            // eslint-disable-next-line no-unused-vars
            rejectReward: sinon.spy((code) => { return true; }),
            updateBasketBallance: sinon.spy(() => { return true; }),
            getLoyaltyCouponsFromLineItemCtnr: sinon.spy(() => { return ['LYLD-0000-0000-0000', 'LYLD-1111-1111-1111']; }),
            updateCoupon: sinon.spy(() => {
                return {
                    ok: true,
                    object: {
                        couponUpdated: false
                    }
                };
            })
        };

        const loyaltyOrderHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelperStub,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
        });

        const mockOrder = new Order();
        mockOrder.status = Order.ORDER_STATUS_NEW;
        mockOrder.exportStatus = Order.EXPORT_STATUS_READY;
        mockOrder.custom.customerGroups = 'Everyone,Loyalty,Registered';
        mockOrder.couponLineItems = [
            {
                couponCode: 'LYLD-0000-0000-0000'
            },
            {
                couponCode: 'LYLD-1111-1111-1111'
            },
            {
                couponCode: 'XYZA-1234-1234-1234'
            }
        ];
        const res = loyaltyOrderHelpers.processLoyaltyOrder(mockOrder);
        assert.isFalse(res);
        assert.isTrue(mockOrder.status.value === Order.ORDER_STATUS_CANCELLED);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.withArgs('LYLD-0000-0000-0000').calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.withArgs('LYLD-1111-1111-1111').calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.calledTwice);
    });

    it('processLoyaltyOrder() can handle valid coupon order', () => {
        const mockLoyaltyHelperStub = {
            // eslint-disable-next-line no-unused-vars
            rejectReward: sinon.spy((code) => { return true; }),
            updateBasketBallance: sinon.spy(() => { return true; }),
            getLoyaltyCouponsFromLineItemCtnr: sinon.spy(() => { return ['LYLD-0000-0000-0000', 'LYLD-1111-1111-1111']; }),
            updateCoupon: sinon.spy(() => {
                return {
                    ok: true,
                    object: {
                        couponUpdated: true
                    }
                };
            })
        };

        const loyaltyOrderHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelperStub,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
        });

        const mockOrder = new Order();
        mockOrder.status = Order.ORDER_STATUS_NEW;
        mockOrder.exportStatus = Order.EXPORT_STATUS_READY;
        mockOrder.custom.customerGroups = 'Everyone,Loyalty,Registered';
        mockOrder.couponLineItems = [
            {
                couponCode: 'LYLD-0000-0000-0000'
            },
            {
                couponCode: 'LYLD-1111-1111-1111'
            },
            {
                couponCode: 'XYZA-1234-1234-1234'
            }
        ];
        const res = loyaltyOrderHelpers.processLoyaltyOrder(mockOrder);
        assert.isTrue(res);
        assert.isTrue(mockOrder.status === Order.ORDER_STATUS_NEW);
        assert.isTrue(mockLoyaltyHelperStub.updateCoupon.calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.updateBasketBallance.calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.notCalled);
    });

    it('processLoyaltyOrder() can set order retry flags when service is not OK', () => {
        const mockLoyaltyHelperStub = {
            // eslint-disable-next-line no-unused-vars
            rejectReward: sinon.spy((code) => { return true; }),
            updateBasketBallance: sinon.spy(() => { return true; }),
            getLoyaltyCouponsFromLineItemCtnr: sinon.spy(() => { return ['LYLD-0000-0000-0000']; }),
            updateCoupon: sinon.spy(() => {
                return {
                    ok: false,
                    object: {
                        couponUpdated: false
                    }
                };
            })
        };

        const loyaltyOrderHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelperStub,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
        });

        const mockOrder = new Order();
        mockOrder.status = Order.ORDER_STATUS_NEW;
        mockOrder.exportStatus = Order.EXPORT_STATUS_READY;
        mockOrder.custom.customerGroups = 'Everyone,Loyalty,Registered';
        mockOrder.couponLineItems = [
            {
                couponCode: 'LYLD-0000-0000-0000'
            }
        ];
        const res = loyaltyOrderHelpers.processLoyaltyOrder(mockOrder);
        assert.isTrue(res);
        assert.isTrue(mockOrder.status === Order.ORDER_STATUS_NEW);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.notCalled);
        assert.isTrue(mockLoyaltyHelperStub.updateBasketBallance.calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.updateCoupon.calledOnce);
        assert.equal(mockOrder.custom.loyaltyCouponNotUpdated, true);
        assert.equal(mockOrder.custom.loyaltyCouponUpdateRetries, 0);
    });

    it('processLoyaltyOrder() can handle a loyalty order with no loyalty coupons (estimates only)', () => {
        const mockLoyaltyHelperStub = {
            // eslint-disable-next-line no-unused-vars
            rejectReward: sinon.spy((code) => { return true; }),
            updateBasketBallance: sinon.spy(() => { return true; }),
            getLoyaltyCouponsFromLineItemCtnr: sinon.spy(() => { return []; }),
            updateCoupon: sinon.spy(() => { })
        };

        const loyaltyOrderHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelperStub,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
        });

        const mockOrder = new Order();
        mockOrder.status = Order.ORDER_STATUS_NEW;
        mockOrder.exportStatus = Order.EXPORT_STATUS_READY;
        mockOrder.custom.customerGroups = 'Everyone,Loyalty,Registered';
        mockOrder.couponLineItems = [
            {
                couponCode: 'XYZA-1234-1234-1234'
            }
        ];
        const res = loyaltyOrderHelpers.processLoyaltyOrder(mockOrder);
        assert.isTrue(res);
        assert.isTrue(mockOrder.status === Order.ORDER_STATUS_NEW);
        assert.isTrue(mockLoyaltyHelperStub.updateBasketBallance.calledOnce);
        assert.isTrue(mockLoyaltyHelperStub.updateCoupon.notCalled);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.notCalled);
    });

    it('processLoyaltyOrder() can handle / skip non-loyalty order', () => {
        const mockLoyaltyHelperStub = {
            // eslint-disable-next-line no-unused-vars
            rejectReward: sinon.spy((code) => { return true; }),
            updateBasketBallance: sinon.spy(() => { return true; }),
            getLoyaltyCouponsFromLineItemCtnr: sinon.spy(() => { return []; }),
            updateCoupon: sinon.spy(() => { })
        };

        const loyaltyOrderHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyOrderHelpers', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelperStub,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
        });

        const mockOrder = new Order();
        mockOrder.status = Order.ORDER_STATUS_NEW;
        mockOrder.exportStatus = Order.EXPORT_STATUS_READY;
        mockOrder.custom.customerGroups = 'Everyone,Registered';
        mockOrder.couponLineItems = [
            {
                couponCode: 'XYZA-1234-1234-1234'
            }
        ];
        const res = loyaltyOrderHelpers.processLoyaltyOrder(mockOrder);
        assert.isTrue(res);
        assert.isTrue(mockOrder.status === Order.ORDER_STATUS_NEW);
        assert.isTrue(mockLoyaltyHelperStub.updateBasketBallance.notCalled);
        assert.isTrue(mockLoyaltyHelperStub.updateCoupon.notCalled);
        assert.isTrue(mockLoyaltyHelperStub.rejectReward.notCalled);
    });
});
