'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var service = {
    setRequestMethod: () => {},
    setURL: () => {},
    addHeader: () => {},
    configuration: {
        credential: {
            user: 'user',
            password: 'password'
        }
    }
};

describe('int_narvar/cartridge/scripts/init/NarvarService.js', () => {
    global.empty = (data) => {
        return !data;
    };
    it('Testing getNarvarService: get the NarvarService', () => {
        var NarvarService = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/init/NarvarService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service, {
                        request: 'request'
                    });
                    return callbackObject.parseResponse('', {
                        status: 200
                    });
                }
            },
            'dw/util/StringUtils': {
                encodeBase64: function () {}
            }
        });
        var result = NarvarService.getNarvarService;
        assert.isDefined(result, 'result not defined');
    });
});
