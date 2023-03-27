var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Service configuration for PerimeterX collector calls
 * @return {object}                result of the service call
 */
var collectorAPIService = LocalServiceRegistry.createService('int_perimeterx.https.collector', {
    createRequest: function (svc, result) {
        return result;
    },
    parseResponse: function (svc, httpClient) {
        var result;

        try {
            result = JSON.parse(httpClient.text);
        } catch (e) {
            result = httpClient.text;
        }
        return result;
    },
    filterLogMessage: function (msg) {
        if (msg) {
            msg = msg.replace(/UserAgent=.*?&/, 'UserAgent=************&');
            msg = msg.replace(/Auth=.*?&/, 'Auth=************&');
        }
        return msg;
    }
});

/**
 * Service configuration for PerimeterX first-party calls
 * @return {object}                result of the service call
 */
var collectorFirstPartyAPIService = LocalServiceRegistry.createService('int_perimeterx.https.collector', {
    createRequest: function (svc, result) {
        return result;
    },
    parseResponse: function (svc, httpClient) {
        var result = {};
        result.headers = httpClient.getResponseHeaders();
        result.statusCode = httpClient.statusCode;
        result.text = httpClient.text;
        return result;
    },
    filterLogMessage: function (msg) {
        if (msg) {
            msg = msg.replace(/UserAgent=.*?&/, 'UserAgent=************&');
            msg = msg.replace(/Auth=.*?&/, 'Auth=************&');
        }
        return msg;
    }
});

/**
 * Service configuration for PerimeterX challenge calls
 * @return {object}                result of the service call
 */
var captchaScriptService = LocalServiceRegistry.createService('int_perimeterx.https.captchaScript', {
    createRequest: function (svc, result) {
        return result;
    },
    parseResponse: function (svc, httpClient) {
        var result = {};
        result.text = httpClient.text;
        result.headers = httpClient.getResponseHeaders();
        return result;
    },
    filterLogMessage: function (msg) {
        if (msg) {
            msg = msg.replace(/UserAgent=.*?&/, 'UserAgent=************&');
            msg = msg.replace(/Auth=.*?&/, 'Auth=************&');
        }
        return msg;
    }
});

/**
 * Service configuration for PerimeterX client calls
 * @return {object}                result of the service call
 */
var clientAPIService = LocalServiceRegistry.createService('int_perimeterx.https.client', {
    createRequest: function (svc, result) {
        return result;
    },
    parseResponse: function (svc, httpClient) {
        var result = {};
        result.text = httpClient.text;
        result.headers = httpClient.getResponseHeaders();
        result.statusCode = httpClient.statusCode;
        return result;
    },
    filterLogMessage: function (msg) {
        if (msg) {
            msg = msg.replace(/UserAgent=.*?&/, 'UserAgent=************&');
            msg = msg.replace(/Auth=.*?&/, 'Auth=************&');
        }
        return msg;
    }
});

module.exports = {
    collectorAPIService: collectorAPIService,
    captchaScriptService: captchaScriptService,
    clientAPIService: clientAPIService,
    collectorFirstPartyAPIService: collectorFirstPartyAPIService
};
