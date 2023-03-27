'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');

class Site extends require('../../../mocks/dw/dw_system_Site') {
    static getCurrent() {
        return {
            getTimezone: () => ''
        };
    }
}

Site.current = Site.getCurrent();

class Calendar {
    setTimeZone() {}
    toTimeString() {
        return '';
    }
}


function BaseOrder() {
    this.billing = {
        billingAddress: {
            address: {
                rfc: '',
                razonsocial: '',
                usoCFDI: '',
                regimenFiscal: '',
                codigoPostal: ''
            }
        }
    };
}

describe('app_ua_na/cartridge/models/order.js', () => {

    before(() => {
        mockSuperModule.create(BaseOrder);
    })

    global.empty = (params) => !params;

    it('Testing na model order.js', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_na/cartridge/models/order.js', {
            'dw/util/Calendar': Calendar,
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            'dw/system/Site': Site
        });
        var lineItemContainer = new (require('../../../mocks/dw/dw_order_Order'))();
        lineItemContainer.billingAddress = {};
        lineItemContainer.billingAddress.custom = {
            rfc: 'rfc',
            razonsocial: 'razonsocial',
            usoCFDI: {
                value: 'usoCFDI'
            },
            regimenFiscal: {
                value: 'regimenFiscal'
            },
            codigoPostal: 'codigoPostal'
        };

        var expectedCustomBillingModel = {
            rfc: 'rfc',
            razonsocial: 'razonsocial',
            usoCFDI: 'usoCFDI',
            regimenFiscal: 'regimenFiscal',
            codigoPostal: 'codigoPostal'
        };

        var order;
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer));
        assert.deepEqual(order.billing.billingAddress.address, expectedCustomBillingModel);
        assert.isNull(order.formatedCreationDate);
        var date = new Date();
        lineItemContainer.creationDate = date;
        order = new OrderModel(lineItemContainer);
        assert.equal(order.formatedCreationDate, '');
    });
});
