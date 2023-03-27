'use strict';

const Logger = require('dw/system/Logger'),
    HTTPClient = require('dw/net/HTTPClient'),
    HTTPService = require('dw/svc/HTTPService'),
    LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

const Scene7Service = LocalServiceRegistry.createService('int_scene7.http', {
    createRequest: function(svc, params) {
        const url = svc.getConfiguration().credential.URL + params;
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        svc.setRequestMethod('GET');
        svc.setURL(url);
        return params;
    },
    parseResponse: function(svc, response) {
        if (response.statusCode === 200) {
            return response.text;
        } else {
            Logger.getLogger('Scene7').error('Scene7Service: Response status code {0}, response text {1}', response.statusCode, response.text);
        }
    }
});

const Scene7Mgr = {
    call: function(params) {
        Scene7Service.call(params);
        return Scene7Service.getResponse();
    }
}

module.exports = Scene7Mgr;
