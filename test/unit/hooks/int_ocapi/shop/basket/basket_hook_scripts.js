'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

var callHookStub = sinon.stub();
var replaceDummyGiftLineItemStub = sinon.stub();
var ensureAllShipmentsHaveMethodStub = sinon.stub();
var shippingAddressValidStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/basket/basket_hook_scripts.js', () => {
    var basketHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/basket_hook_scripts.js', {
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
        'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
        '~/cartridge/scripts/basketHelper': {
            updateResponse: () => 'updateResponse',
            updateShippingAddressToGiftCardShipment: () => '',
            updateAddressType: () => '',
            manageKlarnaSession: () => '',
            getRealTimeInventory: () => 10,
            setInventoryRecord: () => '',
            replaceDummyGiftLineItem: replaceDummyGiftLineItemStub,
            updatePaypalTokenExpirationTime: () => '',
            updateShippingEstimatedDeliveryDate: () => '',
            isShippingAddressValid: shippingAddressValidStub
        },
        '*/cartridge/scripts/util/collections': {
            forEach: (array, callback) => {
                callback(array.get(0));
            }
        },
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            updateGiftCardShipments: () => ''
        },
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: () => ''
        },
        'dw/system/HookMgr': {
            callHook: callHookStub
        },
        'dw/campaign/AmountDiscount': {},
        '*/cartridge/scripts/cart/cartHelpers': {
            ensureAllShipmentsHaveMethods: ensureAllShipmentsHaveMethodStub
        },
        '~/cartridge/scripts/paymentHelper': {
            autoAdjustBasketPaymentInstruments: () => ''
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getValue: () => true,
            getJsonValue: (value) => value
        },
        'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/helpers/loyaltyHelper': {
            estimate: () => '',
            checkCustomerReconcile: () => ''
        },
        '*/cartridge/scripts/paypal/processor': {
            handle: () => {
                return {
                    error: false
                };
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            isHALEnabledForShopApp: () => false,
            setEmptyShippingAddressFields: () => ''
        },
        'int_IDME/cartridge/scripts/util/IDMEServiceHelper.js': {
            requestValidationStatus: () => {
                return 'ABCD';
            }
        },
        '*/cartridge/scripts/basketHelper': {
            updateResponse: () => 'updateResponse',
            updateShippingAddressToGiftCardShipment: () => '',
            updateAddressType: () => '',
            manageKlarnaSession: () => '',
            getRealTimeInventory: () => 10,
            setInventoryRecord: () => '',
            replaceDummyGiftLineItem: replaceDummyGiftLineItemStub,
            updatePaypalTokenExpirationTime: () => '',
            updateShippingEstimatedDeliveryDate: () => '',
            isShippingAddressValid: shippingAddressValidStub
        },
        '*/cartridge/scripts/checkout/shippingHelpers': {
            getApplicableShippingMethods: function () {
                return [{ id: 'test1' }];
            }
        }
    });

    global.empty = (params) => !params;

    it('Testing method: modifyPOSTResponse', () => {
        assert.equal(basketHookScripts.modifyPOSTResponse(), 'updateResponse');
    });

    it('Testing method: modifyPATCHResponse', () => {
        assert.equal(basketHookScripts.modifyPATCHResponse(), 'updateResponse');
    });

    it('Testing method: modifyGETResponse', () => {
        assert.equal(basketHookScripts.modifyGETResponse(), 'updateResponse');
    });

    it('Testing method: modifyPUTResponse', () => {
        assert.equal(basketHookScripts.modifyPUTResponse(), 'updateResponse');
    });

    it('Testing method: modifyDELETEResponse', () => {
        assert.equal(basketHookScripts.modifyDELETEResponse(), 'updateResponse');
    });

    it('Testing method: afterPUT', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var shipment = new (require('../../../../../mocks/dw/dw_order_Shipment'))();
        callHookStub.returns(null);
        assert.doesNotThrow(() => basketHookScripts.afterPUT(basket, shipment));
        callHookStub.throws(new Error(''));
        assert.doesNotThrow(() => basketHookScripts.afterPUT(basket, shipment));
        callHookStub.resetBehavior();
    });

    it('Testing method: beforePOST --> Test Custom Exception', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var items = [JSON.stringify({
            product_item: {
                product_id: 'dummyProductId'
            }
        })];
        replaceDummyGiftLineItemStub.throws(new Error('test'));
        basketHookScripts.beforePOST(basket, items);
        replaceDummyGiftLineItemStub.resetBehavior();
    });

    it('Testing method: beforePOST without error', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var items = [JSON.stringify({
            product_item: {
                product_id: 'dummyProductId'
            }
        })];
        var obj = {};
        basket.custom = {
            lineItemPriceAdjustments: [JSON.stringify(obj)]
        };
        basketHookScripts.beforePOST(basket, items);
        replaceDummyGiftLineItemStub.resetBehavior();
    });

    it('Testing method: afterPOST', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        basket.createProductLineItem('dummyProductId', basket.defaultShipment);
        global.request = {
            isMemberOfCustomerGroup: () => true
        };
        basketHookScripts.afterPOST(basket);
        ensureAllShipmentsHaveMethodStub.throws(new Error('Test'));
        basketHookScripts.afterPOST(basket);
    });

    it('Testing method: afterPATCH', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var items = [JSON.stringify({
            product_item: {
                product_id: 'dummyProductId'
            }
        })];
        global.request = {
            getHttpParameters: () => {
                return {
                    get: () => ['start']
                };
            }
        };
        basket.createProductLineItem('dummyProductId', basket.defaultShipment);
        basket.custom = {
            isCommercialPickup: true
        };
        assert.doesNotThrow(() => basketHookScripts.afterPATCH(basket, items));
    });

    it('Testing method: afterDELETE', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        basket.createProductLineItem('dummyProductId', basket.defaultShipment);
        basketHookScripts.afterDELETE(basket);
    });

    it('Testing method: modifyGETResponse_v2', () => {
        var ArrayList = require('../../../../../mocks/scripts/util/dw.util.Collection');
        var shipment = new (require('../../../../../mocks/dw/dw_order_Shipment'))();
        assert.doesNotThrow(() => basketHookScripts.modifyGETResponse_v2(shipment, {
            applicable_shipping_methods: new ArrayList([{ id: 'test1' }]),
            default_shipping_method_id: 'test1'
        }));
    });

    it('Testing method: beforePUT', () => {
        shippingAddressValidStub.returns(true);
        var shippingAddress = {
            c_isOfficeAddress: '',
            c_sapCarrierCode: ''
        };
        assert.doesNotThrow(() => basketHookScripts.beforePUT(null, null, shippingAddress));
        shippingAddressValidStub.returns(false);
        assert.doesNotThrow(() => basketHookScripts.beforePUT(null, null, shippingAddress));
        shippingAddressValidStub.resetBehavior();
    });

    it('Testing method: beforePATCH', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        basket.custom = {
            verifiedIdmeScope: true
        };
        var basketInput = {
            c_verifiedIdmeScope: 'abc'
        };
        if (!global.session) global.session = {};
        global.session.custom = {};
        basketHookScripts.beforePATCH(basket, basketInput);
    });
});
