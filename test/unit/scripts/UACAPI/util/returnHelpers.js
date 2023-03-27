/* eslint-disable no-undef */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

function UACAPIEmptyAuthTokenHelper() {
    this.getValidToken = () => null;
}
function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}
class EmailProvider {
    constructor() {
        this.emailObj = {};
    }

    get(type, emailObj) {
        this.emailObj = emailObj;
        return this;
    }

    send() {
        return 'Email Sent';
    }
}
var Site = {
    getCurrent: function () {
        return {
            getID: function () { return 'OC'; },
            getDefaultCurrency: function () { return 'US'; },
            getDefaultLocale: function () { return 'US'; }
        };
    },
    current: {
        getCustomPreferenceValue: function () { return { customerServiceEmail: 'AU' }; }
    }
};
var Locale = {
    getLocale: function () {
        return { US: 'AU' };
    }
};

describe('int_mao/cartridge/scripts/UACAPI/helpers/order/returnHelpers.js', function () {
    const returnHelpers = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/returnHelpers', {

        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
        '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
            getGraphQL: () => {
                return {
                    call: () => {
                        return {
                            ok: true,
                            object: {
                                error: false,
                                orders: []
                            }
                        };
                    }
                };
            }
        },
        '../util/UACAPIHelper': {
            prepareGraphQLRequest: () => null
        },
        '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
            orderReturnReasonModel: function () {
            }
        },
        '*/cartridge/modules/providers': new EmailProvider(),
        '*/cartridge/scripts/helpers/emailHelpers': {
            emailTypes: {
                registration: 1,
                passwordReset: 2,
                passwordChanged: 3,
                orderConfirmation: 4,
                accountLocked: 5,
                accountEdited: 6,
                possibleFraudNotification: 7,
                invoiceConfirmation: 8,
                eGiftCard: 9,
                returnLabel: 10
            }
        },
        'dw/system/Site': Site,
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/util/Locale': Locale
    });
    var order = {
        siteId: 'OC',
        customerInfo: {
            email: 'example@example.com'
        },
        orderItems: [{
            ID: '1234',
            productItem: {
                product: {
                    upc: '1234',
                    sku: '1234-1234',
                    copy: {
                        name: 'product name'
                    },
                    assets: null,
                    color: null,
                    prices: {
                        total: 100
                    }
                },
                quantity: 1
            },
            shippingMethod: 'GROUND',
            shipmentId: '124',
            storeId: null
        }],
        originalOrderItems: [{
            ID: '1234'
        }],
        currency: 'USD',
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
    };

    var returnItems = {
        returnItems: [{

        }]
    };
    var guestData = {
        returnemail: 'dummy@example.com',
        returnfirstName: 'Amanda',
        returnLastName: 'Jones',
        streetAddress: '65 May Lane',
        apartment: '',
        city: 'Allston',
        returnstate: 'MA',
        returnzip: '02135',
        returnreasons: 'anonymous',
        returnquantity: 1,
        transactionno: '121212121212'
    };

    var rmaObject = {
        rma: {
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
        }
    };
    var pdfObject = {
        trackingNumber: '98889898998'
    };
    var sapCarrierCode = '123456';
    var rmaNumber = '99999';

    var requestType = {
        trackingNumber: '98889898998'
    };
    var params = {
        trackingNumber: '98889898998'
    };

    var returnDetails = '{"returnArray":[{"returnSku":"1309545-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"}]}';

    it('Testing method: getRMAHistoryRequestBody with params', () => {
        var result = returnHelpers.getRMAHistoryRequestBody('123', '1221');
        assert.isDefined(result, 'result is  defined');
        assert.isNotNull(result, 'result is not null');
        assert.equal(result.input.customerNo, '123');
    });
    it('Testing method: getRMAHistoryRequestBody with empty params', () => {
        var result = returnHelpers.getRMAHistoryRequestBody();
        assert.isDefined(result, 'result is  defined');
        assert.isNotNull(result, 'result is not null');
        assert.equal(result.input.customerNo, '');
    });
    it('Testing method: getRMADetailsRequestBody with params', () => {
        var result = returnHelpers.getRMADetailsRequestBody('123', '1221');
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
        assert.equal(result.input.customerNo, '123');
    });
    it('Testing method: getRMADetailsRequestBody with empty params', () => {
        var result = returnHelpers.getRMADetailsRequestBody();
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
        assert.equal(result.input.customerNo, '');
    });
    it('Testing method: getRMARequestBody', () => {
        var result = returnHelpers.getRMARequestBody(order, returnItems);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: getGuestRMARequestBody', () => {
        var result = returnHelpers.getGuestRMARequestBody(order, returnItems);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: setReturnDetails', () => {
        var session = {
            privacy: {
                returnDetailsCounter: 5
            }
        };
        global.session = session;
        var result = returnHelpers.setReturnDetails(returnDetails);
        assert.isUndefined(result, 'result is Undefined');
    });
    it('Testing method: getReturnDetails', () => {
        var session = {
            privacy: {
                returnDetailsCounter: 1,
                returnDetails1: '[{"returnSku":"1309545-299-30/30","return…ity":1,"returnDescription":"asdasdasd"}]'
            }
        };
        global.session = session;
        var result = returnHelpers.getReturnDetails();
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: getExchangeOriginalOrderCollection', () => {
        var result = returnHelpers.getExchangeOriginalOrderCollection(order);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: getGuestOrderRMARequestBody', () => {
        var result = returnHelpers.getGuestOrderRMARequestBody(guestData, pdfObject, sapCarrierCode, rmaNumber);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: canadaPostRequestBody', () => {
        var result = returnHelpers.canadaPostRequestBody(guestData);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: createAuthFormObj', () => {
        var result = returnHelpers.createAuthFormObj(rmaObject, guestData);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    let returnObj = {
        CustomerEmail: 'testEmail',
        firstName: 'testFirstName',
        lastName: 'testlastName'
    };
    it('Testing method: sendReturnLabel', () => {
        var result = returnHelpers.sendReturnLabel(returnObj);
    });
    it('Testing method: createRmaMutation with empty token', () => {
        var returnHelpers = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/returnHelpers', {
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIEmptyAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => null
                    };
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },

            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
                orderReturnReasonModel: function () {
                }
            },
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'dw/system/Site': Site,
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/util/Locale': Locale
        });
        var result = returnHelpers.createRmaMutation(requestType, params);
        assert.isDefined(result, 'result is defined');
        assert.equal(result.error, true);
    });
    it('Testing method: createRmaMutation with response is null', () => {
        // eslint-disable-next-line no-shadow
        var returnHelpers = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/returnHelpers', {
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => null
                    };
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },

            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
                orderReturnReasonModel: function () {
                }
            },
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'dw/system/Site': Site,
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/util/Locale': Locale
        });
        var result = returnHelpers.createRmaMutation(requestType, params);
        assert.isDefined(result, 'result is defined');
        assert.equal(result.error, true);
    });
    it('Testing method: createRmaMutation with response is null', () => {
        var returnHelpers = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/returnHelpers', {
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => {
                            return {
                                ok: true,
                                object: {
                                    error: true,
                                    orders: [],
                                    errorMessage: 'server error'
                                }
                            };
                        }
                    };
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },

            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
                orderReturnReasonModel: function () {
                }
            },
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'dw/system/Site': Site,
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/util/Locale': Locale
        });
        var result = returnHelpers.createRmaMutation(requestType, params);
        assert.isDefined(result, 'result is defined');
        assert.equal(result.error, true);
    });
    it('Testing method: createRmaMutation', () => {
        var result = returnHelpers.createRmaMutation(requestType, params);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
});
