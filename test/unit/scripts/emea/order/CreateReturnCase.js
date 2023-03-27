'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

var ReturnsUtils = function () {
    return {
        createReturnCaseForPrintLabel: function (order, returnItemsInfo) { 
            return order;
        },
        createReturnCase: function (order, returnItemsInfo) {
            return returnItemsInfo[0];
        }
    };
};

var transaction = {
    wrap: function wrap(callBack) {
        return callBack.call();
    },
    begin: function begin() {},
    commit: function commit() {},
    rollback: function begin() {}
};


    var params = {
        Order: {
            custom: {
                returnCaseNumber: ''
            }
        },
        returnCaseNumber: '12121',
        PrintLabel: true,
        ReturnItemsInfo: [{
            rmaDetails: {
                rmaNumber: '12121'
            },
            customerInfo: {
                email: 'email '
            },
            returnOrder: {
                isCommercialPickup: true,
                billingAddress: {
                    firstName: 'Amanda',
                    lastName: 'Jones',
                    address1: '65 May Lane',
                    address2: '',
                    city: 'Allston',
                    postalCode: '02135',
                    countryCode: { value: 'us' },
                    phone: '617-555-1234',
                    stateCode: 'MA',
                    custom: {
                        suburb: 'suburb',
                        district: 'district',
                        businessName: 'businessName'
                    }
                }
            },
            returnShipment: [{
                dateDelivered: '01/01/2022',
                trackingNumber: '124',
                trackingLink: '1234',
                carrier: {
                    name: 'shipment name'
                }
            }],
            returnAddress: {
                fullName: 'Amanda Jones',
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '617-555-1234',
                stateCode: 'MA'
            }
        }]
    };


describe('app_ua_emea/cartridge/scripts/orders/CreateObject.js', function () {
    var CreateObject = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/orders/CreateReturnCase', {
        'dw/object/CustomObjectMgr': {
            createCustomObject: () => {
                return {
                    custom: {
                        dwOrderNo: '',
                        trackingNumber: '',
                        consignmentId: '',
                        readyToExport: '',
                        transactionReference: '',
                        currencyCode: '',
                        returnSkusJson: ''
                    }
                };
            }
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
        'dw/system/Transaction': transaction,
        'configuration': {
            getValue: () => {
                return 'CREDIT_CARD';
            }
        }
    });

    it('Test Method : create', () => {
        params.PrintLabel = null;
        var result = CreateObject.create(params);
        assert.isDefined(result);
        // assert.isNull(result);
    });

    it('Test Method : create --> pass PrintLabel param = true ', () => {
        params.PrintLabel = true;
        var result = CreateObject.create(params);
        assert.isDefined(result);
        params.ReturnItemsInfo = [];
        result = CreateObject.create(params);
        assert.isNull(result);
    });
});
