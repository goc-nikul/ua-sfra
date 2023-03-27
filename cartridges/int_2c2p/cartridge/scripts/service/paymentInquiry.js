'use strict';

/**
 * Returns back Inquiry service object
 * @param {string} payload querypaylaod
 * @returns {Object} returns Inquiry service object
 */
function paymentInquiry(payload) {
    return require('dw/svc/LocalServiceRegistry').createService('2c2p.http.transaction', {
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

module.exports = paymentInquiry;
