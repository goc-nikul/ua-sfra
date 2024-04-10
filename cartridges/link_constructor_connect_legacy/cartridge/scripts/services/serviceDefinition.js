'use strict';

/**
 * Definition file for the Constructor API service.
 * @returns {dw.svc.HTTPService} The service object.
 */
function init() {
  var initService = require('dw/svc/LocalServiceRegistry')
    .createService('constructor.http.api', {
      createRequest: function createRequest(service, params) {
        // eslint-disable-next-line max-len
        service.addHeader('User-Agent', 'Cartridge; Constructor Connect [javascript] SiteGenesis + SFRA); PLATFORM: SFCC ' + dw.system.System.compatibilityMode);
        service.addHeader('Content-Type', 'application/json');
        return params;
      },
      parseResponse: function parseResponse(_service, client) {
        return {
          headers: client.responseHeaders,
          statusCode: client.statusCode,
          response: client.text
        };
      },
      filterLogMessage: function filterLogMessage(message) {
        return message;
      }
    });

  return initService;
}

module.exports.init = init;
