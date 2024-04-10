const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var facetHelper = require('../../../../../mocks/constructor/custom/facetHelper');

describe('getOptionValueData', () => {
    it('should return data for a valid option value and facet', () => {
        const validFacet = 'size';
        const validDisplayName = 'S';
        const parameters = {};
        var response = {
            'facet_options': [
                {
                    'value': '4',
                    'value_alias': null,
                    'display_name': '4',
                    'position': null,
                    'data': {
                        'values': [
                            '4/5.5', 
                            '4'
                        ]
                    },
                    'hidden': false
                }
            ]
        }

        const result = facetHelper.getOptionValueData(validFacet, validDisplayName, parameters);

        expect(result).to.deep.equal(response);
    });

    it('should return null for an invalid option value and facet', () => {
        const invalidFacet = 'size';
        const invalidDisplayName = 'NonExistentValue';
        const parameters = {};

        const result = facetHelper.getOptionValueData(invalidFacet, invalidDisplayName, parameters);

        expect(result).to.be.null;
    });
});

describe('getOptionValues', () => {
    it('should return data for a valid option value and facet', () => {
        const validFacet = 'size';
        var response = {
            'facet_options': [
                {
                    'value': '4',
                    'value_alias': null,
                    'display_name': '4',
                    'position': null,
                    'data': {
                        'values': [
                            '4/5.5', 
                            '4'
                        ]
                    },
                    'hidden': false
                },
                {
                    'value': '5',
                    'value_alias': null,
                    'display_name': '5',
                    'position': null,
                    'data': {
                        'values': [
                            '3.5/5', 
                            '5/6.5', 
                            '5'
                        ]
                    },
                    'hidden': false
                }
            ]
        }

        const result = facetHelper.getOptionValues(validFacet);

        expect(result).to.deep.equal(response);
    });

    it('should return null for an invalid facet', () => {
        const invalidFacet = 'InvalidFacet';

        const result = facetHelper.getOptionValues(invalidFacet);

        expect(result).to.be.null;
    });
});

describe('mergeOptionValueData', () => {
    it('should merge custom values with existing Constructor values and return merged data', () => {
        const facet = 'size';
        const displayName = 'S';
        const customValues = ['S', 'M', 'L'];
        const returnWholeValue = true;
        const cioData = {
            data: {
                values: ['XS', 'S', 'M'],
            },
        };
        const expectedMergedValues = ['XS', 'S', 'M', 'L'];

        const result = facetHelper.mergeOptionValueData(facet, displayName, customValues, returnWholeValue, cioData);

        expect(result).to.deep.equal(cioData);
        expect(result.data.values).to.deep.equal(expectedMergedValues);
    });

    it('should return null when displayName is invalid', () => {
        const facet = 'size';
        const displayName = 'NonExistentValue';
        const customValues = ['S', 'M', 'L'];
        const returnWholeValue = true;
        const cioData = null;

        const result = facetHelper.mergeOptionValueData(facet, displayName, customValues, returnWholeValue, cioData);

        expect(result).to.be.null;
    });
});

describe('createOptionValue', () => {
    it('should create an option value for the facet', () => {
        const facet = 'size';
        const stepExecution = {};
        const displayName = 'S';
        const customValues = ['S', 'M', 'L'];

        const customObj = {
            value: displayName,
            value_alias: null,
            display_name: displayName,
            hidden: false,
            position: null,
            data: {
                values: customValues
            }
        };

        var mockedResult = {
            error: 0,
            errorMessage: null,
            mockResult: false,
            msg: 'OK',
            object: {
                headers: null,
                response: customObj,
                statusCode: 200
            },
            ok: true,
            status: 'OK',
            unavailableReason: null
        };

        const result = facetHelper.createOptionValue(facet, stepExecution, displayName, customValues);

        expect(result).to.deep.equal(mockedResult);
    });
});

describe('updateOptionValue', () => {
    it('should update an option value for the facet', () => {
        const facet = 'color';
        const stepExecution = {};
        const optionValue = {
            value: 'red',
            value_alias: null,
            display_name: 'Red',
            hidden: false,
            position: null,
            data: {
                values: ['red', 'maroon']
            }
        };

        var mockedResult = {
            error: 0,
            errorMessage: null,
            mockResult: false,
            msg: 'OK',
            object: {
                headers: null,
                response: optionValue,
                statusCode: 200
            },
            ok: true,
            status: 'OK',
            unavailableReason: null
        };

        const result = facetHelper.updateOptionValue(facet, stepExecution, optionValue);

        expect(result).to.deep.equal(mockedResult);
    });
});

describe('getPriceRefinement', () => {
    it('should return empty string if price or product is empty', () => {
        const mockProduct = { master: true, primaryCategory: 'TestCategory' };
        
        const resultEmptyPrice = facetHelper.getPriceRefinement(null, mockProduct);
        const resultEmptyProduct = facetHelper.getPriceRefinement(100, '');
        
        expect(resultEmptyPrice).to.equal('');
        expect(resultEmptyProduct).to.equal('');
    });

    it('should return correct price refinement when valid price and product are provided', () => {
        const mockProduct = {
            master: true,
            primaryCategory: {
                ID: 'root'
            }
        };

        const result = facetHelper.getPriceRefinement(21, mockProduct);
        expect(result).to.equal('$0 - $25');
    });

    it('should return empty string if no match found in price map', () => {
        const mockProduct = {
            master: true,
            primaryCategory: {
                ID: 'root'
            }
        };

        const result = facetHelper.getPriceRefinement(200, mockProduct);
        expect(result).to.equal('');
    });
});
