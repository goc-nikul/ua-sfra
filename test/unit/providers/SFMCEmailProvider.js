'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/SFMCEmailProvider', function() {
    let HookMgr = require('../../mocks/dw/dw_system_HookMgr');

    let SFMCEmailProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/SFMCEmailProvider', {
        './AbstractEmailProvider': require('../../mocks/scripts/AbstractProvider'),
        '*/cartridge/scripts/helpers/emailHelpers': require('../../mocks/scripts/emailHelpers'),
        'dw/system/HookMgr': HookMgr
    });

    var options = {
        emailData: {
            type: 1
        },
        params: {},
        templateData: {
            resettingCustomer: 'resettingCustomer'
        }
    };

    let provider = new SFMCEmailProvider();
    provider.options = options;

    it('Testing method: updateRequestData', () => {
        let result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.account.created');
        
        options.emailData.type = 2;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.account.passwordReset');
        
        options.emailData.type = 3;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.account.passwordChanged');
        
        options.emailData.type = 4;
        options.templateData = {order: 'Test order'};
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.order.confirmation');
        
        options.emailData.type = 6;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.account.updated');
        
        options.emailData.type = 7;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.order.fraud');
        
        options.emailData.type = 8;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.order.invoiceConfirmation');

        options.emailData.type = 9;
        options.eGiftCardsDetails = {};
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.giftCertificate.sendCertificate');

        options.emailData.type = 10;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.order.returnLabel');

        options.emailData.type = 11;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.oms.shipment');

        options.emailData.type = 12;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.oms.orderRefund');

        options.emailData.type = 13;
        result = provider.updateRequestData(options);
        assert.equal(result.hookID, 'app.communication.oms.returnOrderCreated');
    });

    it('Testing method: send', () => {
        provider.send();
        let isCalled = HookMgr.isCalled;
        assert.equal(true, isCalled);
    });
});
