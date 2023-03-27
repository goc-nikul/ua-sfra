'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../helpers/unit/Spy');
var sinon = require('sinon')
describe('app_ua_core/cartridge/scripts/helpers/addressHelpers', function() {
    global.empty = (data) => {
        return !data;
    };

    var addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
        'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
        '~/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil'),
        'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
    });
    
    it('Testing method: getCountriesAndRegions', () => {
        var options = [{
            value : 'US',
            label: 'Unites States'
        }];
        var addressForm = {
            country: {
               options: options
            },
            states: {
                stateUS: {
                    valid: true,
                    label: 'label.input.state'
                },
                nostates: {}
            }
    	};
    	var resource = {};
        let result = addressHelpers.getCountriesAndRegions(addressForm, resource);
        assert.equal(result[addressForm.country.options[0].value].regionLabel, 'testMsg');
    });

    it('Testing method: getCountriesAndRegions --> getFieldOptions', () => {
        var options = [{
            value : 'US',
            label: 'Unites States'
        }];
        var addressForm = {
            country: {
               options: options
            },
            states: {
                stateUS: {
                    valid: true,
                    label: 'label.input.state',
                    options: [
                        {
                            value: 'value'
                        }
                    ]
                },
                nostates: {}
            }
    	};
    	var resource = {};
        let result = addressHelpers.getCountriesAndRegions(addressForm, resource);
        assert.equal(result[addressForm.country.options[0].value].regionLabel, 'testMsg');
    });

    it('Testing method: getCountriesAndRegions --> country options is null', () => {
        var options = [{
            value : 'US',
            label: 'Unites States'
        }];
        var addressForm = {
            country: {
               options: null
            },
            states: {
                stateUS: {
                    valid: true,
                    label: 'label.input.state'
                },
                nostates: {}
            }
    	};
    	var resource = {};
        let result = addressHelpers.getCountriesAndRegions(addressForm, resource);
        assert.isNotNull(result);
    });

    it('Testing method: getCountriesAndRegions', () => {
        var options = [{
            value : 'US',
            label: 'Unites States'
        }];
        var addressForm = {
            country: {
               options: options
            },
            states: {
                stateUS1: {
                    valid: true,
                    label: 'label.input.state'
                },
                nostates: undefined
            }
    	};
    	var resource = {};
        let result = addressHelpers.getCountriesAndRegions(addressForm, resource);
        assert.isNotNull(result);
    });

    it('Testing method: getCountriesAndRegions --> Custom Exception', () => {
        var stub = sinon.stub();

        var addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': {
                msg: stub
            },
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil'),
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });
        var options = [{
            value : 'US',
            label: 'Unites States'
        }];
        var addressForm = {
            country: {
               options: options
            },
            states: {
                stateUS: {
                    valid: true,
                    label: 'label.input.state'
                },
                nostates: undefined
            }
    	};
        stub.throws('Custom Error Exception')
    	var resource = {};
        let result = addressHelpers.getCountriesAndRegions(addressForm, resource);
        assert.isNotNull(result);
    });

    it('Testing method: getCountries', () => {
        let result = addressHelpers.getCountries();
        assert.isTrue(result.length > 0);
    });

    it('Testing method: setCountryOptions', () => {
        addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil'),
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });
        var billingForm = {
            country: {
                options: [],
                setOptions: function (country) {
                    return [];
                }
            },
        };
        let result = addressHelpers.setCountryOptions(billingForm);
        assert.deepEqual(billingForm.country.options , billingForm.country.setOptions());
        
    });

    it('Testing method: sortDefaultBillingAddress', () => {
        var addressBook = {
            indexOf: function(defaultBillingAddress) {
                return 0;
            }
        };
        var customer = {
            profile: {
                custom: {
                    defaultBillingAddressID: 'testID'
                }
            },
            getProfile: function() {
                return {
                    getAddressBook: function() {
                        return {
                            getAddress: function(addressId) {
                                return {
                                    ID: addressId
                                }
                            }
                        }
                    }
                }
            }
        };
        let result = addressHelpers.sortDefaultBillingAddress(customer, addressBook);
        assert.isTrue(!empty(customer.profile.custom.defaultBillingAddressID));
    });

    it('Testing method: sortDefaultBillingAddress --> defaultBillingAddress equal to addressBook', () => {
        var addressBook = {
            indexOf: function(defaultBillingAddress) {
                return 1;
            },
            swap: function () {
                return {};
            }
        };
        var customer = {
            profile: {
                custom: {
                    defaultBillingAddressID: 'testID'
                }
            },
            getProfile: function() {
                return {
                    getAddressBook: function() {
                        return {
                            getAddress: function(addressId) {
                                return {
                                    ID: addressId
                                }
                            }
                        }
                    }
                }
            }
        };
        let result = addressHelpers.sortDefaultBillingAddress(customer, addressBook);
        assert.isTrue(!empty(customer.profile.custom.defaultBillingAddressID));
    });


    it('Testing method: setCountryOptionsCA', () => {
        addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil'),
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });
        var billingForm = {
            country: {
                options: [],
                setOptions: function (country) {
                    return [];
                }
            },
        };
        let result = addressHelpers.setCountryOptionsCA(billingForm);
        assert.deepEqual(billingForm.country.options , billingForm.country.setOptions());
    });

    it('Testing method: updateAddressFields', () => {
        var CustomerAddress = require('../../mocks/dw/dw_customer_CustomerAddress');
        var address = new CustomerAddress();
        address.states = {
                stateCode: 'CA'
        };
        address.country = 'US';
        var newAddress = {
            setAddress1: function(o) {
                return o;
            },
            setAddress2: function(o) {
                return o;
            },
            setCity: function(o) {
                return o;
            },
            setFirstName: function(o) {
                return o;
            },
            setLastName: function(o) {
                return o;
            },
            setPhone: function(o) {
                return o;
            },
            setPostalCode: function(o) {
                return o;
            },
            setStateCode: function(o) {
                return o;
            },
            setCountryCode: function(o) {
                return o;
            },
            setJobTitle: function(o) {
                return o;
            },
            setPostBox: function(o) {
                return o;
            },
            setSalutation: function(o) {
                return o;
            },
            setSecondName: function(o) {
                return o;
            },
            setCompanyName: function(o) {
                return o;
            },
            setSuffix: function(o) {
                return o;
            },
            setSuite: function(o) {
                return o;
            },
            setJobTitle: function(o) {
                return o;
            }
        };
        let result = addressHelpers.updateAddressFields(newAddress, address);
        assert.equal(address.address1 , newAddress.setAddress1(address.address1));
    });

    it('Testing method: validateAddressInputFields', () => {
        addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return [{error: true}];
                }
            },
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });
        var addressObject = {
            states: {
                stateCode: 'US'
            }
        }
        let result = addressHelpers.validateAddressInputFields(addressObject);
        assert.isTrue(result.error);
    });

    it('Testing method: inputValidationField', () => {
        addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return{};
                }
            },
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });
       var inputValidation = {
        customerAddressErrors: {
            firstName: {},
            lastName: {},
            address1: {},
            address2: {},
            city: {},
            stateCode: {},
            postalCode: {},
            country: {},
        }
    };

    var profileForm = {
        firstName: {},
        lastName: {},
        address1: {},
        address2: {},
        city: {},
        states: {
            stateCode: {}
        },
        postalCode: {},
        country: {}
    }
    addressHelpers.inputValidationField(inputValidation, profileForm);
    });

    it('Testing method: formatCalenderHelper', () => {
        addressHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'MX';
                        }
                    }
                }
            },
            'dw/util/Calendar': function () { return {}; },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return {};
                }
            },
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });
    var request = {};
    request.currentCustomer = {
        raw: {
            profile: {
                getLastModified: function () {
                    return '01/08/2021'
                }
            }
        }
    }
    addressHelpers.calenderHelper(request);
    });
});
