'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const { values } = require('lodash');
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('./baseOrderModel');
var ReturnsUtils = function () {
    return {
        getReturnsPreferences: function () {
            return {
                isReturnsAvailable: true
            };
        },
        getQTYInformation: () => {},
        getPLIShippingDate: () => '',
        isProductReturnBlocked: () => {}
    };
};

class Calendar {
    constructor(date) {
        this.date = date;
        return {
            toTimeString: function () {
                return '01/01/2020';
            },
            setTimeZone: () => {
                return date;
            }
        };
    }
}

var lineItemContainer = {
    getProductLineItems: function () {
        return [
            {
                UUID: '9876543210',
                product: {},
                custom: {
                    sku: ''
                },
                getShipment: () => {
                    return {
                        value: 2
                    };
                }
            }
        ];
    },
    getReturnCases: function () {
        return {
            size: function () { return 0; }
        };
    },
    getReturnCaseItems: function () {
        return {
            asMap: function () {
                return {
                    values: function (){
                        return items;
                    }
                };
            }
        };
    },
    custom: {
        shippingJson: {},
        atsValue: ''
    },
    getShippingStatus: function () {
        return {
            value: 2
        };
    }
};

describe('app_ua_apac/cartridge/models/order', () => {

    before(function () {
        mockSuperModule.create(baseOrderModelMock);
    });

    it('Testing if container view is not orderDetails or basket', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/order.js', {
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/models/productLineItem/decorators/index': {
                productPersonalization: function (item, pli) {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    }
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });

        var options = { containerView: 'order' };
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

    it('Testing Order Model when personalization is enabled', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/order.js', {
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/models/productLineItem/decorators/index': {
                productPersonalization: function (item, pli) {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    }
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });

        var options = { containerView: 'orderDetails' };
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

    it('Testing Order Model when personalization is disabled', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/order.js', {
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: false
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/models/productLineItem/decorators/index': {
                productPersonalization: function (item, pli) {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/addressHelpers': {
                getTranslatedLabel: function () {
                    return {
                        stateCode: 'TAS',
                        city: 'Wellington'
                    }
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar')
        });

        var options = { containerView: 'orderDetails' };
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

});
