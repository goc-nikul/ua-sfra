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
            accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
            pdf: 'shipLabel',
            trackerCode: 'trackingNumber',
            routingCode: 'ConsignmentID'
        };
    };
    return callObj;
};

describe('int_dhl/cartridge/scripts/helpers/dhlHelpers.js', () => {
    var ReturnsUtils = function () {
        return {
            getPreferenceValue: function (preference) {
                if (preference === 'returnFromAddress') {
                    return JSON.stringify({
                        name: 'Under Armour Returns',
                        address: 'Stadionplein 10',
                        city: 'Amsterdam',
                        postalCode: '1076CM',
                        countryCode: 'NL',
                        phone: '00800-82766871',
                        carrierName: 'DHLParcel',
                        accountNumber: '06266613'
                    });
                }
                if (preference === 'returnAddress') {
                    return JSON.stringify({
                        name: 'Under Armour',
                        attentionName: 'Under Armour Returns',
                        address: 'POPEWEG 50',
                        city: 'VENLO',
                        postalCode: '5928SC',
                        countryCode: 'NL',
                        phone: '00800-82766871',
                        carrierName: 'DHLParcel',
                        accountNumber: '06266613'
                    });
                }

                return null;
            }
        };
    };
    global.empty = (data) => {
        return !data;
    };
    var dhlParcelServiceHelpers = proxyquire('../../../../../cartridges/int_dhl/cartridge/scripts/service/dhlParcelServiceHelpers.js', {
        'dw/svc/LocalServiceRegistry': {
            createService: createService
        },
        'app_ua_core/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
    });

    var dhlHelpers = proxyquire('../../../../../cartridges/int_dhl/cartridge/scripts/helpers/dhlHelpers.js', {
        '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
        '*/cartridge/scripts/service/dhlParcelServiceHelpers': dhlParcelServiceHelpers,
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
    });

    it('Testing method: fetchDHLExpressShippingAndTrackingNumber', () => {
        assert.equal(dhlHelpers.fetchDHLExpressShippingAndTrackingNumber(), null);
    });

    it('Testing method: fetchDHLParcelShippingAndTrackingNumber', () => {
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        var labelResponse = dhlHelpers.fetchDHLParcelShippingAndTrackingNumber(order);
        assert.equal(labelResponse.shipLabel, 'shipLabel');
        assert.equal(labelResponse.trackingNumber, 'trackingNumber');
        assert.equal(labelResponse.ConsignmentID, 'ConsignmentID');
    });
});
