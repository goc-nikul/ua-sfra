'use strict';

var Class = require('../scripts/utils/Class').Class;
var currentSite = require('dw/system/Site').getCurrent();

var AbstractFraudScreenProvider = Class.extend({
    object: null,

    /**
     * @constructs
     * @param {dw.order.Order} order - current order
     * @returns {Object} - instance of fraud check  provider
     */
    init: function (order) {
        this.order = order || {};
        return this;
    },

    /**
     * @constructs
     * @param {dw.order.Order} order - current order
     * @returns {Object} - instance of fraud check  provider
     */
    get: function (order) {
        var providerPrefix = currentSite.getCustomPreferenceValue('fraudCheckProvider');
        var mock = {
            validate: function () {
                return 'accept';
            }
        };

        /* istanbul ignore next */
        if (providerPrefix && providerPrefix.valueOf() !== null) {
            return new (require('./' + providerPrefix + 'FraudScreenProvider.js'))(order); // Unit test AccertifyFraudScreenProvider separately
        }

        return mock;
    },

    /**
     * @abstract
     */
    validate: function () {
        throw new Error('Must be implemented in extended class');
    }
});

module.exports = AbstractFraudScreenProvider;
