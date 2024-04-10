'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var stubProductXmlWriter = sinon.stub();
// Path to test scripts
var pathToCoreMock = '../../../mocks/';

class File {
    static SEPARATOR = '/';
    static IMPEX = 'IMPEX';

    constructor(fullPath) {
        this.SEPARATOR = '/';
        this.IMPEX = 'impex';
        this.fullPath = fullPath;
    }
    createNewFile() { return 'New File'; }
    isDirectory() { return true; }
    exists() { return true; }
    mkdir() { return 'New File'; }
    remove() { return 'New File'; }
    isFile() { return true; }
    getFullPath() { return this.fullPath; }
}

var CatalogXML = proxyquire('../../../../cartridges/bc_jobs/cartridge/scripts/utils/CatalogXmlWriter.js', {
    'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
    'dw/io/File': File,
    'dw/io/FileWriter': require(pathToCoreMock + 'dw/dw_io_FileWriter'),
    'dw/io/XMLStreamWriter': require(pathToCoreMock + 'dw/dw_io_XMLStreamWriter'),
    '~/cartridge/scripts/utils/ProductXmlWriter': stubProductXmlWriter
});

describe('cartridges/bc_jobs/cartridge/scripts/utils/CatalogXmlWriter.js file test cases', () => {
    it('createFile() should create a file with the given directory and name', function () {

        const catalogXml = new CatalogXML('catalogId');
        const fileDirectory = 'testDirectory';
        const fileName = 'testFile';

        const result = catalogXml.createFile(fileDirectory, fileName);

        assert.equal(result.getFullPath(), 'IMPEX/testDirectory/testFile.xml');
    });

});
