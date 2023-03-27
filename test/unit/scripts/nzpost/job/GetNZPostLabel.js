'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_nzpost/cartridge/scripts/job/GetNZPostLabel.js', () => {

    it('Testing method getLabel when no record in returnXML custom object', () => {
        var GetNZPostLabel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/job/GetNZPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/HookMgr': require('../../../../mocks/dw/dw_system_HookMgr'),
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    return {
                        hasNext: () => false
                    }
                }
            },
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/order/returnHelpers': {}
        });
        var label = GetNZPostLabel.getLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with trackingNumber and shipLabel is null', () => {
        var GetNZPostLabel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/job/GetNZPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/HookMgr': {
                hasHook: () => true,
                callHook: () => {
                    return {
                        trackingNumber: null,
                        shipLabel: null
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD'
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
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            '*/cartridge/scripts/order/returnHelpers': {}
        });
        var label = GetNZPostLabel.getLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

    it('Testing method getLabel when one record in returnXML custom object with trackingNumber and shipLabel not null', () => {
        var GetNZPostLabel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/job/GetNZPostLabel.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/HookMgr': {
                hasHook: () => true,
                callHook: () => {
                    return {
                        trackingNumber: '1234',
                        shipLabel: 'Ship'
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                queryCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            consignmentId: 'ABCD'
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
                                    trackingNumber: null,
                                    shipmentLabel: null
                                }
                            }
                        }
                    };
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: () => null
            }
        });
        var label = GetNZPostLabel.getLabel();
        assert.isNotNull(label, 'getLabel is null');
        assert.isDefined(label, 'getLabel is not defined');
    });

});
