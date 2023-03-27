/* eslint-disable */
'use strict';
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class File {
    constructor(filePath) {
        this.filePath = filePath;
    }

    createNewFile() {
        return 'New File';
    }

    mkdirs() {
        return true;
    }
}

File.IMPEX = '';

class XMLStreamWriter {
    constructor(filePath) {
        this.filePath = filePath;
    }

    writeStartDocument() {
        return 'New File';
    }

    writeStartElement() {
        return 'New File';
    }

    writeAttribute() {
        return 'New File';
    }

    writeCharacters(chars) {
        return 'New File';
    }

    writeEndElement() {
        return 'New File';
    }

    writeEndDocument() {
        return 'End of document';
    }

    close() {
        return '';
    }

    flush() {
        return '';
    }
}

class FileWriter {
    constructor(filePath) {
        this.filePath = filePath;
    }
}

var jobParams = {
    FilePath: '/src/feeds/cleanCategory',
    CatalogID: 'shoplinker'
};

describe('int_shoplinker/cartridge/scripts/catalog/RecreateCategory.js', () => {
    var shoplinkerRecreateCatalog = proxyquire('../../../../../cartridges/int_shoplinker/cartridge/scripts/catalog/RecreateCategory.js', {
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/catalog/CatalogMgr': require('../../../../mocks/shoplinker/dw_catalog_CatalogMgr'),
        'dw/io/File': File,
        'dw/io/FileWriter': FileWriter,
        'dw/io/XMLStreamWriter': XMLStreamWriter,
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),

    });

    it('Testing method: execute', () => {
        var result = shoplinkerRecreateCatalog.execute(jobParams);
        assert.isUndefined(result, 'result is defined');
    });
});