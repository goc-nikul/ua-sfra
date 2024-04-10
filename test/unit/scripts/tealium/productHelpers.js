'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
let Collection = require('../../../mocks/dw/dw_util_Collection');
var mockSuperModule = require('../../../mockModuleSuperModule');
var Logger = require('../../../mocks/dw/dw_system_Logger');

describe('int_tealium/cartridge/scripts/helpers/ProductHelper test', function () {
    
    let  ProductHelper = proxyquire('../../../../cartridges/int_tealium/cartridge/scripts/helpers/productHelpers', {
        'dw/catalog/ProductMgr' : require('../../../mocks/dw/dw_catalog_ProductMgr'),
        'dw/system/Logger' : Logger
    });

    it('Testing method: getSelectedVariant --> get Selected Variant with inventory details', () => {
        
        let result = ProductHelper.getSelectedVariant('883814258849');

        assert.equal(result.error, false);
        assert.isDefined(result.inventoryATSValue);
        assert.isObject(result.variantProduct);
    });
});


