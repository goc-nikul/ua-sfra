'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/dw/dw_util_ArrayList');
describe('app_ua_na/cartridge/scripts/helpers/addressHelpers', function() {
    global.empty = (data) => {
        return !data;
    };
    var Forms = function () {
        var formData = {
            exteriorNumber: {
                value:'exteriorNumber'
            },
            interiorNumber: {
                value:'interiorNumber'
            },
            additionalInformation:{
                value: 'additionalInformation'
            },
            colony:{
                value: 'colony'
            },
            dependentLocality:{
                value: 'dependentLocality'
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

    var addressHelpers = proxyquire('../../../../../cartridges/app_ua_na/cartridge/scripts/helpers/addressHelpers', {
        'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '~/cartridge/scripts/utils/PreferencesUtil':  require('../../../../../test/mocks/scripts/PreferencesUtil'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'server': server,
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
            'dw/util/ArrayList': ArrayList
        }),
        'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAccoutHelpers
    });

    it('Testing method: updateAddressFields', () => {
        var CustomerAddress = require('../../../../mocks/dw/dw_customer_CustomerAddress');
        var address = new CustomerAddress();
        address.states = {
                stateCode: 'test'
        };
        address.country = 'MX';
        address.state = 'state';
        address.exteriorNumber = 'exteriorNumber';
        address.interiorNumber = 'interiorNumber';
        address.additionalInformation = 'additionalInformation';
        address.colony = 'colony';
        address.dependentLocality = 'dependentLocality';
        address.postalCode = '11111';
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
            custom: {
                exteriorNumber : 'exteriorNumber',
                interiorNumber:'interiorNumber',
                additionalInformation:'additionalInformation',
                colony:'colony',
                dependentLocality: 'dependentLocality'
            }
        };
        let result = addressHelpers.updateAddressFields(newAddress, address);
        assert.equal(address.address1 , newAddress.setAddress1(address.address1));
        assert.equal(address.exteriorNumber.exteriorNumber , newAddress.setCity(address.exteriorNumber.exteriorNumber));
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
            exteriorNumber:'Stonefields',
            interiorNumber:'Stonefields',
            additionalInformation:'Stonefields',
            colony:'Stonefields',
            dependentLocality: 'Canterbury',
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

        var addHelpers = proxyquire('../../../../../cartridges/app_ua_na/cartridge/scripts/helpers/addressHelpers', {
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
                exteriorNumber : 'exteriorNumber',
                interiorNumber:'interiorNumber',
                additionalInformation:'additionalInformation',
                colony:'colony',
                dependentLocality: 'dependentLocality'
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
        assert.equal(result.exteriorNumber, 'exteriorNumber');
        assert.equal(result.interiorNumber, 'interiorNumber');
        assert.equal(result.additionalInformation, 'additionalInformation');
        assert.equal(result.colony, 'colony');
        assert.equal(result.dependentLocality, 'dependentLocality');
    });

    it ('Testing method: gatherShippingAddresses --> Should gather all shipping addresses into one array', () => {
        let baseAddressHelpers = proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil':require('../../../../../test/mocks/scripts/PreferencesUtil')
        });

        var addHelpers = proxyquire('../../../../../cartridges/app_ua_na/cartridge/scripts/helpers/addressHelpers', {
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/utils/PreferencesUtil': require('../../../../../test/mocks/scripts/PreferencesUtil'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'server': server,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'app_ua_core/cartridge/scripts/helpers/addressHelpers': baseAddressHelpers
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
                exteriorNumber : 'exteriorNumber1',
                interiorNumber:'interiorNumber1',
                additionalInformation:'additionalInformation1',
                colony:'colony1',
                dependentLocality: 'dependentLocality1'
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
                exteriorNumber : 'exteriorNumber2',
                interiorNumber:'interiorNumber2',
                additionalInformation:'additionalInformation2',
                colony:'colony2',
                dependentLocality: 'dependentLocality2'
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

});
