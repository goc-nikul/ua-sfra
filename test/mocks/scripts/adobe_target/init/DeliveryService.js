const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const HTTPService = require('dw/svc/HTTPService');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

class DeliveryServiceMock extends HTTPService {
    constructor(configObj) {
        super(configObj);
        this.response = {
            text: JSON.stringify({
                status: 200,
                id: {
                    marketingCloudVisitorId: '',
                    tntId: ''
                },
                execute: {
                    mboxes: [
                        {
                            name: 'testMboxId',
                            analytics: { payload: { tnta: '' } }
                        }
                    ]
                }
            }),
            statusCode: 200,
            getText: () => this.response.text,
            getStatusCode: () => this.response.statusCode
        };
    }
}

class LocalServiceRegistryMock extends LocalServiceRegistry {
    static createService(serviceId, configObj) {
        if (!serviceId) {
            throw new Error();
        }

        return new DeliveryServiceMock(configObj);
    }
}

function proxyModel() {
    return proxyquire(
        '../../../../../cartridges/int_adobe_target/cartridge/scripts/init/DeliveryService',
        {
            'dw/svc/LocalServiceRegistry': LocalServiceRegistryMock,
            '~/cartridge/scripts/adobeTargetPreferences': require('../adobeTargetPreferences'),
            'int_adobe_target/cartridge/scripts/util/DeliveryHelper': require('../util/DeliveryHelper')
        }
    );
}

module.exports = proxyModel();
