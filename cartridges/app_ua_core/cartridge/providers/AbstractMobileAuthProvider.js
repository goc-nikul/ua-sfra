'use strict';

var Class = require('../scripts/utils/Class').Class;
var currentSite = require('dw/system/Site').getCurrent();

var AbstractMobileAuthProvider = Class.extend({
    object: null,

    /**
     * @constructs
     * @returns {Object} - instance of mobile auth provider
     */
    init: function () {
        this.mobileAuthEnabled = currentSite.getCustomPreferenceValue('enableMobileAuthentication') || false;
        return this;
    },

    /**
     * @constructs
     * @returns {Object} - mobile auth provider
     */
    get: function () {
        var providerPrefix = currentSite.getCustomPreferenceValue('mobileAuthProvider').value;
        var mock = {
        };

        // istanbul ignore if
        if (providerPrefix) {
            return new (require('./' + providerPrefix + 'MobileAuthProvider'))(); // Unit test NiceIDMobileAuthProvider instead
        }

        return mock;
    }
});

module.exports = AbstractMobileAuthProvider;
