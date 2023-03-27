'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../../helpers/unit/Spy');
let spy = new Spy();

class ShippingMethod {
    constructor(shippingMethod) {
        this.ID = shippingMethod ? shippingMethod.ID : null;
        this.displayName = shippingMethod ? shippingMethod.displayName : null;
        this.description = shippingMethod ? shippingMethod.description : null;
        this.estimatedArrivalTime = shippingMethod && shippingMethod.custom
            ? shippingMethod.custom.estimatedArrivalTime : null;
        this.default = shippingMethod ? shippingMethod.defaultMethod : null;
        this.shippingCost = shippingMethod.shippingCost;
        this.selected = false;
        this.storePickupEnabled = shippingMethod.custom && shippingMethod.custom.storePickupEnabled ? shippingMethod.custom.storePickupEnabled : false;
        this.shippingDeliveryDates = 'Arrives dd/mm/yy - dd/mm/yy';
    }
}

function proxyModel() {
    var shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
        'dw/order/ShippingMgr': require('../../dw/dw_order_ShippingMgr'),
        '*/cartridge/scripts/util/collections': require('../util/collections'),
        '*/cartridge/models/shipping/shippingMethod': ShippingMethod,
        'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
        'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
        'dw/system/Site': require('../../dw/dw_system_Site'),
        'dw/order/BasketMgr': require('../../dw/dw_order_BasketMgr'),
        'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
        'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
        'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasInStorePickUpShipment: () => true,
            basketHasOnlyBOPISProducts: () => false
        }
    });
    shippingHelpers.getSpy = function () {
        return spy;
    };

    return shippingHelpers;
}

module.exports = proxyModel();
