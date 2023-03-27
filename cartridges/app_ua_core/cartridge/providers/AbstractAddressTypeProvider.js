'use strict';

var Class = require('../scripts/utils/Class').Class;
var currentSite = require('dw/system/Site').getCurrent();

var AbstractAddressTypeProvider = Class.extend({
    object: null,

    /**
     * @constructs
     * @param {dw.order.OrderAddress} address - Current address
     * @returns {Object} - instance of fraud check  provider
     */
    init: function (address) {
        this.address = address || {};
        return this;
    },

    /**
     * @constructs
     * @param {dw.order.OrderAddress} address - Current address
     * @returns {Object} - instance of fraud check  provider
     */
    get: function (address) {
        var providerPrefix = currentSite.getCustomPreferenceValue('addressProvider').value;
        var mock = {
            addressType: function () {} // We don't need to unit test this empty function
        };

        // istanbul ignore if
        if (providerPrefix) {
            return new (require('./' + providerPrefix + 'AddressTypeProvider'))(address); // Unit test FedExAddressTypeProvider and AddressHelper instead
        }

        return mock;
    },

    /**
     * @abstract
     */
    addressType: function () {
        throw new Error('Must be implemented in extended class');
    }
});

module.exports = AbstractAddressTypeProvider;
