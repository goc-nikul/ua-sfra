'use strict';

module.exports = {
    get: function (providerType, options) {
        var AbstractProvider = require('*/cartridge/providers/Abstract' + providerType + 'Provider');
        var provider = new AbstractProvider();
        return provider.get(options);
    }
};
