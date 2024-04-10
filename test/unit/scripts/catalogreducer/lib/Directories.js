'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();



// Path to test scripts
var pathToCoreMock = '../../../../mocks/';

var base = module.superModule;
base.prepareRootFolder = function () {};
base.createDirectory = function (str) {
    return str;
};

global.module = {
    superModule: {}
};
var Directories = proxyquire('../../../../../cartridges/bm_catalogreducer_custom/cartridge/scripts/lib/Directories', {
    'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
    'dw/system/System': {
        getCalendar: () => {
            return {
                add: () => null,
                getTime: () => {
                    return {
                        getTime: () => 100000
                    }
                },
                toTimeString: () => '05242023022039'
            };
        }
    },
    'dw/io/File': require(pathToCoreMock + 'dw/dw_io_File')
});

describe('cartridges/bm_catalogreducer_custom/cartridge/scripts/lib/Directories.js file test cases', () => {
    const catalogId = 'usCatalog';
    const fileName = 'random_name';

    it('Test prepareRootFolder method by passing only 1 parameter', function () {

        let result = Directories.prepareRootFolder(catalogId);

        assert.ok(result);
        assert.isNotNull(result.directoryName);
        assert.isNotNull(result.directortyPath);
    });
    it('Test prepareRootFolder method by passing only 2 parameter', function () {

        let result = Directories.prepareRootFolder(catalogId, fileName);

        assert.ok(result);
        assert.equal(fileName, result.directoryName);
        assert.isNotNull(result.directortyPath);
    });
});
