'use strict';

const {
    assert
} = require('chai');

var sinon = require('sinon');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

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

describe('int_mao/cartridge/scripts/MaoSendStatusUpdate.js', () => {

    it('Testing method MaoSendStatusUpdate --> Test in case no orders returned from the search query', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: function () {
                    return {};
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {},
            '~/cartridge/scripts/services/MaoService': {},
            '~/cartridge/scripts/MaoPreferences': {},
            '~/cartridge/scripts/MAOAuthTokenHelper': {}
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> Required Site Preferences not available', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: function () {
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
            '~/cartridge/scripts/MAOAuthTokenHelper': {}
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> queryOrders return one order with status Faild', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> Access Token unavailable', () => {
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
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelpers
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> queryOrders return one order with status NEW and order updated in MAO', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'paymentDetailsUpdate',
                            onHold: true
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> queryOrders return one order with status open and order updated in MAO, order.custom.update contains fraudCheck', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 4
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'fraudCheck',
                            onHold: false
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> queryOrders return one order with status open and order updated in MAO, order.custom.update not contain value', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 4
                        },
                        custom: {
                            maoStatusUpdateFailedCount: 1,
                            updates: '',
                            onHold: true
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> saveOrderService return an error ', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'fraudCheck',
                            onHold: false
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing method MaoSendStatusUpdate --> failedCount >= maxAllowedFailedCount ', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'fraudCheck',
                            onHold: false
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing MaoSendStatusUpdate --> Test in case unexpected behavior like custom attributes not exist in order object', () => {
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing MaoSendStatusUpdate --> Test custom exception in execute function, , handle close orders case', () => {
        global.dw = {
            util: {
                SeekableIterator: Object
            }
        };
        var stubFormat = sinon.stub();
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
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
                        next: stubFormat
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        stubFormat.throws(new Error('custom exception'));
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing MaoSendStatusUpdate --> Test custom exception in execute function', () => {
        global.dw = {
            util: {
                SeekableIterator: function () {
                    return false;
                }
            }
        };
        var stubFormat = sinon.stub();
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        setConfirmationStatus: function () {
                            return 'confirmed';
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
                        next: stubFormat
                    };
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            '~/cartridge/scripts/OrderExportUtils': {
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        stubFormat.throws(new Error('custom exception'));
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });

    it('Testing MaoSendStatusUpdate --> Test custom exception in handleFailedOrders function', () => {

        var stubFormat = sinon.stub();
        var MaoSendStatusUpdate = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoSendStatusUpdate.js', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/util/StringUtils': {
                format: function () {
                    return 'formatted number';
                }
            },
            'dw/system/Transaction': stubFormat,
            'dw/order/OrderMgr': {
                queryOrders: () => {
                    var customObj = [{
                        status: {
                            value: 3
                        },
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            updates: 'fraudCheck',
                            onHold: false
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
                getOrderCancelRequestJSON: function () {
                    return null;
                },
                getUpdatePaymentRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false,"Payment":"TestPayment"}';
                },
                getConfirmOrderRequestJSON: function () {
                    return '{"MessageHeader":"aaaaa","OrderId":"12345","IsConfirmed":false}';
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
            '~/cartridge/scripts/MAOAuthTokenHelper': MAOAuthTokenHelper
        });
        stubFormat.throws(new Error('custom exception'));
        var result = MaoSendStatusUpdate.execute();
        assert.isNotNull(result);
    });
});
