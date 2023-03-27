'use strict';

var Class = require('../scripts/utils/Class').Class;
var currentSite = require('dw/system/Site').getCurrent();

var AbstractAddressTypeProvider = Class.extend({
    object: null,

    /**
     * @constructs
     * @param {Object} options - Options for provider.
     * @returns {Object} - Instance of address verification provider.
     */
    init: function () {
        this.options = {};
        this.params = {};
        return this;
    },

    /**
     * Generate mock if provider is not found.
     * @returns {Object} - Mock object.
     */
    getMock: function () {
        return {
            enabledInBM: function () {
                return false;
            },
            get: function () {
                return {
                    success: false,
                    address: {
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        zipCode: ''
                    }
                };
            },
            search: function () {
                return {
                    success: false,
                    status: 'None',
                    moniker: '',
                    refinedList: [],
                    address: {
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        zipCode: ''
                    },
                    original: {
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        zipCode: ''
                    }
                };
            },
            update: function () {
                return {
                    success: false,
                    address: {
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        zipCode: ''
                    }
                };
            },
            typeDownSearch: function () {
                return {
                    success: false,
                    result: {}
                };
            }
        };
    },

    /**
     * Get the instance of address verification provider.
     * @constructs
     * @returns {Object} - Address verification provider.
     */
    get: function () {
        var providerPrefix = currentSite.getCustomPreferenceValue('addressVerificationProvider').value;
        if (!providerPrefix) {
            return this.getMock();
        }
        var provider = new (require('./' + providerPrefix + 'AddressVerificationProvider'))();
        /* istanbul ignore if */
        if (!provider.enabledInBM()) {
            /* istanbul ignore next */
            return this.getMock(); // To difficult to test configuration attribute
        }
        return provider;
    }
});

module.exports = AbstractAddressTypeProvider;
