'use strict';

const { method, split } = require('lodash');
const M = require('minimatch');
const sinon = require('sinon');
const { SHIPPING_STATUS_SHIPPED } = require('../../../../mocks/dw/dw_order_Order');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var ArrayList = require('../../../../mocks/scripts/util/collections');
var shippingJson = '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]';

global.empty = (data) => {
    return !data;
};

global.request = {
    locale: 'MX'
};

class Sites {
    constructor() {
        this.preferenceMap = {
            enableNarvarTracking: true,
            narvarRetailerName: 'UA',
            narvarCarrierMapping: '{"UPS-STD":"UPS","UPS-PUP":"UPS","UPS-EXS":"UPS"}'
        };
        this.preferences = {
            custom: this.preferenceMap
        };
    }
    getCustomPreferenceValue(key) {
        if (key === 'enableNarvarTracking') {
            return {
                replace: () => {
                    return { split: () => { return { indexof: () => { return this.preferenceMap[key]; }, indexOf: () => { return this.preferenceMap[key]; } }; }
                    };
                }
            };
        }
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

class Calender {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
    }

    add(field, value) {
        if (field === this.DATE) {
            this.date.setDate(this.date.getDate() + value);
        }
    }

    before() {
        return false;
    }

    toTimeString() {
        return this.date;
    }

    get() {
        return 2;
    }

    getTime() {
        return 100000;
    }

    parseByFormat(date, key) {
        return date;
    }
}


class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
}


class Locale {
    constructor() {
        this.ID = 'Default';
        this.country = 'MX';
    }
    // eslint-disable-next-line no-unused-vars
    static getLocale(id) {
        return {
            getCountry: () => {
                return this.country;
            }
        };
    }
}

class Quantity {
    constructor(a, b) {
        this.value = 1;
    }
}

var items = [{
    orderItemID: '1234',
    Order: {
        orderNo: 'DEVEU-00020652'
    },
    qty: 1,
    lineItem: {
        quantity: {
            getUnit: () => {
                return 1;
            }
        },
        custom: {
            sku: '1234-1234',
            refundItems: ''
        },
        productID: '1234'
    },
    custom: {
        refundItems: ''
    },
    orderItem: {
        itemID: '1234',
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
    },
    getAuthorizedQuantity: () => {
        return 1;
    },
    createReturnItem: () => {
        return { setReasonCode: (key) => { return key; },
            setReturnedQuantity: (key) => { return key; }
        };
    },
    getReasonCode: () => {
        return 'SIZE_ISSUE';
    },
    setStatus: () => {
        return {
            STATUS_CANCELLED: 'STATUS_CANCELLED'
        };
    }
}];

var returncase = {
    returns: { empty: true },
    status: 'STATUS_NEW',
    items: [{
        setStatus: () => {
            return {
                STATUS_CANCELLED: 'STATUS_CANCELLED'
            };
        },
        lineItem: {
            upc: '1234',
            sku: '3023533-001-6',
            copy: {
                name: 'product name'
            },
            assets: null,
            color: null,
            prices: {
                total: 100
            },
            qty: 1,
            custom: { sku: '3023533-001-6-1' }
        },
        reasonCode: {
            value: 'SIZE_ISSUE'
        }
    }],
    custom: {
        refundItems: ['3023533-001-6-1'],
    },
    confirm: () => {
        return true;
    },
    createReturn: () => {
        return {
            custom: {
                refundItems: ''
            },
            returnCase: { RMA: true },
            status: { value: SHIPPING_STATUS_SHIPPED },
            getReturnNumber: () => {
                return 'DEVEU-00020652-R1';
            },
            setNote: () => {
                return 'ShortShip Refund';
            }
        };
    },
    getItems: () => {
        return items;
    }
};

