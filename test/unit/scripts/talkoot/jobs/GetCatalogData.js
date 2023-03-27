/* eslint-disable */
'use strict';
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');


// stubs
var callStub = sinon.stub();

class File {
    constructor(filePath) {
        this.filePath = filePath;
    }

    createNewFile() {
        return 'New File';
    }
}

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

    writeCharacters() {
        return 'New File';
    }

    writeEndElement() {
        return 'New File';
    }

    close() {
        return '';
    }
}

class FileWriter {
    constructor(filePath) {
        this.filePath = filePath;
    }
}

var jobParams = {
    JobID: 'getCatalog',
    JobQuery: 'getCatalog',
    JobTypeName: 'eCom Copy - New',
    FilePath: 'src/catalog',
    CatalogID: 'mens'
};

describe('int_talkoot/cartridge/scripts/jobs/GetCatalogData.js', () => {
    var GetCatalogData = proxyquire('../../../../../cartridges/int_talkoot/cartridge/scripts/jobs/GetCatalogData.js', {
        'int_talkoot/cartridge/scripts/services/TalkootService': {
            call: callStub
        },
        'dw/system/System': {
            getPreferences: () => {
                return {
                    getCustom: function () {
                        return {
                            talkootMap: '{"product-name":{"attrID":"display-name","isCustom":false,"localized":true},"whats-it-do":{"attrID":"whatsItDo","isCustom":true,"localized":true},"dna-bullet-1,dna-bullet-2,dna-bullet-3,dna-bullet-4,dna-bullet-5,dna-bullet-6,dna-bullet-7,dna-bullet-8":{"attrID":"dna","isCustom":true,"localized":true,"multiple":true},"specs-bullet-1,specs-bullet-2,specs-bullet-3,specs-bullet-4,specs-bullet-5,specs-bullet-6,specs-bullet-7,specs-bullet-8":{"attrID":"specs","isCustom":true,"localized":true,"multiple":true},"fit-and-care-bullet-1,fit-and-care-bullet-2,fit-and-care-bullet-3,fit-and-care-bullet-4,fit-and-care-bullet-5,fit-and-care-bullet-6,fit-and-care-bullet-7,fit-and-care-bullet-8":{"attrID":"fitCare","isCustom":false,"localized":true,"multiple":true},"ecom,ecom-copy":{"attrID":"ecom","isCustom":true,"localized":true,"multiple":false},"bullet-1,bullet-1-copy":{"attrID":"ecom","isCustom":false,"localized":true,"multiple":true},"test-value":{"attrID":"ecom","isCustom":true,"localized":true,"multiple":true} }'
                        };
                    }
                };
            }
        },
        'dw/io/File': File,
        'dw/io/FileWriter': FileWriter,
        'dw/io/XMLStreamWriter': XMLStreamWriter,
        'dw/system/Logger': {
            info: () => '',
            warn: () => ''
        }
    });

    it('should return undefined when job params is empty object ', () => {
        var result = GetCatalogData.execute({});
        assert.isUndefined(result, 'result is defined');

    });

    it('should return undefined when service resoponse not contains jobs', () => {
        callStub.returns({});
        var result = GetCatalogData.execute(jobParams);
        assert.isUndefined(result, 'result is defined');
        callStub.reset();
    });

    it('should create the file in given location with data', () => {
        callStub.returns({
            Locales: [
                {
                    LocaleName: 'US',
                    LocaleID: 'US'
                }
            ],
            'Jobs': [
                {
                    'JobID': 1,
                    'JobName': 'Job Name 1',
                    'JobNumber': 'Job Number 1',
                    'CompanyID': 1,
                    'CompanyName': 'Company 1',
                    'JobTypeID': 1,
                    'JobTypeName': 'eCom Copy - New',
                    'SeasonID': 1,
                    'SeasonName': 'Season Name 1',
                    'Year': 2022,
                    'LocaleID': 1,
                    'LocaleName': 'Locale Name 1',
                    'Dictionary': 'English (USA)',
                    'ProjectManagerID': 1,
                    'ProjectManagerName': 'Project Manager Name 1',
                    'ClientContactID': 1,
                    'ClientContactName': 'Client Contact Name 1',
                    'StartDate': '2022-08-02T02:03:14.0219133-07:00',
                    'DueDate': '2022-09-01T02:03:14.0219133-07:00',
                    'RushDate': '2022-09-01T02:03:14.0219133-07:00',
                    'Notes': 'Notes 1',
                    'RoundCount': 3,
                    'ModelCount': 1,
                    'ActiveFlag': true
                }
            ],
            'Models': [
                {
                    'ModelID': 1,
                    'ModelName': 'Model Name 1',
                    'ModelNumber': 'Model Number 1',
                    'JobID': 1,
                    'JobTypeID': 0,
                    'SeasonID': 0,
                    'Year': 0,
                    'JobName': 'Job Name 1'
                }
            ],
            'Copies': [
                {
                    'CopyID': 2177806,
                    'JobID': 453,
                    'JobName': 'T-shirts',
                    'ModelID': 144024,
                    'ModelName': 'Big shirt',
                    'CopyTypeID': 8,
                    'CopyTypeName': 'copy',
                    'CopyName': 'ecom-copy',
                    'CopyValue': 'These big shirts go down to your knees.',
                    'Completed': false,
                    'RankOrder': '1',
                    'LastModifiedDate': '2017-03-05T15:38:04.753',
                    'LastModifiedBy': 'Tony Gwynn'
                },{
                    'CopyID': 2176586,
                    'JobID': 453,
                    'JobName': 'Shoes',
                    'ModelID': 144024,
                    'ModelName': 'TYIJL',
                    'CopyTypeID': 8,
                    'CopyTypeName': 'copy',
                    'CopyName': 'product-name',
                    'CopyValue': 'These big shirts go down to your knees.',
                    'Completed': false,
                    'RankOrder': '1',
                    'LastModifiedDate': '2017-03-05T15:38:04.753',
                    'LastModifiedBy': 'Tony Gwynn'
                },
                {
                    'CopyID': 2177807,
                    'JobID': 453,
                    'JobName': 'T-shirts',
                    'ModelID': 144024,
                    'ModelName': 'Little shirts',
                    'CopyTypeID': 7,
                    'CopyTypeName': 'bullet',
                    'CopyName': 'bullet 1',
                    'CopyValue': 'tri-blend',
                    'Completed': false,
                    'RankOrder': 2,
                    'LastModifiedDate': '2017-03-05T10:38:04.753',
                    'LastModifiedBy': 'Carmelo Martinez'
                },
                {
                    'CopyID': 218473,
                    'JobID': 453,
                    'JobName': 'Test name',
                    'ModelID': 144024,
                    'ModelName': '',
                    'CopyTypeID': 7,
                    'CopyTypeName': 'test-value',
                    'CopyName': 'test-value',
                    'CopyValue': 'tri-blend',
                    'Completed': false,
                    'RankOrder': 2,
                    'LastModifiedDate': '2017-03-05T10:38:04.753',
                    'LastModifiedBy': 'Carmelo Martinez'
                },
                {
                    'CopyID': 265473,
                    'JobID': 4543,
                    'JobName': 'Test name2',
                    'ModelID': 14454,
                    'ModelName': '',
                    'CopyTypeID': 78,
                    'CopyTypeName': 'test-value',
                    'CopyName': 'bullet-1-copy',
                    'CopyValue': 'tri-blend',
                    'Completed': false,
                    'RankOrder': 2,
                    'LastModifiedDate': '2018-03-05T10:38:04.753',
                    'LastModifiedBy': 'Carmelo'
                }
            ]
        });
        var result = GetCatalogData.execute(jobParams);
        assert.isUndefined(result, 'result is defined');
    });
});
