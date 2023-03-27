'use strict';

/**
 * Create a token service
 * @param {Object} payload payload object
 * @returns {Object} payload service object
 */
function paymentToken(payload) {
    return require('dw/svc/LocalServiceRegistry').createService('2c2p.http.payment', {
        createRequest: function (svc) {
            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod('POST');
            // exception handling done in calling function
            return JSON.stringify(payload);
        },
        parseResponse: function (svc, response) {
            return response.text;
        }
    }).call();
}

module.exports = paymentToken;
