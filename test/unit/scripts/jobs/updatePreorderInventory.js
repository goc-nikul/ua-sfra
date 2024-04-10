'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../../../mocks/util/collections');
var Site = require('../../../mocks/dw/dw_system_Site');

const parameters = {
    fileNamePrefix: 'US_UpdatePreorderInventory',
    targetDirectoryPath: 'src/inventory/preorder',
    inventoryListId: 'US_Ecomm_Inventory',
    inventoryListDefaultInStockFlag: 'false'
};

const mockStatus = class Status {
    constructor(status, code, message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
};
mockStatus.ERROR = 1;
mockStatus.OK = 2;

describe('app_ua_core/cartridge/scripts/jobs/updatePreorderInventory.js test', () => {
    var updatePreorderInventory = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/jobs/updatePreorderInventory.js', {
        'dw/system/Status': mockStatus,
        'dw/io/File': require('../../../mocks/dw/dw_io_File'),
        'dw/io': {
            FileWriter: require('../../../mocks/dw/dw_io_FileWriter'),
            XMLIndentingStreamWriter: require('../../../mocks/dw/dw_io_XMLIndentingStreamWriter')
        },
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/scripts/util/collections': collections
    });

    it('should have status ok when site custom preferences preOrderProductList and inStockProductList are populated', () => {
        const result = updatePreorderInventory.execute(parameters);
        assert.isNotNull(result, 'status is null');
        assert.isDefined(result, 'status is undefined');
        assert.equal(result.status, mockStatus.OK, 'Job result should be OK.');
    });

    it('should have status ok when site custom preferences preOrderProductList and inStockProductList are empty', () => {
        Site.getCurrent().setCustomPreferenceValue('preOrderProductList', null);
        Site.getCurrent().setCustomPreferenceValue('inStockProductList', null);

        const result = updatePreorderInventory.execute(parameters);
        assert.isNotNull(result, 'status is null');
        assert.isDefined(result, 'status is undefined');
        assert.equal(result.status, mockStatus.OK, 'Job result should be OK.');
    });
});
