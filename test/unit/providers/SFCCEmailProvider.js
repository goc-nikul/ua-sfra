'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/SFCCEmailProvider', function() {

    class OrderModel {
        constructor() {}
    }

    global.request = {
        getLocale: function () {
            return 'en_US';
        }
    };

    let SFCCEmailProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/SFCCEmailProvider', {
        './AbstractEmailProvider': require('../../mocks/scripts/AbstractProvider'),
        '*/cartridge/scripts/helpers/emailHelpers': require('../../mocks/scripts/emailHelpers'),
        '*/cartridge/models/order': OrderModel,
        'dw/util/Locale': global.request
    });

    let options = {
        emailData: {type: 1},
        templateData: {}
    };
    let provider = new SFCCEmailProvider();
    provider.options = options;

    it('Testing method: getTemplateByEmailType', () => {
        let result = provider.getTemplateByEmailType(1); // registration
        assert.equal(result, 'checkout/confirmation/accountRegisteredEmail');

        result = provider.getTemplateByEmailType(3);
        assert.equal(result, 'account/password/passwordChangedEmail');

        result = provider.getTemplateByEmailType(2);
        assert.equal(result, 'account/password/passwordResetEmail');

        result = provider.getTemplateByEmailType(6);
        assert.equal(result, 'account/components/accountEditedEmail');

        result = provider.getTemplateByEmailType(7);
        assert.equal(result, 'account/components/orderFraudNotification');

        result = provider.getTemplateByEmailType();
        assert.equal(result, 'account/password/passwordChangedEmail');

        global.request = {
            getLocale: function () {
                return 'en_US';
            }
        };

        result = provider.getTemplateByEmailType(4);
        assert.equal(result, 'checkout/confirmation/confirmationEmail');
    });

    it('Testing method: send', () => {
        provider.send();
        assert.equal(true, options.emailData.isCalled);
    });
});
