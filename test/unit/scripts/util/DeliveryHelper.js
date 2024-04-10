const { min } = require('lodash');

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = (data) => {
    return !data;
};

class Calendar {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.DAY_OF_MONTH = 5;
        this.HOUR_OF_DAY = 11;
        this.MINUTE = 12;
        this.SECOND = 13;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
    }

    add(field, value) {
        if ((this.date !== undefined && this.date !== null) && field !== null && value !== null) {
            // add(field: Number, value: Number)
            // Adds or subtracts the specified amount of time to the given calendar field, based on the calendar's rules
            // this.date.setDate(this.date.getDate() + value);
            this.date.add(field, value);
        }
    }

    set(field, value) {
        if (this.date !== undefined) {
            // set(field: Number, value: Number)
            // Sets the given calendar field to the given value
            this.date.set(field, value);
        }
    }

    before() {
        return true;
    }

    toTimeString() {
        if (this.date !== undefined) {
            return this.date.time;
        }
        return null;
    }

    getTime() {
        if (this.date !== undefined) {
            return this.date.time;
        }
        return null;
    }

    get(key) {
        // get(field: Number)
        // Returns the value of the given calendar field
        return 7;
    }
}


var shippingMethod = {
    description: 'Order received in 2 business days',
    displayName: '2-Day Express',
    ID: '002',
    shippingCost: '$0.00',
    defaultMethod: false,
    custom: {
        estimatedArrivalTime: '2 Business Days',
        storePickupEnabled: false,
        maxDeliveryDays: 2,
        minDeliveryDays: 2
    }
};

var shippingMethodEmptyCustom = {
    description: 'Order received in 2 business days',
    displayName: '2-Day Express',
    ID: '002',
    shippingCost: '$0.00',
    defaultMethod: false,
    custom: {
    }
};

var cachedShippingMethod = {
    description: 'Order received in 2 business days',
    displayName: '2-Day Express',
    ID: '002',
    shippingCost: '$0.00',
    defaultMethod: false,
    custom: {
        estimatedArrivalTime: '2 Business Days',
        storePickupEnabled: false,
        maxDeliveryDays: 2,
        minDeliveryDays: 2
    }
};

describe('app_ua_core/cartridge/scripts/util/DeliveryHelper test', () => {
    const DeliveryHelper = require('../../../mocks/scripts/util/DeliveryHelper');


    it('Testing method: getShippingDeliveryDates empty shippingmethod', () => {
        var availableDates = DeliveryHelper.getShippingDeliveryDates(shippingMethodEmptyCustom, {});
        assert.equal(availableDates.length, 2);
    });

    it('Testing method: getAvailableDeliveryDates', () => {
        var availableDates = DeliveryHelper.getAvailableDeliveryDates();
        assert.equal(availableDates.length, 30);
    });

    it('Testing method: getAvailableDeliveryDates', () => {
        var DeliveryHelperss = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
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
        var availableDates = DeliveryHelperss.getAvailableDeliveryDates();
        assert.equal(availableDates.length, 0);
    });

    it('Testing method: getAvailableDeliveryDates', () => {
        var DeliveryHelperss = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
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
        var availableDates = DeliveryHelperss.getAvailableDeliveryDates();
        assert.equal(availableDates.length, 0);
    });

    it('Testing method: getAvailableDeliveryDates', () => {
        var Site = {
            getCurrent() {
                return {
                    getCustomPreferenceValue: function (key) {
                        if (key === 'scheduledDeliveryDateMapping') return '{"startDateOffset":1,"endDateOffset":1,"holidays":["01-01","21-04","01-05","07-09","12-10","02-11","15-11","25-12"]}';
                        return true;
                    }
                };
            }
        };
        var DeliveryHelperss = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
            'dw/util/Calendar': Calendar,
            // eslint-disable-next-line spellcheck/spell-checker
            'int_customfeeds/cartridge/scripts/util/JSONUtils': {
                parse: function (data) {
                    return JSON.parse(data);
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': Site,
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
        var availableDates = DeliveryHelperss.getAvailableDeliveryDates();
        assert.equal(availableDates.length, 0);
    });

    it('Testing method: getAvailableDeliveryDates', () => {
        var Site = {
            getCurrent() {
                return {
                    getCustomPreferenceValue: function (key) {
                        if (key === 'scheduledDeliveryDateMapping') return '{"startDateOffset":30,"endDateOffset":60,"holidays":["01-01","21-04","01-05","07-09","12-10","02-11","15-11","25-12"]}';
                        return true;
                    }
                };
            }
        };
        var DeliveryHelperss = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
            // eslint-disable-next-line spellcheck/spell-checker
            'int_customfeeds/cartridge/scripts/util/JSONUtils': {
                parse: function (data) {
                    return JSON.parse(data);
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': Site,
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () { return null; }
            },
            '*/cartridge/scripts/helpers/requestHelpers': {
                isRequestTransactional: function () {
                    return true;
                }
            }
        });
        var availableDates = DeliveryHelperss.getShippingDeliveryDates(shippingMethod, false);
        assert.equal(availableDates.length, 2);
    });


    it('Testing method: getShippingDeliveryDates', () => {
        var availableDates = DeliveryHelper.getShippingDeliveryDates(shippingMethod, {});
        assert.equal(availableDates.length, 2);
    });


    it('Testing method: getShippingDeliveryDates', () => {
        var availableDates = DeliveryHelper.getShippingDeliveryDates(shippingMethod, {});
        assert.equal(availableDates.length, 2);
    });

    // eslint-disable-next-line spellcheck/spell-checker
    it('Testing method: getAvailableDeliveryDatesFormated', () => {
        // eslint-disable-next-line spellcheck/spell-checker
        var availableDates = DeliveryHelper.getAvailableDeliveryDatesFormated(shippingMethod);
        assert.equal(availableDates.length, 2);
    });

    // eslint-disable-next-line spellcheck/spell-checker
    it('Testing method: getShippingDeliveryDatesFormated', () => {
        // eslint-disable-next-line spellcheck/spell-checker
        var availableDates = DeliveryHelper.getShippingDeliveryDatesFormated(shippingMethod);
        assert.equal(availableDates.length, 2);
    });

    it('Testing method: getShippingDeliveryDatesFormated', () => {
        // eslint-disable-next-line spellcheck/spell-checker
        var availableDates = DeliveryHelper.getShippingDeliveryDatesFormated(null);
        assert.equal(availableDates.length, 0);
    });

    it('Testing method: getShippingDeliveryDatesFormated', () => {
        var calendars = Calendar;
        calendars.before = function () {
            return true;
        };
        var DeliveryHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/DeliveryHelper', {
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
        // eslint-disable-next-line spellcheck/spell-checker
        var availableDates = DeliveryHelpers.getShippingDeliveryDatesFormated(shippingMethod);
        assert.equal(availableDates.length, 2);
    });
});
