'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', () => {

    it('Testing productPersonalization model for null and defined', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {},
            '*/cartridge/config/peronslizePreferences': {},
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var productPersonalization = new ProductPersonalizationModel();
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
    });

    it('Testing productPersonalization model if isPersonalizationEligible is disabled', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => false
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: () => false
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var product = {};
        var lineItem = {
            custom: {
                jerseyNameText: 'jerseyNameText',
                jerseyNumberText: 'jerseyNumberText',
                sponsors: 'Yes'
            }
        };
        var productPersonalization = new ProductPersonalizationModel(product, lineItem);
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
        assert.isFalse(product.isPersonalizationEligible, 'productPersonalization should be false');
    });

    it('Testing productPersonalization model if isPersonalizationEligible is enabled', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => true
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: () => true
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var product = {};
        var lineItem = {
            custom: {
                jerseyNameText: 'jerseyNameText',
                jerseyNumberText: 'jerseyNumberText',
                sponsors: 'Yes'
            }
        };
        var productPersonalization = new ProductPersonalizationModel(product, lineItem);
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
        assert.isTrue(product.isPersonalizationEligible, 'productPersonalization should be true');
        assert.equal(product.personalizationName, 'jerseyNameText');
        assert.equal(product.personalizationNumber, 'jerseyNumberText');
        assert.isTrue(product.personalizationSponsors, 'personalizationSponsors should be true');
        assert.isNotNull(product.personalizationDetail, 'personalizationDetail should not be null');
        assert.equal(product.personalizationDetail, 'testMsgf');
    });

    it('Testing productPersonalization model if isPersonalizationEligible is enabled and lineitem not exists', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => true
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: () => true
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var product = {};
        var lineItem = {
            custom: {
                jerseyNameText: null,
                jerseyNumberText: null,
                sponsors: null
            }
        };
        var productPersonalization = new ProductPersonalizationModel(product, lineItem);
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
        assert.isFalse(product.isPersonalizationEligible, 'productPersonalization should be true');
        assert.isUndefined(product.personalizationName, 'personalizationName is not defined');
        assert.isUndefined(product.personalizationNumber, 'personalizationNumber is not defined');
        assert.isUndefined(product.personalizationSponsors, 'personalizationSponsors should be true');
        assert.isUndefined(product.personalizationDetail, 'personalizationDetail should not be null');
    });


    it('Testing productPersonalization model if isPersonalizationEligible is enabled and only lineitem Jersey name exists', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => true
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: () => true
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var product = {};
        var lineItem = {
            custom: {
                jerseyNameText: 'jerseyNameText',
                jerseyNumberText: null,
                sponsors: null
            }
        };
        var productPersonalization = new ProductPersonalizationModel(product, lineItem);
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
        assert.isTrue(product.isPersonalizationEligible, 'productPersonalization should be true');
        assert.isNotNull(product.personalizationName, 'personalizationName is null');
        assert.equal(product.personalizationNumber, '');
        assert.isFalse(product.personalizationSponsors, 'personalizationSponsors should be true');
        assert.equal(product.personalizationDetail, 'testMsgf');
    });

    it('Testing productPersonalization model if isPersonalizationEligible is enabled and only lineitem Jersey number exists', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => true
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: () => true
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var product = {};
        var lineItem = {
            custom: {
                jerseyNameText: null,
                jerseyNumberText: 'jerseyNumberText',
                sponsors: null
            }
        };
        var productPersonalization = new ProductPersonalizationModel(product, lineItem);
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
        assert.isTrue(product.isPersonalizationEligible, 'productPersonalization should be true');
        assert.equal(product.personalizationName, '');
        assert.equal(product.personalizationNumber, 'jerseyNumberText');
        assert.isFalse(product.personalizationSponsors, 'personalizationSponsors should be true');
        assert.equal(product.personalizationDetail, 'testMsgf');
    });

    it('Testing productPersonalization model if isPersonalizationEligible is enabled and only lineitem Jersey number exists', () => {
        var ProductPersonalizationModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/productPersonalization.js', {
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => true
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: () => true
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource')
        });
        var product = {};
        var lineItem = {
            custom: {
                jerseyNameText: null,
                jerseyNumberText: null,
                sponsors: 'Yes'
            }
        };
        var productPersonalization = new ProductPersonalizationModel(product, lineItem);
        assert.isNotNull(productPersonalization, 'productPersonalization is null');
        assert.isDefined(productPersonalization, 'productPersonalization in not defined');
        assert.isTrue(product.isPersonalizationEligible, 'productPersonalization should be true');
        assert.equal(product.personalizationName, '');
        assert.equal(product.personalizationNumber, '');
        assert.isTrue(product.personalizationSponsors, 'personalizationSponsors should be true');
        assert.isNull(product.personalizationDetail, 'personalizationDetail is not null');
    });

});
