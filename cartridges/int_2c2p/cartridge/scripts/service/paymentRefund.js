'use strict';

/**
 * Define and call payment refund service
 * @param {string} payload request payload
 * @returns {Object} returns service object
 */
function paymentRefund(payload) {
    return require('dw/svc/LocalServiceRegistry').createService('2c2p.http.refund', {
        createRequest: function (svc) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/x-www-form-URLencoded; charset=UTF-8');
            return 'paymentRequest=' + payload;
        },
        parseResponse: function (svc, response) {
            return response.text;
        }
    }).call();
}

module.exports = paymentRefund;
