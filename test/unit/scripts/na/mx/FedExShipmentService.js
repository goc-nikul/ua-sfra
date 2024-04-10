'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

let serviceRequest;

describe('app_ua_mx/cartridge/scripts/init/FedExShipmentService.js', () => {
    beforeEach(() => {
        global.webreferences2 = {
            ShipService_v17: {
                getDefaultService: () => {}
            }
        };

        var fedExShipmentService = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/init/FedExShipmentService.js', {
            'int_fedex/cartridge/scripts/util/FedExHelper': function FedExHelper() {
                this.createFedExShipmentProcessRequest = () => {};
                this.parseFedExShipmentProcessResponse = () => {};
                this.getMockedFedExShipmentProcessResponse = () => {
                    return new (require('dw/svc/Result'))();
                };
            }
        });

        serviceRequest = fedExShipmentService.shipRequest;
        serviceRequest.configObj.configuration = new (require('dw/svc/ServiceConfig'))();
        serviceRequest.setServiceClient({
            processShipment: () => {}
        });
    });

    it('Testing the initialization of the MX FedExShipmentService service', () => {
        var result = serviceRequest.call();
        assert.isTrue(result.isOk());
    });

    it('Testing the initialization of the MX FedExShipmentService service, use mock', () => {
        serviceRequest.setMock();
        var result = serviceRequest.call();
        assert.isFalse(result.isMockResult());
    });

    it('Testing the initialization of the MX FedExShipmentService service, with no credentials', () => {
        serviceRequest.configuration.credential = undefined;
        var result = serviceRequest.call();
        assert.isTrue(result.isOk());
    });
});
