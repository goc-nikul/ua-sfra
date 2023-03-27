'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

class MAOAuthTokenHelper {
    constructor() {
        this.token = null;
    }
    getValidToken() {
        return {
            accessToken: 'aaaaa'
        };
    }
}

global.empty = (data) => {
    return !data;
};

describe('int_mao/cartridge/scripts/OrderExport.js', () => {

    it('Testing method execute OrderExport.js --> Test in case no orders returned from the search query', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: function () {
                    return {};
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {},
            '~/cartridge/scripts/services/MaoService': {},
            '~/cartridge/scripts/MaoPreferences': {},
            '~/cartridge/scripts/MAOAuthTokenHelper': {},
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result, 'No Orders to export');
    });

    it('Testing method orderExport --> Access Token unavailable', () => {
        class MAOAuthTokenHelpers {
            constructor() {
                this.token = null;
            }
            getValidToken() {
                return {
                    accessToken: ''
                };
            }
        }
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 8
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null
                        }
                    }];
                    var cnt = 0;
                    return {
                        close: function () {
                            return {};
                        },
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderCancelRequestJSON: function () {
                    return null;
                }
            },
            '~/cartridge/scripts/services/MaoService': {},
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com'
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelpers,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method OrderExport --> Required Site Preferences not available', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: function () {
                    return {
                        count: 1,
                        close: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {},
            '~/cartridge/scripts/services/MaoService': {},
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: ''
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': {},
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport --> queryOrders return one order and order not saved successfully in MAO and OrderJSON is empty', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '';
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    statusCode: 200
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com'
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport --> queryOrders return one order and order saved successfully in MAO', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: ''
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":[{"Extended":{"sapCarrierCode":"12345"}}],"OrderType":{"OrderTypeId":""},"Payment":"payment"}';
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    statusCode: 200
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com'
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport --> queryOrders return one order and order saved successfully in MAO, sapCarrierCode custom attribute is not empty', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: true,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":[{"Extended":{"sapCarrierCode":"12345"}}],"OrderType":{"OrderTypeId":""},"Payment":"payment"}';
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    statusCode: 200
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com'
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport --> queryOrders return one order and order not saved successfully in MAO', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoOrderExportFailedCount: 1,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":{},"OrderType":{"OrderTypeId":""},"Payment":"payment"}'
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'error',
                                object: {
                                    statusCode: 500
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com'
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport --> queryOrders return one order and order not saved successfully in MAO and  order marked to "Export Failed"', () => {
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":{},"OrderType":{"OrderTypeId":""},"Payment":"payment"}'
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'error',
                                object: {
                                    statusCode: 500
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com',
                maoMaxFailedCount: 1
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport -->  Test custom exception execute function,  handle close orders case', () => {
        global.dw = {
            util: {
                SeekableIterator: Object
            }
        };
        var stubFormat = sinon.stub();
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return '';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        close: function () {
                            return '';
                        },
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: stubFormat
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":{},"OrderType":{"OrderTypeId":""},"Payment":"payment"}'
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    statusCode: 200
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com',
                maoMaxFailedCount: 1
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        stubFormat.throws(new Error('custom exception'));
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport -->  Test custom exception execute function', () => {
        global.dw = {
            util: {
                SeekableIterator: function () {
                    return false;
                }
            }
        };
        var stubFormat = sinon.stub();
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return '';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        close: function () {
                            return '';
                        },
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: stubFormat
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":{},"OrderType":{"OrderTypeId":""},"Payment":"payment"}'
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    statusCode: 200
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com',
                maoMaxFailedCount: 1
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        stubFormat.throws(new Error('custom exception'));
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport -->  Test custom exception in saveOrderInMAO function', () => {
        var stubFormat = sinon.stub();
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return '';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        close: function () {
                            return '';
                        },
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: stubFormat
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    statusCode: 200
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com',
                maoMaxFailedCount: 1
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        stubFormat.throws(new Error('custom exception'));
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });

    it('Testing method orderExport -->  Test custom exception in handleFailedOrders function', () => {
        var stubFormat = sinon.stub();
        var orderExport = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/OrderExport.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return '';
                }
            },
            'dw/system/Transaction': stubFormat,
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: false,
                            sapCarrierCode: '12345'
                        },
                        setExportStatus: function () {
                            return 'exported';
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
                        }
                    }];
                    var cnt = 0;
                    return {
                        close: function () {
                            return '';
                        },
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderJSON: function () {
                    return '{"MessageHeader":"MessageHeader","CapturedDate":"Some Date","CurrencyCode":"USD","CustomerFirstName":"UA","CustomerLastName":"UA","DocType":"","Extended":"","IsConfirmed":"true","OrderActions":{},"OrderId":"12345","OrderChargeDetail":{},"OrderTaxDetail":{},"OrderLine":{},"OrderType":{"OrderTypeId":""},"Payment":"payment"}'
                }
            },
            '~/cartridge/scripts/services/MaoService': {
                saveOrderService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'error',
                                object: {
                                    statusCode: 500
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoDomTokenChildOrgUsername: 'underarmour',
                MaoDomTokenChildOrgPassword: 'passw0rd',
                MaoDomSaveOrderEndpointUrl: 'www.maotest.com',
                maoMaxFailedCount: 1
            },
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper,
            '~/cartridge/scripts/services/SQSQueueService': {}
        });
        stubFormat.throws(new Error('custom exception'));
        var args = {
            'MaxLimit': 10
        };
        var result = orderExport.execute(args);
        assert.isNotNull(result);
    });
});
