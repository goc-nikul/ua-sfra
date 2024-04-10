const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

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
                    "4/5.5"
                ]
            }
        },
        statusCode: 200
    },
    ok: true,
    status: 'OK',
    unavailableReason: null
};

describe('sendFacetMetadata Function', () => {
    it('should send facet metadata and return a response', () => {
        var sendFacetMetadata = require('../../../../../mocks/constructor/jobs/sendFacetMetadata');

        const parameters = {
            method: 'PATCH',
            path: '/size/options'
        };
        const stepExecution = {};
        const data = { success: true };

        const result = sendFacetMetadata.sendFacetMetadata(parameters, stepExecution, data);

        // chai can't compare functions, so remove functions from the result if they exist
        for (const key in result) {
            if (typeof result[key] === 'function') {
                delete result[key];
            }
        }

        expect(result).to.deep.equal(response);
    });

    it('should return an error status if credentials are not set', () => {
        var sendFacetMetadata = proxyquire('../../../../../mocks/constructor/jobs/sendFacetMetadata', {
            '../../dw/dw_system_Status': {
                ERROR: 404,
                constructor: function (error) {
                    return {
                        status: 'ERROR',
                        code: error,
                        message: 'ERROR',
                        details: {}
                    };
                }
            },
            '../helpers/config': {
                getCredentialsOrNull: function () {
                    return null;
                }
            }
        });

        var err = {
            status: 'ERROR',
            code: 404,
            message: 'ERROR',
            details: {}
        };

        const parameters = {};
        const stepExecution = {};
        const data = {};

        const result = sendFacetMetadata.sendFacetMetadata(parameters, stepExecution, data);

        expect(result).to.deep.equal(err);
    });
});

describe('getFacetMetadata', function() {
    it('should return an error status if credentials are not set', function() {
        var sendFacetMetadata = proxyquire('../../../../../mocks/constructor/jobs/sendFacetMetadata', {
            '../../dw/dw_system_Status': {
                ERROR: 404,
                constructor: function (error) {
                    return {
                        status: 'ERROR',
                        code: error,
                        message: 'ERROR',
                        details: {}
                    };
                }
            },
            '../helpers/config': {
                getCredentialsOrNull: function () {
                    return null;
                }
            }
        });

        var err = {
            status: 'ERROR',
            code: 404,
            message: 'ERROR',
            details: {}
        };

        const parameters = {};
        
        const result = sendFacetMetadata.getFacetMetadata({parameters});
        expect(result).to.have.property('status', 'ERROR');
    });

    it('should return facet metadata if credentials are set', function() {
        var sendFacetMetadata = require('../../../../../mocks/constructor/jobs/sendFacetMetadata');
        var response = {
            value: "4",
            value_alias: null,
            display_name: "4",
            hidden: false,
            position: null,
            data: {
                values: [
                    "4/5.5"
                ]
            }
        }

        const parameters = {
            method: 'PATCH',
            path: '/size/options',
            data: { success: true }
        };

        const result = sendFacetMetadata.getFacetMetadata(parameters);

        expect(result).to.deep.equal(response);
    });
});
