'use strict';

var Class = require('*/cartridge/scripts/utils/Class').Class;

var preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

var AbstractEmailProvider = Class.extend({
    object: null,

    /**
     * @constructs
     * @param {Object} options - options for provider
     * @returns {Object} - instance of email provider
     */
    init: function (options) {
        this.options = options || {};
        return this;
    },

    get: function (options) {
        var providerPrefix = preferencesUtil.getValue('newsletterProvider') || 'Merkle';
        if (providerPrefix === 'None') {
            return this;
        }

        return new (require('./' + providerPrefix + 'NewsletterProvider.js'))(options);
    },

    /**
     * @abstract
     */
    subscribe: function () {
        throw new Error('Must be implemented in extended class');
    },

    /**
     * @abstract
     */
    status: function () {
        throw new Error('Must be implemented in extended class');
    }
});

module.exports = AbstractEmailProvider;
