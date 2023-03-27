'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseAccountModelMock = require('./baseModel');
var AccountModel;

var currentCustomer = {
    profile: {
        firstName: 'John',
        lastName: 'Snow',
        email: 'jsnow@starks.com'
    },
    raw: {
        authenticated: true,
        registered: true,
        profile: {
            custom: {
                zipCode: '12345',
                countryDialingCode: ''
            }
        }
    }
};

describe('app_ua_apac/cartridge/models/account', () => {
    before(function () {
        mockSuperModule.create(baseAccountModelMock);
        AccountModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/account.js', {
            'dw/web/Resource': {
                msgf: function (params) { return params; },
                msg: function (params) { return params; }
            }
        });
    });

    it('Testing account Model not Defined', function () {
        var result = new AccountModel(currentCustomer);
        assert.isDefined(result, 'Model Object is not defined');
        assert.isDefined(result.profile, 'Profile object is not defined');
        assert.isDefined(result.profile.firstName, 'First Name is not defined');
        assert.isDefined(result.profile.lastName, 'Last Name is not defined');
        assert.isDefined(result.profile.email, 'Email is not defined');
        assert.isDefined(result.profile.zipCode, 'Zip code is not defined');
    });

    it('Testing account Model not Null', function () {
        var result = new AccountModel(currentCustomer);
        assert.isNotNull(result, 'Model Object is null');
        assert.isNotNull(result.profile, 'Profile object is null');
        assert.isNotNull(result.profile.firstName, 'First Name is null');
        assert.isNotNull(result.profile.lastName, 'Last Name is null');
        assert.isNotNull(result.profile.email, 'Email is null');
        assert.isNotNull(result.profile.zipCode, 'Zip code is null');
    });

    it('should receive customer profile', function () {
        var result = new AccountModel(currentCustomer);
        assert.equal(result.profile.firstName, 'John');
        assert.equal(result.profile.lastName, 'Snow');
        assert.equal(result.profile.email, 'jsnow@starks.com');
        assert.equal(result.profile.zipCode, '12345');
    });

    it('should not receive customer profile for guest customer', function () {
        currentCustomer.profile = null;
        assert.isNull(AccountModel.getProfile(currentCustomer), 'Customer profile should be null');
    });

});
