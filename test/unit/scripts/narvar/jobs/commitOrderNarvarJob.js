'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var params;
var orders = [
    {
        orderID: '1',
        custom: {
            narvarExportOrder: {
                value: 'Exported'
            },
            exportCallToNarvar: 2
        },
        addNote: () => { }
    },
    {
        orderID: '2',
        custom: {
            narvarExportOrder: {
                value: 'Exported'
            },
            exportCallToNarvar: ''
        },
        addNote: () => { }
    }
];
var index = 0;
var mockedScripts = {
    'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
    'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
    'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
    'dw/order/Order': {
        ORDER_STATUS_FAILED: false,
        SHIPPING_STATUS_NOT_SHIPPED: true,
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
    '*/cartridge/scripts/helpers/narvarHelper': {
        getRequestObj: (order) => {
            return order;
        }
    }
};
describe('int_narvar/cartridge/scripts/jobs/commitOrderNarvarJob.js', () => {
    global.empty = (data) => {
        return !data;
    };
    beforeEach(() => {
        index = 0;
    });
    it('Test Method: ExportOrders job with all params', () => {
        var commitOrderNarvarJob = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/jobs/commitOrderNarvarJob.js', mockedScripts);
        params = {
            orderProcessLimit: 1000,
            orderPastDaysLimit: 30
        };
        var result = commitOrderNarvarJob.exportOrders(params);
        assert.isDefined(result, 'result is defined');
    });

    it('Test Method: ExportOrders job with all params', () => {
        var commitOrderNarvarJob = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/jobs/commitOrderNarvarJob.js', mockedScripts);
        params = {
            orderProcessLimit: '',
            orderPastDaysLimit: ''
        };
        var result = commitOrderNarvarJob.exportOrders(params);
        assert.isDefined(result, 'result is defined');
    });

    it('Test Method: Throw Error', () => {
        orders = [
            {
                orderID: '1',
                custom: {
                    narvarExportOrder: {
                        value: 'Exported'
                    },
                    exportCallToNarvar: 1
                }
            }
        ];
        mockedScripts['dw/order/OrderMgr'] = {
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
        };
        var commitOrderNarvarJob = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/jobs/commitOrderNarvarJob.js', mockedScripts);
        params = {
            orderProcessLimit: '',
            orderPastDaysLimit: ''
        };
        var result = commitOrderNarvarJob.exportOrders(params);
        assert.isDefined(result, 'result is defined');
    });

    it('Test Method: Service ERROR', () => {
        orders = [
            {
                orderID: '1',
                custom: {
                    narvarExportOrder: {
                        value: 'Exported'
                    },
                    exportCallToNarvar: 1
                },
                addNote: () => { }
            }
        ];
        mockedScripts['dw/order/OrderMgr'] = {
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
        };
        mockedScripts['*/cartridge/scripts/init/NarvarService'] = {
            getNarvarService: {
                call: () => {
                    return {
                        status: 'ERROR'
                    };
                }
            }
        };
        var commitOrderNarvarJob = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/jobs/commitOrderNarvarJob.js', mockedScripts);
        params = {
            orderProcessLimit: '',
            orderPastDaysLimit: ''
        };
        var result = commitOrderNarvarJob.exportOrders(params);
        assert.isDefined(result, 'result is defined');
    });
});
