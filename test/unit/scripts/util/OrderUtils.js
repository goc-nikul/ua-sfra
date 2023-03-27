'use strict';
/* eslint-disable */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class Bytes {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    toString() {
        return this.secretKey;
    }
}

class Cipher {
    encrypt(input) {
        return input;
    }
}


describe('OrderUtils: app_ua_core/cartridge/scripts/util/OrderUtils test', () => {

    var OrderUtils = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/OrderUtils', {
        'dw/crypto/Encoding': {
            toBase64: function(input) {
                return input;
            }
        },
        'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        'dw/crypto/Cipher': Cipher,
        'dw/util/Bytes': Bytes,
        'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {
            prepareURLForLocale: function(url, locale) {
                return url + '/' + locale;
            }
        }
    });

    var orderCreationDate = new Date();

    it('Testing method: getPDFDistanceSalesAgreementURL', () => {
        global.request =  {
            locale: 'en_US'
        }
        var result = OrderUtils.getPDFDistanceSalesAgreementURL('fsdcsfsfsfwewqewe', orderCreationDate);
        assert.equal(result, 'test/Order-DistanceSalesAgreement/en_US');
    });

    it('Testing method: authorizeOrderPayment', () => {
        global.request =  {
            locale: 'en_US'
        }
        var result = OrderUtils.getPDFPreDisclosureFormURL('fsdcsfsfsfwewqewe', orderCreationDate);
        assert.equal(result, 'test/Order-PreDisclosureForm/en_US');
    });
});