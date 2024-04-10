'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/dw/dw_util_ArrayList');
describe('app_ua_apac/cartridge/scripts/helpers/addressHelpers', function() {
    global.empty = (data) => {
        return !data;
    };
    var Forms = function () {
        var formData = {
            city: {
                citytest1 :{
                    "label": "Postal Code*",
                    "options": [
                        {
                        "checked": false,
                        "htmlValue": "testcity",
                        "label": "testcity",
                        "id": "testcity",
                        "selected": false,
                        "value": "testcity"
                        }
                    ]
                }
            },
            postalCode: {
                postalCodetestcity :{
                    "label": "Postal Code*",
                    "options": [
                        {
                        "checked": false,
                        "htmlValue": "79000",
                        "label": "79000",
                        "id": "79000",
                        "selected": false,
                        "value": "79000"
                        }
                    ]
                },
                postalCodetest1 :{
                    "label": "Postal Code*",
                    "options": [
                        {
                        "checked": false,
                        "htmlValue": "79000",
                        "label": "79000",
                        "id": "79000",
                        "selected": false,
                        "value": "79000"
                        }
                    ]
                }
            },
            district: {
                districttestcity :{
                    "label": "district",
                    "options": [
                        {
                        "checked": false,
                        "htmlValue": "testdistrict",
                        "label": "testdistrict",
                        "id": "testdistrict",
                        "selected": false,
                        "value": "testdistrict"
                        }
                    ]
                }
            },
            shipping: {
                shippingAddress:{
                    addressFields:{
                        states: {
                            stateCode:{
                                options: [{
                                    value : 'test1',
                                    label: 'test1',
                                    id:'test1'
                                }]
                            }
                        }
                    }
                }
            }
        };

        this.getForm = function (id) {
            return formData[id];
        };
    };
    var server = {
        forms: new Forms()
    };
    let baseAccoutHelpers = proxyquire('../../../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
        'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil'),
        'app_storefront_base/cartridge/scripts/helpers/addressHelpers':{}
    });

    var addressHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
        'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '~/cartridge/scripts/utils/PreferencesUtil':  require('../../../../../test/mocks/scripts/PreferencesUtil'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'server': server,
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
            'dw/util/ArrayList': ArrayList
        }),
        'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAccoutHelpers,
        '*/cartridge/config/preferences': {
            isShowSplitPhoneMobileField: false
        },
        'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale')
    });

    it('Testing method: combinePhoneField', () => {

        var addressHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil':  require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAccoutHelpers,
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            },
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale')
        });

        let addressForm = {
            suburb:{
                phoneMobile1: '010',
                phoneMobile2: '0101',
                phoneMobile3: '0101'
            }
        };
        let result = addressHelpers.combinePhoneField(addressForm);

        assert.isNotNull(addressForm.phone);
    });

    it('Testing method: updateAddressFields', () => {
        var CustomerAddress = require('../../../../mocks/dw/dw_customer_CustomerAddress');
        var address = new CustomerAddress();
        address.states = {
                stateCode: 'test'
        };
        address.country = 'HK';
        address.state = 'state';
        address.suburb = 'sub';
        address.businessName = 'businessName';
        address.district = {
            dis : 'dis'
        };
        address.city = {
           city:'city'
        }
        address.postalCode = {
            postalcode:  '11111'
        };
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
            },
            setDistrict: function(o) {
                return o;
            },
            setSuburb: function(o) {
                return o;
            },
            custom: {
                suburb : 'suburb',
                businessName:'BN',
                district: 'district'
            }
        };
        let result = addressHelpers.updateAddressFields(newAddress, address);
        assert.equal(address.address1 , newAddress.setAddress1(address.address1));
        assert.equal(address.suburb.suburb , newAddress.setCity(address.suburb.suburb));
    });

    it('Testing method: updateAddressFields for splited phone field', () => {
        var CustomerAddress = require('../../../../mocks/dw/dw_customer_CustomerAddress');
        var addressHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil':  require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAccoutHelpers,
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            },
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale')
        });
        let address = new CustomerAddress();
        address.country = 'KR';
        address.phone1 = '101';
        address.phone2 = '212';
        address.phone3 = '2222';
        address.phone = '';
        let newAddress = {
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
            },
            setDistrict: function(o) {
                return o;
            },
            setSuburb: function(o) {
                return o;
            },
            custom: {
                phone1 : '010',
                phone2: '111',
                phone3: '1111'
            }
        };
        addressHelpers.updateAddressFields(newAddress, address);
        assert.equal(address.phone1 , newAddress.custom.phone1);
        assert.equal(address.phone2 , newAddress.custom.phone2);
        assert.equal(address.phone3 , newAddress.custom.phone3);
        assert.equal(address.phone , newAddress.setPhone(address.phone));
    });

    it('Testing method: inputValidationField', () => {
        let inputFieldsValidation = {
            customerAddressErrors: {
                suburb : 'Error in suburb'
            }
        };
        let addressForm = {
            suburb:{
                error: null
            }
        };
        let result = addressHelpers.inputValidationField(inputFieldsValidation, addressForm);
        assert.isNotNull(addressForm.suburb.error);
    });

    it('Testing method: getCountriesDefinition => should return empty object when  country.options is empty', () => {
        // Test function with TH country Data to cover all cases
        global.request.getLocale = function () {
            return 'en_TH';
        };
        let addressForm = {
            country: {
                options: ''
            },
            states: {
                stateCode: {
                    options: ''
                }
            }
        }
        let resource = {}
        let result = addressHelpers.getCountriesDefinition(addressForm, resource);
        assert.equal(Object.keys(result).length, 0);
    });

    it('Testing method: getCountriesDefinition TH country', () => {
        // Test function with TH country Data to cover all cases
        var options = [{
            value : 'TH',
            label: 'Thailand'
        }];
        var stateOptions = [{
            value : 'test1',
            label: 'test1',
            id:'test1'
        },{
            value : 'test2',
            label: 'test2'
        }];
        let addressForm = {
            country : {
                options: options
            },
            states : {
                stateCode : {
                    options: stateOptions
                }
            }
        }
        let resource = {}
        session.custom.currentCountry = 'TH'
        let result = addressHelpers.getCountriesDefinition(addressForm, resource);
        assert.equal(Object.keys(result.states).length, 1);
    });

    it('Testing method: getCountriesDefinition ID Country', () => {
         // Test function with ID country Data to cover all cases
        var options = [{
            value : 'ID',
            label: 'Thailand'
        }];
        var stateOptions = [{
            value : 'test1',
            label: 'test1',
            id:'test1'
        },{
            value : 'test2',
            label: 'test2'
        }];
        let addressForm = {
            country : {
                options: options
            },
            states : {
                stateCode : {
                    options: stateOptions
                }
            }
        }
        let resource = {}
        session.custom.currentCountry = 'ID'
        let result1 = addressHelpers.getCountriesDefinition(addressForm, resource);
        assert.equal(Object.keys(result1.states).length, 1);
    });

    it('Testing method: getCountriesDefinition MY Country', () => {
        // Test function with MY country Data to cover all cases
       var options = [{
           value : 'MY',
           label: 'Malaysia'
       }];
       var stateOptions = [{
           value : 'test1',
           label: 'test1',
           id:'test1'
       }];
       let addressForm = {
           country : {
               options: options
           },
           states : {
               stateCode : {
                   options: stateOptions
               }
           }
       }
       let resource = {}
       session.custom.currentCountry = 'MY'
       let result1 = addressHelpers.getCountriesDefinition(addressForm, resource);
       assert.equal(Object.keys(result1.states).length, 1);
   });

   it('Testing method: getCountriesDefinition PH Country', () => {
        // Test function with PH country Data to cover all cases
        var options = [{
            value : 'PH',
            label: 'Philippines'
        }];
        var stateOptions = [{
            value : 'test1',
            label: 'test1',
            id:'test1'
        },{
            value : 'test2',
            label: 'test2'
        }];
        let addressForm = {
            country : {
                options: options
            },
            states : {
                stateCode : {
                    options: stateOptions
                }
            }
        }
        let resource = {}
        session.custom.currentCountry = 'PH'
        let result1 = addressHelpers.getCountriesDefinition(addressForm, resource);
        assert.equal(Object.keys(result1.states).length, 1);
    });
    
    it('Testing method: getCountriesDefinition: when states not available should return length as 0', () => {
        var options = [{
            value: 'PH',
            label: 'Philippines'
        }];
        var stateOptions = [{
            value: 'test1',
            label: 'test1',
            id: 'test1'
        }, {
            value: 'test2',
            label: 'test2'
        }];
        let addressForm = {
            country: {
                options: options
            },
            states: {
                stateCode: {
                    options: stateOptions
                }
            }
        }
        let resource = {}

        var Forms = function () {
            var formData = {
                city: {nocities:null},
                postalCode: {},
                district: {},
                shipping: {
                    shippingAddress: {
                        addressFields: {
                            states: {
                                stateCode: {
                                    options: [{
                                        value: 'test1',
                                        label: 'test1',
                                        id: 'test1'
                                    }]
                                }
                            }
                        }
                    }
                }
            };

            this.getForm = function (id) {
                return formData[id];
            };
        };
        var serverMock = {
            forms: new Forms()
        };
        let baseAccoutHelpers = proxyquire('../../../../../cartridges/app_ua_core/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'app_storefront_base/cartridge/scripts/helpers/addressHelpers': {}
        });

        var addressHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': serverMock,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAccoutHelpers,
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale')
        });
        let result1 = addressHelpers.getCountriesDefinition(addressForm, resource);
        assert.equal(Object.keys(result1.states).length, 0);


    })

    it('Testing method: getCountriesDefinition  when country not available', () => {
        // Test function with invalid country Data to cover all cases
        var options = [];
        var stateOptions = [];
        let addressForm = {
            country: {
                options: options
            },
            states: {
                stateCode: {
                    options: stateOptions
                }
            }
        }
        let resource = {}
        session.custom.currentCountry = ''
        let result1 = addressHelpers.getCountriesDefinition(addressForm, resource);
        assert.equal(Object.keys(result1.states).length, 0);
    });

    it('Testing method: getTranslatedLabel', () => {
        session.forms = {};
        session.forms.city = 'Bang Bo'
        session.custom.currentCountry = 'TH'
        let result = addressHelpers.getTranslatedLabel('test1', 'testcity');
        assert.equal(result.stateCode, 'test1');
        assert.equal(result.city, 'testcity');
        session.custom.currentCountry = ''
        result = addressHelpers.getTranslatedLabel('test1', 'testcity');
        assert.equal(result.stateCode, 'test1');
        assert.equal(result.city, '');


    });

    it ('Testing method: saveAddress', () => {
        var result = {};
        var customer = {
            raw: {
                getProfile: function () {
                    return {
                        getAddressBook: function () {
                            return {
                                createAddress: function (id) {
                                    result.id = id;
                                    return new Proxy({}, {
                                        get(target, name) {
                                            return function (value) {
                                                var propName = name.substr(3, name.length - 3);
                                                var formattedName = propName.charAt(0).toLowerCase() + propName.slice(1);
                                                result[formattedName] = value;
                                            };
                                        }
                                    });
                                }
                            };
                        }
                    };
                }
            }
        };
        var address = {
            firstName: 'Foo',
            lastName: 'Bar',
            address1: '10 Test St.',
            city: 'Testville',
            postalCode: '12345',
            phone: '123456789',
            country: 'ID',
            suburb:'Stonefields',
            district: 'Canterbury',
        };
        addressHelpers.saveAddress(address, customer, 'TestID');
        assert.equal(result.firstName, 'Foo');
        assert.equal(result.lastName, 'Bar');
        assert.equal(result.address1, '10 Test St.');
        assert.equal(result.city, 'Testville');
        assert.equal(result.postalCode, '12345');
        assert.equal(result.phone, '123456789');
        assert.equal(result.countryCode, 'ID');
    });

    it ('Testing method: copyShippingAddress', () => {

        let baseAddressHelpers = proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil')
        });

        var addHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil':  require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAddressHelpers
        });

        var address = {
            firstName: 'Foo',
            lastName: 'Bar',
            address1: '10 Test St.',
            city: 'Testville',
            postalCode: '12345',
            phone: '123456789',
            countryCode: 'ID',
            custom: {
                suburb:'suburb',
                district: 'district',
                businessName:'businessName'
            }
        };

        var result = addHelpers.copyShippingAddress(address);

        assert.equal(result.firstName, 'Foo');
        assert.equal(result.lastName, 'Bar');
        assert.equal(result.address1, '10 Test St.');
        assert.equal(result.city, 'Testville');
        assert.equal(result.postalCode, '12345');
        assert.equal(result.phone, '123456789');
        assert.equal(result.country, 'ID');
        assert.equal(result.suburb, 'suburb');
        assert.equal(result.district, 'district');
        assert.equal(result.businessName, 'businessName');
    });

    it ('Testing method: gatherShippingAddresses --> Should gather all shipping addresses into one array', () => {
        let baseAddressHelpers = proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil':require('../../../../../test/mocks/scripts/PreferencesUtil')
        });

        var addHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAddressHelpers,
            '~/cartridge/scripts/checkout/checkoutHelpers': {
                validateInputFieldsForShippingMethod(address) {
                    return address.error;
                }
            }
        });
        var address1 = {
            firstName: 'Foo',
            lastName: 'Bar',
            address1: '10 Test St.',
            city: 'Testville',
            postalCode: '12345',
            phone: '123456789',
            countryCode: 'ID',
            custom: {
                suburb:'suburb1',
                district: 'district1',
                businessName:'businessName1'
            }
        };
        var address2 = {
            firstName: 'Foo2',
            lastName: 'Bar2',
            address1: '102 Test St.',
            city: 'Testville',
            postalCode: '12345',
            phone: '123456789',
            countryCode: 'ID',
            custom: {
                suburb:'suburb2',
                district: 'district2',
                businessName:'businessName2'
            }
        };
        var order = {
            shipments: [
                {
                    shippingAddress: address1
                },
                {
                    shippingAddress: address2
                }
            ]
        };
        var allAddresses = addHelpers.gatherShippingAddresses(order);

        assert.equal(allAddresses[0].firstName, address1.firstName);
        assert.equal(allAddresses[0].lastName, address1.lastName);
        assert.equal(allAddresses[0].address1, address1.address1);
        assert.equal(allAddresses[1].lastName, address2.lastName);
        assert.equal(allAddresses[1].address1, address2.address1);
    });

    it ('Testing method: gatherShippingAddresses -Should return default shipment address as an array when there are no other shipments', () => {
        var address = {
            firstName: 'Foo',
            lastName: 'Bar',
            address1: '10 Test St.',
            city: 'Testville',
            postalCode: '12345',
            phone: '123456789',
            countryCode: 'ID'
        };
        var order = {
            defaultShipment: {
                shippingAddress: address
            }
        };
        var allAddresses = addressHelpers.gatherShippingAddresses(order);

        assert.equal(allAddresses[0].firstName, address.firstName);
        assert.equal(allAddresses[0].lastName, address.lastName);
        assert.equal(allAddresses[0].address1, address.address1);
    });

    it('Testing method: validateAddressInputFields - should validate address input fields ', () => {
        var addressHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': {},
            '~/cartridge/scripts/checkout/checkoutHelpers': {
                validateInputFieldsForShippingMethod(address) {
                    return address.error;
                }
            }
        });
        let address = { error: true };
        var result = addressHelpers.validateAddressInputFields(address);
        assert.equal(address.error, result);
        address.error = false;
        result = addressHelpers.validateAddressInputFields(address);
        assert.equal(address.error, result);
    });

    it('Testing method: splitPhoneField', () => {
        let addressHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil':  require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAccoutHelpers,
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            },
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale')
        });
        let customerPhone = '0101111111';
        let splitedPhone = addressHelpers.splitPhoneField(customerPhone);
        assert.equal(splitedPhone[0], '010');
        assert.equal(splitedPhone[1], '1111');
        assert.equal(splitedPhone[2], '111');
        customerPhone = '10111111';
        splitedPhone = addressHelpers.splitPhoneField(customerPhone);
        assert.equal(splitedPhone[0], '010');
        assert.equal(splitedPhone[1], '111');
        assert.equal(splitedPhone[2], '111');
        customerPhone = '';
        splitedPhone = addressHelpers.splitPhoneField(customerPhone);
        assert.equal(customerPhone, splitedPhone);
    });
});
