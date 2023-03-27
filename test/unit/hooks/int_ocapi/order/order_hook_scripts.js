'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

var handlePaymentsStub = sinon.stub();
var pendingKlarnaOrderStub = sinon.stub();
var providerStub = sinon.stub();
var getEGiftCardLineItems = sinon.stub();
var placeOrder = sinon.stub();
var valueStub = sinon.stub();
var updateCouponStub = sinon.stub();
var currentBasketStub = sinon.stub();
var basketHasGCPaymentInstrument = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/order/order_hook_scripts.js', () => {
    var OrderExportUtilsMock = require('../../../scripts/mao/OrderExportUtilsMock');
    var collections = require('../../../../mocks/util/collections');
    var Maoconstants = OrderExportUtilsMock.Maoconstants;
    var orderHookScripts = proxyquire('.././../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/order_hook_scripts.js', {
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            setStoreInProductLineItem: () => null,
            basketHasOnlyBOPISProducts: () => false,
            basketHasInStorePickUpShipment: () => true

        },
        '*/cartridge/scripts/MaoConstants': Maoconstants,
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: () => ''
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/order/BasketMgr': {
            getCurrentBasket: currentBasketStub
        },
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: () => false
        },
        '*/cartridge/scripts/giftcard/hooks/giftcardsHooks': {
            reverseGiftCardsAmount: () => ''
        },
        '*/cartridge/scripts/vipDataHelpers': {
            isVIPOrder: () => true
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            handlePayments: handlePaymentsStub,
            sendConfirmationEmail: () => true,
            handlePendingKlarnaOrder: pendingKlarnaOrderStub,
            placeOrder: placeOrder,
            failOrder: () => true,
            sendFraudNotificationEmail: () => ''
        },
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            getEGiftCardLineItems: getEGiftCardLineItems,
            basketHasGCPaymentInstrument: basketHasGCPaymentInstrument,
            basketHasGiftCardItems: () => {
                return {
                    eGiftCards: true
                };
            }
        },
        '*/cartridge/scripts/vip/hooks/vipHooks': {
            reverseVipPoints: () => ''
        },
        'int_paymetric/cartridge/scripts/util/paymetricXiPayHelper': {
            doVoidAuthorization: () => ''
        },
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/HookMgr': require('../../../../mocks/dw/dw_system_HookMgr'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/util/SetOrderStatus': {
            setCustomerName: () => '',
            setOrderType: () => '',
            setEmployeeOrder: () => ''
        },
        '*/cartridge/modules/providers': {
            get: providerStub
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getValue: valueStub
        },
        '*/cartridge/scripts/helpers/loyaltyHelper': {
            estimate: () => '',
            getLoyaltyCouponsFromLineItemCtnr: () => 'bcd',
            updateCoupon: updateCouponStub,
            updateBasketBallance: () => 'bcd'
        }
    });

    if (!global.request) global.request = {};
    if (!global.session) global.session = {};
    if (!global.customer) global.customer = {};
    global.empty = (params) => !params;

    it('Testing method: afterPOST', () => {
        global.session.custom = {
            customerCountry: null
        };
        global.request.getLocale = () => 'US';
        global.request.locale = {
            id: 'US'
        };
        var order = new (require('../../../../mocks/dw/dw_order_Order'))();
        order.customer.customerGroups = [];
        handlePaymentsStub.returns({
            error: false
        });
        order.shipments.toArray()[0].productLineItems = [order.shipments.toArray()[0].productLineItems.toArray()];
        order.getCustom = () => {
            return {
                onHold: true
            };
        };
        pendingKlarnaOrderStub.returns({
            error: false
        });
        providerStub.returns({
            handleReadyForExport: () => '',
            validate: () => 'accept'
        });
        assert.doesNotThrow(() => orderHookScripts.afterPOST(order));

        order.getCustom = () => {
            return {
                onHold: false
            };
        };
        getEGiftCardLineItems.returns([{}]);
        placeOrder.returns({
            error: false
        });
        valueStub.returns(true);
        global.customer = {
            isMemberOfCustomerGroup: () => true,
            isAuthenticated: () => true
        };
        updateCouponStub.returns({
            ok: true,
            object: {
                couponUpdated: true
            }
        });
        assert.doesNotThrow(() => orderHookScripts.afterPOST(order));

        updateCouponStub.returns({
            ok: false
        });
        assert.doesNotThrow(() => orderHookScripts.afterPOST(order));

        providerStub.returns({
            handleReadyForExport: () => '',
            validate: () => 'review'
        });
        assert.doesNotThrow(() => orderHookScripts.afterPOST(order));

        providerStub.returns({
            handleReadyForExport: () => '',
            validate: () => 'reject'
        });
        currentBasketStub.returns({});
        basketHasGCPaymentInstrument.returns(true);
        assert.doesNotThrow(() => orderHookScripts.afterPOST(order));

        handlePaymentsStub.returns({
            error: true
        });
        assert.doesNotThrow(() => orderHookScripts.afterPOST(order));

        handlePaymentsStub.resetBehavior();
        pendingKlarnaOrderStub.resetBehavior();
        providerStub.resetBehavior();
        getEGiftCardLineItems.resetBehavior();
        placeOrder.resetBehavior();
        valueStub.resetBehavior();
        updateCouponStub.resetBehavior();
        currentBasketStub.resetBehavior();
        basketHasGCPaymentInstrument.resetBehavior();
    });


    it('Testing method: modifyPOSTResponse', () => {
        var order = new (require('../../../../mocks/dw/dw_order_Order'))();
        order.custom.maoOrderType = {
            value: false
        };
        assert.doesNotThrow(() => orderHookScripts.modifyPOSTResponse(order));
        order.custom.maoOrderType = {
            value: true
        };
        var orderResponse = {
            c_merchandise_total_price: 0
        };
        order.getMerchandizeTotalPrice = () => {
            return {
                getValue: () => 10
            };
        };
        assert.doesNotThrow(() => orderHookScripts.modifyPOSTResponse(order, orderResponse));
    });

    it('Testing method: modifyPATCHResponse', () => {
        var order = new (require('../../../../mocks/dw/dw_order_Order'))();
        var orderResponse = {
            c_merchandise_total_price: 0
        };
        order.getMerchandizeTotalPrice = () => {
            return {
                getValue: () => 10
            };
        };
        assert.doesNotThrow(() => orderHookScripts.modifyPATCHResponse(order, orderResponse));
    });

    it('Testing method: modifyGETResponse', () => {
        var order = new (require('../../../../mocks/dw/dw_order_Order'))();
        var orderResponse = {
            c_merchandise_total_price: 0
        };
        order.getMerchandizeTotalPrice = () => {
            return {
                getValue: () => 10
            };
        };
        assert.doesNotThrow(() => orderHookScripts.modifyGETResponse(order, orderResponse));
    });

    it('Testing method: modifyPUTResponse', () => {
        var order = new (require('../../../../mocks/dw/dw_order_Order'))();
        var orderResponse = {
            c_merchandise_total_price: 0
        };
        order.getMerchandizeTotalPrice = () => {
            return {
                getValue: () => 10
            };
        };
        assert.doesNotThrow(() => orderHookScripts.modifyPUTResponse(order, orderResponse));
    });
});
