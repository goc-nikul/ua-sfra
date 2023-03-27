/* eslint-disable spellcheck/spell-checker */
/**
 * Initialize HTTP services for a cartridge
 */
'use strict';

var IDMEHelper = require('../util/IDMEHelper');

module.exports = require('dw/svc/LocalServiceRegistry').createService('int_idme.http.tokendata', {
    createRequest: function (svc, options) {
        svc.setRequestMethod('POST');
        svc.setURL(options.apiEndpointURI);
        svc.addHeader('X-API-ORIGIN', 'DEMANDWARE');

        return options.payload;
    },
    parseResponse: function (svc, client) {
        return IDMEHelper.parseTokenDataResponse(svc, client);
    },
    mockCall: function (svc, client) {
        return IDMEHelper.getMockedIDMEResponse(svc, client);
    }
});
