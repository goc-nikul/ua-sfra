'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_brandify/cartridge/scripts/services/BrandifyService.js', () => {

    var svc = {
        setRequestMethod: () => true,
        setAuthentication: () => true,
        addHeader: () => true,
        addParam: () => true
    }

    var createService = function (serviceName, callObj) {
        callObj.createRequest(svc, {
            payload: 'Abc'
        });
        return callObj.parseResponse(null, {
            payload: 'Abc'
        });
    };

    var brandifyService = proxyquire('../../../../../cartridges/int_brandify/cartridge/scripts/services/BrandifyService.js', {
        'dw/svc/LocalServiceRegistry': {
            createService: createService
        }
    });

    it('Testing method: brandify service', () => {
        assert.deepEqual(brandifyService, {
            payload: 'Abc'
        });
    });

});
