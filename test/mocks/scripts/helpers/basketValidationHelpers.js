'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class CustomerUtils {
    getCustomerGroupLineItemQtyLimit() {
        return 1;
    }
}

function proxyModel() {
    var basketValidationHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/helpers/basketValidationHelpers', {
        '*/cartridge/scripts/util/collections': require('../util/collections'),
        'dw/catalog/ProductInventoryMgr': {},
        'dw/catalog/StoreMgr': {},
        'int_mao/cartridge/scripts/availability/MAOAvailability': require('../mao/MAOAvailability'),
        'dw/web/Resource': require('../../dw/dw_web_Resource'),
        'dw/system/Site': require('../../dw/dw_system_Site'),
        'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': require('../mao/MAOAvailabilityHelper'),
        'dw/system/Transaction': require('../../dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../dw/dw_system_Logger'),
        'app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers': {},
        '*/cartridge/scripts/util/CustomerUtils': CustomerUtils
    });
    return basketValidationHelpers;
}

module.exports = proxyModel();
