'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('plugin_productpersonalize/cartridge/models/personlize', () => {
    const personalizePreferences = proxyquire('../../../cartridges/plugin_productpersonalize/cartridge/config/peronslizePreferences', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });
    var Decorator = proxyquire('../../../cartridges/plugin_productpersonalize/cartridge/models/personalize', {
        '*/cartridge/config/peronslizePreferences': personalizePreferences,
        'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
        'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource')
    });

    var customObj = {
        custom: {
            ID: 'personlize_product',
            jerseyStyle: '1234',
            frontImage: 'frontimg.jpg',
            backImage: 'backimg.jpg',
            enableSponsors: true,
            frontImageSponsors: 'frontimg.jpg',
            backImageSponsors: 'backimg.jpg',
            nameLocation: 'above',
            personalizationInfo: 'Personlization Info',
            nopersonalizationsOption: 0,
            nameOption: 10,
            numberOption: 20,
            namenumberOption: 10,
            sponsorsOption: 10,
            namesponsorsOption: 10,
            numbersponsorsOption: 10,
            namenumbersponsorsOption: 10,
            defaultOption: true
        }
    };

    global.session = {
        currency: {
            currencyCode: 'AUD'
        }
    };
    var obj = new Decorator(customObj);

    // validate custom object is null or not
    it('Testing custom object productID condition', () => {
        assert.notEqual(obj.productID, '');
    });

    it('Testing custom object jerseyStyle condition', () => {
        assert.isNotNull(obj.jerseyStyle, 'Jersey Style Null');
    });

    it('Testing custom object nopersonalizationsOption condition', () => {
        assert.equal(obj.nopersonalizationsOption, '$0.00');
    });

    it('Testing custom object nameOption condition', () => {
        assert.notEqual(obj.nameOption, '$0.00');
    });

    it('Testing custom object numberOption condition', () => {
        assert.notEqual(obj.numberOption, '$0.00');
    });

    it('Testing custom object namenumberOption condition', () => {
        assert.notEqual(obj.namenumberOption, '$0.00');
    });

    it('Testing custom object sponsorsOption condition', () => {
        assert.notEqual(obj.sponsorsOption, '$0.00');
    });

    it('Testing custom object namesponsorsOption condition', () => {
        assert.notEqual(obj.namesponsorsOption, '$0.00');
    });

    it('Testing custom object numbersponsorsOption condition', () => {
        assert.notEqual(obj.numbersponsorsOption, '$0.00');
    });

    it('Testing custom object namenumbersponsorsOption condition', () => {
        assert.notEqual(obj.namenumbersponsorsOption, '$0.00');
    });

});
