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

describe('int_fedex_rest/cartridge/scripts/hooks/fedexShipment.js', () => {
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
                        carrierName: 'FedEx',
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
                        carrierName: 'FedEx',
                        accountNumber: '06266613'
                    });
                }

                return null;
            }
        };
    };

    var fedexServiceHelpers = proxyquire('../../../../../cartridges/int_fedex_rest/cartridge/scripts/service/fedexServiceHelpers.js', {
        'dw/svc/LocalServiceRegistry': {
            createService: createService
        },
        'app_ua_core/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
    });

    var fedexHelpers = proxyquire('../../../../../cartridges/int_fedex_rest/cartridge/scripts/helpers/fedexHelpers.js', {
        '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
        '*/cartridge/scripts/service/fedexServiceHelpers': fedexServiceHelpers,
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
    });

    var fedexShipment = proxyquire('../../../../../cartridges/int_fedex_rest/cartridge/scripts/hooks/fedexShipment.js', {
        '*/cartridge/scripts/helpers/fedexHelpers': fedexHelpers
    });

    it('Testing method: fedexShipment hook', function () {
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        assert.doesNotThrow(() => fedexShipment.shippingLabelAndTrackingNumber(order));
    });
});
