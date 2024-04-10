const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockBuildFacetMetadata = require('../../../../../mocks/constructor/jobs/buildFacetMetadata');
var Status = require('../../../../../mocks/dw/dw_system_Status');

describe('removeUnneededData function', function () {
    it('should remove unneeded attributes from facets', function () {
        var facets = [
            { name: 'Attribute1', display_name: 'Attribute 1', data: 'Data1' },
            { name: 'Attribute2', display_name: 'Attribute 2', data: 'Data2' },
            { name: 'Attribute3', display_name: 'Attribute 3', data: 'Data3' }
        ];
        var attributes = ['Attribute1', 'Attribute3'];

        var result = mockBuildFacetMetadata.removeUnneededData(facets, attributes);

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.deep.equal({ data: 'Data1', display_name: 'Attribute 1', name: 'Attribute1' });
        expect(result[1]).to.deep.equal({ data: 'Data3', display_name: 'Attribute 3', name: 'Attribute3' });
    });

    it('should return an empty array if no matching attributes found', function () {
        var facets = [
            { name: 'Attribute1', display_name: 'Attribute 1', data: 'Data1' },
            { name: 'Attribute2', display_name: 'Attribute 2', data: 'Data2' }
        ];
        var attributes = ['Attribute3', 'Attribute4'];

        var result = mockBuildFacetMetadata.removeUnneededData(facets, attributes);

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(0);
    });
});

describe('buildFacetMeta function', function () {
    var buildFacetMetadata = proxyquire('../../../../../mocks/constructor/jobs/buildFacetMetadata', {
        '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/getters/categories': {
            getAllCategories: function () {
                return [
                    { ID: 'root' },
                    { ID: 'men' }
                ];
            }
        }
    });

    it('should get display name overrides for facets', function () {
        const facets = [
            { name: 'team', display_name: 'Facet 1', data: {} },
            { name: 'facet2', display_name: 'Facet 2', data: {} },
        ];

        var expectedResult = [
            { name: 'team', display_name: 'Facet 1', data: { categoryOverrides: { root: 'Team', men: 'Team'} } },
            { name: 'facet2', display_name: 'Facet 2', data: {} }
        ];

        var result = buildFacetMetadata.buildFacetMeta(facets);

        expect(result).to.deep.equal(expectedResult);
    });
});

describe('doesSFCCDataExistAsCIOFacetOptionCustomData', () => {
    it('should return true if SFCC data exists in CIO facet option custom data', () => {
        const sfccData = ['value1', 'value2'];
        const cioData = {
            data: {
                values: ['value1', 'value2', 'value3'],
            },
        };

        const result = mockBuildFacetMetadata.doesSFCCDataExistAsCIOFacetOptionCustomData(sfccData, cioData);

        expect(result).to.be.true;
    });
  
    it('should return false if SFCC data does not exist in CIO facet option custom data', () => {
      const sfccData = ['value1', 'value2', 'value4'];
        const cioData = {
            data: {
                values: ['value1', 'value2', 'value3'],
            },
      };
  
      const result = mockBuildFacetMetadata.doesSFCCDataExistAsCIOFacetOptionCustomData(sfccData, cioData);
  
      expect(result).to.be.false;
    });
  
    it('should return false if data or values are missing in CIO facet option custom data', () => {
      const sfccData = ['value1', 'value2', 'value4'];
      const cioData = {};
  
      const result = mockBuildFacetMetadata.doesSFCCDataExistAsCIOFacetOptionCustomData(sfccData, cioData);
  
      expect(result).to.be.false;
    });
});

describe('sendSizeList', () => {
    it('should send size list data to Constructor and create option values', () => {
        const sfccSizeList = {
            S: ['S', 'M'],
            L: ['L', 'XL'],
        };

        var response = {
            error: 0,
            errorMessage: null,
            mockResult: false,
            msg: 'OK',
            object: {
                headers: null,
                response: {
                    value: "L",
                    value_alias: null,
                    display_name: "L",
                    hidden: false,
                    position: null,
                    data: {
                        values: [
                            "L",
                            "XL"
                        ]
                    }
                },
                statusCode: 200
            },
            ok: true,
            status: 'OK',
            unavailableReason: null
        };

        const result = mockBuildFacetMetadata.sendSizeList({}, sfccSizeList);

        expect(result).to.deep.equal(response);
    });

    it('should send size list data to Constructor and update option values', () => {
        const sfccSizeList = {
            4: ['4.0', '4.2', '4.6']
        };

        var response = {
            error: 0,
            errorMessage: null,
            mockResult: false,
            msg: 'OK',
            object: {
                headers: null,
                response: {
                    value: "4",
                    value_alias: null,
                    display_name: "4",
                    hidden: false,
                    position: null,
                    data: {
                        values: [
                            "4/5.5",
                            "4",
                            "4.0",
                            "4.2",
                            "4.6"
                        ]
                    }
                },
                statusCode: 200
            },
            ok: true,
            status: 'OK',
            unavailableReason: null
        };

        const result = mockBuildFacetMetadata.sendSizeList({}, sfccSizeList);

        expect(result).to.deep.equal(response);
    });
});

describe('execute function', function () {
    var buildFacetMetadata = proxyquire('../../../../../mocks/constructor/jobs/buildFacetMetadata', {
        '../../../mocks/constructor/jobs/sendFacetMetadata': {
            getFacetMetadata: function(parameters) {
                return JSON.stringify(
                    {
                        facets: [
                            {
                                name: 'subsilhouette',
                                type: 'multiple',
                                display_name: 'Product Type',
                                sort_order: 'relevance',
                                sort_descending: 'false',
                                range_type: 'null',
                                range_format: 'null',
                                range_inclusive: 'null',
                                range_limits: 'null',
                                match_type: 'any',
                                position: 'null',
                                hidden: 'false',
                                protected: 'false',
                                data: {
                                    uaId: 'c_subsilhouette',
                                    uaDisplayName: 'Product Type'
                                }
                            }
                        ]
                    }
                );
            }
        },
        '../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/getters/categories': {
            getAllCategories: function () {
                return [
                    { ID: 'root' },
                    { ID: 'men' }
                ];
            }
        }
    });

    var parameters = {
        Locale: 'en_US'
    };

    var stepExecution = {};

    it('should execute the function and return status OK', function () {
        var result = buildFacetMetadata.execute(parameters, stepExecution);

        expect(result).to.deep.equal(new Status(Status.OK));
    });
});
