'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

let returnHelpers;
let defaultStubs;
let Site;
let SFMCEmailHelper;
let PreferencesUtil;
let HookMgr;

describe('app_ua_mx/cartridge/scripts/order/returnHelpers.js', () => {
    before(() => {
        Site = new (require('dw/system/Site'))();
        Site.getCurrent = () => Site;
        Site.preferences.getCustom = () => {
            return {
                'returnService': {
                    value: 'FedEx'
                }
            }
        };
        PreferencesUtil = {
            isCountryEnabled: () => true
        };
        SFMCEmailHelper = {
            sendReturnConfirmationEmail: sinon.spy(() => {})
        };
        HookMgr = new (require('dw/system/HookMgr'))();
    });

    beforeEach(() => {
        global.session = {
            privacy: {}
        };
        defaultStubs = {
            'dw/system/HookMgr': HookMgr,
            '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil,
            '*/cartridge/scripts/helpers/SFMCEmailHelper': SFMCEmailHelper,
            'dw/web/URLUtils': {
                https: () => {
                    return {
                        toString: () => 'string'
                    }
                }
            },
            'int_marketing_cloud/cartridge/scripts/util/helpers': {
                getCustomObject: () => {
                    return {
                        enabled: true,
                        countriesEnabled: ['MX']
                    }
                }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': function ReturnsUtils() {
                this.getPreferenceValue = (key) => {
                    var values = {
                        'returnService': 'FedEx'
                    };
                    return values[key] || null;
                }
            },
            'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {
                prepareURLForLocale: () => 'URL'
            },
            'dw/crypto/SecureRandom': function SecureRandom() {
                this.nextNumber = () => 0.1;
            },
            'dw/system/Site': Site
        };
        returnHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/returnHelpers.js', defaultStubs);
    });

    it('Testing method: setReturnDetails', () => {
        var retrunItems = [
            '{"returnSku":"1309545-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"}'
        ];

        // returnArray contains only one item
        var returnDetails = '{"returnArray":[' + retrunItems[0] + ']}';
        assert.doesNotThrow(() => returnHelpers.setReturnDetails(returnDetails));
        assert.equal(global.session.privacy.returnDetailsCounter, 1);
        assert.equal(global.session.privacy.returnDetails1, '[' + retrunItems[0] + ']');

        // returnArray contains four items
        retrunItems.push('{"returnSku":"1309545-299-20/20","returnReason":"SIZE_TOO_LARGE","replacementSku":"","returnQuantity":1,"returnDescription":"aaabbbccc"}');
        retrunItems.push('{"returnSku":"1309545-299-10/10","returnReason":"SIZE_TOO_LARGE","replacementSku":"","returnQuantity":1,"returnDescription":"cccbbbaaa"}');
        retrunItems.push('{"returnSku":"1309545-299-00/00","returnReason":"SIZE_TOO_LARGE","replacementSku":"","returnQuantity":1,"returnDescription":"bbbaaaccc"}');
        returnDetails = '{"returnArray":[' + retrunItems[0] + ',' + retrunItems[1] + ',' + retrunItems[2] + ',' + retrunItems[3] + ']}';
        assert.doesNotThrow(() => returnHelpers.setReturnDetails(returnDetails));
        assert.equal(global.session.privacy.returnDetailsCounter, 2);
        assert.equal(global.session.privacy.returnDetails1, '[' + retrunItems[0] + ',' + retrunItems[1] + ',' + retrunItems[2] + ']');
        assert.equal(global.session.privacy.returnDetails2, '[' + retrunItems[3] + ']');
    });

    it('Testing method: getReturnDetails', () => {
        var returnDetails;
        var returnDetailsCounter = 1;
        var initialReturnDetails = '{"returnDetails1":"returnDetails1"}';
        var expectedResult = {
            returnArray: [
                JSON.parse(initialReturnDetails)
            ]
        };

        // The session contains only one returned item.
        global.session.privacy.returnDetailsCounter = returnDetailsCounter;
        global.session.privacy.returnDetails1 = initialReturnDetails;

        assert.doesNotThrow(() => returnDetails = returnHelpers.getReturnDetails());
        assert.deepEqual(returnDetails, expectedResult);

        // The session contains four returned items.
        returnDetailsCounter = 2;
        initialReturnDetails = [
            {
                returnDetails1: 'returnDetails1'
            },
            {
                returnDetails2: 'returnDetails2'
            },
            {
                returnDetails3: 'returnDetails3'
            },
            {
                returnDetails4: 'returnDetails4'
            }
        ];
        expectedResult = {
            returnArray: initialReturnDetails
        }

        global.session.privacy.returnDetailsCounter = returnDetailsCounter;
        global.session.privacy.returnDetails1 = JSON.stringify(initialReturnDetails.slice(0, 3));
        global.session.privacy.returnDetails2 = JSON.stringify(initialReturnDetails.slice(-1));

        assert.doesNotThrow(() => returnDetails = returnHelpers.getReturnDetails());
        assert.deepEqual(returnDetails, expectedResult);
    });

    it('Testing method: createAuthFormObj', () => {
        var params;
        var Order = require('dw/order');
        var address = new Order.OrderAddress();        
        var order = new Order.Order();
        order.custom.shippingJson = '{}';
        order.getBillingAddress = () => address;
        var lineItem = new Order.LineItem();
        var shipment = new Order.Shipment()
        shipment.custom.paazlDeliveryInfo = '{}';
        shipment.getShippingAddress = () => address;
        lineItem.shipment = shipment;
        lineItem.authorizedQuantity = {
            value: {
                toString: () => 'string'
            }
        };
        var returnCase = new Order.ReturnCase();
        returnCase.getOrder = () => order;
        returnCase.items = [
            {
                lineItem,
                authorizedQuantity: {
                    value: {
                        toString: () => 'string'
                    }
                }

            }
        ];
        Site.setCustomPreferenceValue('returnService', {
            value: 'FedEx'
        });
        assert.doesNotThrow(() => params = returnHelpers.createAuthFormObj(returnCase));
        assert.isDefined(params);
        assert.isObject(params);
        var expectedProperties = [
            'deliveryNumber',
            'fullName',
            'firstName',
            'lastName',
            'address1',
            'city',
            'province',
            'postalCode',
            'phone',
            'email',
            'transactionNumber',
            'trackingNumber',
            'carrierName',
            'country',
            'suburb'
        ];
        expectedProperties.forEach((propName) => {
            assert.property(params, propName);
        });

        // The address is filled out
        address.fullName = 'fullName';
        address.firstName = 'FirstName';
        address.lastName = 'lastName';
        address.address1 = 'address1';
        address.city = 'city';
        address.postalCode = 'postalCode';
        address.stateCode = 'stateCode';
        address.custom.suburb = 'suburb';
        returnCase.custom  = {
            trackingNumber: 'TRC112233'
        };
        order.getCustomerEmail = () => 'test@email.com';
        order.custom.shippingJson = '[{"deliveryNumber":"deliveryNumber"}]';
        shipment.custom.paazlDeliveryInfo = '{"deliveryType":"HOME"}';
        Site.setCustomPreferenceValue('returnService', {
            value: null
        });

        assert.doesNotThrow(() => params = returnHelpers.createAuthFormObj(returnCase));
        assert.equal(params.fullName, address.fullName);
        assert.equal(params.firstName, address.firstName);
        assert.equal(params.lastName, address.lastName);
        assert.equal(params.address1, address.address1);
        assert.equal(params.city, address.city);
        assert.equal(params.postalCode, address.postalCode);
        assert.equal(params.province, address.stateCode);
        assert.equal(params.suburb, address.custom.suburb);
    });

    it('Testing method: sendReturnCreatedConfirmationEmail', () => {
        var Order = require('dw/order');
        var order = new Order.Order();
        order.custom.customerCountry = 'MX';
        var returnCase = new Order.ReturnCase();
        returnCase.custom  = {
            trackingNumber: 'TRC112233'
        };
        HookMgr.hasHook = () => true;

        // isCountryEnabled = true
        assert.doesNotThrow(() => returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase));
        assert(SFMCEmailHelper.sendReturnConfirmationEmail.called);

        // isCountryEnabled = false
        SFMCEmailHelper.sendReturnConfirmationEmail.reset();
        PreferencesUtil.isCountryEnabled = () => false;
        assert.doesNotThrow(() => returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase));
        assert(SFMCEmailHelper.sendReturnConfirmationEmail.notCalled);
    });

    it('Testing method: generateRmaNumber', () => {
        var length = 5;
        var generatedString;

        assert.doesNotThrow(() => generatedString = returnHelpers.generateRmaNumber(length));
        assert.lengthOf(generatedString, length);
    });
});
