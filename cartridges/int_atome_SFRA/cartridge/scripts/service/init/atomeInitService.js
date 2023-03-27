'use strict';

/**
 * This is the Authentication service to communicate with Atome
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var atomeService = LocalServiceRegistry.createService('atome.http.service', {

    createRequest: function (svc, args) {
        svc.addHeader('Content-Type', 'application/json');
        return args;
    },

    parseResponse: function (svc, client) {
        return client.text;
    },

    filterLogMessage: function (msg) {
        //  No need to filter logs.  No sensitive information.
        return msg;
    }
});

exports.atomeService = atomeService;