describe('app_ua_mx/cartridge/scripts/orders/ReturnUtils.js', function () {
    var ReturnsUtils = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/orders/ReturnsUtils', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/util/Calendar': Calender,
        'dw/order/ReturnCaseItem': () => {
            return { STATUS_RETURNED: 'STATUS_RETURNED' }
        },
        'dw/system/Site': Sites,
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/util/Locale': Locale,
        'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
        'dw/value/Quantity': Quantity,
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getJsonValue: (countryOverride) => {
                return {
                    'MX': {
                        'returnFromAddress': {
                            'name': 'Under Armour',
                            'attentionName': 'Under Armour Returns',
                            'address': '7 Avenue Didier Daurat',
                            'city': 'Toulouse',
                            'postalCode': '30044',
                            'countryCode': 'MX',
                            'phone': '00800-82766871'
                        }
                    }
                };
            },
            getValue: function (orderReturnsEligibility) {
                if (orderReturnsEligibility === 'orderReturnsEligibility') {
                    return 365;
                } else if (orderReturnsEligibility === 'returnAddress') {
                    return '{"name":"Geodis Norway AS","attentionName":"C/O GF Logistikk – UA Return","address":"Brages veg 8","city":"Jessheim","postalCode":"2050","countryCode":"NO","phone":"00800-82766871"}';
                } else if (orderReturnsEligibility === 'mailSubject') {
                    return 'sendPaymentDetails';
                } else if (orderReturnsEligibility === 'csEmail') {
                    return 'donotreply@underarmour.com';
                } else if (orderReturnsEligibility === 'blockedReturnCategories') {
                    return 'MEN,ABC,DFF';
                }
                return null;
            }
        },
        '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/order/Invoice': {
            STATUS_FAILED: 'STATUS_FAILED'
        },
        'app_ua_mx/cartridge/scripts/orders/EODReportMgr': {
            incrementReportValue: () => {
                return 'ShortShipOrder';
            }
        },
        'dw/util/HashMap': function () {
            return {
                result: {},
                put: function (key, context) {
                    this.result[key] = context;
                }
            };
        },
        'app_ua_core/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
        'dw/system': {},
        'underarmour_storefront/cartridge/scripts/util/MailHelper': {
            processSendMail: () => {
                return 'sent';
            }
        },
        'dw/order/OrderMgr': {
            getOrder: (orderID) => {
                if (orderID) {
                    return {
                        custom: {
                            shippingJson: '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]'
                        },
                        getReturnCase: (retCaseNum) => {
                            returncase.returns.empty = false;
                            // returncase.returns.status = 'STATUS_COMPLETED';
                            returncase.returns.toArray = function () { return [{ STATUS_COMPLETED: 'STATUS_COMPLETED', invoice: { status: 'STATUS_FAILED', STATUS_FAILED: 'STATUS_FAILED' }, status: 'STATUS_COMPLETED' }]; };
                            return returncase;
                        }
                    };
                }
                return null;
            }
        },
        'dw/order/Return': () => {
            return { STATUS_COMPLETED: 'STATUS_COMPLETED' };
        },
        'dw/catalog/CatalogMgr': {
            getCategory: () => {
                return 'Footwear';
            }
        },
        TimezoneHelper: () =>{ return TimezoneHelper; }
    });

    it('Test Method: getReturnsPreferences', () => {
        var orderCreationDate = '12/03/2021';
        var returnCaseCount = 10;
        var result = ReturnsUtils.prototype.getReturnsPreferences(orderCreationDate, returnCaseCount);
        assert.equal(result.eligibilityDaysCount, 0);
        assert.equal(result.expiredDate, 100000);
        assert.equal(result.isReturnsAvailable, false);
    });

    it('Test Method : getQTYInformation', () => {
        global.dw = {
            util: {
                SortedMap: function (a, b) {
                    return {
                        put: () => {
                            return a - b;
                        }
                    };
                }
            },
            web: {
                Resource: {
                    msg: () => { return 1; }
                }
            }
        };
        var pli = {
            siteId: 'OC',
            customerInfo: {
                email: 'example@example.com'
            },
            custom: {
                sku: '1361379-001-XS'
            },
            quantity: {
                value: 1
            },
            orderItem: {
                itemID: '1234',
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
            },
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
        
        var returnCase = {
            orderItem: {
                itemID: '1234',
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
            },
            status: 'STATUS_RETURNED',
            STATUS_RETURNED: 'STATUS_RETURNED',
            reasonCode: 'SIZE_ISSUE',
            getAuthorizedQuantity: () => {
                return 1;
            }
        };
        var returnCaseArray = [returnCase];
        var result = ReturnsUtils.prototype.getQTYInformation(pli, returnCaseArray, shippingJson);
        assert.equal(result.availableQTY, 0);
        assert.equal(result.shippedQty, 1);
        assert.equal(result.customerReturnedQTY, 1);
        assert.equal(result.shortShipReturnedQty, 0);
        assert.equal(result.inReturnProcess, 0);

        returnCase.reasonCode = '';
        result = ReturnsUtils.prototype.getQTYInformation(pli, returnCaseArray, shippingJson);
        assert.equal(result.availableQTY, 0);
        assert.equal(result.shippedQty, 1);
        assert.equal(result.customerReturnedQTY, 0);
        assert.equal(result.shortShipReturnedQty, 1);
        assert.equal(result.inReturnProcess, 0);
    });

    it('Test Method : ReturnsUtils with empty function parameters', () => {
        var preferenceName = 'returnFromAddress';
        var orderCustomerLocale = 'en_AT';
        var result = ReturnsUtils.prototype.getPreferenceValue(preferenceName, orderCustomerLocale);
        assert.isDefined(result, 'returns JSON object');
    });

    it('Test Method : ReturnsUtils with empty function parameters', () => {
        var preferenceName = '';
        var orderCustomerLocale = 'en_AT';
        var result = ReturnsUtils.prototype.getPreferenceValue(preferenceName, orderCustomerLocale);
        assert.equal(result, null);
    });

    it('Test Method : ReturnsUtils with empty function parameters', () => {
        assert.isDefined(ReturnsUtils, 'returns empty function');
    });

    it('Test Method : getPLIRefundsInfo', () => {
        var refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        var pliSku = '3023533-001-6';
        var result = ReturnsUtils.prototype.getPLIRefundsInfo(refundsJson, pliSku);
        assert.equal(result[0].refundAmount, '$230.00');
        assert.isDefined(result[0].refundDate);
    });

    it('Test Method : getRefundInfoForOrderDetail', () => {
        var refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        var returnNumber = 'DEVEU-00020652-R1';
        var result = ReturnsUtils.prototype.getRefundInfoForOrderDetail(returnNumber, refundsJson);
        assert.equal(result.refundAmount, '230.00');
        assert.equal(result.refundCurrency, 'PLN');
        assert.isDefined(result.refundDate);
        assert.equal(result.returnNumber, 'DEVEU-00020652-R1');
        assert.isDefined(result.items);
    });

    it('Test Method : getReturnStatus', () => {
        var lineItemContainer = {
            custom: {
                refundsJson: '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]'
            },
            getProductLineItems: () => {
                return [{
                    custom: {
                        sku: '123456'
                    },
                    getQuantityValue() {
                        return '22999';
                    }
                }];
            }
        };
        // var returnNumber = 'DEVEU-00020652-R1';
        var result = ReturnsUtils.prototype.getReturnStatus(lineItemContainer);
        assert.equal(result, 'PARTIALLY_RETURNED');
        var sku = '123456';
        result = ReturnsUtils.prototype.getPLIBySKU(lineItemContainer, sku);
        assert.isDefined(result, 'Result is defined');
    });

    it('Test Method : isPartiallyShipped', () => {
        var lineItemContainer = {
            custom: {
                shippingJson: shippingJson // '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]'
            },
            getProductLineItems: () => {
                return [{
                    custom: {
                        sku: '123456'
                    },
                    getQuantityValue() {
                        return '22999';
                    }
                }];
            }
        };
        // var returnNumber = 'DEVEU-00020652-R1';
        var result = ReturnsUtils.prototype.isPartiallyShipped(lineItemContainer);
        assert.equal(result, true);
    });

    it('Test Method : createReturnCase', () => {
        global.dw = {
            util: {
                SortedMap: function (a, b) {
                    return {
                        put: () => {
                            return a - b;
                        }
                    };
                }
            },
            web: {
                Resource: {
                    msg: () => { return 1; }
                }
            }
        };
        var pli = {
            siteId: 'OC',
            customerInfo: {
                email: 'example@example.com'
            },
            custom: {
                sku: '1361379-001-XS',
                rmaList: '',
                refundItems: '',
                shippingDate: '12/03/2022',
                shippingJson: shippingJson // '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]'
            },
            quantity: {
                value: 1
            },
            orderItem: [{
                itemID: '1234',
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
                shippingMethod: {
                    custom: {
                        isExpressShipping: 'EXP'
                    }
                },
                shipmentId: '124',
                storeId: null,
                getShippingMethod: () => {
                    return this.shippingMethod;
                }
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
            },
            createReturnCase: (isShortShipReturn) => {
                return {
                    returnCaseNumber: '12324',
                    custom: {
                        refundItems: ''
                    },
                    createItem(orderItemID) {
                        return {
                            setAuthorizedQuantity: () => {
                                return 1;
                            },
                            setReasonCode: () => {
                                return 'FIT_ISSUE';
                            },
                            setNote: () => {
                                return 'SIZE ISSUE';
                            }
                        };
                    }
                };
            },
            getShipments: () => {
                return [{
                    getShippingMethod: () => {
                        return {
                            custom: {
                                isExpressShipping: 'EXP'
                            }
                        };
                    }
                }];
            }
        };
        
        var returnCase = [{
            returnOrderItemID: '1234',
            qty: 1,
            pli: {
                quantity: {
                    getUnit: () => {
                        return 1;
                    }
                },
                custom: {
                    sku: '1234-1234',
                    refundItems: ''
                },
                productID: '1234'
            },
            custom: {
                refundItems: ''
            },
            orderItem: {
                itemID: '1234',
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
            },
            returnSku: '1234',
            returnPid: '1234',
            getAuthorizedQuantity: () => {
                return 1;
            },
            Quantity: () => {
                return 1;
            }
        }];
        global.Quantity = (data) => {
            return !data;
        };
        var result = ReturnsUtils.prototype.createReturnCase(pli, returnCase, true);
        assert.equal(result.returnCaseNumber, '12324');
        assert.isUndefined(result.custom.refundItems[0]);
        result = ReturnsUtils.prototype.createReturnCase(null, null, true);
        assert.equal(result, null);
        result = ReturnsUtils.prototype.createReturnCaseForPrintLabel(null, null, true);
        assert.equal(result, null);
        result = ReturnsUtils.prototype.createReturnCaseForPrintLabel(pli, returnCase, true);
        assert.equal(result.returnCaseNumber, '12324');
        // assert.isDefined(result.custom.refundItems[0]);
        result = ReturnsUtils.prototype.getOrderShippingDate(pli);
        assert.isDefined(result);
        pli.custom.shippingDate = '';
        result = ReturnsUtils.prototype.getOrderShippingDate(pli);
        assert.isDefined(result);
        result = ReturnsUtils.prototype.getShippingDate(pli);
        assert.equal(result, false);
        result = ReturnsUtils.prototype.getShippingTrackingCode(pli);
        assert.equal(result, '883613727547322E');
        pli.custom.shippingJson = '';
        result = ReturnsUtils.prototype.getShippingTrackingCode(pli);
        assert.equal(result, '');
        result = ReturnsUtils.prototype.getOrderShippingMethodExpStd(pli);
        assert.equal(result, 'EXP');
    });

    it('Test Method : createReturnWithReturnCase', () => {
        var returnCase = {
            createReturn() {
                return {
                    custom: {
                        refundItems: ''
                    },
                    getReturnNumber: () => {
                        return 'DEVEU-00020652-R1';
                    }
                };
            },
            getItems: () => {
                return [{
                    orderItemID: '1234',
                    qty: 1,
                    lineItem: {
                        quantity: {
                            getUnit: () => {
                                return 1;
                            }
                        },
                        custom: {
                            sku: '1234-1234',
                            refundItems: ''
                        },
                        productID: '1234'
                    },
                    custom: {
                        refundItems: ''
                    },
                    orderItem: {
                        itemID: '1234',
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
                    },
                    getAuthorizedQuantity: () => {
                        return 1;
                    },
                    createReturnItem: () => {
                        return { setReasonCode: (key) => { return key; },
                            setReturnedQuantity: (key) => { return key; }
                        };
                    },
                    getReasonCode: () => {
                        return 'SIZE_ISSUE';
                    }
                }];
            }
        };
        var result = ReturnsUtils.prototype.createReturnWithReturnCase(returnCase);
        assert.equal(result.custom.refundItems, '1234-1234-1');
    });

    it('Test Method : isNarvarEnabled', () => {
        var customerCountry = 'ALL';
        var result = ReturnsUtils.prototype.isNarvarEnabled(customerCountry);
        assert.equal(result, true);
    });

    it('Test Method : getShippingTrackingLink', () => {
        var pli = {
            siteId: 'OC',
            customerInfo: {
                email: 'example@example.com'
            },
            getCreationDate: () => {
                return '12/02/2022';
            },
            custom: {
                sku: '1361379-001-XS',
                rmaList: '',
                refundItems: '',
                shippingDate: '12/03/2022',
                shippingJson: shippingJson // '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]'
            },
            quantity: {
                value: 1
            },
            orderItem: [{
                itemID: '1234',
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
                shippingMethod: {
                    custom: {
                        isExpressShipping: 'EXP'
                    }
                },
                shipmentId: '124',
                storeId: null,
                getShippingMethod: () => {
                    return this.shippingMethod;
                }
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
            },
            createReturnCase: (isShortShipReturn) => {
                return {
                    returnCaseNumber: '12324',
                    custom: {
                        refundItems: ''
                    },
                    createItem(orderItemID) {
                        return {
                            setAuthorizedQuantity: () => {
                                return 1;
                            },
                            setReasonCode: () => {
                                return 'FIT_ISSUE';
                            },
                            setNote: () => {
                                return 'SIZE ISSUE';
                            }
                        };
                    }
                };
            },
            getShipments: () => {
                return [{
                    getShippingMethod: () => {
                        return {
                            custom: {
                                isExpressShipping: 'EXP'
                            }
                        };
                    }
                }];
            }
        };
        var result = ReturnsUtils.prototype.getShippingTrackingLink(pli, false);
        assert.isDefined(result, 'https://UA.narvar.com/UA/tracking/UPS?tracking_numbers=883613727547322E&service=EXP&order_date=12/02/20:22&ship_date=12/03/20:22&locale=undefined&origin_country=NO&origin_zip_code=2050&destination_country=AT');
        pli.custom.shippingJson = '';
        result = ReturnsUtils.prototype.getShippingTrackingLink(pli, false);
        assert.equal(result, '');
        pli.custom.shippingJson = '';
        pli.custom.shippingData = 'href =//UA.narvar.com/UA/tracking/UPS?tracking_numbers=883613727547322E&service=EXP&order_date=12/02/20:22&ship_date=12/03/20:22&locale=undefined&origin_country=NO&origin_zip_code=2050&destination_country=AT';
        result = ReturnsUtils.prototype.getShippingTrackingLink(pli, false);
        assert.equal(result, '');
    });


    it('Test Method : getPLIShippingDate', () => {
        var plisku = '1361379-001-XS';
        var result = ReturnsUtils.prototype.getPLIShippingDate(shippingJson, plisku);
        assert.isDefined(result);
        result = ReturnsUtils.prototype.getPLIShippingDate(null, plisku);
        assert.isNull(result, 'Date is null');
    });

    it('Test Method : getRefundLineItems && isRefundHasIgnoreSku', () => {
        var refund = {
            'emailSent': true,
            'refundDate': '2022-03-15T12:28:00.025Z',
            'refundAmount': '230.00',
            'refundCurrency': 'PLN',
            'refundReason': '',
            'items': [{
                '3023533-001-6': '1'
            }],
            'itemAmounts': {
                '3023533-001-6': '230.00'
            },
            'returnNumber': 'DEVEU-00020652-R1'
        };
        var result = ReturnsUtils.prototype.getRefundLineItems(refund);
        assert.isDefined(result);
        result = ReturnsUtils.prototype.isRefundHasIgnoreSku(refund);
        assert.isFalse(result, 'The SKU Ignore is false');
    });

    it('Test Method : getReturnAccordingReturnNumber', () => {
        var returnNumber = 'DEVEU-00020652-R1';
        var order = {
            returns: [{
                orderItemID: '1234',
                qty: 1,
                lineItem: {
                    quantity: {
                        getUnit: () => {
                            return 1;
                        }
                    },
                    custom: {
                        sku: '1234-1234',
                        refundItems: ''
                    },
                    productID: '1234'
                },
                custom: {
                    refundItems: ''
                },
                orderItem: {
                    itemID: '1234',
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
                },
                getReturnNumber: () => {
                    return 'DEVEU-00020652-R1';
                }
            }]
        };
        var result = ReturnsUtils.prototype.getReturnAccordingReturnNumber(order, returnNumber);
        assert.isDefined(result, 'return object of defined data');
    });

    it('Test Method : getReturnAccordingRefundLineItems', () => {
        global.dw = {
            order: {
                ReturnCase: {
                    STATUS_NEW: 'STATUS_NEW'
                },
                Return: { STATUS_NEW: 'STATUS_NEW' }
            }
        };
        var pli = {
            getReturns: () => {
                return [{
                    custom: {
                        refundItems: ['3023533-001-6-1']
                    },
                    getStatus: () => {
                        return 'STATUS_NEW';
                    },
                    getInvoice: () => {
                        return { getStatus: () => { return 'STATUS_PAID'; }
                        };
                    }
                }];
            },
            getPaymentInstruments: () => {
                return [
                    {
                        custom: {
                            internalToken: '123'
                        }
                    }
                ];
            },
            custom: { rmaList: 'rmaList' },
            createReturnCase: (isShortShipReturn) => {
                return {
                    returnCaseNumber: '12324',
                    custom: {
                        refundItems: ''
                    },
                    createItem(orderItemID) {
                        return {
                            setAuthorizedQuantity: () => {
                                return 1;
                            },
                            setReasonCode: () => {
                                return 'FIT_ISSUE';
                            },
                            setNote: () => {
                                return 'SIZE ISSUE';
                            }
                        };
                    },
                    confirm: () => { return true; },
                    createReturn: () => {
                        return {
                            custom: {
                                refundItems: ''
                            },
                            returnCase: { RMA: true },
                            status: { value: SHIPPING_STATUS_SHIPPED },
                            getReturnNumber: () => {
                                return 'DEVEU-00020652-R1';
                            },
                            setNote: () => {
                                return 'ShortShip Refund';
                            }
                        };
                    },
                    getItems: () => {
                        return items;
                    }
                };
            },
            getShipments: () => {
                return [{
                    getShippingMethod: () => {
                        return {
                            custom: {
                                isExpressShipping: 'EXP'
                            }
                        };
                    }
                }];
            },
            getProductLineItems: () => {
                return [{
                    custom: {
                        sku: '3023533-001-6',
                        refundItems: ''
                    },
                    getQuantityValue() {
                        return 1;
                    },
                    getOrderItem: () => {
                        return { getItemID: () => { return items; } };
                    },
                    quantity: {
                        getUnit: () => {
                            return 1;
                        }
                    },
                    productID: '1234'
                }];
            },
            getReturnCases: () => {
                return [returncase];
            }
        };
        var lineItems = [{
            upc: '1234',
            sku: '3023533-001-6',
            copy: {
                name: 'product name'
            },
            assets: null,
            color: null,
            prices: {
                total: 100
            },
            qty: 1
        }];
        var neededReturnStatus = 'STATUS_NEW';
        var result = ReturnsUtils.prototype.getReturnAccordingRefundLineItems(pli, lineItems, neededReturnStatus);
        assert.equal(result, null);
        result = ReturnsUtils.prototype.hasNotProcessedReturnCase(pli);
        assert.equal(result, true);
        result = ReturnsUtils.prototype.failNotProcessedReturnCases(pli);
        assert.isUndefined(result, 'Return value is undefined');
        lineItems.sku = '3023533-001-6-1';
        result = ReturnsUtils.prototype.searchReasonForItem(pli, lineItems);
        assert.equal(result, 'SIZE_ISSUE');
        result = ReturnsUtils.prototype.createReturnAccordingRefundLineItems(pli, lineItems);
        assert.isDefined(result, 'resultReturn is defined');
        result = ReturnsUtils.prototype.getReturnToBeRefunded(pli, lineItems, neededReturnStatus);
        assert.isDefined(result, 'resultReturn is defined');
        var Return = {
            STATUS_COMPLETED: 'STATUS_COMPLETED',
            createInvoice() {
                var STATUS_NOT_PAID = 'STATUS_NOT_PAID';
                var STATUS_PAID = 'STATUS_PAID';
                var STATUS_FAILED = 'STATUS_FAILED';
                return {
                    STATUS_NOT_PAID: STATUS_NOT_PAID,
                    STATUS_PAID: STATUS_PAID,
                    setStatus(STATUS) {
                        if (STATUS === 'STATUS_PAID') {
                            return STATUS_PAID;
                        } else if (STATUS === 'STATUS_NOT_PAID')  {
                            return STATUS_NOT_PAID;
                        }
                        return STATUS_FAILED;
                    },
                    addRefundTransaction() {
                        return '$230.00';
                    }
                };
            },
            setStatus(STATUS) {
                return 'STATUS_COMPLETED';
            },
            setNote(key) {
                return key;
            },
            getReturnCase() {
                return returncase;
            }
        };

        result = ReturnsUtils.prototype.processReturnToBeRefunded(pli, Return, lineItems, neededReturnStatus);
        assert.isUndefined(result);
        result = ReturnsUtils.prototype.failReturn(Return);
        assert.equal(result.STATUS_COMPLETED, 'STATUS_COMPLETED');
        var isFailed = true;
        var skipTotalCountInc = 2;
        result = ReturnsUtils.prototype.SetRefundsCountInfo(isFailed, skipTotalCountInc, pli);
        assert.equal(result, undefined);
        var offlineRefund = false;
        var orderRefundNumber = 'DEVEU-00020652-R1';
        pli.custom.refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        global.dw = {
            util: {
                ArrayList: function () {
                    return ArrayList;
                }
            }
        };
        result = ReturnsUtils.prototype.toggleRefundsJson(pli, offlineRefund, orderRefundNumber);
        assert.isDefined(result, 'returns defined values');
        result = ReturnsUtils.prototype.toggleRefundsJson(pli, true, orderRefundNumber);
        assert.isDefined(result, 'returns defined values');
    });

    it('Test Method : isFailedReturn & getRefundNumberFromAdyenReference', () => {
        var returnNumber = 'DEVEU-00020652-R1';
        var result = ReturnsUtils.prototype.isFailedReturn(returnNumber);
        assert.equal(result, true);
        result = ReturnsUtils.prototype.getRefundNumberFromAdyenReference(returnNumber);
        assert.isDefined(result, 'Returns defined');
    });
    
    // it('Test Method : SetRefundsCountInfo', () => {
    //     var isFailed = true;
    //     var skipTotalCountInc = 2;
    //     var result = ReturnsUtils.prototype.SetRefundsCountInfo(isFailed, skipTotalCountInc, pli);
    //     assert.equal(result, true);
    // });

    it('Test Method : isFullOrderRefund', () => {
        var order = {
            productLineItems: [{
                upc: '1234',
                sku: '3023533-001-6',
                copy: {
                    name: 'product name'
                },
                assets: null,
                color: null,
                prices: {
                    total: 100
                },
                qty: 1,
                custom: { sku: '3023533-001-6-1', refundsJson: '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]' }
            }],
            custom: { refundsJson: '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]' } 
        };
        var refundsJson = { items: { '3023533-001-6': '1' } };
        var result = ReturnsUtils.prototype.isFullOrderRefund(order, refundsJson);
        assert.equal(result, false);
    });

    it('Test Method : sendPaymentDetails', () => {
        var data = {
            Order: {
                orderNo: 'DEVMX-00020652',
                custom: {
                    customerLocale: 'MX'
                }
            }
        };
        var result = ReturnsUtils.prototype.sendPaymentDetails(data);
        assert.equal(result, 'sent');
    });

    it('Test Method : checkPaymentMethod', () => {
        var data = {
            Order: {
                orderNo: 'DEVMX-00020652',
                custom: {
                    customerLocale: 'MX'
                }
            },
            paymentInstruments: [
                {
                    creditCardExpirationMonth: '3',
                    creditCardExpirationYear: '2019',
                    maskedCreditCardNumber: '***********4215',
                    creditCardType: 'Visa',
                    paymentMethod: 'CREDIT_CARD',
                    raw: {
                        paymentMethod: 'CREDIT_CARD'
                    }
                }
            ]
        };
        var result = ReturnsUtils.prototype.checkPaymentMethod(data);
        assert.equal(result, 'other');
    });
    it('Test Method : isProductReturnBlocked', () => {
        let productMock = {
            isVariant: function() {
                return true;
            },
            variationModel: {
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return {
                        value: 'sample064'
                    };
                }
            },
            masterProduct: {
                isAssignedToCategory: () => {
                    return true;
                }
            },
            custom: {
                division: 'Footwear'
            },
            isAssignedToCategory: () => {
                return true;
            }
        };
        var result = ReturnsUtils.prototype.isProductReturnBlocked(productMock);
        assert.equal(result, true);
    });
});
