var httpService = require('*/cartridge/scripts/services/httpService');
var logger = require('*/cartridge/scripts/helpers/logger');

var DEFAULT_RETRY_TIMES = 3;

/**
 * Handles sending a request to the Constructor connect API.
 *
 * Note that this function will:
 * - Handle authentication.
 * - Handle retrying the request (by default, 3 attempts).
 *
 * @param {{
 *  url: string,
 *  payload: unknown,
 *  retryTimes: number | undefined,
 *  credentials: {
 *    apiToken: string,
 *    apiKey: string,
 *  }
 * }} args The function parameters.
 *
 * @returns {{
 *  response: dw.svc.Result,
 *  totalTimeMs: number
 * }} The api call result.
 */
module.exports = function performConstructorConnectRequest(args) {
  var maxAttempts = args.retryTimes || DEFAULT_RETRY_TIMES;
  var attempts = 0;

  var service = httpService.init();

  service.setURL(args.url);

  service.setAuthentication('NONE');
  service.setRequestMethod('POST');

  service.addHeader('api-token', args.credentials.apiToken);
  service.addHeader('api-key', args.credentials.apiKey);

  while (maxAttempts > attempts) {
    attempts += 1;

    var now = new Date();
    var response = service.call(args.payload);
    var totalTimeMs = new Date() - now;

    if (response.isOk()) {
      return {
        totalTimeMs: totalTimeMs,
        response: response
      };
    }

    logger.error(
      'Error while sending request to ' + args.url + ': ' + response.getErrorMessage(),
      {
        attempt: attempts + '/' + maxAttempts,
        totalTimeMs: totalTimeMs + 'ms'
      }
    );
  }

  throw new Error('Error while sending request, max attempts reached.');
};
