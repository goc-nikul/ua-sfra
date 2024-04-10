'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Order = require('../../../../mocks/dw/dw_order_Order');
const assert = require('chai').assert;
const sinon = require('sinon');

describe('int_loyalty/cartridge/scripts/jobs/UpdateCouponStatus.js test', () => {
    const mockOrderMgr = require('../../../../mocks/dw/dw_order_OrderMgr');
    mockOrderMgr.processOrders = sinon.spy(() => { });

    const updateCouponStatusJobStep = proxyquire('../../../../../cartridges/int_loyalty/cartridge/scripts/jobs/UpdateCouponStatus', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/order/OrderMgr': mockOrderMgr,
        'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'int_loyalty/cartridge/scripts/helpers/loyaltyHelper': {}
    });

    beforeEach(() => {
        mockOrderMgr.processOrders.reset();
    });

    it('executes without arguments (default params)', () => {
        updateCouponStatusJobStep.execute();
        const query = 'exportStatus = {0} AND custom.loyaltyCouponUpdateRetries < {1} AND custom.loyaltyCouponNotUpdated = true'
        var args = mockOrderMgr.processOrders.args[0];
        assert(mockOrderMgr.processOrders.calledOnce);
        assert.equal(args[1], query);
        assert.equal(args[2], Order.EXPORT_STATUS_EXPORTED);
        assert.equal(args[3], 5);
    });

    it('executes with argument, retriesLimit', () => {
        const params = {
            retriesLimit: 10
        };
        updateCouponStatusJobStep.execute(params);
        const query = 'exportStatus = {0} AND custom.loyaltyCouponUpdateRetries < {1} AND custom.loyaltyCouponNotUpdated = true'
        var args = mockOrderMgr.processOrders.args[0];
        assert(mockOrderMgr.processOrders.calledOnce);
        assert.equal(args[1], query);
        assert.equal(args[2], Order.EXPORT_STATUS_EXPORTED);
        assert.equal(args[3], 10);
    });

    it('executes with startDate and endDate parameters', () => {
        const params = {
            retriesLimit: 10,
            startDate: '4/24/2023',
            endDate: '4/26/2023'
        };
        updateCouponStatusJobStep.execute(params);
        const query = 'exportStatus = {0} AND custom.loyaltyCouponUpdateRetries < {1} AND custom.loyaltyCouponNotUpdated = true AND creationDate >= {2} AND creationDate <= {3}'
        var args = mockOrderMgr.processOrders.args[0];
        assert(mockOrderMgr.processOrders.calledOnce);
        assert.equal(args[1], query);
        assert.equal(args[2], Order.EXPORT_STATUS_EXPORTED);
        assert.equal(args[3], 10);
        assert.equal(new Date(args[4]).getDate(), new Date('4/24/2023').getDate());
        assert.equal(new Date(args[5]).getDate(), new Date('4/26/2023').getDate());
    });


});

describe('int_loyalty/cartridge/scripts/jobs/UpdateCouponStatus.js processes order', () => {
    global.empty = (data) => {
        return !data;
    };

    it('processOrderCallback updates order with successful response', () => {
        const mockLoyaltyHelper = {
            getLoyaltyCouponsFromLineItemCtnr: () => { return ['LYLD-0000-0000-0000']; },
            updateCoupon: sinon.spy((coupons, customerNo) => {
                return {
                    ok: true,
                    object: {
                        couponUpdated: true
                    }
                };
            })
        };

        mockLoyaltyHelper.updateCoupon.reset();
        let mockOrder = new Order();
        mockOrder.orderNo = 'order-1234';
        mockOrder.customerNo = 'customer-1234';
        mockOrder.custom.loyaltyCouponNotUpdated = true;
        mockOrder.custom.loyaltyCouponUpdateRetries = 0;

        const updateCouponStatusJobStep = proxyquire('../../../../../cartridges/int_loyalty/cartridge/scripts/jobs/UpdateCouponStatus', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'int_loyalty/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelper
        });
        updateCouponStatusJobStep.processOrderCallback(mockOrder);
        assert(mockLoyaltyHelper.updateCoupon.withArgs(['LYLD-0000-0000-0000'], 'customer-1234').calledOnce);
        assert.isFalse(mockOrder.custom.loyaltyCouponNotUpdated);
    });


    it('processOrderCallback updates order when coupons not updated', () => {
        const mockLoyaltyHelper = {
            getLoyaltyCouponsFromLineItemCtnr: () => { return ['LYLD-0000-0000-0000']; },
            updateCoupon: sinon.spy((coupons, customerNo) => {
                return {
                    ok: true,
                    object: {
                        couponUpdated: false
                    }
                };
            })
        };

        mockLoyaltyHelper.updateCoupon.reset();
        let mockOrder = new Order();
        mockOrder.orderNo = 'order-1234';
        mockOrder.customerNo = 'customer-1234';
        mockOrder.custom.loyaltyCouponNotUpdated = true;
        mockOrder.custom.loyaltyCouponUpdateRetries = 0;

        const updateCouponStatusJobStep = proxyquire('../../../../../cartridges/int_loyalty/cartridge/scripts/jobs/UpdateCouponStatus', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'int_loyalty/cartridge/scripts/helpers/loyaltyHelper': mockLoyaltyHelper
        });
        updateCouponStatusJobStep.processOrderCallback(mockOrder);
        assert(mockLoyaltyHelper.updateCoupon.withArgs(['LYLD-0000-0000-0000'], 'customer-1234').calledOnce);
        assert.isTrue(mockOrder.custom.loyaltyCouponNotUpdated);
        assert.equal(mockOrder.custom.loyaltyCouponUpdateRetries, 1);
    });
});
