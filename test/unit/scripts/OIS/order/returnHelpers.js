/* eslint-disable no-undef */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

function OISAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

class SecureRandom {
    constructor(item) {
        this.item = 0.1;
    }
    nextNumber() {
        return this.item;
    }
}

class Sites {
    constructor() {
        this.preferenceMap = {
            isBOPISEnabled: true,
            enableVIPCheckoutExperience: true,
            returnService: { value: 'UPS' },
            country: 'US',
            currency: 'USD'
        };
        this.preferences = {
            custom: this.preferenceMap
        };
    }
    getCustomPreferenceValue(key) {
        return this.preferenceMap[key];
    }
    getPreferences() {
        return {
            getCustom: () => {
                return this.preferenceMap;
            },
            custom: this.preferenceMap
        };
    }
    getID() {
        return this.preferenceMap.country;
    }
    getDefaultCurrency() {
        return this.preferenceMap.currency;
    }
    getDefaultLocale() {
        return this.preferenceMap.country;
    }
    // dw.system.Site methods
    static getCurrent() {
        if (Sites.current) {
            return Sites.current;
        }
        return new Sites();
    }
}
Sites.current = Sites.getCurrent();

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

var order = {
    orderNo: 'US0001',
    custom: {
        customerCountry: 'AT'
    },
    customerLocaleID: 'AT',
    siteId: 'OC',
    customerInfo: {
        email: 'example@example.com',
        customerNo: 'US1234'
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
    currency: 'USD'
};
var requestType = {
    trackingNumber: '98889898998'
};
var pdfObject = {
    trackingNumber: '98889898998'
};
var returnCase = {
    returnArray: [{
        returnSku: '1309545-299-30/30',
        returnReason: 'SIZE_TOO_SMALL',
        replacementSku: '',
        returnQuantity: 1,
        returnDescription: 'asdasdasd'
    }]
};

var Locale = {
    getLocale: function () {
        return { US: 'AU' };
    }
};

var guestData = {
    returnemail: 'test@gmail.com',
    returnfirstName: 'FirstName',
    returnLastName: 'LastName',
    streetAddress: 'streetAddress',
    apartment: 'apartment',
    city: 'US',
    returnstate: 'AK',
    returnzip: '60601',
    returnphone: '99999999',
    returnreasons: 'Size Issue',
    returnquantity: 1,
    transactionno: 'transactionno'
};

describe('int_OIS/cartridge/scripts/order/returnHelpers.js', function () {
    var returnHelpers = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/returnHelpers', {
        '~/cartridge/scripts/init/OISDataService': {
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
        '../util/OISHelper': {
            prepareGraphQLRequest: (requestType, params) => {
                return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
            }
        },
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/models/OIS/order': {},
        '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper,
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
        'dw/system/Site': Sites,
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/util/Locale': Locale,
        'dw/crypto/SecureRandom': SecureRandom,
        '*/cartridge/modules/providers': new EmailProvider(),
        '*/cartridge/scripts/util/utilHelper': {
            orderReturnReasonModel: () => {
                return 'SIZE_FIT';
            }
        }
    });

    var returnDetails = '{"returnArray":[{"returnSku":"1309545-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"}]}';

    it('Testing method: createRmaMutation with params', () => {
        var result = returnHelpers.createRmaMutation('createGuestItemizedRma', returnCase);
        assert.isDefined(result.error, false);
    });
    
    it('Testing method: generateRmaNumber with params', () => {
        global.session = {
            privacy: {
                returnDetails1: '',
                returnDetails2: '',
                returnDetails3: ''
            }
        };
        var result = returnHelpers.generateRmaNumber(10);
        assert.isDefined(result);
    });
    it('Testing method: getRMARequestBody with params', () => {
        var result = returnHelpers.getRMARequestBody(order, returnCase, pdfObject, '98889898998', 'US00011');
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });
    it('Testing method: getGuestRMARequestBody', () => {
        var result = returnHelpers.getGuestRMARequestBody(order, returnCase, pdfObject, '98889898998', 'US00011');
        assert.isDefined(result, 'result is Undefined');
    });

    it('Testing method: getRMAHistoryRequestBody', () => {
        var result = returnHelpers.getRMAHistoryRequestBody(order, returnCase, pdfObject, '98889898998', 'US00011');
        assert.isDefined(result, 'result is Undefined');
    });

    it('Testing method: getRMADetailsRequestBody', () => {
        var result = returnHelpers.getRMADetailsRequestBody(order.customerInfo.customerNo);
        assert.isDefined(result, 'result is defined');
        assert.equal(result.input.customerNo, 'US1234');
        assert.equal(result.input.siteId, 'US');
    });

    it('Testing method: getGuestOrderRMARequestBody & canadaPostRequestBody', () => {
        var result = returnHelpers.getGuestOrderRMARequestBody(guestData, pdfObject, 'FADEX', 'US001');
        assert.isNotNull(result);
        assert.isDefined(result, 'result is defined');
        result = returnHelpers.canadaPostRequestBody(guestData);
        assert.isDefined(result);
    });

    it('Testing method: sendReturnLabel', () => {
        var returnObj = {
            CustomerEmail: 'test@gmail.com'
        };
        var result = returnHelpers.sendReturnLabel(returnObj);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: setReturnDetails with params', () => {
        global.session = {
            privacy: {
                returnDetails1: '',
                returnDetails2: '',
                returnDetails3: ''
            }
        };
        var result = returnHelpers.setReturnDetails(returnDetails);
        assert.isUndefined(result, 'result is defined');
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

    it('Testing method: createAuthFormObj', () => {
        var result = returnHelpers.createAuthFormObj(rmaObject, guestData);
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });

    it('Testing method: createAuthFormObj', () => {
        var result = returnHelpers.createAuthFormObj(rmaObject, guestData);
        assert.equal(result.returnReasonModel, 'SIZE_FIT');
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result, 'result is not null');
    });

    it('Testing method: createRmaMutation with params', () => {
        function OISAuthTokenHelpers() {
            this.getValidToken = () => {
                return {
                    accessToken: null
                };
            };
        }
        var returnHelperss = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/returnHelpers', {
            '~/cartridge/scripts/init/OISDataService': {
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
            '../util/OISHelper': {
                prepareGraphQLRequest: (requestType, params) => {
                    return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {},
            '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelpers,
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
            'dw/system/Site': Sites,
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/util/Locale': Locale,
            'dw/crypto/SecureRandom': SecureRandom,
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/scripts/util/utilHelper': {
                orderReturnReasonModel: () => {
                    return 'SIZE_FIT';
                }
            }
        });
        var result = returnHelperss.createRmaMutation('createGuestItemizedRma', returnCase);
        assert.isNull(result, false);
    });
});
