
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

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
var Site = {
    calendar: new Calender()
};

class WeakMac {
    constructor(item) {
        this.WeakMac = 'HMAC_SHA_1';
    }

    digest(field, value) {
        return this.WeakMac;
    }
}

var pli = {
    orderNo: 'DEVEU-00020652',
    siteId: 'OC',
    customerInfo: {
        email: 'example@example.com'
    },
    custom: {
        sku: '1361379-001-XS',
        refundsJson: '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]',
        offlineRefund: ''
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

var ProcessRefunds = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/jobs/ProcessRefunds', {
    '~/cartridge/scripts/logs/2c2p.js': {
        writelog: (item) => {
            return 'error';
        },
        LOG_TYPE: {
            WARN: 'warn',
            INFO: 'info',
            ERROR: 'error',
            DEBUG: 'debug'
        }
    },
    '~/cartridge/scripts/config/2c2Prefs.js': {
        secret: 'secretKey2C2P',
        merchantID: 'mid2C2P',
        paymentChannel: '2c2PaymentChannel',
        request3DS: '2c2pRequest3DS',
        frontendReturnUrl: '2c2FrontendReturnUrl',
        backendReturnUrl: '2c2pBackendReturnUrl',
        configuration2C2P: 'configuration2C2P',
        returnVersion: 3.4,
        refundCancelMaxDays2C2: 'RefundCancelMaxDays2C2'
    },
    'dw/crypto/WeakMac': WeakMac,
    'dw/crypto/Encoding': {
        toHex: (data) => {
            return {
                toUpperCase() {
                    return data;
                }
            };
        }
    },
    'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
    '~/cartridge/scripts/helpers/serviceHelper': {
        refund: (field) => {
            return field;
        }
    },
    'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
    'dw/system/Site': Site,
    'dw/util/Calendar': Calender,
    'dw/order/OrderMgr': {
        processOrders(field, value) {
            return field(pli);
        }
    },
    'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
});

class XML {
    constructor(xmlString) {
        this.xml = xmlString;
        this.respCode = '00';
    }

    toString(xml) {
        if (xml === 'respCode') {
            return this.respCode;
        }
        return this.xml;
    }
}


describe('int_2c2p/cartridge/scripts/jobs/ProcessRefunds.js', function () {
    it('Test Method: ProcessRefunds job with all params', () => {
        global.XML = XML;
        var result = ProcessRefunds.execute();
        assert.isUndefined(result, 'result is not defined');
    });

    it('Test Method: ProcessRefunds job - error exception message from XML obj', () => {
        pli.custom.refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        class XMLS {
            constructor(xmlString) {
                this.xml = xmlString;
                this.respCode = '01';
            }
        
            toString(xml) {
                if (xml === 'respCode') {
                    return this.respCode;
                }
                return this.xml;
            }
        }
        global.XML = XMLS;
        var result = ProcessRefunds.execute();
        assert.isUndefined(result, 'result is not defined');
    });


    it('Test Method: ProcessRefunds job to verify the refundResponse expection message ', () => {
        ProcessRefunds = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/jobs/ProcessRefunds', {
            '~/cartridge/scripts/logs/2c2p.js': {
                writelog: (item) => {
                    return 'error';
                },
                LOG_TYPE: {
                    WARN: 'warn',
                    INFO: 'info',
                    ERROR: 'error',
                    DEBUG: 'debug'
                }
            },
            '~/cartridge/scripts/config/2c2Prefs.js': {
                secret: 'secretKey2C2P',
                merchantID: 'mid2C2P',
                paymentChannel: '2c2PaymentChannel',
                request3DS: '2c2pRequest3DS',
                frontendReturnUrl: '2c2FrontendReturnUrl',
                backendReturnUrl: '2c2pBackendReturnUrl',
                configuration2C2P: 'configuration2C2P',
                returnVersion: 3.4,
                refundCancelMaxDays2C2: 'RefundCancelMaxDays2C2'
            },
            'dw/crypto/WeakMac': WeakMac,
            'dw/crypto/Encoding': {
                toHex: (data) => {
                    return {
                        toUpperCase() {
                            return data;
                        }
                    };
                }
            },
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '~/cartridge/scripts/helpers/serviceHelper': {
                refund: (field) => {
                    return null;
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Site': Site,
            'dw/util/Calendar': Calender,
            'dw/order/OrderMgr': {
                processOrders(field, value) {
                    return field(pli);
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
        });
        pli.custom.refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        global.XML = XML;
        var result = ProcessRefunds.execute();
        assert.isUndefined(result, 'result is not defined');
    });

    it('Test Method: ProcessRefunds job without refund amount', () => {
        pli.custom.refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        global.XML = XML;
        var result = ProcessRefunds.execute();
        assert.isUndefined(result, 'result is not defined');
    });

    it('Test Method: ProcessRefunds job without JSON data to test catch blocks', () => {
        pli.custom.refundsJson = '';
        global.XML = XML;
        var result = ProcessRefunds.execute();
        assert.isUndefined(result, 'result is not defined');
        // pli.custom.refundsJson.reset();
    });

    it('Test Method: ProcessRefunds job without JSON data to test catch blocks', () => {
        pli.custom.refundsJson = '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]';
        XML.respCode = '01';
        global.XML = XML;
        var result = ProcessRefunds.execute();
        assert.isUndefined(result, 'result is not defined');
    });
});
