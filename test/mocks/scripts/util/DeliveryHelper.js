'use strict';
var myDateUtils = require('dw/util/DateUtils');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();


function proxyModel() {
    return proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
        'dw/util/DateUtils': {
            nowForSite: function () {
                let newDate = myDateUtils.nowForSite();
                return {
                    newDate
                };
            }
        },
        // eslint-disable-next-line spellcheck/spell-checker
        'int_customfeeds/cartridge/scripts/util/JSONUtils': {
            parse: function (data) {
                return JSON.parse(data);
            }
        },
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
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
        },
        '*/cartridge/scripts/helpers/requestHelpers': {
            isRequestTransactional: function () {
                return true;
            }
        }
    });
}

module.exports = proxyModel();
