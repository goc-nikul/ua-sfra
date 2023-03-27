'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
}

class Calendar {
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
        return this.date.toDateString();
    }

    get() {
        return 2;
    }
}

function proxyModel() {
    return proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
        'dw/util/Calendar': Calendar,
        // eslint-disable-next-line spellcheck/spell-checker
        'int_customfeeds/cartridge/scripts/util/JSONUtils': {
            parse: function (data) {
                return JSON.parse(data);
            }
        },
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
        'dw/object/CustomObjectMgr': {
            getCustomObject: function () {
                return {
                    getCustom() {
                        return {
                            expiryTime: new Date(),
                            shippingMethodId: '2-business-days_US',
                            maxDeliveryDate: new Date(),
                            minDeliveryDate: new Date()
                        };
                    }
                };
            }
        }
    });
}

module.exports = proxyModel();
