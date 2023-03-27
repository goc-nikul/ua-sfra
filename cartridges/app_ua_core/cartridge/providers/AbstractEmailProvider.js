'use strict';

var Class = require('../scripts/utils/Class').Class;

var currentSite = require('dw/system/Site').getCurrent();

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
        var providerPrefix = currentSite.getCustomPreferenceValue('emailProvider');

        var mock = {
            send: function () {} // We don't need to unit test this empty function
        };

        // istanbul ignore if
        if (providerPrefix) {
            return new (require('./' + providerPrefix + 'EmailProvider.js'))(options); // Unit test SFCCEmailProvider and SFMCEmailProvider
        }

        return mock;
    },

    /**
     * @abstract
     */
    send: function () {
        throw new Error('Must be implemented in extended class');
    }
});

module.exports = AbstractEmailProvider;
