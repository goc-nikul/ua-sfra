require('dw-api-mock/demandware-globals');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

describe('int_mao/cartridge/scripts/services/GooglePubSubQueueService', function () {
    it('Testing the initialization and service call of the GooglePubSubQueueService', () => {
        const googlePubSubQueueService = proxyquire(
            '../../../../cartridges/int_mao/cartridge/scripts/services/GooglePubSubQueueService',
            {
                '*/cartridge/scripts/services/GoogleServiceAccountAuth': {
                    generateJWT:() => {
                        return 'OGUyNjcwYWM0YWY5Y2YxY'
                    }
                }
            }
        );

        var serviceRequest = googlePubSubQueueService.saveOrderService();
        serviceRequest.setRequestMethod = () => {};
        serviceRequest.addHeader = () => {};

        var params = {
            client_email: 'client_email',
            private_key_id: 'private_key_id',
            private_key: 'private_key',
            project_id: 'project_id',
            topic_id: 'project_id',
            queueMessage: {
                message: 'message'
            }
        };
        var result = serviceRequest.call(params);
        assert.isTrue(result.isOk());
    });
});
