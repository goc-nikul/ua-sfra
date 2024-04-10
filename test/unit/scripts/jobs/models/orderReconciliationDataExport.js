const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

describe('app_ua_core/cartridge/scripts/jobs/models/orderReconciliationDataExport.js', () => {
    var OrderReconciliationDataExport = proxyquire(
        '../../../../../cartridges/app_ua_core/cartridge/scripts/jobs/models/orderReconciliationDataExport.js',
        {
            'dw/io/File': require('../../../../mocks/dw/dw_io_File'),
            'dw/io/FileWriter': require('../../../../mocks/dw/dw_io_FileWriter'),
            'dw/io/CSVStreamWriter': require('../../../../mocks/dw/dw_io_CSVStreamWriter'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
        }
    );
    var model = new OrderReconciliationDataExport({
        targetDirectoryPath: 'test',
        exportFileName: 'test.csv'
    });

    var result;

    it('Testing method: writeHeader', () => {
        result = model.writeHeader();
        assert.isUndefined(result);
    });
    it('Testing method: initRow', () => {
        result = model.initRow();
        assert.isUndefined(result);
    });
    it('Testing method: buildRow', () => {
        result = model.buildRow({});
        assert.isUndefined(result);
    });
    it('Testing method: close', () => {
        result = model.close();
        assert.isUndefined(result);
    });
});
