'use strict';

var Class = require('../scripts/utils/Class').Class;
var currentSite = require('dw/system/Site').getCurrent();

var AbstractOrderStatusProvider = Class.extend({
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
        var providerPrefix = 'orderStatusProvider' in currentSite.preferences.custom ? currentSite.getCustomPreferenceValue('orderStatusProvider').value : null;
        var mock = {
            handleReadyForExport: function () {}
        };

        /* istanbul ignore next */
        if (providerPrefix) {
            return new (require('./' + providerPrefix + 'OrderStatusProvider.js'))(order); // Unit test DefaultOrderStatusProvider separately
        }

        return mock;
    },

    /**
     * @abstract
     */
    handleReadyForExport: function () {
        throw new Error('Must be implemented in extended class');
    }
});

module.exports = AbstractOrderStatusProvider;
