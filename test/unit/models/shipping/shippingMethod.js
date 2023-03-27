'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const sinon = require('sinon');
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseShippingMethodModel = function ShippingMethodModel() {};

var CustomString = require('../../../mocks/dw/String');
var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');

var getCustomPreferenceValueStub = sinon.stub();
var stubbasketHasOnlyBOPISProducts = sinon.stub();
var getShippingDeliveryDatesStub = sinon.stub();

BasketMgr.setCurrentBasket(new LineItemCtnr());

var ShippingMethodModel;

var Site = {
    current: {
        getCustomPreferenceValue: getCustomPreferenceValueStub,
        preferences: {
            custom: {
                'isBOPISEnabled': true,
                'totalShipmentCostThreshold': true
            }
        }
    }
};
getCustomPreferenceValueStub.returns(0);

Site.getCurrent = () => {
    return Site.current;
};

var shippingMethod = {
    description: 'Store Pickup ',
    displayName: 'Store Pickup',
    ID: '005',
    shippingCost: '$0.00',
    custom: {
        storePickupEnabled: true,
        isIncludeBopisShipmentCost: true
    }
};

var shipments = {
    productLineItems: [{
        product: {
            ID: '0001'
        },
        quantity: {
            value: 2
        }
    }, {
        product: {
            ID: '0002'
        },
        quantity: {
            value: 3
        }
    }]
};

var deliveryHelper = {
    getShippingDeliveryDates: getShippingDeliveryDatesStub
};


const instorePickupStoreHelpers = {
    basketHasInStorePickUpShipment: () => {
        return true;
    },
    basketHasOnlyBOPISProducts: stubbasketHasOnlyBOPISProducts
};

var StringUtils = {
    formatMoney: function (amount) {
        return '$' + amount.value;
    },
    formatCalendar: function (calander) {
        var string = new CustomString(calander.toTimeString());
        return string;
    }
};

class Calander {
    constructor(date) {
        this.date = date;
        return {
            toTimeString: function () {
                return date.toDateString();
            }
        };
    }
}

describe('app_ua_core/cartridge/models/shipping/shippingMethod.js', () => {
    before(function () {
        mockSuperModule.create(baseShippingMethodModel);
        ShippingMethodModel = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/shipping/shippingMethod.js', {
            'app_ua_core/cartridge/scripts/util/DeliveryHelper': deliveryHelper,
            'dw/order/ShippingMgr': require('../../../mocks/dw/dw_order_ShippingMgr'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/util/Calendar': {
                SHORT_DATE_PATTERN: 'dd/mm/yyyy'
            },
            'dw/util/StringUtils': StringUtils,
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': instorePickupStoreHelpers,
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/order/BasketMgr': BasketMgr,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': Site

        });
    });


    it('Testing shippingMethodModel: When null passed to the model', () => {
        var shippingModel = new ShippingMethodModel(null, null);
        assert.isDefined(shippingModel);
        assert.isNotNull(shippingModel);
        assert.isNull(shippingModel.raw);
        assert.isUndefined(shippingModel.shippingCostVal);
        assert.isDefined(shippingModel.shippingDeliveryDates);
        assert.equal(shippingModel.shippingDeliveryDates, '');
        getCustomPreferenceValueStub.reset();
    });

    it('Testing shippingMethodModel: When BOPIS is enabled for the site', () => {
        getCustomPreferenceValueStub.returns(1);
        var shippingModel = new ShippingMethodModel(shippingMethod, shipments);
        assert.isDefined(shippingModel);
        assert.isNotNull(shippingModel);
        assert.isDefined(shippingModel.storePickupEnabled);
        assert.isDefined(shippingModel.shippingCost);
        getCustomPreferenceValueStub.reset();
    });

    it('Testing shippingMethodModel: Checking for Shipping Delivery Dates', () => {
        getCustomPreferenceValueStub.returns(8);
        getShippingDeliveryDatesStub.returns([new Calander(new Date()), new Calander(new Date('2022/03/23'))]);
        var shippingModel = new ShippingMethodModel(shippingMethod, shipments);
        assert.isDefined(shippingModel);
        assert.isDefined(shippingModel.shippingDeliveryDates);

        getShippingDeliveryDatesStub.reset();
        getShippingDeliveryDatesStub.returns([new Calander(new Date()), new Calander(new Date())]);
        shippingModel = new ShippingMethodModel(shippingMethod, shipments);
        assert.isDefined(shippingModel);
        assert.isDefined(shippingModel.shippingDeliveryDates);

        getShippingDeliveryDatesStub.reset();
        getCustomPreferenceValueStub.reset();
    });
    it('Testing shippingMethodModel: when totalShipmentCostThreshold is not present in preference', () => {
        delete Site.current.preferences.custom.totalShipmentCostThreshold;

        ShippingMethodModel = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/shipping/shippingMethod.js', {
            'app_ua_core/cartridge/scripts/util/DeliveryHelper': deliveryHelper,
            'dw/order/ShippingMgr': require('../../../mocks/dw/dw_order_ShippingMgr'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/util/Calendar': {
                SHORT_DATE_PATTERN: 'dd/mm/yyyy'
            },
            'dw/util/StringUtils': StringUtils,
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': instorePickupStoreHelpers,
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/order/BasketMgr': BasketMgr,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': Site

        });
        var shippingModel = new ShippingMethodModel(shippingMethod, shipments);
        assert.isDefined(shippingModel.shippingCost);
        getShippingDeliveryDatesStub.reset();
    });

    it('Testing shippingMethodModel: When basket has only BOPIS products', () => {
        stubbasketHasOnlyBOPISProducts.returns(true);
        var shippingModel = new ShippingMethodModel(shippingMethod, shipments);
        assert.isDefined(shippingModel);
        assert.isUndefined(shippingModel.shippingCost);
        stubbasketHasOnlyBOPISProducts.reset();
    });

    it('Testing shippingMethodModel: When Bopis Shipment Cost not inlcuded in shipping method', () => {
        delete shippingMethod.custom.isIncludeBopisShipmentCost;
        delete shippingMethod.custom.storePickupEnabled;
        var shippingModel = new ShippingMethodModel(shippingMethod, shipments);
        assert.isDefined(shippingModel);
        assert.isUndefined(shippingModel.shippingCost);
    });
});
