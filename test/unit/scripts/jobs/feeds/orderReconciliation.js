const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const sinon = require('sinon');

class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
    convertSiteTimeToUTC() {
        return new Date();
    }
}

var Export = function () {
    this.writeHeader = function () {};

    this.initRow = function () {};

    this.buildRow = function () {};

    this.close = function () {};
};

describe('app_ua_core/cartridge/scripts/jobs/feeds/orderReconciliation.js', () => {
    var mockOrderMgr = require('../../../../mocks/dw/dw_order_OrderMgr');
    mockOrderMgr.processOrders = sinon.spy(() => {});
    var OrderReconciliation = proxyquire(
        '../../../../../cartridges/app_ua_core/cartridge/scripts/jobs/feeds/orderReconciliation.js',
        {
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '../models/orderReconciliationDataExport': Export,
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            'dw/order/OrderMgr': mockOrderMgr,
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper
        }
    );

    it('Testing Job: when no exception occured', () => {
        var status = OrderReconciliation.process({
            lastXdays: 2
        });
        assert.isNotNull(status, 'status is null');
        assert.isDefined(status, 'status is undefined');
    });
});
