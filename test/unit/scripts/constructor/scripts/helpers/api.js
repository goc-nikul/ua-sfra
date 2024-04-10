const assert = require('chai').assert;
const expect = require('chai').expect;

var api = require('../../../../../mocks/constructor/helpers/api');

function removeFunctions(obj) {
    // chai can't compare functions, so remove functions from the result if they exist
    for (const key in obj) {
        if (typeof obj[key] === 'function') {
            delete obj[key];
        }
    }

    return obj;
}

describe('sendData Function', function() {
    it('should send data and return result', function() {
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

        mockedParams = {
            credentials: {},
            type: 'mockedType',
            data: { success : true },
            section: 'mockedSection',
            parameters: {
                method: 'POST',
                path: 'mockedPath'
            }
        };

        const result = removeFunctions(
            api.sendData(
                mockedParams.type,
                mockedParams.credentials,
                mockedParams.data,
                mockedParams.section,
                mockedParams.parameters
            )
        );

        expect(result).to.deep.equal(response);
    });

    it('should handle failed chunks', function() {
        var failedResponse = {
            error: 1,
            errorMessage: "error message",
            mockResult: false,
            msg: 'ERROR',
            object: {
                headers: null,
                response: null,
                statusCode: 404
            },
            ok: false,
            status: 'ERROR',
            unavailableReason: null
        };

        mockedParams = {
            credentials: {},
            type: 'mockedType',
            data: { success : false },
            section: 'mockedSection',
            parameters: {
                method: 'POST',
                path: 'mockedPath'
            }
        };

        const result = removeFunctions(
            api.sendData(
                mockedParams.type,
                mockedParams.credentials,
                mockedParams.data,
                mockedParams.section,
                mockedParams.parameters
            )
        );

        expect(result).to.deep.equal(failedResponse);
    });
});

describe('getData Function', function() {
    it('should get data and return response', function() {
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
        };

        var mockedParams = {
            credentials: {},
            type: 'mockedType',
            section: 'mockedSection',
            parameters: {
                num_results_per_page: 50,
                path: 'mockedPath',
                data: { success : true },
            }
        };

        const result = removeFunctions(
            api.getData(
                mockedParams.type,
                mockedParams.credentials,
                mockedParams.section,
                mockedParams.parameters
            )
        );

        expect(result).to.deep.equal(response);
    });

    it('should handle error response', function() {
        var failedResponse = {
            error: 1,
            errorMessage: "error message",
            mockResult: false,
            msg: 'ERROR',
            object: {
                headers: null,
                response: null,
                statusCode: 404
            },
            ok: false,
            status: 'ERROR',
            unavailableReason: null
        };

        var mockedParams = {
            credentials: {},
            type: 'mockedType',
            section: 'mockedSection',
            parameters: {
                num_results_per_page: 50,
                path: 'mockedPath',
                data: { success : false },
            }
        };

        const result = removeFunctions(
            api.getData(
                mockedParams.type,
                mockedParams.credentials,
                mockedParams.section,
                mockedParams.parameters
            )
        );

        expect(result).to.deep.equal(failedResponse);
    });
});