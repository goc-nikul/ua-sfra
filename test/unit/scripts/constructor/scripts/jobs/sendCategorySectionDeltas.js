const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Status = require('../../../../../mocks/dw/dw_system_Status');

describe('sendCategorySectionDeltas function', function () {
    var okStatus = new Status(Status.OK, 'OK');

    var sendCategorySectionDeltas = proxyquire('../../../../../mocks/constructor/jobs/sendCategorySectionDeltas', {
        '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/xmlFileIterator': {
            create: function () {
                return true;
            }
        },
        '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/files': {
            handleFileActionAfterSendingDeltas: function(parameters, rootPath, filePath, success) {}
        },
        '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/api': {
            sendDeltasFromXmlFile: function(type, credentials, xmlFileIterator, section, jobExecutionContext) {
                return okStatus;
            },
            feedTypes: {
                product: 'product'
            }
        }
    });

    var parameters = {};

    var stepExecution = {
        jobExecution: {
            context: {
                filePath: 'IMPEX/src/Constructor/category_sections_xvw8vj5nxld.xml',
                rootPath: '/src/Constructor/',
                locale: 'en_US'
            }
        }
    };

    it('should send category section deltas to Constructor.io', function () {
        var result = sendCategorySectionDeltas.execute(parameters, stepExecution);

        expect(result).to.deep.equal(okStatus);
    });
});
