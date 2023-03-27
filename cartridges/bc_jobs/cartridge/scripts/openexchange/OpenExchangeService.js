'use strict';

/**
 * Module initializes and exports local instance of openexchange service
 * @module avsService
 * @type {dw.svc.Service}
 */

module.exports = require('dw/svc/LocalServiceRegistry').createService('int.openexchange.http', {
    createRequest: function(svc, params) {
        return null;
    },
    parseResponse: function(svc, client) {
       return client;
    }
});
