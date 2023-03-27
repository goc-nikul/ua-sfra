'use strict';

/* eslint-disable quotes */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_fedex/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Fedex: util/ServiceHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    var ServiceHelper = proxyquire(pathToLinkScripts + 'util/ServiceHelper', {
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger')
    });

    var serviceConfiguration = {
        "key": "test",
        "password": "test",
        "accountNumber": "test",
        "meterNumber": "test",
        "serviceId": "aval",
        "major": 4,
        "intermediat": 0,
        "minor": 0
    };

    var profile = {
        custom: {
            data: JSON.stringify(serviceConfiguration)
        }
    };

    it('Testing method: getServiceConfig', () => {
        var serviceHelper = new ServiceHelper();

        var result = serviceHelper.getServiceConfig(profile);

        assert.deepEqual(result, {
            "key": "test",
            "password": "test",
            "accountNumber": "test",
            "meterNumber": "test",
            "serviceId": "aval",
            "major": 4,
            "intermediat": 0,
            "minor": 0
        });
    });

    it('Testing method: getMockedFedExShipmentProcessResponse', () => {
        var serviceHelper = new ServiceHelper();
        var result = serviceHelper.getMockedFedExShipmentProcessResponse();

        assert.deepEqual(result, {
            status: 'OK',
            classification: 'RESIDENTIAL'
        });
    });

    it('Testing method: parseFedExAddressResponse', () => {
        var serviceHelper = new ServiceHelper();
        var requestData = require(pathToLinkMock + 'scripts/serviceResponse');
        var result = serviceHelper.parseFedExAddressResponse('', requestData);

        assert.deepEqual(result, {
            status: 'OK',
            classification: 'RESIDENTIAL'
        });
    });

    it('Testing method: createFedExAddressTypeRequest', () => {
        var serviceHelper = new ServiceHelper();
        var webRef = require(pathToLinkMock + 'scripts/AddressValidationService_v4');
        var addressFields = {
            firstName: 'firstNameTest',
            lastName: 'lastNameTest',
            address1: 'address1Test',
            address2: 'address2Test',
            city: 'cityTest',
            postalCode: 'postalCodeTest',
            stateCode: 'stateCodeTest',
            countryCode: 'countryCodeTest',
            phone: 'phoneTest'
        };

        var result = serviceHelper.createFedExAddressTypeRequest('', profile, webRef, addressFields);

        assert.equal(result.webAuthenticationDetail.userCredential.key, 'test');
        assert.equal(result.webAuthenticationDetail.userCredential.password, 'test');
        assert.equal(result.clientDetail.accountNumber, 'test');
        assert.equal(result.clientDetail.meterNumber, 'test');
        assert.equal(result.version.serviceId, 'aval');
        assert.equal(result.version.major, 4);
        assert.equal(result.addressesToValidate[0].address.city, 'cityTest');
        assert.equal(result.addressesToValidate[0].address.postalCode, 'postalCodeTest');
    });
});
