'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var svc = {
    setURL: () => true,
    getConfiguration: () => {
        return {
            getCredential: () => {
                return {
                    getURL: () => 'url'
                };
            },
            getProfile: () => {
                return {
                    getTimeoutMillis: () => 5000
                };
            }
        };
    },
    configuration: {
        profile: {}
    },
    serviceClient: {
        processShipment: () => true
    }
};

var createService = function (svcName, callBackObj) {
    callBackObj.mockFull();
    callBackObj.initServiceClient(svc);
    callBackObj.createRequest(svc);
    callBackObj.execute(svc, {});
    return callBackObj.parseResponse();
};

describe('int_ups/cartridge/scripts/service/upsServiceHelpers.js', () => {

    var upsServiceHelpers = proxyquire('../../../../../cartridges/int_ups/cartridge/scripts/service/upsServiceHelpers.js', {
        'dw/svc/LocalServiceRegistry': {
            createService: createService
        },
        'dw/ws/WSUtil': {
            setRequestTimeout: () => true
        },
        '*/cartridge/scripts/helpers/shipmentShip': {
            createRequest: () => true,
            parseResponse: () => 'parsed_response',
            mockResponse: () => 'mock_response'
        }
    });

    it('Testing method: shipmentShipRequest', () => {
        global.webreferences2 = {
            Ship: {
                getDefaultService: () => '2022'
            }
        }
        assert.equal(upsServiceHelpers.shipmentShipRequest(), 'parsed_response');
    });

});
