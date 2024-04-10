var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var System = require('dw/system/System');

/**
 * Initializes a new HTTP service to perform API calls.
 * @returns {dw.svc.HTTPService} The service object.
 */
module.exports.init = function init() {
  var initService = LocalServiceRegistry
    .createService('constructor.http.api',
    {
      createRequest: function createRequest(service, params) {
        // eslint-disable-next-line max-len
        service.addHeader('User-Agent', 'Cartridge; Constructor Connect [javascript] SiteGenesis + SFRA); PLATFORM: SFCC ' + System.compatibilityMode);
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
};
