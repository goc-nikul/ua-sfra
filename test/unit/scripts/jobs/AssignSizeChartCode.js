'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var SeekableIterator = require('../../../mocks/dw/dw_util_SeekableIterator');
var Collection = require('../../../mocks/scripts/util/dw.util.Collection');

var products = new SeekableIterator([
    {
        id: 'product1',
        master: true,
        variants: []
    }
]);

var product = {
    id: 'sizeChartProduct',
    master: true,
    custom: {
        agegroup: 'Mens',
        silhouette: 'footwear'
    }
};

var sizeChartDataObj = {
    sizeChartMappingCode: 'mens-footwear',
    product: product
};
var colProducts = new Collection();
colProducts.add(sizeChartDataObj);

var productMgr = {
    queryAllSiteProducts: function () {
        return products;
    }
};

describe('bc_jobs/cartridge/scripts/catalog/AssignSizeChartCode.js', () => {
    var assignSizeChartCode = proxyquire('../../../../cartridges/bc_jobs/cartridge/scripts/catalog/AssignSizeChartCode.js', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/catalog/CatalogMgr': require('../../../mocks/dw/dw_catalog_CatalogMgr'),
        'dw/catalog/ProductMgr': productMgr,
        'dw/io/File': require('../../../mocks/dw/dw_io_File'),
        'dw/io/FileWriter': require('../../../mocks/dw/dw_io_FileWriter'),
        'dw/io/XMLStreamWriter': require('../../../mocks/dw/dw_io_XMLStreamWriter')
    });
    var result;
    it('Testing method: beforeStep ', () => {
        let parameters = {
            storefrontCatalogID: 'NACatalog',
            isQueryAllForSiteProducts: true
        };
        let stepExecution = {

        };
        result = assignSizeChartCode.beforeStep(parameters, stepExecution);
        assert.isUndefined(result);
    });

    it('Testing method: getTotalCount', () => {
        result = assignSizeChartCode.getTotalCount();
        assert.isDefined(result);
        assert.equal(result, products.count);
    });

    it('Testing method: read', () => {
        result = assignSizeChartCode.read();
        assert.isDefined(result);
        assert.isNotNull(result);

        result = assignSizeChartCode.read();
        assert.isUndefined(result);
    });

    it('Testing method: afterStep', () => {
        result = assignSizeChartCode.afterStep();
        assert.isDefined(result);
    });

    it('Testing method: process', () => {
        result = assignSizeChartCode.process(product);
        assert.isUndefined(result);
    });

    it('Testing method: write', () => {
        result = assignSizeChartCode.write(colProducts, {}, {});
        assert.isUndefined(result);
    });
});
