'use service';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var GoogleServiceAccountAuth = require('*/cartridge/scripts/services/GoogleServiceAccountAuth');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

/**
 * Service call to save order in MAO in Google PubSub Queue
 * @return {Object} service object
 */
function saveOrderService() {
    return LocalServiceRegistry.createService('pubSubQueue.save.order', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');

            var payload = {
                iss: params.client_email,
                sub: params.client_email,
                aud: 'https://pubsub.googleapis.com/',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
            };
            var BearerToken = GoogleServiceAccountAuth.generateJWT(payload, params.private_key_id, params.private_key);
            svc.addHeader('Authorization', 'Bearer ' + BearerToken);

            var credential = svc.getConfiguration().getCredential();
            var url = credential.getURL().replace('{project}', params.project_id).replace('{topic}', params.topic_id);
            svc.setURL(url);

            var queueMessage = JSON.stringify(params.queueMessage);
            var queueMessageAttributes = params.queueMessageAttributes;
            var requestData = JSON.stringify({
                messages: [
                    {
                        data: Encoding.toBase64(new Bytes(queueMessage)),
                        attributes: queueMessageAttributes
                    }
                ]
            });
            return requestData;
        },
        parseResponse: function (svc, response) {
            return response;
        }
    });
}

module.exports.saveOrderService = saveOrderService;
