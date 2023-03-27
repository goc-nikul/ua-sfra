'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../mockModuleSuperModule');

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;
var BaseAddressGet = Class.extend({});
var AddressGet;

global.empty =  (params) => !params;

describe('app_ua_apac/cartridge/scripts/actions/AddressGet', () => {

    before(() => {
        mockSuperModule.create(BaseAddressGet);
        AddressGet = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/scripts/QASActions/actions/AddressGet.js', {});
    });

    it('Testing updateAddress method when result not found', () => {
        var AddressGetObj = AddressGet.extend({
            response: {},
            setResultAddress: (address) => {
                assert.isNull(address.address1, 'Address1 is not null for response null');
                assert.isNull(address.address2, 'Address2 is not null for response null');
                assert.isNull(address.city, 'City is not null for response null');
                assert.isNull(address.state, 'State is not null for response null');
                assert.isNull(address.zipCode, 'ZipCode is not null for response null');
            }
        });
        AddressGetObj.prototype.updateAddress();
    });

    it('Testing updateAddress method when result found', () => {
        var AddressGetObj = AddressGet.extend({
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
        AddressGetObj.prototype.updateAddress();
    });

    it('Testing updateAddress method when address2 not found', () => {
        var AddressGetObj = AddressGet.extend({
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
        AddressGetObj.prototype.updateAddress();
    });

});
