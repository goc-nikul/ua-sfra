'use strict';

var mockResponse = {
    statusCode: 200,
    statusMessage: 'Success',
    text: '<transaction-results><transaction-id>00000804</transaction-id><recommendation-code>ACCEPT</recommendation-code></transaction-results>'
};

function call() {
    return {
        object: JSON.stringify(mockResponse),
        status: 'OK'
    };
}

function getResponse() {
    return mockResponse;
}

module.exports = {
    call: call,
    getResponse: getResponse
};
