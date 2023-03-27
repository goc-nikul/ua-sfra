'use strict';

/* eslint-disable no-unused-vars */
/* eslint-disable spellcheck/spell-checker */

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Service call to Brandify to get stores based on postal code
 * @return {void}
 */
module.exports = require('dw/svc/LocalServiceRegistry').createService('brandify.store.locator.search', {
    createRequest: function (svc, requestData) {
        svc.setRequestMethod('POST');
        svc.setAuthentication('NONE');
        svc.addHeader('Content-Type', 'application/json');
        svc.addParam('lang', 'en_US');
        return JSON.stringify(requestData);
    },
    parseResponse: function (svc, response) {
        return response;
    }
});
