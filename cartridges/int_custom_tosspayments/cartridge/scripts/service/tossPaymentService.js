'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');

/**
 * Creates basic authentication header for toss payments using secret key
 * @returns {string} encoded string
 */
function getAuthorizationHeader() {
    var Site = require('dw/system/Site');
    var secretKey = Site.getCurrent().getCustomPreferenceValue('tossPaymentsSecretKey');
    var encodedKey = StringUtils.encodeBase64(secretKey + ':');
    return 'Basic ' + encodedKey;
}

exports.paymentService = LocalServiceRegistry.createService('tosspayments.api', {
    createRequest: (svc, requestObject) => {
        var url = svc.getConfiguration().credential.URL + '/payments/' + requestObject.paymentKey;

        svc.setRequestMethod('POST');
        svc.setURL(url);
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Authorization', getAuthorizationHeader());

        return JSON.stringify(requestObject);
    },
    parseResponse: (svc, response) => {
        return response;
    }
});

exports.cancelService = LocalServiceRegistry.createService('tosspayments.api', {
    createRequest: (svc, requestObject) => {
        var url = svc.getConfiguration().credential.URL + '/payments/' + requestObject.paymentKey + '/cancel';

        svc.setRequestMethod('POST');
        svc.setURL(url);
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Authorization', getAuthorizationHeader());

        return requestObject.body;
    },
    parseResponse: function (svc, response) {
        return response;
    }
});
