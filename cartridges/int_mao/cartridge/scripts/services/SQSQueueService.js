'use service';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Utils = require('~/cartridge/scripts/helper/utils');
var authorize = require('*/cartridge/scripts/services/authorize');

/**
 * Service call to save order in MAO in SQS Queue
 * @return {Object} service object
 */
function saveOrderService() {
    return LocalServiceRegistry.createService('sqsQueue.save.order', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');

            var SignatureUrl = params.SignatureUrl
                .replace('{account}', params.account)
                .replace('{queue}', params.queue)
                .replace('{region}', params.awsRegion)
                .replace('{service}', params.servicename)
                .replace('{messageBody}', encodeURIComponent(JSON.stringify(params.data)))
                .replace('{messageHdr}', encodeURIComponent(JSON.stringify(params.messageHdr)));

            var time = Number((new Date().getTime() / 1000).toFixed(0)) * 1;
            // eslint-disable-next-line no-param-reassign
            params.time = time;
            var signature = new authorize.InitializeSignature(params);

            svc.addHeader(
                'Authorization',
                signature.getServiceAuthorizationHeader(
                    signature.calculateServiceSignature(
                        'POST',
                        SignatureUrl,
                        params.data
                    )
                )
            );
            svc.addHeader('Date', Utils.gmdate("yyyy-MM-dd'T'HH:mm:ss+00:00", time));
            svc.addHeader('User-Agent', 'SFCC Client 20.02.1');
            svc.setURL(params.url);

            return;
        },
        parseResponse: function (svc, response) {
            return response;
        }
    });
}


module.exports.saveOrderService = saveOrderService;
