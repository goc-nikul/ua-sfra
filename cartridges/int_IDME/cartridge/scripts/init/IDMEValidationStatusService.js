/* eslint-disable spellcheck/spell-checker */
/**
 * Initialize HTTP services for a cartridge
 */
'use strict';

var IDMEHelper = require('../util/IDMEHelper');

module.exports = require('dw/svc/LocalServiceRegistry').createService('int_idme.http.validationstatus', {
    createRequest: function (svc, requestString) {
        svc.setRequestMethod('GET');
        svc.setURL(requestString);
        svc.addHeader('X-API-ORIGIN', 'DEMANDWARE');

        return '';
    },
    parseResponse: function (svc, client) {
        return IDMEHelper.parseValidationResponse(svc, client);
    },
    mockCall: function (svc, client) {
        return IDMEHelper.getMockedIDMEValidationStatusResponse(svc, client);
    }
});
