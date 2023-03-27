'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseAddressModelMock = function Address() {
    this.address = {};
};
var AddressModel;
var stubgetForm = sinon.stub();

var addressObject = {
    custom: {
        exteriorNumber: '234P',
        interiorNumber: '789Y',
        additionalInformation: 'TestInfo',
        colony: 'CIUDAD',
        dependentLocality: 'CDMEX'
    }
};


global.empty = function (params) {
    return !params;
};

describe('app_ua_na/cartridge/models/address.js', () => {
    before(function () {
        mockSuperModule.create(baseAddressModelMock);
        AddressModel = proxyquire('../../../../cartridges/app_ua_na/cartridge/models/address', {
            'server': {
                forms: {
                    getForm: stubgetForm.returns({
                        shippingAddress: {
                            addressFields: {}
                        }
                    })
                }
            }
        });
    });

    it('Testing for address model when empty and null passed', () => {
        var address = new AddressModel('');
        assert.isDefined(address, 'Model Object is not defined');
        assert.deepEqual(address.address, {}, 'Address Model Object is not empty');
        assert.isUndefined(address.address.exteriorNumber, 'exteriorNumber is defined');
        address = new AddressModel(null);
        assert.isDefined(address, 'Model Object is not defined');
        assert.deepEqual(address.address, {}, 'Address Model Object is not empty');
        assert.isUndefined(address.address.exteriorNumber, 'exteriorNumber is defined');
    });

    it('Testing for address model with values', () => {
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {
                    interiorNumber: '',
                    additionalInformation: ''
                }
            }
        });
        var address = new AddressModel(addressObject);
        assert.isDefined(address, 'Model Object is not defined');
        assert.isDefined(address.address, 'Address Model Object is not defined');
        assert.isDefined(address.address.exteriorNumber, 'exteriorNumber is not defined');
        assert.isDefined(address.address.interiorNumber, 'interiorNumber is  not defined');
        assert.isDefined(address.address.additionalInformation, 'additionalInformation is not defined');
        assert.isDefined(address.address.colony, 'stateCodeLabel is not defined');
        assert.isDefined(address.address.dependentLocality, 'dependentLocality is not defined');
        stubgetForm.reset();
    });

    it('Testing for address model not null', () => {
        var address = new AddressModel(addressObject);
        assert.isNotNull(address, 'Model Object is null');
        assert.isNotNull(address.address, 'Address Model Object is null');
        assert.isNotNull(address.address.exteriorNumber, 'exteriorNumber is null');
        assert.isNotNull(address.address.interiorNumber, 'interiorNumber is null');
        assert.isNotNull(address.address.additionalInformation, 'additionalInformation is null');
        assert.isNotNull(address.address.colony, 'colony is null');
        assert.isNotNull(address.address.dependentLocality, 'dependentLocality is null');
    });

    it('Testing exteriorNumber for address model passing null and without attribute', () => {
        addressObject.custom.exteriorNumber = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.exteriorNumber, 'exteriorNumber is defeined');
        delete addressObject.custom.exteriorNumber;
        address = new AddressModel(addressObject);
        assert.isUndefined(address.address.exteriorNumber, 'exteriorNumber is defeined');
    });

    it('Testing exteriorNumber for address model with values', () => {
        delete addressObject.custom.exteriorNumber;
        addressObject.raw = {
            custom: {
                exteriorNumber: '234P'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.exteriorNumber, 'exteriorNumber is not defined');
        assert.equal(address.address.exteriorNumber, addressObject.raw.custom.exteriorNumber, 'exteriorNumber mismatch');
    });

    it('Testing interiorNumber for address model passing null and without attribute', () => {
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {
                    interiorNumber: ''
                }
            }
        });
        addressObject.custom.interiorNumber = null;
        var address = new AddressModel(addressObject);

        assert.isDefined(address.address.interiorNumber, 'interiorNumber is defeined');
        assert.equal(address.address.interiorNumber, '', 'interiorNumber is value mismatch');
        delete addressObject.custom.interiorNumber;

        address = new AddressModel(addressObject);
        assert.isDefined(address.address.interiorNumber, 'interiorNumber is defeined');
        stubgetForm.reset();
    });

    it('Testing interiorNumber for address model with values', () => {
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {}
            }
        });
        addressObject.raw = {
            custom: {
                interiorNumber: '789Y'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.interiorNumber, 'interiorNumber is not defined');
        assert.equal(address.address.interiorNumber, addressObject.raw.custom.interiorNumber, 'interiorNumber mismatch');
        stubgetForm.reset();
    });

    it('Testing interiorNumber in address model for shipping form values', () => {
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.interiorNumber, 'interiorNumber is not defined');
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {
                    interiorNumber: {
                        value: '789Y'
                    }
                }
            }
        });
        addressObject.custom.interiorNumber = '789Y';
        address = new AddressModel(addressObject);

        assert.isDefined(address.address.interiorNumber, 'interiorNumber is not defined');
        assert.equal(address.address.interiorNumber, addressObject.custom.interiorNumber, 'interiorNumber mismatch');
        stubgetForm.reset();
    });

    it('Testing additionalInformation for address model passing null and without attribute', () => {
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {
                    additionalInformation: ''
                }
            }
        });

        addressObject.custom.additionalInformation = null;
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.additionalInformation, 'additionalInformation is defeined');
        assert.equal(address.address.additionalInformation, '', 'additionalInformation is value mismatch');

        delete addressObject.custom.additionalInformation;
        address = new AddressModel(addressObject);
        assert.isDefined(address.address.additionalInformation, 'additionalInformation is defeined');
        stubgetForm.reset();
    });

    it('Testing additionalInformation for address model with values', () => {
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {}
            }
        });
        addressObject.raw = {
            custom: {
                additionalInformation: '789Y'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.additionalInformation, 'additionalInformation is not defined');
        assert.equal(address.address.additionalInformation, addressObject.raw.custom.additionalInformation, 'additionalInformation mismatch');
        stubgetForm.reset();
    });

    it('Testing additionalInformation in address model for shipping form values', () => {
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.additionalInformation, 'additionalInformation is not defined');
        stubgetForm.returns({
            shippingAddress: {
                addressFields: {
                    additionalInformation: {
                        value: '789Y'
                    }
                }
            }
        });
        addressObject.custom.additionalInformation = '789Y';
        address = new AddressModel(addressObject);
        assert.isDefined(address.address.additionalInformation, 'additionalInformation is not defined');
        assert.equal(address.address.additionalInformation, addressObject.custom.additionalInformation, 'additionalInformation mismatch');
        stubgetForm.reset();
    });

    it('Testing colony for address model passing null and without attribute', () => {
        addressObject.custom.colony = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.colony, 'colony is defeined');
        delete addressObject.custom.colony;
        address = new AddressModel(addressObject);
        assert.isUndefined(address.address.colony, 'colony is defeined');
    });

    it('Testing colony in addressObject with values', () => {
        addressObject.raw = {
            custom: {
                colony: 'CIUDAD'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.colony, 'colony is not defined');
        assert.equal(address.address.colony, addressObject.raw.custom.colony, 'colony mismatch');
    });

    it('Testing dependentLocality for address model passing null and without attribute', () => {
        addressObject.custom.dependentLocality = null;
        var address = new AddressModel(addressObject);
        assert.isUndefined(address.address.dependentLocality, 'dependentLocality is defeined');
        delete addressObject.custom.dependentLocality;

        address = new AddressModel(addressObject);
        assert.isUndefined(address.address.dependentLocality, 'dependentLocality is defeined');
    });

    it('Testing dependentLocality not exists in addressObject', () => {
        addressObject.raw = {
            custom: {
                dependentLocality: 'CDMEX'
            }
        };
        var address = new AddressModel(addressObject);
        assert.isDefined(address.address.dependentLocality, 'dependentLocality is not defined');
        assert.equal(address.address.dependentLocality, addressObject.raw.custom.dependentLocality, 'dependentLocality mismatch');
    });
});

