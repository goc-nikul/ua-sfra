'use strict';

var AbstractEmailProvider = require('./AbstractAddressVerificationProvider');
var QAS = require('*/cartridge/scripts/QASActions/actions');
var currentSite = require('dw/system/Site').getCurrent();

var QASAddressTypeProvider = AbstractEmailProvider.extend({
    /**
     * Check if verification is enabled in BM.
     * @returns {boolean} - Is enabled in BM.
     */
    enabledInBM: function () {
        var isEnabled = currentSite.getCustomPreferenceValue('QAS_EnableAddressVerification');
        return isEnabled;
    },

    /**
     * Search by moniker.
     * @param {Object} moniker - Moniker to search full address.
     * @returns {Object} - Search results.
     */
    get: function (moniker) {
        QAS.get.execute(
            moniker
        );
        var searchResults = QAS.get.getResult();
        return {
            success: !searchResults.error,
            address: searchResults.address.result
        };
    },

    /**
     * Search by address.
     * @param {Object} address - Address to search.
     * @returns {Object} - Search results.
     */
    search: function (address) {
        QAS.search.execute({
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode
        });
        var searchResults = QAS.search.getResult();
        return {
            success: !searchResults.error,
            status: searchResults.verificationStatus,
            moniker: searchResults.refinedList.moniker,
            refinedList: searchResults.refinedList.picklist,
            address: searchResults.address.result,
            original: searchResults.address.origin
        };
    },

    /**
     * Refine address and search using refinement.
     * @param {Object} moniker - Moniker of the address to update.
     * @param {Object} refinement - Updating changes.
     * @returns {Object} - Search results.
     */
    update: function (moniker, refinement) {
        QAS.refine.execute(refinement, moniker);
        var refineResults = QAS.refine.getResult();
        /* istanbul ignore next */
        if (refineResults.error || !refineResults.refinedList.picklist[0]) { // Unit test for error in address 3rd-party verification functional testing. Out of scope.
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
        }
        QAS.get.execute(refineResults.refinedList.picklist[0].moniker);
        var searchResults = QAS.get.getResult();
        return {
            success: !searchResults.error,
            address: searchResults.address.result
        };
    },

    /**
     * Search by query.
     * @param {Object} query - Query to search.
     * @returns {Object} - Search results.
     */
    typeDownSearch: function (query) {
        QAS.typeDownSearch.execute(query);
        var searchResults = QAS.typeDownSearch.getResult();
        return {
            success: !searchResults.error,
            result: searchResults.refinedList.picklist[0] || /* istanbul ignore next */ {}
        };
    }
});

module.exports = QASAddressTypeProvider;
