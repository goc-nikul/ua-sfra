'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');

function BaseProductLineItem() {}

describe('plugin_productpersonalize/cartridge/models/productLineItem/productLineItem.js', () => {

    before(() => {
        mockSuperModule.create(BaseProductLineItem);
    });

    it('Testing product line item model without options', () => {
        var ProductLineItemModel = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/productLineItem.js', {
            '*/cartridge/models/productLineItem/decorators/index': {
                productPersonalization: () => {}
            }
        });
        var productLineItem = new ProductLineItemModel();
        assert.isNotNull(productLineItem, 'productLineItem is null');
    });

    it('Testing product line item model with options', () => {
        var ProductLineItemModel = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/productLineItem.js', {
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
        var productLineItem = new ProductLineItemModel(null, null, options);
        assert.isNotNull(productLineItem, 'productLineItem is null');
    });

});
