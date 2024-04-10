/* eslint-disable no-param-reassign */
'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var svc = {
    setRequestMethod: () => true,
    addHeader: () => true
};

var createService = function (serviceName, callObj) {
    callObj.createRequest(svc, {
        payload: 'Abc'
    });
    callObj.call = (params) => {
        callObj.createRequest(svc, params);
        return {
            ok: true,
            object: {
                accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
                pdf: 'shipLabel',
                trackerCode: 'trackingNumber',
                routingCode: 'ConsignmentID'
            }
        };
    };
    callObj.getResponse = () => {
        return {
            statusCode: 201,
            text: '{ accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9" }'
        };
    };
    return callObj;
};

describe('int_ups/cartridge/scripts/service/upsServiceHelpers.js', () => {
    var dhlParcelServiceHelpers = proxyquire('../../../../../cartridges/int_dhl/cartridge/scripts/service/dhlParcelServiceHelpers.js', {
        'dw/svc/LocalServiceRegistry': {
            createService: createService
        },
        'app_ua_core/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
    });

    it('Testing method: dhlParcelServiceRequest', () => {
        var response = dhlParcelServiceHelpers.call();
        assert.equal(response.statusCode, 201);
    });
});
