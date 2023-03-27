'use strict';

var AbstractEmailProvider = require('./AbstractAddressVerificationProvider');

var DAUMAddressTypeProvider = AbstractEmailProvider.extend({
    /**
     * Check if verification is enabled in BM.
     * @returns {boolean} - Is enabled in BM.
     */
    enabledInBM: function () {
        return false;
    },

    /**
     * Search by moniker.
     * @param {Object} moniker - Moniker to search full address.
     * @returns {Object} - Search results.
     */
    get: function () {
        return {
            success: '',
            address: ''
        };
    }
});

module.exports = DAUMAddressTypeProvider;
