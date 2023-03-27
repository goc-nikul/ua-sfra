'use strict';

var Class = require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class').Class;

var AbstractProvider = Class.extend({
    constructor(data) {
        this.data = data;
    }
});

module.exports = AbstractProvider;
