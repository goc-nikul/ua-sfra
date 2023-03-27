'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');

function BaseOrderLineItem() {}

describe('plugin_productpersonalize/cartridge/models/productLineItem/orderLineItem.js', () => {

    before(() => {
        mockSuperModule.create(BaseOrderLineItem);
    });

    it('Testing Order lineitem model when no option model exists', () => {
        var OrderLineItemModel = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/orderLineItem.js', {
            '*/cartridge/models/productLineItem/decorators/index': () => {}
        });
        var orderLineItem = new OrderLineItemModel();
        assert.isNotNull(orderLineItem, 'orderLineItemModel is null');
    });

    it('Testing Order lineitem model', () => {
        var OrderLineItemModel = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/orderLineItem.js', {
            '*/cartridge/models/productLineItem/decorators/index': {
                productPersonalization: () => {}
            }
        });
        var options = {
            lineItem: {
                custom: {
                    jerseyNameText: 'jerseyNameText',
                    jerseyNumberText: 'jerseyNumberText',
                    sponsors: true
                }
            }
        };
        var orderLineItem = new OrderLineItemModel(null, null, options);
        assert.isNotNull(orderLineItem, 'orderLineItemModel is null');
    });

});
