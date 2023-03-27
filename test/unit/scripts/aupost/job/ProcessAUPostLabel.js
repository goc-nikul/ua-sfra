'use strict';

/* eslint-disable */

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class Bytes {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    toString() {
        return this.secretKey;
    }
}

describe('int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', () => {

    it('Testing method getLabel when no record in returnXML custom object', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    return {
                        hasNext: () => false
                    };
                }
            },
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/order/returnHelpers': {},
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/util/Bytes': Bytes

        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with manifest is not null', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD',
                            returnID: 'testID',
                            dwOrderNo: '12345'
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/OrderMgr': {
                getOrder: () => {
                    return {
                        getReturnCase: () => {
                            return {
                                custom: {
                                    manifest: '12345'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function () {
                    return {};
                }
            },
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/svc/downloadAUPostlabelService': {
                downloadAUPostlabel: function (param1, param2, param3) {
                    return {
                        call: function () {
                            return {
                                ok: true,
                                object: '010101'
                            };
                        }
                    };
                }
            },
            'dw/util/Bytes': Bytes
        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with manifest is  null', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD',
                            returnID: 'testID',
                            dwOrderNo: '12345'
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/OrderMgr': {
                getOrder: () => {
                    return {
                        getReturnCase: () => {
                            return {
                                custom: {
                                    manifest: ''
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function () {
                    return {};
                }
            },
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/Bytes': Bytes
        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with getpdf service return error', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD',
                            returnID: 'testID',
                            dwOrderNo: '12345'
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/OrderMgr': {
                getOrder: () => {
                    return {
                        getReturnCase: () => {
                            return {
                                custom: {
                                    manifest: '12345'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function () {
                    return {};
                }
            },
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/svc/downloadAUPostlabelService': {
                downloadAUPostlabel: function (param1, param2, param3) {
                    return {
                        call: function () {
                            return {
                                ok: false,
                                object: ''
                            };
                        }
                    };
                }
            },
            'dw/util/Bytes': Bytes
        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with order null', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD',
                            returnID: 'testID',
                            dwOrderNo: '12345'
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/OrderMgr': {
                getOrder: () => {
                    return null;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {},
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/Bytes': Bytes
        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with empty return case', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD',
                            returnID: '',
                            dwOrderNo: '12345'
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/OrderMgr': {
                getOrder: () => {
                    return null;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {},
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/Bytes': Bytes
        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when unexpected error occurs', () => {
        var GetAUPostLabel = proxyquire('../../../../../cartridges/int_aupost/cartridge/scripts/job/ProcessAUPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
            'dw/order/OrderMgr': {
                getOrder: () => {
                    return null;
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {},
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/Bytes': Bytes
        });
        var label = GetAUPostLabel.processLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });
});
