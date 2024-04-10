'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');

function BaseAccount() {}
BaseAccount.getProfile = () => {
    return {
        firstName: 'firstName',
        lastName: 'lastName',
    }
}

let account;
let accountModel;
let currentCustomer;
let addressModel;
let orderModel;

describe('app_ua_mx/cartridge/models/account.js', () => {
    before(() => {
        mockSuperModule.create(BaseAccount);
    });

    beforeEach(() => {
        accountModel = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/models/account.js', {});
        currentCustomer = new (require('dw/customer/Customer'))();
        addressModel = {};
        orderModel = {};
    });

    it('Testing the initialization of the MX account model, raw profile dob data is undefined', () => {
        assert.doesNotThrow(() => account = new accountModel(currentCustomer, addressModel, orderModel));
        assert.equal(account.profile.dob, '');
    });

    it('Testing the initialization of the MX account model, raw profile dob data is defined', () => {
        var expectedDob = '10/14/1986';
        currentCustomer.raw = {
            profile: {
                custom: {
                    dob: expectedDob
                }
            }
        };
        assert.doesNotThrow(() => account = new accountModel(currentCustomer, addressModel, orderModel));
        assert.equal(account.profile.dob, expectedDob);
    });
});
