/* eslint-disable no-undef */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

class Sites {
    constructor() {
        this.preferenceMap = {
            isBOPISEnabled: true,
            enableVIPCheckoutExperience: true,
            returnService: { value : 'UPS' }
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
    // dw.system.Site methods
    static getCurrent() {
        if (Sites.current) {
            return Sites.current;
        }
        return new Sites();
    }
}
Sites.current = Sites.getCurrent();


var returnCase = {
    items: [
        {
            lineItem: {
                productName: 'Product123',
                product: {
                    custom: {
                        colorway: 'black'
                    }
                },
                custom: {
                    sku: '1361379-001-XS',
                    colorway: 'black'
                },
                shipment: {
                    custom: {
                        paazlDeliveryInfo: '{"deliveryType":"HOME"}',
                        trackingNumber: 'UPS123'
                    },
                    getShippingAddress: () => {
                        return {
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
                        };
                    }
                }
            },
            authorizedQuantity: {
                value: 3
            },
            reasonCode: 'Size Issue'
        }
    ],
    custom: {
        paazlDeliveryInfo: '{"deliveryType":"HOME"}',
        trackingNumber: 'UPS123'
    },
    getOrder: () => {
        return {
            custom: {
                shippingJson: '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]'
            },
            getCustomerEmail: () => {
                return 'test@gmail.com';
            },
            getBillingAddress: () => {
                return {
                    getPhone: () => {
                        return '12345678990';
                    }
                };
            }
        };
    }
};

var Locale = {
    getLocale: function () {
        return { US: 'AU' };
    }
};

var ReturnsUtils = function () {
    return {
        getPreferenceValue: function (service, locale) {
            if (service === 'returnService') {
                return 'UPS';
            } else if (service === 'enableReturnXMLs') {
                return true;
            }
        }
    };
};

describe('app_ua_emea/cartridge/scripts/order/returnHelpers.js', function () {
    var returnHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/returnHelpers', {
        '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
        'dw/system/HookMgr': {
            hasHook: function (hookID) {
                return true;
            },
            callHook: function (hookID) {
                return {
                    isCalled: true,
                    shipLabel: 'TestShipLabel',
                    isReturnCase: true,
                    trackingNumber: '12345'
                };
            }
        },
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'app_ua_emea/cartridge/scripts/helpers/SFMCEmailHelper': {},
        'int_marketing_cloud/cartridge/scripts/util/helpers': {},
        'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {},
        '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
            orderReturnReasonModel: function () {
            }
        },
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
        'dw/util/Locale': Locale
    });
    var order = {
        custom: {
            customerCountry: 'AT'
        },
        customerLocaleID: 'AT',
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
    var requestType = {
        trackingNumber: '98889898998'
    };
    var params = {
        trackingNumber: '98889898998'
    };

    var returnDetails = '{"returnArray":[{"returnSku":"1309545-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"},{"returnSku":"13095451-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"}]}';

    it('Testing method: getRMAHistoryRequestBody with params', () => {
        var result = returnHelpers.createAuthFormObj(returnCase);
        assert.isDefined(result, 'result is  defined');
        assert.isNotNull(result, 'result is not null');
        // assert.equal(result.input.customerNo, '123');
    });

    it('Testing method: createAuthFormObj', () => {
        class Site {
            constructor() {
                this.preferenceMap = {
                    returnService: false
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
            // dw.system.Site methods
            static getCurrent() {
                if (Site.current) {
                    return Site.current;
                }
                return new Site();
            }
        }
        returnHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/returnHelpers', {
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: (SFMCEnabled) => {
                    return true;
                }
            },
            'app_ua_emea/cartridge/scripts/helpers/SFMCEmailHelper': {
                sendReturnConfirmationEmail: function (orders, parmas) {
                    return 'Email Sent';
                }
            },
            'int_marketing_cloud/cartridge/scripts/util/helpers': {
                getCustomObject: function(customObjectName, objectID) {
                    return {
                        enabled: true,
                        countriesEnabled: ['AT']
                    };
                }
            },
            'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {
                prepareURLForLocale: () => {
                    return 'https://www.asdhkas.com';
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
                orderReturnReasonModel: function () {
                }
            },
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
        var result = returnHelpers.createAuthFormObj(returnCase);
        assert.isDefined(result, 'result is  defined');
        assert.isNotNull(result, 'result is not null');
        // assert.equal(result.input.customerNo, '');
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
        assert.isNotNull(result, 'result is not null');
        result = returnHelpers.getReturnDetails();
        assert.isDefined(result.returnArray);
    });
    it('Testing method: sendReturnCreatedConfirmationEmail with params', () => {
        var result = returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase);
        assert.isUndefined(result, 'result is defined');
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
});
