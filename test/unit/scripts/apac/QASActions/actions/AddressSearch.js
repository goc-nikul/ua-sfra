'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../mockModuleSuperModule');

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;
var BaseAddressSearch = Class.extend({});
var AddressSearch;

global.empty = (params) => !params;
global.request = {
    locale: 'US'
};

describe('app_ua_apac/cartridge/scripts/actions/AddressSearch', () => {


    before(() => {
        mockSuperModule.create(BaseAddressSearch);
        AddressSearch = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/scripts/QASActions/actions/AddressSearch.js', {
            'dw/util/Locale': require('../../../../../mocks/dw/dw_util_Locale'),
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site')
        });
    });

    it('Testing updateAddress method when result not found', () => {
        var AddressSearchObj = AddressSearch.extend({
            response: {},
            setResultAddress: (address) => {
                assert.isNull(address.address1, 'Address1 is not null for response null');
                assert.isNull(address.address2, 'Address2 is not null for response null');
                assert.isNull(address.city, 'City is not null for response null');
                assert.isNull(address.state, 'State is not null for response null');
                assert.isNull(address.zipCode, 'ZipCode is not null for response null');
            }
        });
        AddressSearchObj.prototype.updateAddress();
    });

    it('Testing updateAddress method when result found', () => {
        var AddressSearchObj = AddressSearch.extend({
            response: {
                result: {
                    getQAAddress: () => {
                        return {
                            getAddressLine: () => {
                                var addressLine = [{
                                        label: 'address1',
                                        line: 'address1'
                                    },
                                    {
                                        label: 'address2',
                                        line: 'address2'
                                    },
                                    {
                                        label: 'Locality',
                                        line: 'city'
                                    }, {
                                        label: 'State code',
                                        line: 'state'
                                    }, {
                                        label: 'Postcode',
                                        line: 'zipcode'
                                    }
                                ];
                                return {
                                    size: () => {
                                        return addressLine.length
                                    },
                                    get: (index) => {
                                        return addressLine[index]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNotNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateAddress();
    });

    it('Testing updateAddress method when address2 not found', () => {
        var AddressSearchObj = AddressSearch.extend({
            response: {
                result: {
                    getQAAddress: () => {
                        return {
                            getAddressLine: () => {
                                var addressLine = [{
                                        label: 'address1',
                                        line: 'address1'
                                    },
                                    {
                                        label: 'address2',
                                        line: null
                                    },
                                    {
                                        label: 'Locality',
                                        line: 'city'
                                    }, {
                                        label: 'State code',
                                        line: 'state'
                                    }, {
                                        label: 'Postcode',
                                        line: 'zipcode'
                                    }
                                ];
                                return {
                                    size: () => {
                                        return addressLine.length
                                    },
                                    get: (index) => {
                                        return addressLine[index]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is null for response');
                assert.isNull(address.address2, 'Address2 is null for response');
                assert.isNotNull(address.city, 'City is null for response');
                assert.isNotNull(address.state, 'State is null for response');
                assert.isNotNull(address.zipCode, 'ZipCode is null for response');
            }
        });
        AddressSearchObj.prototype.updateAddress();
    });

    it('Testing getCountry method if country already exists', () => {
        var AddressSearchObj = AddressSearch.extend({
            country: 'US'
        });
        AddressSearchObj.prototype.getCountry();
        assert.isDefined(AddressSearchObj.prototype.country, 'country code is defined');
        assert.isNotNull(AddressSearchObj.prototype.country, 'country code is null');
    });

    it('Testing getCountry method if country not exists and qasAddressValidateCountryOverride not exists', () => {
        var AddressSearchObj = AddressSearch.extend({});
        AddressSearchObj.prototype.getCountry();
        assert.isNotNull(AddressSearchObj.prototype.country, 'country code is null');
    });

    it('Testing getCountry method if country not exists and qasAddressValidateCountryOverride exists but locale doesnot match with custom prefs', () => {
        var AddressSearchQAS = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/scripts/QASActions/actions/AddressSearch.js', {
            'dw/util/Locale': {
                getLocale: () => {
                    return {
                        country: 'AU',
                        ISO3Country: 'AUS'
                    }
                }
            },
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: () => '{"AU": "AUS"}'
                }
            }
        });
        var AddressSearchObj = AddressSearchQAS.extend({});
        AddressSearchObj.prototype.getCountry();
        assert.isNotNull(AddressSearchObj.prototype.country, 'country code is null');
        assert.notEqual(AddressSearchObj.prototype.country, 'USA');
        assert.equal(AddressSearchObj.prototype.country, 'AUS');
    });

    it('Testing getCountry method if country not exists and qasAddressValidateCountryOverride exists and locale match with custom prefs', () => {
        var AddressSearchQAS = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/scripts/QASActions/actions/AddressSearch.js', {
            'dw/util/Locale': {
                getLocale: () => {
                    return {
                        country: 'US',
                        ISO3Country: 'USA'
                    }
                }
            },
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: () => '{"US": "USA"}'
                }
            }
        });
        var AddressSearchObj = AddressSearchQAS.extend({});
        AddressSearchObj.prototype.getCountry();
        assert.isNotNull(AddressSearchObj.prototype.country, 'country code is null');
        assert.equal(AddressSearchObj.prototype.country, 'USA');
    });

    it('Testing getCountry method if country not exists and qasAddressValidateCountryOverride exists and error in custom prefs', () => {
        var AddressSearchQAS = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/scripts/QASActions/actions/AddressSearch.js', {
            'dw/util/Locale': {
                getLocale: () => {
                    return {
                        country: 'US',
                        ISO3Country: 'USA'
                    }
                }
            },
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: () => '{"US": "USA"'
                }
            }
        });
        var AddressSearchObj = AddressSearchQAS.extend({});
        AddressSearchObj.prototype.getCountry();
        assert.isNotNull(AddressSearchObj.prototype.country, 'country code is null');
        assert.equal(AddressSearchObj.prototype.country, 'USA');
    });

});
