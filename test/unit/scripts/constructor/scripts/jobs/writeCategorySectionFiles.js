var sinon = require('sinon');
const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Status = require('../../../../../mocks/dw/dw_system_Status');

var writeCategorySectionFiles = proxyquire('../../../../../mocks/constructor/jobs/writeCategorySectionFiles', {
    '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/getters/categories': {
        getAllCategories: function () {
            return [
                { ID: 'root' },
                { ID: 'men' }
            ];
        }
    },
    '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/xmlConverter': {
        createXmlFileFromArray: function (filePath,rootElementName,arrayElementName, array, transformItem) {
            return 3;
        }
    },
    '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/files': {
        getFilePath: function (rootPath, key) {
            return '/path/to/output.xml';
        },
        ensureConstructorFolderExists: function(path) {
            return true;
        }
    }
});

describe('writeCategoriesToXml', function () {
    it('should write categories to an XML file', function () {
        const filePath = '/path/to/output.xml';

        var result = writeCategorySectionFiles.writeCategoriesToXml(filePath);

        expect(result).to.equal('[info] writeCategorySectionFiles.js: Written 3 categories to a new XML file.');
    });
});

describe('execute', function () {
    it('should execute the category writing job', function () {
        const parameters = {
            WriteFolder: '/path/to/write/folder',
            Locale: 'en_US'
        };

        const stepExecution = {
            jobExecution: {
                context: {
                    rootPath: '/path/to/write/folder',
                    filePath: '/path/to/output.xml'
                }
            }
        };

        var result = writeCategorySectionFiles.execute(parameters, stepExecution);

        expect(result).to.deep.equal(new Status(Status.OK));
    });
});
