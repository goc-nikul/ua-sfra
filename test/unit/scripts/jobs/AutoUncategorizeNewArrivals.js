'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


describe('bc_jobs/cartridge/scripts/catalog/AutoUncategorizeNewArrivals.js', () => {
    var AutoUncategorizeNewArrivals = proxyquire('../../../../cartridges/bc_jobs/cartridge/scripts/catalog/AutoUncategorizeNewArrivals.js', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/catalog/CatalogMgr': require('../../../mocks/scripts/AutoUncategorizeNewArrival/dw_catalog_CatalogMgr'),
        'dw/io/File': require('../../../mocks/dw/dw_io_File'),
        'dw/io/FileWriter': require('../../../mocks/dw/dw_io_FileWriter'),
        'dw/io/XMLStreamWriter': require('../../../mocks/dw/dw_io_XMLStreamWriter'),
        'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
        'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
        'int_customfeeds/cartridge/scripts/util/ProductUtils' : {
            getPriceByPricebook: function () {
                return 100;
            }
        }
    });

    it('Testing Job: handle exception', () => {
        var newArrivals = AutoUncategorizeNewArrivals.autoUncategorizeNewArrivals();
        var Status = require('../../../mocks/dw/dw_system_Status');
        assert.isNotNull(newArrivals, 'status is null');
        assert.isDefined(newArrivals, 'status is undefined');
        assert.equal(newArrivals.status, Status.ERROR, 'Auto Uncategorize exception occured');
    });

    it('Testing Job: the job step is disabled', () => {
        var newArrivals = AutoUncategorizeNewArrivals.autoUncategorizeNewArrivals({
            params: {
                isDisabled : true,
                storefrontCatalogID : 'NAcatalog_strofront',
                masterCatalogID : 'NAcatalog'
            }
        });
        var Status = require('../../../mocks/dw/dw_system_Status');
        assert.isNotNull(newArrivals, 'status is null');
        assert.isDefined(newArrivals, 'status is undefined');
        assert.equal(newArrivals.status, Status.OK, 'Auto Uncategorize new arrival disabled');
    });

    it('Testing Job: the job step is successful', () => {
        var newArrivals = AutoUncategorizeNewArrivals.autoUncategorizeNewArrivals({
            params: {
                isDisabled : false,
                storefrontCatalogID : 'NAcatalog_strofront',
                masterCatalogID : 'NAcatalog'
            }
        });
        var Status = require('../../../mocks/dw/dw_system_Status');
        assert.isNotNull(newArrivals, 'status is null');
        assert.isDefined(newArrivals, 'status is undefined');
        assert.equal(newArrivals.status, Status.OK, 'Auto Uncategorize new arrival completed');
    });

    
});
