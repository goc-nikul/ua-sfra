'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var SeekableIterator = require('../../../mocks/dw/dw_util_SeekableIterator');
var Product = require('../../../mocks/dw/dw_catalog_Product');

global.empty = (data) => {
    return !data;
};

var products = new SeekableIterator([
    {
        id: 'product1',
        master: true,
        variants:[]
    }
]);

var productMgr = {
    queryAllSiteProducts: function () {
        return products;
    }
};

var params = {
    MasterCatalogId: 'NACatalog',
    deleteProduct: true
}

var productMock1 = {
    id: 'product1',
    master: true,
    variants:[]
}


describe('app_ua_core/cartridge/scripts/jobs/catalog/masterProductsCleanup.js', () => {
    var masterProductsCleanup = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/jobs/catalog/masterProductsCleanup.js', {
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/catalog/ProductMgr': productMgr,
        'dw/io/File': require('../../../mocks/dw/dw_io_File'),
        'dw/io/FileWriter': require('../../../mocks/dw/dw_io_FileWriter'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
    });
    var result;
    it('Testing method: beforeStep ', () => {
        result = masterProductsCleanup.beforeStep({});
        assert.isUndefined(result);
    });

    it('Testing method: getTotalCount', () => {
        result = masterProductsCleanup.getTotalCount();
        assert.isDefined(result);
        assert.equal(result, products.count);
    });

    it('Testing method: read', () => {
        result = masterProductsCleanup.read();
        assert.isDefined(result);
    });

    it('Testing method: process', () => {
        result = masterProductsCleanup.process(productMock1);
        assert.isUndefined(result);
    });

    it('Testing method: write', () => {
        result = masterProductsCleanup.write({}, {}, {});
        assert.isUndefined(result);
    });

    it('Testing method: afterStep', () => {
        result = masterProductsCleanup.afterStep();
        assert.isDefined(result);
    });
});
