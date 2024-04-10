/* eslint-disable no-param-reassign */
'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const mockObject = require('../../../../../cartridges/int_fedex_rest/cartridge/scripts/service/mockHelper.js');

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
            object: mockObject.fedexLabelMock
        };
    };
    callObj.getResponse = () => {
        return mockObject.fedexLabelMock;
    };
    return callObj;
};

class Locale {
    constructor() {
        this.ID = 'Default';
        this.country = 'GB';
    }
    // eslint-disable-next-line no-unused-vars
    static getLocale(id) {
        return {
            getCountry: () => {
                return this.country;
            }
        };
    }
}

describe('int_fedex_rest/cartridge/scripts/helpers/fedexHelpers.js', () => {
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
    global.empty = (data) => {
        return !data;
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
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/util/Locale': Locale
    });

    it('Testing method: fetchFedexShipmentShippingAndTrackingNumber', () => {
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        var labelResponse = fedexHelpers.fetchFedexShipmentShippingAndTrackingNumber(order);
        assert.equal(labelResponse.shipLabel, mockObject.fedexLabelMock.output.transactionShipments[0].pieceResponses[0].packageDocuments[0].encodedLabel);
        assert.equal(labelResponse.trackingNumber, mockObject.fedexLabelMock.output.transactionShipments[0].pieceResponses[0].trackingNumber);
        assert.equal(labelResponse.ConsignmentID, mockObject.fedexLabelMock.output.transactionShipments[0].pieceResponses[0].trackingNumber);
    });
});
