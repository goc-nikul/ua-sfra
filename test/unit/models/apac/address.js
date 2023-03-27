'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseAddressModelMock = require('./baseAddressModel');
var AddressModel;

var addressObject = {
    stateCode: 'TAS',
    city: 'Wellington',
    countryCode: {
        value: 'HK'
    },
    phone: '0101111111',
    custom: {
        suburb: 'Stonefields',
        district: 'Canterbury',
        businessName: 'Under Armour',
        phone1: '010',
        phone2: '111',
        phone3: '1111'
    }
};

var createOrderAddress = function () {
    return {
        address1: '1 Drury Lane',
        address2: null,
        countryCode: {
            displayValue: 'United States',
            value: 'US'
        },
        firstName: 'The Muffin',
        lastName: 'Man',
        city: 'Far Far Away',
        phone: '010-111-1111',
        postalCode: '04330',
        stateCode: 'ME',
        custom: {
            suburb: 'Stonefields',
            district: 'Canterbury',
            businessName: 'Under Armour'
        }
    };
};

global.empty = function (params) { return !params; }

describe('app_ua_apac/cartridge/models/address', () => {

    before(function () {
        mockSuperModule.create(baseAddressModelMock);
        AddressModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/address.js', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    };
                }
            },
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: false
            }
        });
    });

    it('Testing for address model not defined', () => {
        var address = new AddressModel(addressObject);
        assert.isDefined(address, 'Model Object is not defined');
        assert.isDefined(address.address, 'Address Model Object is not defined');
        assert.isDefined(address.address.suburb, 'suburb is not defined');
        assert.isDefined(address.address.district, 'district is not defined');
        assert.isDefined(address.address.businessName, 'businessName is not defined');
        assert.isDefined(address.address.stateCodeLabel, 'stateCodeLabel is not defined');
        assert.isDefined(address.address.cityLabel, 'cityLabel is not defined');
        assert.isDefined(address.address.hideCityAndPostalCode, 'hideCityAndPostalCode is not defined');
    });

    it('Testing for address model not null', () => {
        var address = new AddressModel(addressObject);
        assert.isNotNull(address, 'Model Object is null');
        assert.isNotNull(address.address, 'Address Model Object is null');
        assert.isNotNull(address.address.suburb, 'suburb is null');
        assert.isNotNull(address.address.district, 'district is null');
        assert.isNotNull(address.address.businessName, 'businessName is null');
        assert.isNotNull(address.address.stateCodeLabel, 'stateCodeLabel is null');
        assert.isNotNull(address.address.cityLabel, 'cityLabel is null');
        assert.isNotNull(address.address.hideCityAndPostalCode, 'hideCityAndPostalCode is null');
    });

    it('Testing suburb not exists for address model', () => {
        delete addressObject.custom.suburb;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.suburb, 'Suburb should be null');
    });

    it('Testing suburb not null for address model', () => {
        addressObject.custom.suburb = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.suburb, 'Suburb should be null');
    });

    it('Testing district not exists for address model', () => {
        delete addressObject.custom.district;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.district, 'district should be null');
    });

    it('Testing district not null for address model', () => {
        addressObject.custom.district = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.district, 'district should be null');
    });

    it('Testing businessName not exists for address model', () => {
        delete addressObject.custom.businessName;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.businessName, 'businessName should be null');
    });

    it('Testing businessName not null for address model', () => {
        addressObject.custom.businessName = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.businessName, 'businessName should be null');
    });

    it('Testing stateCode not exists for address model', () => {
        delete addressObject.stateCode;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.stateCode, 'stateCode should be null');
    });

    it('Testing stateCode not null for address model', () => {
        addressObject.stateCode = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.stateCode, 'stateCode should be null');
    });

    it('Testing city not exists for address model', () => {
        delete addressObject.city;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.city, 'city should be null');
    });

    it('Testing city not null for address model', () => {
        addressObject.city = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.city, 'city should be null');
    });

    it('Testing hideCityAndPostalCode for HK', () => {
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.hideCityAndPostalCode, 'hideCityAndPostalCode is not defined');
    });

    it('Testing hideCityAndPostalCode for Non HK', () => {
        addressObject.countryCode.value = 'NZ';
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.hideCityAndPostalCode, 'hideCityAndPostalCode is not defined');
    });

    it('Testing suburb exists for address model', () => {
        delete addressObject.custom.suburb;
        addressObject.raw = {
            custom: {
                suburb: 'Stonefields'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.suburb, 'Suburb should be null');
    });

    it('Testing district exists for address model', () => {
        delete addressObject.custom.district;
        addressObject.raw = {
            custom: {
                district: 'Canterbury'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.district, 'District should be null');
    });

    it('Testing businessName exists for address model', () => {
        delete addressObject.custom.businessName;
        addressObject.raw = {
            custom: {
                businessName: 'UA'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.businessName, 'BusinessName should be null');
    });

    it('Testing split phone field not null for address model', () => {
        var AddressModelNew = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/address.js', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    };
                }
            },
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            }
        });
        addressObject.custom.phone1 = '010';
        addressObject.custom.phone2 = '111';
        addressObject.custom.phone3 = '1111';
        var address = new AddressModelNew(addressObject);
        assert.isDefined(address.address.phone1, 'phone1 should be null');
        assert.isDefined(address.address.phone2, 'phone2 should be null');
        assert.isDefined(address.address.phone3, 'phone3 should be null');
    });

    it('Testing split phone field not null for address model when split fields are empty but comnined field has value', () => {
        var AddressModelNew = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/address.js', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    };
                },
                splitPhoneField: function () {
                    return [
                        '010', '111', '1111'
                    ];
                }
            },
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            }
        });
        addressObject.custom.phone1 = null;
        addressObject.custom.phone2 = null;
        addressObject.custom.phone3 = null;
        var address = new AddressModelNew(addressObject);
        assert.isDefined(address.address.phone1, 'phone1 should not be null');
        assert.isDefined(address.address.phone2, 'phone2 should not be null');
        assert.isDefined(address.address.phone3, 'phone3 should not be null');
    });

    it('Testing split phone field exists for address model', () => {
        var AddressModelNew = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/address.js', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    };
                }
            },
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            }
        });
        delete addressObject.custom.phone1;
        delete addressObject.custom.phone2;
        delete addressObject.custom.phone3;
        addressObject.raw = {
            custom: {
                phone1: '010',
                phone2: '111',
                phone3: '1111'
            }
        };
        var address = new AddressModelNew(addressObject);
        assert.isDefined(address.address.phone1, 'phone1 should be null');
        assert.isDefined(address.address.phone2, 'phone2 should be null');
        assert.isDefined(address.address.phone3, 'phone3 should be null');
    });
});
