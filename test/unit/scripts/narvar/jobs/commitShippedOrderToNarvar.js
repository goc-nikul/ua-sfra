'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var params;
var orders = [
    {
        orderID: '1',
        custom: {
            narvarExportOrder: {
                value: 'Shipped'
            },
            shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"1379475-001-MD":"1"}}]',
            shippedCallToNarvar: 3,
            shippedItemsToNarvar: ''
        },
        productQuantityTotal: 1,
        addNote: () => {}
    },
    {
        orderID: '2',
        custom: {
            narvarExportOrder: {
                value: ''
            },
            shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"1379475-001-MD":"1"}}]',
            shippedCallToNarvar: 1,
            shippedItemsToNarvar: 1
        },
        productQuantityTotal: 1,
        addNote: () => {}
    },
    {
        orderID: '3',
        custom: {
            narvarExportOrder: {
                value: 'PartiallyShipped'
            },
            shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"1379475-001-MD":"1"}}]',
            shippedCallToNarvar: '',
            shippedItemsToNarvar: ''
        },
        productQuantityTotal: 1,
        addNote: () => {}
    },
    {
        orderID: '4',
        custom: {
            narvarExportOrder: {
                value: 'PartiallyShipped'
            },
            shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"1379475-001-MD":"1"}}]',
            shippedCallToNarvar: '',
            shippedItemsToNarvar: ''
        },
        productQuantityTotal: 1,
        addNote: () => {}
    }
];
var index = 0;
var commitShippedOrderToNarvar = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/jobs/commitShippedOrderToNarvar.js', {
    'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
    'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
    'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
    'dw/order/Order': {
        ORDER_STATUS_FAILED: false,
        SHIPPING_STATUS_NOT_SHIPPED: false,
        EXPORT_STATUS_EXPORTED: true
    },
    'dw/order/OrderMgr': {
        searchOrders: () => {
            return {
                hasNext: () => {
                    return index < orders.length;
                },
                next: () => {
                    return orders[index++];
                }
            };
        }
    },
    'dw/system/Site': {
        getCalendar: () => {
            return {
                add: () => null,
                getTime: () => 100000
            };
        },
        current: {
            getCustomPreferenceValue: function (key) {
                if (key === 'maxCallToNarvar') return 3;
                return 0;
            }

        },
        getCurrent: () => {
            return {
                getCustomPreferenceValue: function (key) {
                    if (key === 'narvarCarrierMapping') {
                        return {
                            'UPS-STD': 'UPS',
                            'UPS-PUP': 'UPS',
                            'UPS-EXS': 'UPS',
                            'HER-P02': 'Hermes',
                            'HER-S02': 'Hermes',
                            'DHL-P02': 'DHL',
                            'DHL-S02': 'DHL',
                            'PNL-S02': 'PostNL',
                            'PNL-P02': 'PostNL',
                            'FED-EXP': 'fedex',
                            'narvar': {
                                'DHL_EXPRESS': 'DHL',
                                'DHL_DE': 'DHL',
                                'FEDEX': 'FEDEX',
                                'UPS': 'UPS'
                            }
                        };
                    }
                    return 0;
                }
            };
        }
    },
    'dw/util/Calendar': {
        DAY_OF_YEAR: '01-02-0003'
    },
    '*/cartridge/scripts/init/NarvarService': {
        getNarvarService: {
            call: () => {
                return {
                    status: 'OK'
                };
            }
        }
    },
    '*/cartridge/scripts/helpers/narvarShippingHelper': {
        getShippedOrderObj: (order) => {
            if (order && order.orderID === '4') {
                return {
                    success: false
                };
            }
            return {
                success: true
            };
        }
    }
});
describe('int_narvar/cartridge/scripts/jobs/commitShippedOrderToNarvar.js', () => {
    global.empty = (data) => {
        return !data;
    };
    it('Test Method: ExportShippedOrders job with all params', () => {
        params = {
            orderProcessLimit: 1000,
            orderPastDaysLimit: 30
        };
        var result = commitShippedOrderToNarvar.exportShippedOrders(params);
        assert.isDefined(result, 'result is defined');
    });
    it('Test Method: ExportShippedOrders job with all params', () => {
        params = {
            orderProcessLimit: '',
            orderPastDaysLimit: ''
        };
        var result = commitShippedOrderToNarvar.exportShippedOrders(params);
        assert.isDefined(result, 'result is defined');
    });
});
