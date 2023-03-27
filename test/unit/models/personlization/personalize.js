'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const PersonlizeModel = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/models/personalize.js', {
    'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
    '*/cartridge/config/peronslizePreferences': {
        scene7BaseURL: ''
    },
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource')
});

global.empty = (params) => !params;
global.session = {
    currency: {
        currencyCode: 'USD'
    }
};

var customObj = {
    custom: {
        ID: null,
        jerseyStyle: null,
        frontImage: null,
        backImage: null,
        enableSponsors: null,
        frontImageSponsors: null,
        backImageSponsors: null,
        nameLocation: null,
        personalizationInfo: null,
        nopersonalizationsOption: null,
        nameOption: null,
        numberOption: null,
        namenumberOption: null,
        sponsorsOption: null,
        namesponsorsOption: null,
        numbersponsorsOption: null,
        namenumbersponsorsOption: null,
        defaultOption: null
    }
};

describe('plugin_productpersonalize/cartridge/models/personalize.js', () => {

    it('Test personalize model if provided custom object is null', () => {
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel();
        });
        assert.isUndefined(personalize.productID, 'ProductID should not exists');
        assert.isNotNull(personalize.productID, 'ProductID should not null');

        assert.isUndefined(personalize.jerseyStyle, 'jerseyStyle should not exists');
        assert.isNotNull(personalize.jerseyStyle, 'jerseyStyle should not null');

        assert.isUndefined(personalize.frontImage, 'frontImage should not exists');
        assert.isNotNull(personalize.frontImage, 'frontImage should not null');

        assert.isUndefined(personalize.backImage, 'backImage should not exists');
        assert.isNotNull(personalize.backImage, 'backImage should not null');

        assert.isUndefined(personalize.enableSponsors, 'enableSponsors should not exists');
        assert.isNotNull(personalize.enableSponsors, 'enableSponsors should not null');

        assert.isUndefined(personalize.frontImageSponsors, 'frontImageSponsors should not exists');
        assert.isNotNull(personalize.frontImageSponsors, 'frontImageSponsors should not null');

        assert.isUndefined(personalize.backImageSponsors, 'backImageSponsors should not exists');
        assert.isNotNull(personalize.backImageSponsors, 'backImageSponsors should not null');

        assert.isUndefined(personalize.nameLocation, 'nameLocation should not exists');
        assert.isNotNull(personalize.nameLocation, 'nameLocation should not null');

        assert.isUndefined(personalize.personalizationInfo, 'personalizationInfo should not exists');
        assert.isNotNull(personalize.personalizationInfo, 'personalizationInfo should not null');
    });

    it('Test personalize model for product is null', () => {
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should be null');

        assert.isDefined(personalize.frontImage, 'frontImage should not exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage should null');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
    });

    it('Test personalize model for product is not null', () => {
        customObj.custom.ID = 'OC_1234';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should not exists');
        assert.equal(personalize.productID, '1234');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should be null');

        assert.isDefined(personalize.frontImage, 'frontImage should not exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage should null');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.ID = null;
    });

    it('Test personalize model for jerseyStyle is not null', () => {
        customObj.custom.jerseyStyle = 'Black';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.equal(personalize.jerseyStyle, 'Black');

        assert.isDefined(personalize.frontImage, 'frontImage should not exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage should null');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.jerseyStyle = null;
    });

    it('Test personalize model for frontImage is not null', () => {
        customObj.custom.frontImage = 'frontImage';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should not exists');
        assert.equal(personalize.frontImage, 'frontImage');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage should null');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.frontImage = null;
    });

    it('Test personalize model for backImage is not null', () => {
        customObj.custom.backImage = 'backImage';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.equal(personalize.backImage, 'backImage');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.backImage = null;
    });

    it('Test personalize model for enableSponsors is not null', () => {
        customObj.custom.enableSponsors = 'true';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isTrue(personalize.enableSponsors, 'enableSponsors should null');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.enableSponsors = null;
    });

    it('Test personalize model for frontImageSponsors is not null', () => {
        customObj.custom.frontImageSponsors = 'frontImageSponsors';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null - 111');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.equal(personalize.frontImageSponsors, 'frontImageSponsors');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.frontImageSponsors = null;
    });

    it('Test personalize model for backImageSponsors is not null', () => {
        customObj.custom.backImageSponsors = 'backImageSponsors';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null - 111');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors should null');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.equal(personalize.backImageSponsors, 'backImageSponsors');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.backImageSponsors = null;
    });

    it('Test personalize model for backImageSponsors is not null', () => {
        customObj.custom.nameLocation = {
            value: 'nameLocation'
        };
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null - 111');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors should null');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.equal(personalize.nameLocation, 'nameLocation');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.isNull(personalize.personalizationInfo, 'personalizationInfo should null');
        customObj.custom.nameLocation = null;
    });

    it('Test personalize model for personalizationInfo is not null', () => {
        customObj.custom.personalizationInfo = 'personalizationInfo';
        var personalize;
        assert.doesNotThrow(() => {
            personalize = new PersonlizeModel(customObj);
        });
        assert.isDefined(personalize.productID, 'ProductID should exists');
        assert.equal(personalize.productID, '');

        assert.isDefined(personalize.jerseyStyle, 'jerseyStyle should exists');
        assert.isNull(personalize.jerseyStyle, 'jerseyStyle should null');

        assert.isDefined(personalize.frontImage, 'frontImage should exists');
        assert.isNull(personalize.frontImage, 'frontImage should null');

        assert.isDefined(personalize.backImage, 'backImage should exists');
        assert.isNull(personalize.backImage, 'backImage');

        assert.isDefined(personalize.enableSponsors, 'enableSponsors should exists');
        assert.isFalse(personalize.enableSponsors, 'enableSponsors should null - 111');

        assert.isDefined(personalize.frontImageSponsors, 'frontImageSponsors should exists');
        assert.isNull(personalize.frontImageSponsors, 'frontImageSponsors');

        assert.isDefined(personalize.backImageSponsors, 'backImageSponsors should exists');
        assert.isNull(personalize.backImageSponsors, 'backImageSponsors');

        assert.isDefined(personalize.nameLocation, 'nameLocation should exists');
        assert.isNull(personalize.nameLocation, 'nameLocation should null');

        assert.isDefined(personalize.personalizationInfo, 'personalizationInfo should exists');
        assert.equal(personalize.personalizationInfo, 'personalizationInfo');
        customObj.custom.personalizationInfo = null;
    });

});
